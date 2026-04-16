import apiClient from './client';

export interface KeylimeSettings {
  verifier_url: string;
  registrar_url: string;
}

export const settingsApi = {
  getKeylime() {
    return apiClient.get<KeylimeSettings>('/settings/keylime');
  },

  updateKeylime(settings: KeylimeSettings) {
    return apiClient.put<KeylimeSettings>('/settings/keylime', settings);
  },
};
