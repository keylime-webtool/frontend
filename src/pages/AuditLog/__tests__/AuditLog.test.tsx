import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuditLog } from '../AuditLog';

vi.mock('@/api/audit', () => ({
  auditApi: {
    list: vi.fn().mockResolvedValue({
      data: {
        items: [
          {
            id: 1,
            timestamp: '2025-01-15T10:00:00Z',
            severity: 'INFO',
            action: 'config_change',
            actor: 'admin@example.com',
            resource: 'settings/keylime',
            source_ip: '192.168.1.1',
            user_agent: 'Mozilla/5.0',
            result: 'SUCCESS',
            previous_hash: '0'.repeat(64),
            entry_hash: 'a'.repeat(64),
          },
          {
            id: 2,
            timestamp: '2025-01-15T11:00:00Z',
            severity: 'WARNING',
            action: 'alert_action',
            actor: 'operator@example.com',
            resource: '9d2c1f0a-1234-4abc-9def-567890abcdef',
            source_ip: 'unknown',
            user_agent: null,
            result: 'acknowledged',
            previous_hash: 'a'.repeat(64),
            entry_hash: 'b'.repeat(64),
          },
        ],
        page: 1,
        page_size: 50,
        total_items: 2,
        total_pages: 1,
      },
    }),
    export: vi.fn().mockResolvedValue({ blob: new Blob(['']), filename: 'audit-log.csv' }),
    verifyChain: vi.fn().mockResolvedValue({
      verified: true,
      total_entries: 42,
    }),
  },
}));

vi.mock('@/store/visualizationStore', () => ({
  useFormatTimestamp: () => (value: string | number | Date | null | undefined) =>
    value == null ? '--' : String(value),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AuditLog', () => {
  it('renders page title and subtitle', () => {
    renderWithProviders(<AuditLog />);
    expect(screen.getByText('Audit Log')).toBeInTheDocument();
    expect(screen.getByText(/Tamper-evident security event log/)).toBeInTheDocument();
  });

  it('renders chain verification status', async () => {
    renderWithProviders(<AuditLog />);
    expect(await screen.findByText('Chain Verified')).toBeInTheDocument();
    expect(await screen.findByText(/42 entries/)).toBeInTheDocument();
    expect(screen.getByText(/Last checked:/)).toBeInTheDocument();
  });

  it('renders audit log entries in the table', async () => {
    renderWithProviders(<AuditLog />);
    expect(await screen.findByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('operator@example.com')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    expect(screen.getByText('settings/keylime')).toBeInTheDocument();
    expect(screen.getByText('SUCCESS')).toBeInTheDocument();
  });

  it('renders severity filter dropdown', () => {
    renderWithProviders(<AuditLog />);
    expect(screen.getByRole('combobox', { name: /filter by severity/i })).toBeInTheDocument();
  });

  it('changes severity filter', async () => {
    const { auditApi } = await import('@/api/audit');
    renderWithProviders(<AuditLog />);
    const select = screen.getByRole('combobox', { name: /filter by severity/i });
    fireEvent.change(select, { target: { value: 'critical' } });
    expect(vi.mocked(auditApi.list)).toHaveBeenCalledWith({ severity: 'critical' });
  });

  it('renders export buttons', () => {
    renderWithProviders(<AuditLog />);
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
    expect(screen.getByText('Export JSON')).toBeInTheDocument();
  });

  it('renders broken chain status with entry and reason', async () => {
    const { auditApi } = await import('@/api/audit');
    vi.mocked(auditApi.verifyChain).mockResolvedValueOnce({
      verified: false,
      total_entries: 10,
      broken_entry_id: 7,
      reason: 'hash mismatch at entry 7',
    });
    renderWithProviders(<AuditLog />);
    expect(await screen.findByText('Chain Broken')).toBeInTheDocument();
    expect(screen.getByText(/Broken at entry #7/)).toBeInTheDocument();
    expect(screen.getByText(/hash mismatch at entry 7/)).toBeInTheDocument();
  });
});
