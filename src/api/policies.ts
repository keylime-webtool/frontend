import apiClient from './client';
import type { Policy, PolicyImpactResult, PaginatedResponse } from '@/types';

export const policiesApi = {
  list(params?: { search?: string }) {
    return apiClient.get<PaginatedResponse<Policy>>('/policies', { params });
  },

  get(policyId: string) {
    return apiClient.get<Policy>(`/policies/${policyId}`);
  },

  create(data: Partial<Policy>) {
    return apiClient.post<Policy>('/policies', data);
  },

  update(policyId: string, data: Partial<Policy>) {
    return apiClient.put<Policy>(`/policies/${policyId}`, data);
  },

  delete(policyId: string) {
    return apiClient.delete(`/policies/${policyId}`);
  },

  versions(policyId: string) {
    return apiClient.get(`/policies/${policyId}/versions`);
  },

  diff(policyId: string, fromVersion: number, toVersion: number) {
    return apiClient.get(`/policies/${policyId}/diff`, {
      params: { from: fromVersion, to: toVersion },
    });
  },

  rollback(policyId: string, version: number) {
    return apiClient.post(`/policies/${policyId}/rollback`, { version });
  },

  impactAnalysis(policyId: string) {
    return apiClient.post<PolicyImpactResult>('/policies/impact-analysis', {
      policy_id: policyId,
    });
  },

  submitForApproval(policyId: string) {
    return apiClient.post('/policies/submit-for-approval', { policy_id: policyId });
  },

  approve(policyId: string) {
    return apiClient.post(`/policies/${policyId}/approve`);
  },

  assignmentMatrix() {
    return apiClient.get('/policies/assignment-matrix');
  },
};
