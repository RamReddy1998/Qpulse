import prisma from '../config/prisma';

export class ReadinessRepository {
  async create(userId: string, score: number, status: string) {
    return prisma.readinessScore.create({
      data: { userId, score, status },
    });
  }

  async getLatest(userId: string) {
    return prisma.readinessScore.findFirst({
      where: { userId },
      orderBy: { calculatedAt: 'desc' },
    });
  }

  async getHistory(userId: string, limit: number = 20) {
    return prisma.readinessScore.findMany({
      where: { userId },
      orderBy: { calculatedAt: 'desc' },
      take: limit,
    });
  }

  async getAverageScore() {
    // Get latest score per user
    const users = await prisma.user.findMany({
      where: { role: 'LEARNER' },
      select: { id: true },
    });

    if (users.length === 0) return 0;

    let totalScore = 0;
    let count = 0;

    for (const user of users) {
      const latest = await prisma.readinessScore.findFirst({
        where: { userId: user.id },
        orderBy: { calculatedAt: 'desc' },
      });
      if (latest) {
        totalScore += latest.score;
        count += 1;
      }
    }

    return count > 0 ? Math.round(totalScore / count) : 0;
  }
}
