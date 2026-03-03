import prisma from '../config/prisma';

export class QuestionRepository {
  async findById(id: string) {
    return prisma.question.findUnique({
      where: { id },
      include: { certification: { select: { name: true } } },
    });
  }

  async findByCertification(certificationId: string, page: number, limit: number) {
    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where: { certificationId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      prisma.question.count({ where: { certificationId } }),
    ]);
    return { questions, total };
  }

  async findRandomByCertification(certificationId: string, count: number) {
    // Get total count first
    const total = await prisma.question.count({ where: { certificationId } });
    if (total === 0) return [];

    const take = Math.min(count, total);

    // Get random questions using a raw query approach with ordering
    const questions = await prisma.question.findMany({
      where: { certificationId },
      take,
      orderBy: { id: 'asc' },
    });

    // Shuffle the results
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    return questions.slice(0, take);
  }

  async findByTopic(certificationId: string, topic: string, limit: number) {
    return prisma.question.findMany({
      where: { certificationId, topic: { contains: topic, mode: 'insensitive' } },
      take: limit,
    });
  }

  async getTopicsByCertification(certificationId: string) {
    const questions = await prisma.question.findMany({
      where: { certificationId },
      select: { topic: true },
      distinct: ['topic'],
    });
    return questions.map((q) => q.topic).filter(Boolean);
  }

  async findRandomForPractice(certificationId: string, excludeIds: string[], count: number) {
    const questions = await prisma.question.findMany({
      where: {
        certificationId,
        id: { notIn: excludeIds },
      },
      take: count * 2, // Get extra for randomization
    });

    // Shuffle
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    return questions.slice(0, count);
  }
}
