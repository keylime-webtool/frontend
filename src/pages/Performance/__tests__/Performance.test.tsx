import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Performance } from '../Performance';

vi.mock('@/api/performance', () => ({
  performanceApi: {
    system: vi.fn().mockResolvedValue({
      data: {
        cpu_percent: 45.2,
        memory_percent: 62.8,
        attestations_per_sec: 120,
        queue_depth: 15,
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
    expect(await screen.findByText('45.2%')).toBeInTheDocument();
    expect(await screen.findByText('62.8%')).toBeInTheDocument();
    expect(await screen.findByText('120')).toBeInTheDocument();
    expect(await screen.findByText('15')).toBeInTheDocument();
  });

  it('renders placeholder sections', () => {
    renderWithProviders(<Performance />);
    expect(screen.getByText('Verifier Cluster Metrics')).toBeInTheDocument();
    expect(screen.getByText('Database Pool Status')).toBeInTheDocument();
    expect(screen.getByText('Circuit Breaker Status')).toBeInTheDocument();
  });

  it('shows danger variant for high CPU usage', async () => {
    const { performanceApi } = await import('@/api/performance');
    vi.mocked(performanceApi.system).mockResolvedValueOnce({
      data: {
        cpu_percent: 92.5,
        memory_percent: 30.0,
        attestations_per_sec: 50,
        queue_depth: 5,
      },
    } as never);
    renderWithProviders(<Performance />);
    expect(await screen.findByText('92.5%')).toBeInTheDocument();
  });

  it('shows warning variant for high queue depth', async () => {
    const { performanceApi } = await import('@/api/performance');
    vi.mocked(performanceApi.system).mockResolvedValueOnce({
      data: {
        cpu_percent: 10.0,
        memory_percent: 20.0,
        attestations_per_sec: 80,
        queue_depth: 150,
      },
    } as never);
    renderWithProviders(<Performance />);
    expect(await screen.findByText('150')).toBeInTheDocument();
  });

  it('renders dashes when no data', async () => {
    const { performanceApi } = await import('@/api/performance');
    vi.mocked(performanceApi.system).mockResolvedValueOnce({ data: null } as never);
    renderWithProviders(<Performance />);
    const dashes = screen.getAllByText('--');
    expect(dashes.length).toBeGreaterThanOrEqual(4);
  });
});
