const prisma = require("../utils/prisma");
const logger = require("../utils/logger");

class InventoryService {
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
