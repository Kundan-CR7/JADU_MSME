const express = require("express");
const router = express.Router();
const purchasesController = require("../controllers/purchases.controller");

router.post("/:id/receive", purchasesController.receivePurchase);

module.exports = router;
