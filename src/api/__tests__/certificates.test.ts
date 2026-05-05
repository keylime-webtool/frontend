import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGet = vi.fn().mockResolvedValue({ data: {} });

vi.mock('../client', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

import { certificatesApi } from '../certificates';

beforeEach(() => vi.clearAllMocks());

describe('certificatesApi', () => {
  it('list calls GET /certificates with params', async () => {
    await certificatesApi.list({ type: 'ek' as never });
    expect(mockGet).toHaveBeenCalledWith('/certificates', { params: { type: 'ek' } });
  });

  it('expirySummary calls GET /certificates/expiry-summary', async () => {
    await certificatesApi.expirySummary();
    expect(mockGet).toHaveBeenCalledWith('/certificates/expiry-summary');
  });

  it('get calls GET /certificates/:id', async () => {
    await certificatesApi.get('cert-1');
    expect(mockGet).toHaveBeenCalledWith('/certificates/cert-1');
  });

  it('timeline calls GET /certificates/timeline', async () => {
    await certificatesApi.timeline();
    expect(mockGet).toHaveBeenCalledWith('/certificates/timeline');
  });

  it('downloadPem calls GET with blob responseType', async () => {
    await certificatesApi.downloadPem('cert-1');
    expect(mockGet).toHaveBeenCalledWith('/certificates/cert-1/download/pem', { responseType: 'blob' });
  });

  it('downloadDer calls GET with blob responseType', async () => {
    await certificatesApi.downloadDer('cert-1');
    expect(mockGet).toHaveBeenCalledWith('/certificates/cert-1/download/der', { responseType: 'blob' });
  });
});
