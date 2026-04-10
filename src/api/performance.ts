import apiClient from './client';
import type { SystemPerformance, IntegrationService } from '@/types';

export const performanceApi = {
  system() {
    return apiClient.get<SystemPerformance>('/system/performance');
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
