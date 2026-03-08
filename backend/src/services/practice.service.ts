import { QuestionRepository } from '../repositories/question.repository';
import { ActivityRepository } from '../repositories/activity.repository';
import { MistakeRepository } from '../repositories/mistake.repository';
import { AiCacheRepository } from '../repositories/aiCache.repository';
import { getAiProvider } from './ai/ai.factory';
import { NotFoundError } from '../utils/errors';
import { QuestionOption } from '../types';
import logger from '../config/logger';

export class PracticeService {
  private questionRepo: QuestionRepository;
  private activityRepo: ActivityRepository;
  private mistakeRepo: MistakeRepository;
  private aiCacheRepo: AiCacheRepository;

  constructor() {
    this.questionRepo = new QuestionRepository();
    this.activityRepo = new ActivityRepository();
    this.mistakeRepo = new MistakeRepository();
    this.aiCacheRepo = new AiCacheRepository();
  }

  async getRandomQuestions(certificationId: string, count: number = 1, excludeIds: string[] = []) {
    const questions = await this.questionRepo.findRandomForPractice(certificationId, excludeIds, count);
    // Return questions without correct answer exposed
    return questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      options: q.options,
      difficulty: q.difficulty,
      topic: q.topic,
      certificationId: q.certificationId,
    }));
  }

  async getFilteredQuestions(
    certificationId: string,
    filters: { topic?: string; difficulty?: string; limit?: number }
  ) {
    const questions = await this.questionRepo.findFiltered(certificationId, filters);
    return questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      options: q.options,
      difficulty: q.difficulty,
      topic: q.topic,
      certificationId: q.certificationId,
    }));
  }

  async getFilterCount(
    certificationId: string,
    filters: { topic?: string; difficulty?: string }
  ) {
    return this.questionRepo.countFiltered(certificationId, filters);
  }

  async submitAnswer(userId: string, questionId: string, userAnswer: string, timeSpentSec: number) {
    const question = await this.questionRepo.findById(questionId);
    if (!question) {
      throw new NotFoundError('Question not found');
    }

    const isCorrect = userAnswer.toUpperCase() === question.correctAnswer.toUpperCase();

    // Log activity
    await this.activityRepo.create(userId, questionId, timeSpentSec, isCorrect, question.topic);

    // Log mistake if incorrect
    if (!isCorrect) {
      await this.mistakeRepo.upsert(userId, questionId);
    }

    return {
      isCorrect,
      correctAnswer: question.correctAnswer,
      userAnswer,
    };
  }

  async getExplanation(questionId: string, userAnswer?: string) {
    const question = await this.questionRepo.findById(questionId);
    if (!question) {
      throw new NotFoundError('Question not found');
    }

    // Check cache first
    const cacheKey = userAnswer ? `explanation_${userAnswer}` : 'explanation';
    const cached = await this.aiCacheRepo.findByQuestionAndType(questionId, cacheKey);
    if (cached) {
      logger.debug('Returning cached AI explanation', { questionId });
      return cached.response;
    }

    // Call AI provider
    const aiProvider = getAiProvider();
    const options = question.options as unknown as QuestionOption;

    try {
      const explanation = await aiProvider.generateExplanation(
        question.questionText,
        options as unknown as Record<string, string>,
        question.correctAnswer,
        userAnswer
      );

      // Cache the response
      await this.aiCacheRepo.save(questionId, cacheKey, explanation);

      return explanation;
    } catch (error) {
      logger.error('AI explanation failed', {
        questionId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      throw error;
    }
  }

  async getHint(questionId: string) {
    const question = await this.questionRepo.findById(questionId);
    if (!question) {
      throw new NotFoundError('Question not found');
    }

    // Check cache first
    const cacheKey = 'hint';
    const cached = await this.aiCacheRepo.findByQuestionAndType(questionId, cacheKey);
    if (cached) {
      logger.debug('Returning cached AI hint', { questionId });
      return cached.response;
    }

    // Generate hint (without revealing the answer)
    const aiProvider = getAiProvider();
    const options = question.options as unknown as QuestionOption;

    try {
      const hint = await aiProvider.generateExplanation(
        question.questionText,
        options as unknown as Record<string, string>,
        question.correctAnswer,
        undefined // No user answer = hint mode
      );

      // For hints, we return a subset of the explanation
      const hintResponse = {
        hints: hint.conceptual || 'Think about the core concept behind this question.',
        tips: hint.examOriented || 'Focus on what the question is really asking.',
        strategy: hint.memoryTrick || 'Eliminate obviously wrong options first.',
      };

      await this.aiCacheRepo.save(questionId, cacheKey, hintResponse);

      return hintResponse;
    } catch (error) {
      logger.error('AI hint generation failed', {
        questionId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      throw error;
    }
  }

  async getQuestionById(questionId: string) {
    const question = await this.questionRepo.findById(questionId);
    if (!question) {
      throw new NotFoundError('Question not found');
    }

    return {
      id: question.id,
      questionText: question.questionText,
      options: question.options,
      difficulty: question.difficulty,
      topic: question.topic,
      certificationId: question.certificationId,
    };
  }

  async getTopics(certificationId: string) {
    return this.questionRepo.getTopicsByCertification(certificationId);
  }

  async getDifficulties(certificationId: string) {
    return this.questionRepo.getDifficultiesByCertification(certificationId);
  }
}
