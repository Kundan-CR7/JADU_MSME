const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const winston = require("winston");

// Logger Setup
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "Backend is running with Prisma" });
});

// Health check to ensure DB is connected
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "Database Connected" });
  } catch (err) {
    logger.error("Health Check Failed", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
