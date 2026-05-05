import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuditLog } from '../AuditLog';

vi.mock('@/api/audit', () => ({
  auditApi: {
    list: vi.fn().mockResolvedValue({
      data: {
        items: [
          {
            id: 'audit-1',
            timestamp: '2025-01-15T10:00:00Z',
            severity: 'info',
            action: 'agent_registered',
            actor: 'admin@example.com',
            resource_type: 'agent',
            result: 'success',
            source_ip: '192.168.1.1',
          },
          {
            id: 'audit-2',
            timestamp: '2025-01-15T11:00:00Z',
            severity: 'warning',
            action: 'policy_modified',
            actor: 'operator@example.com',
            resource_type: 'policy',
            result: 'success',
            source_ip: '10.0.0.5',
          },
        ],
      },
    }),
    verifyChain: vi.fn().mockResolvedValue({
      data: {
        verified: true,
        total_entries: 42,
        last_verification: '2025-01-15T12:00:00Z',
      },
    }),
  },
}));

vi.mock('@/store/visualizationStore', () => ({
  useFormatTimestamp: () => (ts: string | null) => ts ?? '--',
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
  });

  it('renders audit log entries in the table', async () => {
    renderWithProviders(<AuditLog />);
    expect(await screen.findByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('operator@example.com')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
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

  it('renders broken chain status', async () => {
    const { auditApi } = await import('@/api/audit');
    vi.mocked(auditApi.verifyChain).mockResolvedValueOnce({
      data: { verified: false, total_entries: 10, last_verification: null },
    } as never);
    renderWithProviders(<AuditLog />);
    expect(await screen.findByText('Chain Broken')).toBeInTheDocument();
  });
});
