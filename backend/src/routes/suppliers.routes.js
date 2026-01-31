const express = require("express");
const router = express.Router();
const suppliersController = require("../controllers/suppliers.controller");
const { requireRole, roles } = require("../middlewares/auth.middleware");

// Stats endpoint should come before :id to avoid conflict if :id is not regex restricted
router.get(
    "/stats",
    requireRole([roles.ADMIN, roles.STAFF]),
    suppliersController.stats
);

router.get(
    "/",
    requireRole([roles.ADMIN, roles.STAFF]),
    suppliersController.list
);

router.post(
    "/",
    requireRole([roles.ADMIN, roles.STAFF]),
    suppliersController.create
);

router.put(
    "/:id",
    requireRole([roles.ADMIN, roles.STAFF]),
    suppliersController.update
);

router.delete(
    "/:id",
    requireRole([roles.ADMIN]),
    suppliersController.delete
);

module.exports = router;
