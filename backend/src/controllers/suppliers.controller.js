const suppliersService = require("../services/suppliers.service");
const logger = require("../utils/logger");

class SuppliersController {
    async list(req, res) {
        try {
            const suppliers = await suppliersService.getAllSuppliers();
            res.json(suppliers);
        } catch (err) {
            res.status(500).json({ error: "Failed to fetch suppliers" });
        }
    }

    async create(req, res) {
        try {
            const supplier = await suppliersService.createSupplier(req.body);
            res.status(201).json(supplier);
        } catch (err) {
            res.status(500).json({ error: "Failed to create supplier" });
        }
    }

    async update(req, res) {
        try {
            const supplier = await suppliersService.updateSupplier(req.params.id, req.body);
            res.json(supplier);
        } catch (err) {
            res.status(500).json({ error: "Failed to update supplier" });
        }
    }

    async delete(req, res) {
        try {
            await suppliersService.deleteSupplier(req.params.id);
            res.json({ message: "Supplier deleted successfully" });
        } catch (err) {
            res.status(500).json({ error: "Failed to delete supplier" });
        }
    }

    async stats(req, res) {
        try {
            const stats = await suppliersService.getSupplierStats();
            res.json(stats);
        } catch (err) {
            res.status(500).json({ error: "Failed to fetch supplier stats" });
        }
    }
}

module.exports = new SuppliersController();
