const app = require("./app");
const logger = require("./utils/logger");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

// Validate DB connection before starting
async function startServer() {
  try {
    await prisma.$connect();
    logger.info("Connected to Database");

    app.listen(port, async () => {
      logger.info(`Server running on port ${port}`);
      // Seed default admin if needed
      try {
        const authController = require("./controllers/auth.controller");
        await authController.seedAdmin();
      } catch (err) {
        logger.error("Failed to seed admin", err);
      }
    });
  } catch (err) {
    logger.error("Failed to start server", err);
    process.exit(1);
  }
}

startServer();
