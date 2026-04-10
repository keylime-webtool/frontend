import apiClient from './client';

export const complianceApi = {
  frameworks() {
    return apiClient.get('/compliance/frameworks');
  },

  report(framework: string) {
    return apiClient.get(`/compliance/reports/${framework}`);
  },

  export(framework: string, format: 'pdf' | 'csv') {
    return apiClient.post('/compliance/export', { framework, format }, { responseType: 'blob' });
  },
};
