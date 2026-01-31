const prisma = require("../../utils/prisma");
const logger = require("../../utils/logger");

class TaskService {
  async getTasks(filters) {
    return prisma.task.findMany({
      where: filters,
      include: { staff: true },
      orderBy: { priority: "desc" }, // High priority first
    });
  }

  async createTask(data) {
    // Check if staff available logic could go here
    return prisma.task.create({ data });
  }

  async updateStatus(id, status) {
    // If DONE, decrement staff load? For mvp let's just update
    return prisma.task.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  }

  async assignTask(id, staffId) {
    // Transactional: Increment staff load
    return prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({ where: { id } });

      // If previously assigned, decrement old staff load
      if (task.assignedTo) {
        await tx.staff.update({
          where: { id: task.assignedTo },
          data: { currentLoad: { decrement: 1 } },
        });
      }

      // Assign new
      const updatedTask = await tx.task.update({
        where: { id },
        data: { assignedTo: staffId },
      });

      // Increment new staff load
      await tx.staff.update({
        where: { id: staffId },
        data: { currentLoad: { increment: 1 } },
      });

      return updatedTask;
    });
  }

  // Bottleneck Detection
  async detectBottlenecks() {
    // Logic: Find stages (statuses) with > 5 tasks pending for > 2 days
    // Simplified: Just count tasks in TODO/IN_PROGRESS
    const counts = await prisma.task.groupBy({
      by: ["status"],
      _count: { id: true },
      where: { status: { not: "DONE" } },
    });

    // Check thresholds (e.g., > 10 tasks in TODO)
    const bottlenecks = counts.filter((c) => c._count.id > 5);

    if (bottlenecks.length > 0) {
      logger.warn("Bottleneck Detected", bottlenecks);
      // Could trigger Agent here to reassign
    }

    return bottlenecks;
  }
}

module.exports = new TaskService();
