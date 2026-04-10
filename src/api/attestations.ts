import apiClient from './client';
import type {
  AttestationSummary,
  AttestationTimelinePoint,
  FailureCategoryCount,
  AttestationIncident,
} from '@/types';

export const attestationsApi = {
  summary(timeRange?: string) {
    return apiClient.get<AttestationSummary>('/attestations/summary', {
      params: { range: timeRange },
    });
  },

  timeline(timeRange?: string) {
    return apiClient.get<AttestationTimelinePoint[]>('/attestations/timeline', {
      params: { range: timeRange },
    });
  },

  failures(timeRange?: string) {
    return apiClient.get<FailureCategoryCount[]>('/attestations/failures', {
      params: { range: timeRange },
    });
  },

  incidents(timeRange?: string) {
    return apiClient.get<AttestationIncident[]>('/attestations/incidents', {
      params: { range: timeRange },
    });
  },

  rollbackPolicy(incidentId: string) {
    return apiClient.post('/attestations/rollback-policy', { incident_id: incidentId });
  },
};
