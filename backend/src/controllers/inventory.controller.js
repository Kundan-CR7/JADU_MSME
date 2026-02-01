const inventoryService = require("../services/inventory.service");
const logger = require("../utils/logger");

class InventoryController {
  async getExpiring(req, res) {
    try {
      const days = parseInt(req.query.days) || 7;
      const batches = await inventoryService.getExpiringBatches(days);
      res.json(batches);
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to fetch alerts" });
    }
  }

  async getDashboardStats(req, res) {
    try {
      const stats = await inventoryService.getDashboardStats();
      res.json(stats);
    } catch (err) {
      logger.error("Inventory Stats Error", err);
      res
        .status(500)
        .json({ error: err.message || "Failed to fetch inventory stats" });
    }
  }

  async list(req, res) {
    try {
      const items = await inventoryService.getAllItems();
      res.json(items);
    } catch (err) {
      res
        .status(500)
        .json({ error: err.message || "Failed to fetch inventory" });
    }
  }

  async categories(req, res) {
    try {
      const categories = await inventoryService.getAllCategories();
      res.json(categories);
    } catch (err) {
      res
        .status(500)
        .json({ error: err.message || "Failed to fetch categories" });
    }
  }

  async create(req, res) {
    try {
      const item = await inventoryService.createItem(req.body);
      res.status(201).json(item);
    } catch (err) {
      logger.error("Create Item Error", err);
      res.status(500).json({ error: err.message || "Failed to create item" });
    }
  }

  async update(req, res) {
    try {
      const item = await inventoryService.updateItem(req.params.id, req.body);
      res.json(item);
    } catch (err) {
      logger.error("Update Item Error", err);
      res.status(500).json({ error: err.message || "Failed to update item" });
    }
  }

  async delete(req, res) {
    try {
      await inventoryService.deleteItem(req.params.id);
      res.json({ message: "Item deleted successfully" });
    } catch (err) {
      logger.error("Delete Item Error", err);
      res.status(500).json({ error: "Failed to delete item" });
    }
  }

  async adjustStock(req, res) {
    try {
      const result = await inventoryService.adjustStock(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      logger.error("Adjust Stock Error", err);
      res.status(500).json({ error: "Failed to adjust stock" });
    }
  }

  async importItems(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const count = await inventoryService.importFromCsv(req.file.path);
      res.json({ message: `Successfully imported ${count} items` });
    } catch (err) {
      logger.error("Import Error", err);
      res.status(500).json({ error: "Failed to import items" });
    }
  }
}

module.exports = new InventoryController();
