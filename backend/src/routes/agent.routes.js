const express = require("express");
const router = express.Router();
const agentController = require("../controllers/agent.controller");
const { requireRole, roles } = require("../middleware/auth.middleware");

router.get(
  "/logs",
  requireRole([roles.ADMIN, roles.STAFF]),
  agentController.getLogs,
);

module.exports = router;
