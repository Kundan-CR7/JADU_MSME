const prisma = require("../../utils/prisma");
const logger = require("../../utils/logger");
const axios = require("axios");

const AGENT_URL = process.env.AGENT_URL || "http://localhost:8000";

class SalesService {
  /**
   * Process a new sales invoice
   * @param {Object} saleData - { invoiceId, items: [{ itemCode, quantity, price }], customerName }
   */
  async processSale(saleData) {
    const { invoiceId, items, customerName, totalAmount } = saleData;

    // 1. Idempotency Check
    const processed = await prisma.processedInvoice.findUnique({
      where: { invoiceId },
    });

    if (processed) {
      logger.warn(`Skipping duplicate invoice: ${invoiceId}`);
      return { status: "DUPLICATE", message: "Invoice already processed" };
    }

    // 2. Transaction: Validate Stock, Deduct (FEFO), Record Sale
    try {
      const result = await prisma.$transaction(async (tx) => {
        // A. Validate all items exist and have stock
        const saleItemsPayload = [];

        for (const itemRequest of items) {
          const item = await tx.item.findUnique({
            where: { code: itemRequest.itemCode },
            include: {
              inventoryBatches: {
                where: { quantity: { gt: 0 } },
                orderBy: [
                  { expiryDate: "asc" }, // FEFO: Earliest expiry first
                  { receivedDate: "asc" },
                ],
              },
            },
          });

          if (!item) {
            throw new Error(`Item not found: ${itemRequest.itemCode}`);
          }

          // Calculate total available stock
          const totalStock = item.inventoryBatches.reduce(
            (sum, b) => sum + b.quantity,
            0,
          );
          if (totalStock < itemRequest.quantity) {
            throw new Error(
              `Insufficient stock for ${item.name}. Requested: ${itemRequest.quantity}, Available: ${totalStock}`,
            );
          }

          // B. FEFO Deduction Logic
          let remainingToDeduct = itemRequest.quantity;

          for (const batch of item.inventoryBatches) {
            if (remainingToDeduct <= 0) break;

            const deductAmount = Math.min(batch.quantity, remainingToDeduct);

            // Update Batch
            await tx.inventoryBatch.update({
              where: { id: batch.id },
              data: { quantity: batch.quantity - deductAmount },
            });

            // Create Inventory Transaction
            await tx.inventoryTransaction.create({
              data: {
                itemId: item.id,
                batchId: batch.id,
                changeType: "SALE",
                quantityChange: -deductAmount,
                referenceId: invoiceId,
              },
            });

            // Prepare SaleItem
            saleItemsPayload.push({
              itemId: item.id,
              quantity: deductAmount,
              unitPrice: itemRequest.price,
              batchIdUsed: batch.id,
            });

            remainingToDeduct -= deductAmount;
          }
        }

        // C. Create Sale Record
        const sale = await tx.sale.create({
          data: {
            invoiceId,
            customerName,
            totalAmount: totalAmount,
            items: {
              create: saleItemsPayload,
            },
          },
        });

        // D. Mark Processed
        await tx.processedInvoice.create({
          data: { invoiceId },
        });

        return sale;
      });

      // 3. Async Trigger Agent (Fire and Forget)
      this.triggerAgent(invoiceId);

      return { status: "SUCCESS", data: result };
    } catch (error) {
      logger.error(
        `Transaction failed for invoice ${invoiceId}: ${error.message}`,
      );
      throw error; // Controller checks this
    }
  }

  // Helper to call Python Agent asynchronously
  async triggerAgent(invoiceId) {
    try {
      // We don't await this in the main flow
      axios
        .post(`${AGENT_URL}/agent/run`, {
          trigger: "SALE",
          payload: { invoiceId },
          timestamp: new Date().toISOString(),
        })
        .catch((err) => {
          logger.error(`Failed to trigger agent: ${err.message}`);
        });
    } catch (e) {
      // Ignore synchronous setup errors
    }
  }
}

module.exports = new SalesService();
