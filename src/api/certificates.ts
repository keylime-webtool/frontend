import apiClient from './client';
import type { Certificate, CertificateExpirySummary, PaginatedResponse } from '@/types';

export const certificatesApi = {
  list(params?: { type?: string; expiry_category?: string }) {
    return apiClient.get<PaginatedResponse<Certificate>>('/certificates', { params });
  },

  expirySummary() {
    return apiClient.get<CertificateExpirySummary>('/certificates/expiry-summary');
  },

  get(certId: string) {
    return apiClient.get<Certificate>(`/certificates/${certId}`);
  },

  renew(certId: string) {
    return apiClient.post(`/certificates/${certId}/renew`);
  },

  batchRenew(certIds: string[]) {
    return apiClient.post('/certificates/batch-renew', { cert_ids: certIds });
  },

  timeline() {
    return apiClient.get('/certificates/timeline');
  },
};
