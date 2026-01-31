const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staff.controller");
const { requireRole, roles } = require("../middleware/auth.middleware");

// Public read for now (or staff level)
router.get("/", requireRole([roles.ADMIN, roles.STAFF]), staffController.list);

// Admin only
router.post("/", requireRole([roles.ADMIN]), staffController.create);
router.patch(
  "/:id/availability",
  requireRole([roles.ADMIN, roles.STAFF]),
  staffController.toggleAvailability,
);

module.exports = router;
