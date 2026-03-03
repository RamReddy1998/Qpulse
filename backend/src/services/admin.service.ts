import { UserRepository } from '../repositories/user.repository';
import { MockTestRepository } from '../repositories/mocktest.repository';
import { ActivityRepository } from '../repositories/activity.repository';
import { ReadinessRepository } from '../repositories/readiness.repository';
import { MistakeRepository } from '../repositories/mistake.repository';
import { BatchRepository } from '../repositories/batch.repository';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';
import logger from '../config/logger';

export class AdminService {
  private userRepo: UserRepository;
  private mockTestRepo: MockTestRepository;
  private activityRepo: ActivityRepository;
  private readinessRepo: ReadinessRepository;
  private mistakeRepo: MistakeRepository;
  private batchRepo: BatchRepository;

  constructor() {
    this.userRepo = new UserRepository();
    this.mockTestRepo = new MockTestRepository();
    this.activityRepo = new ActivityRepository();
    this.readinessRepo = new ReadinessRepository();
    this.mistakeRepo = new MistakeRepository();
    this.batchRepo = new BatchRepository();
  }

  async getDashboard() {
    const [totalLearners, activeLearners, avgReadiness, totalMocks] = await Promise.all([
      this.userRepo.countByRole('LEARNER'),
      this.activityRepo.getActiveLearnerCount(7),
      this.readinessRepo.getAverageScore(),
      this.mockTestRepo.countAll(),
    ]);

    return {
      totalLearners,
      activeLearners,
      avgReadiness,
      totalMocks,
    };
  }

  async getLearners(page: number, limit: number) {
    return this.userRepo.findAll(page, limit);
  }

  async getLearnerAnalytics(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user || user.role !== 'LEARNER') {
      throw new NotFoundError('Learner not found');
    }

    const [timeStats, topicAccuracy, topMistakes, mockTestCount, latestReadiness] = await Promise.all([
      this.activityRepo.getTotalTimeSpent(userId),
      this.activityRepo.getTopicAccuracy(userId),
      this.mistakeRepo.getTopMistakeTopics(userId),
      this.mockTestRepo.countByUser(userId),
      this.readinessRepo.getLatest(userId),
    ]);

    return {
      username: user.username,
      totalTimeSec: timeStats.totalTimeSec,
      totalAttempts: timeStats.totalAttempts,
      mockTestCount,
      readinessScore: latestReadiness?.score || 0,
      readinessStatus: latestReadiness?.status || 'not_ready',
      topicAccuracy,
      weakTopics: topMistakes,
    };
  }

  // Batch management
  async createBatch(batchName: string, certificationId: string) {
    return this.batchRepo.create(batchName, certificationId);
  }

  async getBatches(page: number, limit: number) {
    return this.batchRepo.findAll(page, limit);
  }

  async getBatchDetails(batchId: string) {
    const batch = await this.batchRepo.findById(batchId);
    if (!batch) {
      throw new NotFoundError('Batch not found');
    }
    return batch;
  }

  async addParticipant(batchId: string, username: string) {
    const batch = await this.batchRepo.findById(batchId);
    if (!batch) {
      throw new NotFoundError('Batch not found');
    }

    const user = await this.userRepo.findByUsername(username);
    if (!user) {
      throw new NotFoundError(`User '${username}' not found`);
    }
    if (user.role !== 'LEARNER') {
      throw new BadRequestError('Only learners can be added to batches');
    }

    const isAlready = await this.batchRepo.isParticipant(batchId, user.id);
    if (isAlready) {
      throw new ConflictError('User is already a participant in this batch');
    }

    await this.batchRepo.addParticipant(batchId, user.id);

    logger.info('Participant added to batch', { batchId, username });

    return { message: `${username} added to batch successfully` };
  }

  async removeParticipant(batchId: string, userId: string) {
    await this.batchRepo.removeParticipant(batchId, userId);
    return { message: 'Participant removed from batch' };
  }
}
