const prisma = require("../utils/prisma");
const logger = require("../utils/logger");

class SuppliersService {
    async getAllSuppliers() {
        try {
            return await prisma.supplier.findMany({
                where: { deletedAt: null },
                orderBy: { createdAt: "desc" },
                include: {
                    _count: {
                        select: {
                            purchases: true,
                            supplierItems: true
                        }
                    }
                }
            });
        } catch (error) {
            logger.error("Get All Suppliers Error", error);
            throw error;
        }
    }

    async createSupplier(data) {
        try {
            return await prisma.supplier.create({
                data: {
                    name: data.name,
                    contactInfo: data.contactInfo,
                    reliabilityScore: data.reliabilityScore || 1.0,
                    avgDeliveryTimeDays: data.avgDeliveryTimeDays ? parseInt(data.avgDeliveryTimeDays) : null
                }
            });
        } catch (error) {
            logger.error("Create Supplier Error", error);
            throw error;
        }
    }

    async updateSupplier(id, data) {
        try {
            return await prisma.supplier.update({
                where: { id },
                data: {
                    name: data.name,
                    contactInfo: data.contactInfo,
                    reliabilityScore: data.reliabilityScore ? parseFloat(data.reliabilityScore) : undefined,
                    avgDeliveryTimeDays: data.avgDeliveryTimeDays ? parseInt(data.avgDeliveryTimeDays) : undefined
                }
            });
        } catch (error) {
            logger.error("Update Supplier Error", error);
            throw error;
        }
    }

    async deleteSupplier(id) {
        try {
            // Soft delete
            return await prisma.supplier.update({
                where: { id },
                data: { deletedAt: new Date() }
            });
        } catch (error) {
            logger.error("Delete Supplier Error", error);
            throw error;
        }
    }

    async getSupplierStats() {
        try {
            const totalSuppliers = await prisma.supplier.count({ where: { deletedAt: null } });

            const aggregations = await prisma.supplier.aggregate({
                where: { deletedAt: null },
                _avg: {
                    reliabilityScore: true,
                    avgDeliveryTimeDays: true
                }
            });

            return {
                totalSuppliers,
                avgReliability: aggregations._avg.reliabilityScore || 0,
                avgDeliveryTime: aggregations._avg.avgDeliveryTimeDays || 0
            };
        } catch (error) {
            logger.error("Get Supplier Stats Error", error);
            throw error;
        }
    }
}

module.exports = new SuppliersService();
