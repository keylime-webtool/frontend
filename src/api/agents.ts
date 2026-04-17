import apiClient from './client';
import type { Agent, AgentListParams, ImaLogEntry, BootLogEntry, PaginatedResponse } from '@/types';
import type { AttestationTimelinePoint } from '@/types';

export const agentsApi = {
  list(params?: AgentListParams) {
    return apiClient.get<PaginatedResponse<Agent>>('/agents', { params });
  },

  get(agentId: string) {
    return apiClient.get<Agent>(`/agents/${agentId}`);
  },

  search(q: string) {
    return apiClient.get<Agent[]>('/agents/search', { params: { q } });
  },

  action(agentId: string, action: string) {
    return apiClient.post(`/agents/${agentId}/action`, { action });
  },

  bulkAction(agentIds: string[], action: string) {
    return apiClient.post('/agents/bulk-action', { agent_ids: agentIds, action });
  },

  timeline(agentId: string) {
    return apiClient.get<AttestationTimelinePoint[]>(`/agents/${agentId}/timeline`);
  },

  imaLog(agentId: string, params?: { search?: string }) {
    return apiClient.get<ImaLogEntry[]>(`/agents/${agentId}/ima-log`, { params });
  },

  bootLog(agentId: string) {
    return apiClient.get<BootLogEntry[]>(`/agents/${agentId}/boot-log`);
  },

  certificates(agentId: string) {
    return apiClient.get(`/agents/${agentId}/certificates`);
  },

  raw(agentId: string, source?: 'backend' | 'registrar' | 'verifier') {
    const path = source ? `/agents/${agentId}/raw/${source}` : `/agents/${agentId}/raw`;
    return apiClient.get(path);
  },
};
