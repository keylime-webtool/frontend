import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from '../Dashboard';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useOutletContext: () => ({ timeRange: '24h' }),
  };
});

vi.mock('@/api/agents', () => ({
  agentsApi: {
    list: vi.fn().mockResolvedValue({
      data: {
        items: [
          { id: 'a1', state: 'GET_QUOTE', attestation_mode: 'Pull' },
          { id: 'a2', state: 'FAILED', attestation_mode: 'Pull' },
          { id: 'a3', state: 'PASS', attestation_mode: 'Push' },
        ],
        total_items: 3,
      },
    }),
  },
}));

vi.mock('@/api/attestations', () => ({
  attestationsApi: {
    summary: vi.fn().mockResolvedValue({ data: null }),
    timeline: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('@/api/alerts', () => ({
  alertsApi: {
    summary: vi.fn().mockResolvedValue({
      data: { active_alerts: 5, active_critical: 2, critical: 2, warnings: 3, info: 1 },
    }),
    list: vi.fn().mockResolvedValue({
      data: {
        items: [
          { id: 'al1', severity: 'critical', type: 'attestation_failure', state: 'new', description: 'test', affected_agents: ['a1'], created_timestamp: '2025-01-01' },
          { id: 'al2', severity: 'warning', type: 'cert_expiry', state: 'acknowledged', description: 'test2', affected_agents: [], created_timestamp: '2025-01-02' },
        ],
      },
    }),
  },
}));

vi.mock('@/api/client', () => ({
  default: { get: vi.fn() },
  getBackendUrl: () => 'http://localhost:8080',
}));

function renderDashboard() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Dashboard', () => {
  it('renders fleet overview header', () => {
    renderDashboard();
    expect(screen.getByText('Fleet Overview')).toBeInTheDocument();
  });

  it('renders KPI cards', async () => {
    renderDashboard();
    expect(await screen.findByText('Total Agents')).toBeInTheDocument();
    expect(screen.getByText('Attestation Success Rate')).toBeInTheDocument();
    expect(screen.getByText('Failed Attestations')).toBeInTheDocument();
    expect(screen.getByText('Urgent Alerts')).toBeInTheDocument();
  });

  it('uses fallback agent attestation stats when summary is null', async () => {
    renderDashboard();
    // 2 of 3 agents are attested (GET_QUOTE, FAILED, PASS); 1 failed → 66.67%
    expect(await screen.findByText('66.67%')).toBeInTheDocument();
  });

  it('renders total agents from API', async () => {
    renderDashboard();
    expect(await screen.findByText('3')).toBeInTheDocument();
  });

  it('renders alert summary subtitle', async () => {
    renderDashboard();
    expect(await screen.findByText('2 critical, 3 warnings')).toBeInTheDocument();
  });

  it('renders chart dimension toggle buttons', async () => {
    renderDashboard();
    await screen.findByText('Total Agents');
    expect(screen.getByText('severity')).toBeInTheDocument();
    expect(screen.getByText('type')).toBeInTheDocument();
    expect(screen.getByText('state')).toBeInTheDocument();
  });
});
