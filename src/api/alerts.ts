import apiClient from './client';
import type { Alert, AlertSummary, PaginatedResponse } from '@/types';

export const alertsApi = {
  list(params?: { severity?: string; state?: string; page?: number; per_page?: number }) {
    return apiClient.get<PaginatedResponse<Alert>>('/alerts', { params });
  },

  summary() {
    return apiClient.get<AlertSummary>('/alerts/summary');
  },

  get(alertId: string) {
    return apiClient.get<Alert>(`/alerts/${alertId}`);
  },

  acknowledge(alertId: string) {
    return apiClient.post(`/alerts/${alertId}/acknowledge`);
  },

  investigate(alertId: string, assignedTo?: string) {
    return apiClient.post(`/alerts/${alertId}/investigate`, { assigned_to: assignedTo });
  },

  resolve(alertId: string, resolution?: string) {
    return apiClient.post(`/alerts/${alertId}/resolve`, { resolution });
  },

  escalate(alertId: string) {
    return apiClient.post(`/alerts/${alertId}/escalate`);
  },
};
