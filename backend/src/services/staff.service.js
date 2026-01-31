const prisma = require("../../utils/prisma");
const logger = require("../../utils/logger");

class StaffService {
  async getAllStaff() {
    return prisma.staff.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  async createStaff(data) {
    return prisma.staff.create({ data });
  }

  async updateAvailability(id, isAvailable) {
    return prisma.staff.update({
      where: { id },
      data: { isAvailable },
    });
  }

  async deleteStaff(id) {
    return prisma.staff.update({
      where: { id },
      data: { deletedAt: new Date() }, // Soft Delete
    });
  }
}

module.exports = new StaffService();
