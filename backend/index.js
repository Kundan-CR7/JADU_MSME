require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./utils/logger');
const authRoutes = require('./routes/auth.routes');
const authController = require('./controllers/auth.controller');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Logging Middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', version: '1.0.0' });
});

// Seed Admin on Startup
authController.seedAdmin().catch(err => logger.error('Failed to seed admin', err));

// Start Server
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});
