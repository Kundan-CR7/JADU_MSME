const staffService = require("../services/staff.service");
const logger = require("../utils/logger");

const bcrypt = require("bcryptjs");
const prisma = require("../utils/prisma");

class StaffController {
  async list(req, res) {
    try {
      const staff = await staffService.getAllStaff();
      res.json(staff);
    } catch (err) {
      logger.error("List Staff Error", err);
      res.status(500).json({ error: "Failed to fetch staff" });
    }
  }

  async create(req, res) {
    try {
      const { name, email, role, password, isAvailable } = req.body;

      // 1. Check if user exists
      const existingUser = await prisma.staff.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }

      // 2. Hash Password
      const hashedPassword = await bcrypt.hash(password || "password123", 10);

      // 3. Create
      const newStaff = await staffService.createStaff({
        name,
        email,
        role,
        password: hashedPassword,
        isAvailable
      });

      res.status(201).json(newStaff);
    } catch (err) {
      logger.error("Create Staff Error", err);
      res.status(500).json({ error: "Failed to create staff" });
    }
  }

  async toggleAvailability(req, res) {
    try {
      const { id } = req.params;
      const { isAvailable } = req.body;
      const updated = await staffService.updateAvailability(id, isAvailable);
      res.json(updated);
    } catch (err) {
      logger.error("Toggle Staff Error", err);
      res.status(500).json({ error: "Failed to update availability" });
    }
  }
  async update(req, res) {
    try {
      const updated = await staffService.updateStaff(req.params.id, req.body);
      res.json(updated);
    } catch (err) {
      logger.error("Update Staff Error", err);
      res.status(500).json({ error: "Failed to update staff" });
    }
  }

  async delete(req, res) {
    try {
      await staffService.deleteStaff(req.params.id);
      res.json({ message: "Staff deleted successfully" });
    } catch (err) {
      logger.error("Delete Staff Error", err);
      res.status(500).json({ error: "Failed to delete staff" });
    }
  }

  async stats(req, res) {
    try {
      const stats = await staffService.getStaffStats();
      res.json(stats);
    } catch (err) {
      logger.error("Staff Stats Error", err);
      res.status(500).json({ error: "Failed to get staff stats" });
    }
  }
}

module.exports = new StaffController();
