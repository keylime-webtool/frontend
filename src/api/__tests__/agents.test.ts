import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGet = vi.fn().mockResolvedValue({ data: {} });
const mockPost = vi.fn().mockResolvedValue({ data: {} });

vi.mock('../client', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

import { agentsApi } from '../agents';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('agentsApi', () => {
  it('list calls GET /agents with params', async () => {
    await agentsApi.list({ page: 2, per_page: 25 });
    expect(mockGet).toHaveBeenCalledWith('/agents', { params: { page: 2, per_page: 25 } });
  });

  it('get calls GET /agents/:id', async () => {
    await agentsApi.get('abc-123');
    expect(mockGet).toHaveBeenCalledWith('/agents/abc-123');
  });

  it('search calls GET /agents/search', async () => {
    await agentsApi.search('host1');
    expect(mockGet).toHaveBeenCalledWith('/agents/search', { params: { q: 'host1' } });
  });

  it('action calls POST /agents/:id/action', async () => {
    await agentsApi.action('abc', 'reactivate');
    expect(mockPost).toHaveBeenCalledWith('/agents/abc/action', { action: 'reactivate' });
  });

  it('bulkAction calls POST /agents/bulk-action', async () => {
    await agentsApi.bulkAction(['a', 'b'], 'delete');
    expect(mockPost).toHaveBeenCalledWith('/agents/bulk-action', { agent_ids: ['a', 'b'], action: 'delete' });
  });

  it('timeline calls GET /agents/:id/timeline', async () => {
    await agentsApi.timeline('xyz');
    expect(mockGet).toHaveBeenCalledWith('/agents/xyz/timeline');
  });

  it('imaLog calls GET with search param', async () => {
    await agentsApi.imaLog('xyz', { search: 'test' });
    expect(mockGet).toHaveBeenCalledWith('/agents/xyz/ima-log', { params: { search: 'test' } });
  });

  it('bootLog calls GET /agents/:id/boot-log', async () => {
    await agentsApi.bootLog('xyz');
    expect(mockGet).toHaveBeenCalledWith('/agents/xyz/boot-log');
  });

  it('certificates calls GET /agents/:id/certificates', async () => {
    await agentsApi.certificates('xyz');
    expect(mockGet).toHaveBeenCalledWith('/agents/xyz/certificates');
  });

  it('raw calls GET with source path when given', async () => {
    await agentsApi.raw('xyz', 'verifier');
    expect(mockGet).toHaveBeenCalledWith('/agents/xyz/raw/verifier');
  });

  it('raw calls GET without source path when omitted', async () => {
    await agentsApi.raw('xyz');
    expect(mockGet).toHaveBeenCalledWith('/agents/xyz/raw');
  });
});
