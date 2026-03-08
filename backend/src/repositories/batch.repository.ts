import prisma from '../config/prisma';

export class BatchRepository {
  async create(batchName: string, certificationId: string, startTime?: Date, endTime?: Date) {
    return prisma.batch.create({
      data: {
        batchName,
        certificationId,
        startTime: startTime || null,
        endTime: endTime || null,
      },
      include: { certification: { select: { name: true } } },
    });
  }

  async findAll(page: number, limit: number) {
    const [batches, total] = await Promise.all([
      prisma.batch.findMany({
        include: {
          certification: { select: { name: true } },
          _count: { select: { participants: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.batch.count(),
    ]);
    return { batches, total };
  }

  async findById(id: string) {
    return prisma.batch.findUnique({
      where: { id },
      include: {
        certification: { select: { name: true } },
        participants: {
          include: { user: { select: { id: true, username: true } } },
        },
      },
    });
  }

  async addParticipant(batchId: string, userId: string) {
    return prisma.batchParticipant.create({
      data: { batchId, userId },
    });
  }

  async removeParticipant(batchId: string, userId: string) {
    return prisma.batchParticipant.deleteMany({
      where: { batchId, userId },
    });
  }

  async findBatchesByUser(userId: string) {
    const participations = await prisma.batchParticipant.findMany({
      where: { userId },
      include: {
        batch: {
          include: { certification: { select: { name: true } } },
        },
      },
    });
    return participations.map((p) => p.batch);
  }

  async isParticipant(batchId: string, userId: string) {
    const participant = await prisma.batchParticipant.findUnique({
      where: { batchId_userId: { batchId, userId } },
    });
    return !!participant;
  }
}
