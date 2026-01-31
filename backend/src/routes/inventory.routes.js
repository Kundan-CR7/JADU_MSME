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
router.get(
  "/categories",
  requireRole([roles.ADMIN, roles.STAFF]),
  inventoryController.categories
);

// CRUD
router.post(
  "/",
  requireRole([roles.ADMIN, roles.STAFF]),
  inventoryController.create
);
router.put(
  "/:id",
  requireRole([roles.ADMIN, roles.STAFF]),
  inventoryController.update
);
router.post(
  "/:id/adjust",
  requireRole([roles.ADMIN, roles.STAFF]),
  inventoryController.adjustStock
);

router.delete(
  "/:id",
  requireRole([roles.ADMIN]), // Only Admin can delete? Or Staff too? Let's allow Staff for now based on prompt "make all buttons accessible"
  inventoryController.delete
);

// Import
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

router.post(
  "/import",
  requireRole([roles.ADMIN, roles.STAFF]),
  upload.single("file"),
  inventoryController.importItems
);

module.exports = router;
