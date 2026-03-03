import { Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendPaginated } from '../utils/response';

const adminService = new AdminService();

export class AdminController {
  static async getDashboard(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const dashboard = await adminService.getDashboard();
      sendSuccess(res, dashboard, 'Admin dashboard retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getLearners(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { users, total } = await adminService.getLearners(page, limit);
      sendPaginated(res, users, total, page, limit, 'Learners retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getLearnerAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      const analytics = await adminService.getLearnerAnalytics(userId);
      sendSuccess(res, analytics, 'Learner analytics retrieved');
    } catch (error) {
      next(error);
    }
  }

  // Batch management
  static async createBatch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { batchName, certificationId } = req.body;
      const batch = await adminService.createBatch(batchName, certificationId);
      sendSuccess(res, batch, 'Batch created', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getBatches(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const { batches, total } = await adminService.getBatches(page, limit);
      sendPaginated(res, batches, total, page, limit, 'Batches retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getBatchDetails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const batchId = req.params.batchId as string;
      const batch = await adminService.getBatchDetails(batchId);
      sendSuccess(res, batch, 'Batch details retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async addParticipant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const batchId = req.params.batchId as string;
      const { username } = req.body;
      const result = await adminService.addParticipant(batchId, username);
      sendSuccess(res, result, 'Participant added');
    } catch (error) {
      next(error);
    }
  }

  static async removeParticipant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const batchId = req.params.batchId as string;
      const userId = req.params.userId as string;
      const result = await adminService.removeParticipant(batchId, userId);
      sendSuccess(res, result, 'Participant removed');
    } catch (error) {
      next(error);
    }
  }
}
