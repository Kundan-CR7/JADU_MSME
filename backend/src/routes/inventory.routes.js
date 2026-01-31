const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventory.controller");
const { requireRole, roles } = require("../middlewares/auth.middleware.js");

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

router.post(
  "/adjust",
  requireRole([roles.ADMIN, roles.STAFF]),
  inventoryController.adjustStock
);

module.exports = router;
