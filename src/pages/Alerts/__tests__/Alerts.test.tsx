import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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
          },
        ],
      },
    }),
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

  it('renders Ack button for new alerts', async () => {
    renderAlerts();
    expect(await screen.findByText('Ack')).toBeInTheDocument();
  });

  it('renders Investigate button for new and acknowledged alerts', async () => {
    renderAlerts();
    const investigateBtns = await screen.findAllByText('Investigate');
    expect(investigateBtns).toHaveLength(2);
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
});
