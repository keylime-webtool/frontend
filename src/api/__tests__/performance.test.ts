import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGet = vi.fn().mockResolvedValue({ data: {} });

vi.mock('../client', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

import { performanceApi } from '../performance';

beforeEach(() => vi.clearAllMocks());

describe('performanceApi', () => {
  it('summary calls GET /performance/summary', async () => {
    await performanceApi.summary();
    expect(mockGet).toHaveBeenCalledWith('/performance/summary');
  });

  it('registrar calls GET /performance/registrar', async () => {
    await performanceApi.registrar();
    expect(mockGet).toHaveBeenCalledWith('/performance/registrar');
  });

  it('database calls GET /system/database', async () => {
    await performanceApi.database();
    expect(mockGet).toHaveBeenCalledWith('/system/database');
  });

  it('integrations calls GET /integrations/status', async () => {
    await performanceApi.integrations();
    expect(mockGet).toHaveBeenCalledWith('/integrations/status');
  });

  it('attestationBackends calls GET /integrations/attestation-backends', async () => {
    await performanceApi.attestationBackends();
    expect(mockGet).toHaveBeenCalledWith('/integrations/attestation-backends');
  });
});
