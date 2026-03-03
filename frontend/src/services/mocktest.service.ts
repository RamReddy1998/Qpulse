import api from './api';
import { ApiResponse, PaginatedResponse, MockTestStart, MockTestResult, MockTestDetail } from '../types';

export const mockTestService = {
  async start(certificationId: string, questionCount = 30): Promise<MockTestStart> {
    const res = await api.post<ApiResponse<MockTestStart>>('/mock-tests/start', {
      certificationId,
      questionCount,
    });
    return res.data.data;
  },

  async submit(
    mockTestId: string,
    answers: Array<{ questionId: string; userAnswer: string; timeSpentSec: number }>
  ): Promise<MockTestResult> {
    const res = await api.post<ApiResponse<MockTestResult>>(`/mock-tests/${mockTestId}/submit`, {
      answers,
    });
    return res.data.data;
  },

  async getResult(mockTestId: string): Promise<MockTestDetail> {
    const res = await api.get<ApiResponse<MockTestDetail>>(`/mock-tests/${mockTestId}/result`);
    return res.data.data;
  },

  async getHistory(page = 1, limit = 20) {
    const res = await api.get<PaginatedResponse<MockTestDetail>>(`/mock-tests/history?page=${page}&limit=${limit}`);
    return res.data;
  },
};
