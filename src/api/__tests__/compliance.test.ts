import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGet = vi.fn().mockResolvedValue({ data: {} });
const mockPost = vi.fn().mockResolvedValue({ data: {} });

vi.mock('../client', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

import { complianceApi } from '../compliance';

beforeEach(() => vi.clearAllMocks());

describe('complianceApi', () => {
  it('frameworks calls GET /compliance/frameworks', async () => {
    await complianceApi.frameworks();
    expect(mockGet).toHaveBeenCalledWith('/compliance/frameworks');
  });

  it('report calls GET /compliance/reports/:framework', async () => {
    await complianceApi.report('nist');
    expect(mockGet).toHaveBeenCalledWith('/compliance/reports/nist');
  });

  it('export calls POST with blob responseType', async () => {
    await complianceApi.export('pci-dss', 'pdf');
    expect(mockPost).toHaveBeenCalledWith(
      '/compliance/export',
      { framework: 'pci-dss', format: 'pdf' },
      { responseType: 'blob' },
    );
  });
});
