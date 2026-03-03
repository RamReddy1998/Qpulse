import api from './api';
import { ApiResponse, PaginatedResponse, AdminDashboard, LearnerAnalytics, Batch, User } from '../types';

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

  async createBatch(batchName: string, certificationId: string): Promise<Batch> {
    const res = await api.post<ApiResponse<Batch>>('/admin/batches', { batchName, certificationId });
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
};
