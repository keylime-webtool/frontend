import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGet = vi.fn().mockResolvedValue({ data: {} });
const mockPost = vi.fn().mockResolvedValue({ data: {} });

vi.mock('../client', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

import { auditApi } from '../audit';

beforeEach(() => vi.clearAllMocks());

describe('auditApi', () => {
  it('list calls GET /audit-log with params', async () => {
    await auditApi.list({ severity: 'critical', page: 1 });
    expect(mockGet).toHaveBeenCalledWith('/audit-log', { params: { severity: 'critical', page: 1 } });
  });

  it('export calls POST /audit-log/export', async () => {
    await auditApi.export('csv', { from_date: '2025-01-01' });
    expect(mockPost).toHaveBeenCalledWith(
      '/audit-log/export',
      { format: 'csv', from_date: '2025-01-01' },
      { responseType: 'blob' },
    );
  });

  it('verifyChain calls GET /audit-log/verify-chain', async () => {
    await auditApi.verifyChain();
    expect(mockGet).toHaveBeenCalledWith('/audit-log/verify-chain');
  });
});
