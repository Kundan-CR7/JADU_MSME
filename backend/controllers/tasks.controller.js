const taskService = require("../services/tasks.service");
const logger = require("../utils/logger");

class TaskController {
  async list(req, res) {
    try {
      const tasks = await taskService.getTasks({});
      res.json(tasks);
    } catch (err) {
      logger.error("List Tasks Error", err);
      res.status(500).json({ error: "Failed" });
    }
  }

  async create(req, res) {
    try {
      const task = await taskService.createTask(req.body);
      res.status(201).json(task);
    } catch (err) {
      res.status(500).json({ error: "Failed" });
    }
  }

  async assign(req, res) {
    try {
      const { id } = req.params;
      const { staffId } = req.body;
      const result = await taskService.assignTask(id, staffId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Failed" });
    }
  }

  async checkBottlenecks(req, res) {
    const result = await taskService.detectBottlenecks();
    res.json({ bottlenecks: result });
  }

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await taskService.updateStatus(id, status);
      res.json(result);
    } catch (err) {
      logger.error("Update Task Status Error", err);
      res.status(500).json({ error: "Failed to update" });
    }
  }
}

module.exports = new TaskController();
