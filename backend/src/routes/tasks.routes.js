const express = require("express");
const router = express.Router();
const taskController = require("../controllers/tasks.controller");
const { requireRole, roles } = require("../middleware/auth.middleware");

router.get("/", requireRole([roles.ADMIN, roles.STAFF]), taskController.list);
router.post("/", requireRole([roles.ADMIN]), taskController.create);
router.post("/:id/assign", requireRole([roles.ADMIN]), taskController.assign);
router.get(
  "/bottlenecks",
  requireRole([roles.ADMIN]),
  taskController.checkBottlenecks,
);
// Adding Status Update
router.patch(
  "/:id/status",
  requireRole([roles.ADMIN, roles.STAFF]),
  taskController.updateStatus,
);

module.exports = router;
