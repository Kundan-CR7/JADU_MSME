const agentService = require("../services/agent.service");

class AgentController {
  async getLogs(req, res) {
    try {
      const logs = await agentService.getDecisionLogs();
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  }
}

module.exports = new AgentController();
