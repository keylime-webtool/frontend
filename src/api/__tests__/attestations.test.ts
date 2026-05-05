import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGet = vi.fn().mockResolvedValue({ data: {} });
const mockPost = vi.fn().mockResolvedValue({ data: {} });

vi.mock('../client', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

import { attestationsApi } from '../attestations';

beforeEach(() => vi.clearAllMocks());

describe('attestationsApi', () => {
  it('summary calls GET with range param', async () => {
    await attestationsApi.summary('24h');
    expect(mockGet).toHaveBeenCalledWith('/attestations/summary', { params: { range: '24h' } });
  });

  it('timeline calls GET with range param', async () => {
    await attestationsApi.timeline('7d');
    expect(mockGet).toHaveBeenCalledWith('/attestations/timeline', { params: { range: '7d' } });
  });

  it('failures calls GET with range param', async () => {
    await attestationsApi.failures('1h');
    expect(mockGet).toHaveBeenCalledWith('/attestations/failures', { params: { range: '1h' } });
  });

  it('incidents calls GET with range param', async () => {
    await attestationsApi.incidents('30d');
    expect(mockGet).toHaveBeenCalledWith('/attestations/incidents', { params: { range: '30d' } });
  });

  it('rollbackPolicy calls POST with incident_id', async () => {
    await attestationsApi.rollbackPolicy('inc-1');
    expect(mockPost).toHaveBeenCalledWith('/attestations/rollback-policy', { incident_id: 'inc-1' });
  });
});
