import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGet = vi.fn().mockResolvedValue({ data: {} });
const mockPut = vi.fn().mockResolvedValue({ data: {} });

vi.mock('../client', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    put: (...args: unknown[]) => mockPut(...args),
  },
}));

import { settingsApi } from '../settings';

beforeEach(() => vi.clearAllMocks());

describe('settingsApi', () => {
  it('getKeylime calls GET /settings/keylime', async () => {
    await settingsApi.getKeylime();
    expect(mockGet).toHaveBeenCalledWith('/settings/keylime');
  });

  it('updateKeylime calls PUT /settings/keylime', async () => {
    const settings = { verifier_url: 'https://v', registrar_url: 'https://r' };
    await settingsApi.updateKeylime(settings);
    expect(mockPut).toHaveBeenCalledWith('/settings/keylime', settings);
  });

  it('getCertificates calls GET /settings/certificates', async () => {
    await settingsApi.getCertificates();
    expect(mockGet).toHaveBeenCalledWith('/settings/certificates');
  });

  it('updateCertificates calls PUT /settings/certificates', async () => {
    const settings = { cert_path: '/a', key_path: '/b', ca_cert_path: '/c' };
    await settingsApi.updateCertificates(settings);
    expect(mockPut).toHaveBeenCalledWith('/settings/certificates', settings);
  });
});
