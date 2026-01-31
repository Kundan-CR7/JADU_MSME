const inventoryService = require("../services/inventory.service");
const logger = require("../utils/logger");

class InventoryController {
  async getExpiring(req, res) {
    try {
      const days = parseInt(req.query.days) || 7;
      const batches = await inventoryService.getExpiringBatches(days);
      res.json(batches);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  }

  async list(req, res) {
    try {
      const items = await inventoryService.getAllItems();
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  }

  async adjustStock(req, res) {
    try {
      const { itemId, batchId, quantityChange, reason } = req.body;
      const prisma = require("../utils/prisma");
      
      const result = await prisma.$transaction(async (tx) => {
        // 1. Update Batch
        const batch = await tx.inventoryBatch.findUnique({ where: { id: batchId } });
        if (!batch) throw new Error("Batch not found");

        const newQty = batch.quantity + parseInt(quantityChange);
        if (newQty < 0) throw new Error("Resulting quantity cannot be negative");

        await tx.inventoryBatch.update({
          where: { id: batchId },
          data: { quantity: newQty }
        });

        // 2. Create Transaction Log
        await tx.inventoryTransaction.create({
          data: {
            itemId,
            batchId,
            changeType: 'ADJUSTMENT',
            quantityChange: parseInt(quantityChange),
            referenceId: reason || 'MANUAL'
          }
        });

        return { newQty };
      });

      res.json({ success: true, ...result });
    } catch (error) {
      logger.error("Adjust Stock Error", error);
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new InventoryController();
