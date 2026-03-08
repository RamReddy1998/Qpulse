import api from './api';
import { ApiResponse, PaginatedResponse, AdminDashboard, LearnerAnalytics, Batch, User, BatchParticipantAnalytics, UploadResult, Question } from '../types';

export const adminService = {
  async getDashboard(): Promise<AdminDashboard> {
    const res = await api.get<ApiResponse<AdminDashboard>>('/admin/dashboard');
    return res.data.data;
  },

  async getLearners(page = 1, limit = 20) {
    const res = await api.get<PaginatedResponse<User>>(`/admin/learners?page=${page}&limit=${limit}`);
    return res.data;
  },

  async getLearnerAnalytics(userId: string): Promise<LearnerAnalytics> {
    const res = await api.get<ApiResponse<LearnerAnalytics>>(`/admin/learners/${userId}/analytics`);
    return res.data.data;
  },

  async createBatch(batchName: string, certificationId: string, startTime?: string, endTime?: string): Promise<Batch> {
    const res = await api.post<ApiResponse<Batch>>('/admin/batches', { batchName, certificationId, startTime, endTime });
    return res.data.data;
  },

  async getBatches(page = 1, limit = 20) {
    const res = await api.get<PaginatedResponse<Batch>>(`/admin/batches?page=${page}&limit=${limit}`);
    return res.data;
  },

  async getBatchDetails(batchId: string): Promise<Batch> {
    const res = await api.get<ApiResponse<Batch>>(`/admin/batches/${batchId}`);
    return res.data.data;
  },

  async getBatchParticipantsAnalytics(batchId: string, page = 1, limit = 20) {
    const res = await api.get<ApiResponse<{ data: BatchParticipantAnalytics[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>>(
      `/admin/batches/${batchId}/analytics?page=${page}&limit=${limit}`
    );
    return res.data.data;
  },

  async addParticipant(batchId: string, username: string) {
    const res = await api.post<ApiResponse<{ message: string }>>(`/admin/batches/${batchId}/participants`, {
      username,
    });
    return res.data.data;
  },

  async removeParticipant(batchId: string, userId: string) {
    const res = await api.delete<ApiResponse<{ message: string }>>(
      `/admin/batches/${batchId}/participants/${userId}`
    );
    return res.data.data;
  },

  async getWeaknessQuestions(topic: string, certificationId?: string): Promise<Question[]> {
    const params = new URLSearchParams({ topic });
    if (certificationId) params.set('certificationId', certificationId);
    const res = await api.get<ApiResponse<Question[]>>(`/admin/weakness/questions?${params.toString()}`);
    return res.data.data;
  },

  async uploadQuestions(certificationId: string, questions: Array<{
    questionText: string;
    options: Record<string, string>;
    correctAnswer: string;
    difficulty: string;
    topic: string;
  }>): Promise<UploadResult> {
    const res = await api.post<ApiResponse<UploadResult>>(`/admin/questions/${certificationId}/upload`, { questions });
    return res.data.data;
  },
};
