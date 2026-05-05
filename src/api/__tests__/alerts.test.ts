import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGet = vi.fn().mockResolvedValue({ data: {} });
const mockPost = vi.fn().mockResolvedValue({ data: {} });

vi.mock('../client', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

import { alertsApi } from '../alerts';

beforeEach(() => vi.clearAllMocks());

describe('alertsApi', () => {
  it('list calls GET /alerts with params', async () => {
    await alertsApi.list({ severity: 'critical', page: 1 });
    expect(mockGet).toHaveBeenCalledWith('/alerts', { params: { severity: 'critical', page: 1 } });
  });

  it('summary calls GET /alerts/summary', async () => {
    await alertsApi.summary();
    expect(mockGet).toHaveBeenCalledWith('/alerts/summary');
  });

  it('get calls GET /alerts/:id', async () => {
    await alertsApi.get('alert-1');
    expect(mockGet).toHaveBeenCalledWith('/alerts/alert-1');
  });

  it('acknowledge calls POST /alerts/:id/acknowledge', async () => {
    await alertsApi.acknowledge('alert-1');
    expect(mockPost).toHaveBeenCalledWith('/alerts/alert-1/acknowledge');
  });

  it('investigate calls POST with assignedTo', async () => {
    await alertsApi.investigate('alert-1', 'admin');
    expect(mockPost).toHaveBeenCalledWith('/alerts/alert-1/investigate', { assigned_to: 'admin' });
  });

  it('resolve calls POST with resolution', async () => {
    await alertsApi.resolve('alert-1', 'fixed');
    expect(mockPost).toHaveBeenCalledWith('/alerts/alert-1/resolve', { resolution: 'fixed' });
  });

  it('escalate calls POST /alerts/:id/escalate', async () => {
    await alertsApi.escalate('alert-1');
    expect(mockPost).toHaveBeenCalledWith('/alerts/alert-1/escalate');
  });
});
