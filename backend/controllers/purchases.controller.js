const purchasesService = require("../services/purchases.service");
const logger = require("../utils/logger");

class PurchasesController {
  async receivePurchase(req, res) {
    try {
      const { id } = req.params;
      const { quantityReceived, qualityNote, receivedDate } = req.body;

      if (!quantityReceived || quantityReceived <= 0) {
        return res
          .status(400)
          .json({ error: "Valid quantityReceived is required" });
      }

      const result = await purchasesService.receivePurchase(id, {
        quantityReceived,
        qualityNote,
        receivedDate,
      });

      return res.status(200).json({
        message: "Purchase received successfully",
        purchase: result,
      });
    } catch (error) {
      logger.error("Receive Purchase Error", error);

      if (error.message.includes("not found")) {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes("already")) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

module.exports = new PurchasesController();
