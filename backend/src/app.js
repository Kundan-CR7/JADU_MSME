const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const passport = require("./config/passport");
const logger = require("./utils/logger");
const salesRoutes = require("./routes/sales.routes");
const purchasesRoutes = require("./routes/purchases.routes");
const staffRoutes = require("./routes/staff.routes");
const taskRoutes = require("./routes/tasks.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const agentRoutes = require("./routes/agent.routes");
const authRoutes = require("./routes/auth.routes");

const app = express();

// Middleware
app.enable("trust proxy"); // Required if behind Nginx/Proxy
app.use(helmet());
app.use(cors()); // Configure origin in production
app.use(express.json());

app.use(session({
  secret: process.env.JWT_SECRET || 'secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

app.use(passport.initialize());
app.use(passport.session());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (SPA needs more)
});
app.use(limiter);

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use("/auth", authRoutes);
app.use("/sales", salesRoutes);
app.use("/purchases", purchasesRoutes);
app.use("/staff", staffRoutes);
app.use("/tasks", taskRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/agent", agentRoutes);

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res
    .status(500)
    .json({ error: "Something went wrong!", details: err.message });
});

module.exports = app;
