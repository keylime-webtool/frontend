import { describe, it, expect, vi, beforeEach, expectTypeOf } from 'vitest';

const mockGet = vi.fn().mockResolvedValue({ data: {} });

vi.mock('../client', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

import { auditApi } from '../audit';
import type { AuditLogEntry, HashChainStatus } from '@/types';

beforeEach(() => vi.clearAllMocks());

describe('auditApi', () => {
  it('list calls GET /audit-log with renamed params and uppercased severity', async () => {
    await auditApi.list({ severity: 'critical', action: 'config_change', page: 2, page_size: 50 });
    expect(mockGet).toHaveBeenCalledWith('/audit-log', {
      params: { severity: 'CRITICAL', action: 'config_change', page: 2, page_size: 50 },
    });
  });

  it('export calls GET /audit-log/export with format, filters and blob response', async () => {
    mockGet.mockResolvedValueOnce({
      data: new Blob(['id,timestamp\n']),
      headers: { 'content-disposition': 'attachment; filename="audit-log-20261124T120000Z.csv"' },
    });
    const file = await auditApi.export('csv', { severity: 'warning' });
    expect(mockGet).toHaveBeenCalledWith('/audit-log/export', {
      params: { format: 'csv', severity: 'WARNING' },
      responseType: 'blob',
    });
    expect(file.filename).toBe('audit-log-20261124T120000Z.csv');
    expect(file.blob).toBeInstanceOf(Blob);
  });

  it('export falls back to a timestamped filename without Content-Disposition', async () => {
    mockGet.mockResolvedValueOnce({ data: new Blob(['[]']), headers: {} });
    const file = await auditApi.export('json');
    expect(file.filename).toMatch(/^audit-log-\d{4}-\d{2}-\d{2}T.+\.json$/);
  });

  it('verifyChain calls GET /audit-log/verify', async () => {
    mockGet.mockResolvedValueOnce({ data: { verified: true, total_entries: 3 } });
    const status = await auditApi.verifyChain();
    expect(mockGet).toHaveBeenCalledWith('/audit-log/verify');
    expect(status).toEqual({ verified: true, total_entries: 3 });
  });

  it('verifyChain resolves with the bare 409 body when the chain is broken', async () => {
    const brokenChain = { verified: false, total_entries: 10, broken_entry_id: 4, reason: 'hash mismatch' };
    mockGet.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 409, data: brokenChain },
    });
    await expect(auditApi.verifyChain()).resolves.toEqual(brokenChain);
  });

  it('verifyChain rethrows errors that are not a broken-chain 409', async () => {
    mockGet.mockRejectedValueOnce(new Error('network unreachable'));
    await expect(auditApi.verifyChain()).rejects.toThrow('network unreachable');
  });
});

describe('audit contract types', () => {
  it('AuditLogEntry matches the backend AuditEntry JSON shape', () => {
    expectTypeOf<AuditLogEntry>().toEqualTypeOf<{
      id: number;
      timestamp: string;
      severity: 'CRITICAL' | 'WARNING' | 'INFO';
      actor: string;
      action: string;
      resource: string;
      source_ip: string;
      user_agent: string | null;
      result: string;
      previous_hash: string;
      entry_hash: string;
    }>();
  });

  it('HashChainStatus matches the verify endpoint bodies', () => {
    expectTypeOf<HashChainStatus>().toEqualTypeOf<{
      verified: boolean;
      total_entries: number;
      broken_entry_id?: number;
      reason?: string;
    }>();
  });
});
