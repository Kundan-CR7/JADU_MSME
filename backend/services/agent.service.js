const prisma = require("../utils/prisma");
const logger = require("../utils/logger");

class AgentService {
  async getDecisionLogs(limit = 10) {
    return prisma.agentDecisionLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }
}

module.exports = new AgentService();
