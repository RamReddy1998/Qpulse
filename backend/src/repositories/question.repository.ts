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
    const total = await prisma.question.count({ where: { certificationId } });
    if (total === 0) return [];

    const take = Math.min(count, total);

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

  async getDifficultiesByCertification(certificationId: string) {
    const questions = await prisma.question.findMany({
      where: { certificationId },
      select: { difficulty: true },
      distinct: ['difficulty'],
    });
    return questions.map((q) => q.difficulty).filter(Boolean);
  }

  async findRandomForPractice(certificationId: string, excludeIds: string[], count: number) {
    const questions = await prisma.question.findMany({
      where: {
        certificationId,
        id: { notIn: excludeIds },
      },
      take: count * 2,
    });

    // Shuffle
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    return questions.slice(0, count);
  }

  async findFiltered(
    certificationId: string,
    filters: { topic?: string; difficulty?: string; limit?: number }
  ) {
    const where: Record<string, unknown> = { certificationId };
    if (filters.topic) {
      where.topic = filters.topic;
    }
    if (filters.difficulty) {
      where.difficulty = filters.difficulty;
    }

    const questions = await prisma.question.findMany({
      where,
      take: filters.limit || 50,
      orderBy: { createdAt: 'asc' },
    });

    // Shuffle
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    return questions;
  }

  async countFiltered(
    certificationId: string,
    filters: { topic?: string; difficulty?: string }
  ) {
    const where: Record<string, unknown> = { certificationId };
    if (filters.topic) where.topic = filters.topic;
    if (filters.difficulty) where.difficulty = filters.difficulty;
    return prisma.question.count({ where });
  }

  async findByIds(ids: string[]) {
    return prisma.question.findMany({
      where: { id: { in: ids } },
      include: { certification: { select: { name: true } } },
    });
  }

  async createQuestion(data: {
    certificationId: string;
    questionText: string;
    options: Record<string, string>;
    correctAnswer: string;
    difficulty: string;
    topic: string;
    source?: string;
  }) {
    return prisma.question.create({
      data: {
        certificationId: data.certificationId,
        questionText: data.questionText,
        options: data.options,
        correctAnswer: data.correctAnswer,
        difficulty: data.difficulty,
        topic: data.topic,
        source: data.source || 'upload',
      },
    });
  }

  async createMany(questions: Array<{
    certificationId: string;
    questionText: string;
    options: Record<string, string>;
    correctAnswer: string;
    difficulty: string;
    topic: string;
    source: string;
  }>) {
    return prisma.question.createMany({
      data: questions,
    });
  }

  async deleteQuestion(id: string) {
    return prisma.question.delete({ where: { id } });
  }

  async updateQuestion(id: string, data: {
    questionText?: string;
    options?: Record<string, string>;
    correctAnswer?: string;
    difficulty?: string;
    topic?: string;
  }) {
    return prisma.question.update({
      where: { id },
      data,
    });
  }

  async findByTopicForWeakness(topic: string, certificationId?: string, limit: number = 20) {
    const where: Record<string, unknown> = { topic };
    if (certificationId) where.certificationId = certificationId;

    return prisma.question.findMany({
      where,
      take: limit,
      include: { certification: { select: { name: true } } },
    });
  }
}
