import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Performance } from '../Performance';

vi.mock('@/api/performance', () => ({
  performanceApi: {
    summary: vi.fn().mockResolvedValue({
      data: {
        verifier_reachable: true,
        verifier_latency_ms: 42,
        circuit_breaker_state: 'closed',
        agent_count: 8,
        estimated_attestation_rate: 120,
        capacity_utilization_pct: 55.3,
        database_status: 'ok',
      },
    }),
  },
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

describe('Performance', () => {
  it('renders page title and subtitle', () => {
    renderWithProviders(<Performance />);
    expect(screen.getByText('System Performance')).toBeInTheDocument();
    expect(screen.getByText(/Monitor Keylime verifier cluster/)).toBeInTheDocument();
  });

  it('renders KPI cards with performance data', async () => {
    renderWithProviders(<Performance />);
    expect(await screen.findByText('Reachable')).toBeInTheDocument();
    expect(await screen.findByText('42 ms')).toBeInTheDocument();
    expect(await screen.findByText('Closed')).toBeInTheDocument();
    expect(await screen.findByText('120/s')).toBeInTheDocument();
    expect(await screen.findByText('55.3%')).toBeInTheDocument();
  });

  it('renders placeholder sections', () => {
    renderWithProviders(<Performance />);
    expect(screen.getByText('Verifier Cluster Metrics')).toBeInTheDocument();
    expect(screen.getByText('Database Pool Status')).toBeInTheDocument();
    expect(screen.getByText('Circuit Breaker Status')).toBeInTheDocument();
  });

  it('shows danger variant for unreachable verifier', async () => {
    const { performanceApi } = await import('@/api/performance');
    vi.mocked(performanceApi.summary).mockResolvedValueOnce({
      data: {
        verifier_reachable: false,
        verifier_latency_ms: null,
        circuit_breaker_state: 'open',
        agent_count: 0,
        estimated_attestation_rate: null,
        capacity_utilization_pct: null,
        database_status: 'ok',
      },
    } as never);
    renderWithProviders(<Performance />);
    expect(await screen.findByText('Unreachable')).toBeInTheDocument();
    expect(await screen.findByText('Open')).toBeInTheDocument();
  });

  it('shows warning variant for high capacity', async () => {
    const { performanceApi } = await import('@/api/performance');
    vi.mocked(performanceApi.summary).mockResolvedValueOnce({
      data: {
        verifier_reachable: true,
        verifier_latency_ms: 15,
        circuit_breaker_state: 'half_open',
        agent_count: 50,
        estimated_attestation_rate: 200,
        capacity_utilization_pct: 78.5,
        database_status: 'ok',
      },
    } as never);
    renderWithProviders(<Performance />);
    expect(await screen.findByText('Half-Open')).toBeInTheDocument();
    expect(await screen.findByText('78.5%')).toBeInTheDocument();
  });

  it('renders dashes when no data', async () => {
    const { performanceApi } = await import('@/api/performance');
    vi.mocked(performanceApi.summary).mockResolvedValueOnce({ data: null } as never);
    renderWithProviders(<Performance />);
    const dashes = screen.getAllByText('--');
    expect(dashes.length).toBeGreaterThanOrEqual(4);
  });
});
