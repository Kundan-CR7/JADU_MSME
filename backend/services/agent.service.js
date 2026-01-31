const prisma = require("../src/utils/prisma");
const logger = require("../src/utils/logger");

class AgentService {
  async getDecisionLogs(limit = 10) {
    return prisma.agentDecisionLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }
}

module.exports = new AgentService();
