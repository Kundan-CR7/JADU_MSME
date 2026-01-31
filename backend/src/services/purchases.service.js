const prisma = require("../../utils/prisma");
const logger = require("../../utils/logger");

class PurchasesService {
  /**
   * Receive goods against a purchase order
   * @param {String} purchaseId
   * @param {Object} data - { quantityReceived, qualityNote, receivedDate }
   */
  async receivePurchase(purchaseId, data) {
    const { quantityReceived, qualityNote, receivedDate } = data;
    const actualReceivedDate = receivedDate
      ? new Date(receivedDate)
      : new Date();

    try {
      return await prisma.$transaction(async (tx) => {
        // 1. Fetch Purchase
        const purchase = await tx.purchase.findUnique({
          where: { id: purchaseId },
          include: { supplier: true, item: true },
        });

        if (!purchase) {
          throw new Error("Purchase Order not found");
        }

        if (purchase.status === "RECEIVED" || purchase.status === "CANCELLED") {
          throw new Error(`Purchase Order is already ${purchase.status}`);
        }

        // 2. Update Purchase Status & Details
        const newTotalReceived = purchase.quantityReceived + quantityReceived;
        let newStatus = "PARTIAL";
        if (newTotalReceived >= purchase.quantityOrdered) {
          newStatus = "RECEIVED"; // Fully received
        }

        const updatedPurchase = await tx.purchase.update({
          where: { id: purchaseId },
          data: {
            quantityReceived: newTotalReceived,
            status: newStatus,
            actualDeliveryDate: actualReceivedDate,
            qualityNote: qualityNote,
          },
        });

        // 3. Create Inventory Batch (Stock Up)
        // Since we are receiving new goods, we create a fresh batch
        // We estimate expiry based on item definition or default (e.g., 30 days) if not provided
        // For simplified logic, we assume standard shelf life if not passed (not in body for now)
        // In real MSME app, expiry would be input by user. Let's assume input or null.

        await tx.inventoryBatch.create({
          data: {
            itemId: purchase.itemId,
            quantity: quantityReceived,
            receivedDate: actualReceivedDate,
            // expiryDate: calculateExpiry(purchase.item.shelfLife) // TODO: Add shelf life to item model
          },
        });

        // 4. Update Supplier Reliability Score
        // Logic:
        // - On Time: +0.05
        // - Late: - ((Days Late / 2) * 0.1)
        // - Bad Quality: -0.2
        // Max 1.0, Min 0.0

        if (newStatus === "RECEIVED") {
          await this.updateSupplierScore(
            tx,
            purchase.supplierId,
            purchase.expectedDeliveryDate,
            actualReceivedDate,
            qualityNote,
          );
        }

        return updatedPurchase;
      });
    } catch (error) {
      logger.error(`Receive Purchase failed: ${error.message}`);
      throw error;
    }
  }

  async updateSupplierScore(tx, supplierId, expectedDate, actualDate, quality) {
    const msPerDay = 24 * 60 * 60 * 1000;

    // Calculate Delay
    let daysLate = 0;
    if (expectedDate && actualDate > expectedDate) {
      daysLate = Math.ceil((actualDate - expectedDate) / msPerDay);
    }

    const supplier = await tx.supplier.findUnique({
      where: { id: supplierId },
    });
    let score = Number(supplier.reliabilityScore);

    // Speed adjustment
    if (daysLate <= 0) {
      score += 0.02; // Reward for on-time
    } else {
      score -= 0.05 * daysLate; // Penalize 5% per day late
    }

    // Quality adjustment
    if (quality === "DAMAGED") {
      score -= 0.15;
    } else if (quality === "GOOD") {
      score += 0.01;
    }

    // Clamp
    score = Math.max(0, Math.min(1, score));

    await tx.supplier.update({
      where: { id: supplierId },
      data: { reliabilityScore: score },
    });

    logger.info(
      `Updated Supplier ${supplier.name} score to ${score.toFixed(2)}`,
    );
  }
}

module.exports = new PurchasesService();
