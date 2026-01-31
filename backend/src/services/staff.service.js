const prisma = require("../utils/prisma");
const logger = require("../utils/logger");

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

  async updateStaff(id, data) {
    return prisma.staff.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        isAvailable: data.isAvailable
      }
    });
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
  async getStaffStats() {
    const totalStaff = await prisma.staff.count({ where: { deletedAt: null } });
    const availableStaff = await prisma.staff.count({ where: { deletedAt: null, isAvailable: true } });
    const busyStaff = await prisma.staff.count({ where: { deletedAt: null, isAvailable: false } });

    return {
      totalStaff,
      availableStaff,
      busyStaff
    };
  }
}

module.exports = new StaffService();
