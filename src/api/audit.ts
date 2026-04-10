import apiClient from './client';
import type { AuditLogEntry, HashChainStatus, PaginatedResponse } from '@/types';

export const auditApi = {
  list(params?: {
    severity?: string;
    category?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
    per_page?: number;
  }) {
    return apiClient.get<PaginatedResponse<AuditLogEntry>>('/audit-log', { params });
  },

  export(format: 'csv' | 'json', params?: { from_date?: string; to_date?: string }) {
    return apiClient.post('/audit-log/export', { format, ...params }, { responseType: 'blob' });
  },

  verifyChain() {
    return apiClient.get<HashChainStatus>('/audit-log/verify-chain');
  },
};
