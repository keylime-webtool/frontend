import apiClient from './client';
import type { Certificate, CertificateExpirySummary, CertificateTimelineEntry, CertificateType, ExpiryCategory, PaginatedResponse } from '@/types';

export const certificatesApi = {
  list(params?: { type?: CertificateType; expiry_category?: ExpiryCategory }) {
    return apiClient.get<PaginatedResponse<Certificate>>('/certificates', { params });
  },

  expirySummary() {
    return apiClient.get<CertificateExpirySummary>('/certificates/expiry-summary');
  },

  get(certId: string) {
    return apiClient.get<Certificate>(`/certificates/${certId}`);
  },

  timeline() {
    return apiClient.get<CertificateTimelineEntry[]>('/certificates/timeline');
  },

  downloadPem(certId: string) {
    return apiClient.get<Blob>(`/certificates/${certId}/download/pem`, {
      responseType: 'blob',
    });
  },

  downloadDer(certId: string) {
    return apiClient.get<Blob>(`/certificates/${certId}/download/der`, {
      responseType: 'blob',
    });
  },
};
