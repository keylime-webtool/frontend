import apiClient from './client';

export interface KeylimeSettings {
  verifier_url: string;
  registrar_url: string;
}

export interface CertificateSettings {
  cert_path: string | null;
  key_path: string | null;
  ca_cert_path: string | null;
}

export const settingsApi = {
  getKeylime() {
    return apiClient.get<KeylimeSettings>('/settings/keylime');
  },

  updateKeylime(settings: KeylimeSettings) {
    return apiClient.put<KeylimeSettings>('/settings/keylime', settings);
  },

  getCertificates() {
    return apiClient.get<CertificateSettings>('/settings/certificates');
  },

  updateCertificates(settings: CertificateSettings) {
    return apiClient.put<CertificateSettings>('/settings/certificates', settings);
  },
};
