const salesService = require("../services/sales.service");
const logger = require("../utils/logger");

class SalesController {
  async createSale(req, res) {
    try {
      const { invoiceId, items, customerName, totalAmount } = req.body;

      // Basic Validation
      if (!invoiceId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Invalid request body" });
      }

      const result = await salesService.processSale(req.body);

      if (result.status === "DUPLICATE") {
        return res
          .status(200)
          .json({ message: result.message, duplicate: true });
      }

      return res.status(201).json({
        message: "Sale processed successfully",
        saleId: result.data.id,
      });
    } catch (error) {
      logger.error("Create Sale Error", error);

      if (
        error.message.includes("Insufficient stock") ||
        error.message.includes("Item not found")
      ) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

module.exports = new SalesController();
