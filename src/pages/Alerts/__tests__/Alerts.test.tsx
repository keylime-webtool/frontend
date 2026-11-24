import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alerts } from '../Alerts';

vi.mock('@/api/alerts', () => ({
  alertsApi: {
    summary: vi.fn().mockResolvedValue({
      data: { critical: 3, warnings: 7, info: 2, active_alerts: 10, active_critical: 3 },
    }),
    list: vi.fn().mockResolvedValue({
      data: {
        items: [
          {
            id: 'a1', severity: 'critical', type: 'attestation_failure',
            state: 'new', description: 'Agent failed attestation',
            affected_agents: ['ag1', 'ag2'], created_timestamp: '2025-06-01T10:00:00Z',
          },
          {
            id: 'a2', severity: 'warning', type: 'cert_expiry',
            state: 'acknowledged', description: 'Cert expiring soon',
            affected_agents: ['ag3'], created_timestamp: '2025-06-02T12:00:00Z',
            escalation_count: 2,
          },
          {
            id: 'a3', severity: 'critical', type: 'pcr_change',
            state: 'under_investigation', description: 'PCR value drift after kernel update',
            affected_agents: ['ag4'], created_timestamp: '2025-06-03T09:00:00Z',
          },
          {
            id: 'a4', severity: 'info', type: 'clock_skew',
            state: 'resolved', description: 'Clock skew corrected after NTP resync',
            affected_agents: ['ag5'], created_timestamp: '2025-06-04T08:00:00Z',
          },
          {
            id: 'a5', severity: 'info', type: 'service_down',
            state: 'dismissed', description: 'Service blip during maintenance',
            affected_agents: [], created_timestamp: '2025-06-05T07:00:00Z',
          },
        ],
      },
    }),
    acknowledge: vi.fn().mockResolvedValue({ data: {} }),
    investigate: vi.fn().mockResolvedValue({ data: {} }),
    resolve: vi.fn().mockResolvedValue({ data: {} }),
    dismiss: vi.fn().mockResolvedValue({ data: {} }),
    escalate: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock('@/api/client', () => ({
  default: { get: vi.fn() },
  getBackendUrl: () => 'http://localhost:8080',
}));

function renderAlerts() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Alerts />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Alerts page', () => {
  it('renders page header', () => {
    renderAlerts();
    expect(screen.getByText('Alert Center')).toBeInTheDocument();
  });

  it('renders KPI cards with summary counts', async () => {
    renderAlerts();
    expect(await screen.findByText('3')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    const infoCards = screen.getAllByText('2');
    expect(infoCards.length).toBeGreaterThanOrEqual(1);
  });

  it('renders alert table rows', async () => {
    renderAlerts();
    expect(await screen.findByText('Agent failed attestation')).toBeInTheDocument();
    expect(screen.getByText('Cert expiring soon')).toBeInTheDocument();
  });

  it('renders filter dropdowns', async () => {
    renderAlerts();
    await screen.findByText('Agent failed attestation');
    expect(screen.getByLabelText('Filter by severity')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by state')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by type')).toBeInTheDocument();
  });

  it('renders Acknowledge button for new alerts', async () => {
    renderAlerts();
    expect(await screen.findAllByRole('button', { name: 'Acknowledge' })).toHaveLength(1);
  });

  it('renders Investigate button for new and acknowledged alerts', async () => {
    renderAlerts();
    const investigateBtns = await screen.findAllByText('Investigate');
    expect(investigateBtns).toHaveLength(2);
  });

  it('offers exactly the backend-valid actions per state', async () => {
    renderAlerts();
    await screen.findByText('Agent failed attestation');
    expect(screen.getAllByRole('button', { name: 'Acknowledge' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Investigate' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Resolve' })).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: 'Dismiss' })).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: 'Escalate' })).toHaveLength(3);
  });

  it('renders no action buttons for resolved and dismissed alerts', async () => {
    renderAlerts();
    const resolvedRow = (await screen.findByText('Clock skew corrected after NTP resync')).closest('tr');
    expect(resolvedRow).not.toBeNull();
    expect(within(resolvedRow!).queryByRole('button')).toBeNull();
    const dismissedRow = screen.getByText('Service blip during maintenance').closest('tr');
    expect(within(dismissedRow!).queryByRole('button')).toBeNull();
  });

  it('acknowledges a new alert when Acknowledge is clicked', async () => {
    const { alertsApi } = await import('@/api/alerts');
    renderAlerts();
    fireEvent.click((await screen.findAllByRole('button', { name: 'Acknowledge' }))[0]);
    await waitFor(() => expect(vi.mocked(alertsApi.acknowledge)).toHaveBeenCalledWith('a1'));
  });

  it('dismisses an acknowledged alert when Dismiss is clicked', async () => {
    const { alertsApi } = await import('@/api/alerts');
    renderAlerts();
    const acknowledgedRow = (await screen.findByText('Cert expiring soon')).closest('tr');
    fireEvent.click(within(acknowledgedRow!).getByRole('button', { name: 'Dismiss' }));
    await waitFor(() => expect(vi.mocked(alertsApi.dismiss)).toHaveBeenCalledWith('a2'));
  });

  it('escalates an alert when Escalate is clicked', async () => {
    const { alertsApi } = await import('@/api/alerts');
    renderAlerts();
    fireEvent.click((await screen.findAllByRole('button', { name: 'Escalate' }))[0]);
    await waitFor(() => expect(vi.mocked(alertsApi.escalate)).toHaveBeenCalledWith('a1'));
  });

  it('shows the escalation count next to the state for escalated alerts', async () => {
    renderAlerts();
    const acknowledgedRow = (await screen.findByText('Cert expiring soon')).closest('tr');
    expect(within(acknowledgedRow!).getByText('Escalated ×2')).toBeInTheDocument();
  });

  it('shows the backend error message when a mutation is rejected', async () => {
    const { alertsApi } = await import('@/api/alerts');
    vi.mocked(alertsApi.acknowledge).mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          error: {
            code: 'BAD_REQUEST',
            message: 'cannot acknowledge alert in dismissed state — must be New',
          },
        },
      },
    });
    renderAlerts();
    fireEvent.click((await screen.findAllByRole('button', { name: 'Acknowledge' }))[0]);
    const banner = await screen.findByRole('alert');
    expect(banner).toHaveTextContent('cannot acknowledge alert in dismissed state — must be New');
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss error' }));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('renders pie chart section titles', async () => {
    renderAlerts();
    await screen.findByText('Agent failed attestation');
    expect(screen.getByText('By Severity')).toBeInTheDocument();
    expect(screen.getByText('By Type')).toBeInTheDocument();
    expect(screen.getByText('By State')).toBeInTheDocument();
  });

  it('has a Show All Alerts reset button', () => {
    renderAlerts();
    expect(screen.getByText('Show All Alerts')).toBeInTheDocument();
  });

  it('changes severity filter via select', async () => {
    renderAlerts();
    await screen.findByText('Agent failed attestation');
    const select = screen.getByLabelText('Filter by severity');
    fireEvent.change(select, { target: { value: 'critical' } });
    expect((select as HTMLSelectElement).value).toBe('critical');
  });

  it('changes state filter via select', async () => {
    renderAlerts();
    await screen.findByText('Agent failed attestation');
    const select = screen.getByLabelText('Filter by state');
    fireEvent.change(select, { target: { value: 'new' } });
    expect((select as HTMLSelectElement).value).toBe('new');
  });

  it('changes type filter via select', async () => {
    renderAlerts();
    await screen.findByText('Agent failed attestation');
    const select = screen.getByLabelText('Filter by type');
    fireEvent.change(select, { target: { value: 'attestation_failure' } });
    expect((select as HTMLSelectElement).value).toBe('attestation_failure');
  });

  it('renders alert type column with formatted text', async () => {
    renderAlerts();
    expect(await screen.findByText('Attestation Failure')).toBeInTheDocument();
    expect(screen.getByText('Cert Expiry')).toBeInTheDocument();
  });

  it('renders affected agents count', async () => {
    renderAlerts();
    await screen.findByText('Agent failed attestation');
    const twos = screen.getAllByText('2');
    expect(twos.length).toBeGreaterThanOrEqual(1);
    const ones = screen.getAllByText('1');
    expect(ones.length).toBeGreaterThanOrEqual(1);
  });

  it('shows loading state initially', () => {
    renderAlerts();
    expect(screen.getByText('Loading alerts...')).toBeInTheDocument();
  });

  it('renders empty pie chart placeholder when no data', async () => {
    const { alertsApi } = await import('@/api/alerts');
    vi.mocked(alertsApi.list).mockResolvedValueOnce({
      data: { items: [] },
    } as never);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter><Alerts /></MemoryRouter>
      </QueryClientProvider>,
    );
    const noDataTexts = await screen.findAllByText('No data');
    expect(noDataTexts.length).toBe(3);
  });
});
