const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staff.controller");
const { requireRole, roles } = require("../middlewares/auth.middleware");

// Public read for now (or staff level)
router.get("/stats", requireRole([roles.ADMIN, roles.STAFF]), staffController.stats);
router.get("/", requireRole([roles.ADMIN, roles.STAFF]), staffController.list);

// Admin only
router.post("/", requireRole([roles.ADMIN]), staffController.create);
router.patch(
  "/:id/availability",
  requireRole([roles.ADMIN, roles.STAFF]),
  staffController.toggleAvailability,
);
router.put(
  "/:id",
  requireRole([roles.ADMIN]),
  staffController.update
);

router.delete(
  "/:id",
  requireRole([roles.ADMIN]),
  staffController.delete
);
module.exports = router;
