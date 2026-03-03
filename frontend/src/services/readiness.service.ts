import api from './api';
import { ApiResponse, PaginatedResponse, ReadinessScore, ReadinessHistory, TopicAccuracy, MistakeLog } from '../types';

export const readinessService = {
  async calculate(): Promise<ReadinessScore> {
    const res = await api.post<ApiResponse<ReadinessScore>>('/readiness/calculate');
    return res.data.data;
  },

  async getLatest(): Promise<ReadinessHistory | null> {
    const res = await api.get<ApiResponse<ReadinessHistory | null>>('/readiness/latest');
    return res.data.data;
  },

  async getHistory(): Promise<ReadinessHistory[]> {
    const res = await api.get<ApiResponse<ReadinessHistory[]>>('/readiness/history');
    return res.data.data;
  },

  async getTopicAccuracy(): Promise<TopicAccuracy[]> {
    const res = await api.get<ApiResponse<TopicAccuracy[]>>('/readiness/topic-accuracy');
    return res.data.data;
  },

  async getMistakes(page = 1, limit = 20) {
    const res = await api.get<PaginatedResponse<MistakeLog>>(`/readiness/mistakes?page=${page}&limit=${limit}`);
    return res.data;
  },
};
