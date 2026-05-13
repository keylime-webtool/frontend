import apiClient from './client';
import type { PerformanceSummary, IntegrationService } from '@/types';

export const performanceApi = {
  summary() {
    return apiClient.get<PerformanceSummary>('/performance/summary');
  },

  database() {
    return apiClient.get('/system/database');
  },

  integrations() {
    return apiClient.get<IntegrationService[]>('/integrations/status');
  },

  attestationBackends() {
    return apiClient.get('/integrations/attestation-backends');
  },
};
