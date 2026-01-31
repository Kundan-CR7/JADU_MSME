const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventory.controller");
const { requireRole, roles } = require("../middleware/auth.middleware");

router.get(
  "/alerts",
  requireRole([roles.ADMIN, roles.STAFF]),
  inventoryController.getExpiring,
);
router.get(
  "/",
  requireRole([roles.ADMIN, roles.STAFF]),
  inventoryController.list,
);

module.exports = router;
