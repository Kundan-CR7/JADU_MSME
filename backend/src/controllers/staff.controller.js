const staffService = require("../../services/staff.service");
const logger = require("../../utils/logger");

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
      const { name, role } = req.body;
      const newStaff = await staffService.createStaff({ name, role });
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
}

module.exports = new StaffController();
