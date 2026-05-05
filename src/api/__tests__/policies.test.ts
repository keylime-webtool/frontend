import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGet = vi.fn().mockResolvedValue({ data: {} });
const mockPost = vi.fn().mockResolvedValue({ data: {} });
const mockPut = vi.fn().mockResolvedValue({ data: {} });
const mockDelete = vi.fn().mockResolvedValue({ data: {} });

vi.mock('../client', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    put: (...args: unknown[]) => mockPut(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

import { policiesApi } from '../policies';

beforeEach(() => vi.clearAllMocks());

describe('policiesApi', () => {
  it('list calls GET /policies with params', async () => {
    await policiesApi.list({ search: 'ima' });
    expect(mockGet).toHaveBeenCalledWith('/policies', { params: { search: 'ima' } });
  });

  it('get calls GET /policies/:id', async () => {
    await policiesApi.get('pol-1');
    expect(mockGet).toHaveBeenCalledWith('/policies/pol-1');
  });

  it('create calls POST /policies', async () => {
    await policiesApi.create({ name: 'new' });
    expect(mockPost).toHaveBeenCalledWith('/policies', { name: 'new' });
  });

  it('update calls PUT /policies/:id', async () => {
    await policiesApi.update('pol-1', { name: 'updated' });
    expect(mockPut).toHaveBeenCalledWith('/policies/pol-1', { name: 'updated' });
  });

  it('delete calls DELETE /policies/:id', async () => {
    await policiesApi.delete('pol-1');
    expect(mockDelete).toHaveBeenCalledWith('/policies/pol-1');
  });

  it('versions calls GET /policies/:id/versions', async () => {
    await policiesApi.versions('pol-1');
    expect(mockGet).toHaveBeenCalledWith('/policies/pol-1/versions');
  });

  it('diff calls GET with from/to params', async () => {
    await policiesApi.diff('pol-1', 1, 3);
    expect(mockGet).toHaveBeenCalledWith('/policies/pol-1/diff', { params: { from: 1, to: 3 } });
  });

  it('rollback calls POST /policies/:id/rollback', async () => {
    await policiesApi.rollback('pol-1', 2);
    expect(mockPost).toHaveBeenCalledWith('/policies/pol-1/rollback', { version: 2 });
  });

  it('impactAnalysis calls POST /policies/impact-analysis', async () => {
    await policiesApi.impactAnalysis('pol-1');
    expect(mockPost).toHaveBeenCalledWith('/policies/impact-analysis', { policy_id: 'pol-1' });
  });

  it('submitForApproval calls POST', async () => {
    await policiesApi.submitForApproval('pol-1');
    expect(mockPost).toHaveBeenCalledWith('/policies/submit-for-approval', { policy_id: 'pol-1' });
  });

  it('approve calls POST /policies/:id/approve', async () => {
    await policiesApi.approve('pol-1');
    expect(mockPost).toHaveBeenCalledWith('/policies/pol-1/approve');
  });

  it('assignmentMatrix calls GET /policies/assignment-matrix', async () => {
    await policiesApi.assignmentMatrix();
    expect(mockGet).toHaveBeenCalledWith('/policies/assignment-matrix');
  });
});
