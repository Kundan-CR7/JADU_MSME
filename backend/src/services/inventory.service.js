const prisma = require("../utils/prisma");
const logger = require("../utils/logger");
const fs = require("fs");
const csv = require("csv-parser");

class InventoryService {
  async getAllCategories() {
    return prisma.category.findMany({ select: { id: true, name: true } });
  }
  /**
   * Get batches expiring within X days
   * @param {number} days
   */
  async getExpiringBatches(days) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    try {
      const batches = await prisma.inventoryBatch.findMany({
        where: {
          quantity: { gt: 0 },
          expiryDate: {
            lte: targetDate,
            gte: new Date(),
          },
        },
        include: { item: true },
        orderBy: { expiryDate: "asc" },
      });

      return batches;
    } catch (error) {
      logger.error("Get Expiring Batches Error", error);
      throw error;
    }
  }

  async getAllItems() {
    try {
      // Fetch items with their categories and aggregate stock
      const items = await prisma.item.findMany({
        where: { deletedAt: null },
        include: {
          category: true,
          inventoryBatches: {
            where: { quantity: { gt: 0 } },
          },
        },
      });

      // Compute total stock manually since we fetched batches
      return items.map((item) => {
        const totalStock = item.inventoryBatches.reduce(
          (sum, b) => sum + b.quantity,
          0,
        );
        return {
          ...item,
          currentStock: totalStock,
          inventoryBatches: undefined, // Clean up if not needed
        };
      });
    } catch (error) {
      logger.error("Get All Items Error", error);
      throw error;
    }
  }

  async createItem(data) {
    const { code, name, category, costPrice, sellingPrice, reorderPoint, initialStock } = data;

    // 1. Get or Create Category
    let categoryId;
    if (category) {
      const cat = await prisma.category.upsert({
        where: { id: category }, // Assuming category is passed as Name for simplicity in UI, or ID. Let's assume Name.
        // Actually, safer to assume UI sends name and we upsert by name if possible, OR UI sends ID.
        // Given the requirement "make everything working", let's handle "Category Name" input.
        // But wait, Schema uses ID. Let's try to find by name, else create.
        // IMPORTANT: Schema Update needed for unique Name? Name is not unique in schema.
        // We'll search findFirst.
        update: {},
        create: { name: category }
      });
      // Upsert by ID requires ID. If we only have name, we can't upsert by ID easily if 'category' input is 'Groceries'.
      // Let's refine: try findFirst first.
      const existingCat = await prisma.category.findFirst({ where: { name: category } });
      if (existingCat) categoryId = existingCat.id;
      else {
        const newCat = await prisma.category.create({ data: { name: category } });
        categoryId = newCat.id;
      }
    }

    // 2. Create Item
    // Generate code if missing
    const itemCode = code || `ITEM-${Date.now()}`;

    const newItem = await prisma.item.create({
      data: {
        code: itemCode,
        name,
        categoryId,
        costPrice: parseFloat(costPrice),
        sellingPrice: parseFloat(sellingPrice),
        reorderPoint: parseInt(reorderPoint) || 10,
        isActive: true
      }
    });

    // 3. Add Initial Stock if provided
    if (initialStock && parseInt(initialStock) > 0) {
      const batch = await prisma.inventoryBatch.create({
        data: {
          itemId: newItem.id,
          batchNumber: `INIT-${Date.now()}`,
          quantity: parseInt(initialStock),
          receivedDate: new Date(),
          expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) // Default 1 year expiry
        }
      });

      // Log transaction
      await prisma.inventoryTransaction.create({
        data: {
          itemId: newItem.id,
          batchId: batch.id,
          changeType: 'ADJUSTMENT',
          quantityChange: parseInt(initialStock),
          referenceId: 'MANUAL_CREATE'
        }
      });
    }

    return newItem;
  }

  async updateItem(id, data) {
    const { name, category, costPrice, sellingPrice, reorderPoint, isActive } = data;

    // Update basic fields
    const updateData = {
      name,
      costPrice: costPrice ? parseFloat(costPrice) : undefined,
      sellingPrice: sellingPrice ? parseFloat(sellingPrice) : undefined,
      reorderPoint: reorderPoint ? parseInt(reorderPoint) : undefined,
      isActive
    };

    if (category) {
      // Resolve category name to ID again (flexible approach)
      const existingCat = await prisma.category.findFirst({ where: { name: category } });
      if (existingCat) updateData.categoryId = existingCat.id;
      else {
        const newCat = await prisma.category.create({ data: { name: category } });
        updateData.categoryId = newCat.id;
      }
    }

    // Handle Stock Update if provided (Absolute Value)
    if (data.stock !== undefined && data.stock !== null) {
      const item = await prisma.item.findUnique({
        where: { id },
        include: { inventoryBatches: { where: { quantity: { gt: 0 } } } }
      });

      const currentStock = item.inventoryBatches.reduce((sum, b) => sum + b.quantity, 0);
      const newStock = parseInt(data.stock);
      const diff = newStock - currentStock;

      if (diff !== 0) {
        await this.adjustStock(id, { quantityChange: diff, reason: 'MANUAL_EDIT' });
      }
    }

    return prisma.item.update({
      where: { id },
      data: updateData
    });
  }

  async deleteItem(id) {
    return prisma.item.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  async adjustStock(id, { quantityChange, reason }) {
    // 1. Validate
    if (!quantityChange || isNaN(quantityChange)) {
      throw new Error("Invalid quantity change");
    }

    const change = parseInt(quantityChange);

    // 2. Create Adjustment Batch (Simplification: We just add/remove from a 'Generic' batch or create a new one for +ve)
    // For accurate inventory, we should FIFO remove, but for "Quick Edit", we'll just add/remove generically.

    // If adding stock (+ve)
    if (change > 0) {
      const batch = await prisma.inventoryBatch.create({
        data: {
          itemId: id,
          batchNumber: `ADJ-${Date.now()}`,
          quantity: change,
          receivedDate: new Date(),
          expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        }
      });

      await prisma.inventoryTransaction.create({
        data: {
          itemId: id,
          batchId: batch.id,
          changeType: 'ADJUSTMENT',
          quantityChange: change,
          referenceId: reason || 'MANUAL_ADJUST'
        }
      });
    }
    // If removing stock (-ve)
    else {
      const batches = await prisma.inventoryBatch.findMany({
        where: { itemId: id, quantity: { gt: 0 } },
        orderBy: { receivedDate: 'asc' } // FIFO
      });

      let remainingToRemove = Math.abs(change);

      for (const batch of batches) {
        if (remainingToRemove <= 0) break;

        const deduct = Math.min(batch.quantity, remainingToRemove);

        await prisma.inventoryBatch.update({
          where: { id: batch.id },
          data: { quantity: batch.quantity - deduct }
        });

        await prisma.inventoryTransaction.create({
          data: {
            itemId: id,
            batchId: batch.id,
            changeType: 'ADJUSTMENT',
            quantityChange: -deduct,
            referenceId: reason || 'MANUAL_ADJUST'
          }
        });

        remainingToRemove -= deduct;
      }
    }

    return { success: true };
  }

  async importFromCsv(filePath) {
    const results = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          let count = 0;
          // Expected CSV Headers: Name, Code, Category, CostPrice, SellingPrice, Stock, ReorderPoint
          for (const row of results) {
            try {
              await this.createItem({
                name: row.Name || row.name,
                code: row.Code || row.code,
                category: row.Category || row.category,
                costPrice: row.CostPrice || row.costPrice || row.price || 0,
                sellingPrice: row.SellingPrice || row.sellingPrice || 0,
                initialStock: row.Stock || row.stock || 0,
                reorderPoint: row.ReorderPoint || row.reorderPoint || 10
              });
              count++;
            } catch (err) {
              logger.error(`Failed to import row: ${JSON.stringify(row)}`, err);
            }
          }

          // Clean up file
          fs.unlink(filePath, (err) => {
            if (err) logger.error("Failed to delete uploaded file", err);
          });

          resolve(count);
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  }
  /**
   * FEFO Allocation Logic (Planning/Simulation)
   * @param {string} itemId 
   * @param {number} qtyNeeded 
   */
  async allocateStockFEFO(itemId, qtyNeeded) {
    try {
      const batches = await prisma.inventoryBatch.findMany({
        where: { itemId: itemId, quantity: { gt: 0 } },
        orderBy: { expiryDate: 'asc' } // FEFO: Earliest expiry first
      });

      let remaining = qtyNeeded;
      const allocation = [];

      for (const batch of batches) {
        if (remaining <= 0) break;

        const take = Math.min(batch.quantity, remaining);
        allocation.push({
          batchId: batch.id,
          qty: take,
          expiry: batch.expiryDate,
          batchNumber: batch.batchNumber
        });
        remaining -= take;
      }

      if (remaining > 0) {
        return { feasible: false, shortfall: remaining, allocation };
      }
      return { feasible: true, allocation };
    } catch (error) {
      logger.error("Allocate Stock FEFO Error", error);
      throw error;
    }

  }
}

module.exports = new InventoryService();
