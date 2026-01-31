const inventoryService = require("../../services/inventory.service");
const logger = require("../../utils/logger");

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
}

module.exports = new InventoryController();
