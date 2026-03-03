import { Response, NextFunction } from 'express';
import { PracticeService } from '../services/practice.service';
import { AuthenticatedRequest } from '../types';
import { sendSuccess } from '../utils/response';

const practiceService = new PracticeService();

export class PracticeController {
  static async getQuestions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const certificationId = req.params.certificationId as string;
      const count = parseInt(req.query.count as string) || 1;
      const excludeIds = req.query.excludeIds
        ? (req.query.excludeIds as string).split(',')
        : [];

      const questions = await practiceService.getRandomQuestions(certificationId, count, excludeIds);
      sendSuccess(res, questions, 'Practice questions retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async submitAnswer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { questionId, userAnswer, timeSpentSec } = req.body;

      const result = await practiceService.submitAnswer(userId, questionId, userAnswer, timeSpentSec || 0);
      sendSuccess(res, result, 'Answer submitted');
    } catch (error) {
      next(error);
    }
  }

  static async getExplanation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const questionId = req.params.questionId as string;
      const userAnswer = req.query.userAnswer as string | undefined;

      const explanation = await practiceService.getExplanation(questionId, userAnswer);
      sendSuccess(res, explanation, 'Explanation retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getTopics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const certificationId = req.params.certificationId as string;
      const topics = await practiceService.getTopics(certificationId);
      sendSuccess(res, topics, 'Topics retrieved');
    } catch (error) {
      next(error);
    }
  }
}
