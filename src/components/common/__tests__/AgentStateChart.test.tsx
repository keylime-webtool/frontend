import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AgentStateChart } from '../AgentStateChart';

vi.mock('@/api/agents', () => ({
  agentsApi: {
    list: vi.fn().mockResolvedValue({
      data: {
        items: [
          { state: 'GET_QUOTE', attestation_mode: 'Pull' },
          { state: 'PASS', attestation_mode: 'Push' },
        ],
      },
    }),
  },
}));

function renderChart() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AgentStateChart />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AgentStateChart', () => {
  it('renders chart container when agents exist', async () => {
    const { container } = renderChart();
    await vi.waitFor(() => {
      expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
    });
  });

  it('shows no agents placeholder when empty', async () => {
    const { agentsApi } = await import('@/api/agents');
    vi.mocked(agentsApi.list).mockResolvedValueOnce({ data: { items: [] } } as never);
    renderChart();
    expect(await screen.findByText('No agents found')).toBeInTheDocument();
  });

  it('does not show placeholder when agents exist', async () => {
    renderChart();
    await vi.waitFor(() => {
      expect(screen.queryByText('No agents found')).not.toBeInTheDocument();
    });
  });

  it('renders pie chart with multiple states', async () => {
    const { agentsApi } = await import('@/api/agents');
    vi.mocked(agentsApi.list).mockResolvedValueOnce({
      data: {
        items: [
          { state: 'GET_QUOTE', attestation_mode: 'Pull' },
          { state: 'GET_QUOTE', attestation_mode: 'Pull' },
          { state: 'PASS', attestation_mode: 'Push' },
          { state: 'FAILED', attestation_mode: 'Pull' },
          { state: 'PENDING', attestation_mode: 'Push' },
        ],
      },
    } as never);
    const { container } = renderChart();
    await vi.waitFor(() => {
      expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
    });
  });

  it('renders chart with unknown agent states', async () => {
    const { agentsApi } = await import('@/api/agents');
    vi.mocked(agentsApi.list).mockResolvedValueOnce({
      data: {
        items: [
          { state: undefined, attestation_mode: undefined },
        ],
      },
    } as never);
    const { container } = renderChart();
    await vi.waitFor(() => {
      expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
    });
  });

  it('handles flat array response without items wrapper', async () => {
    const { agentsApi } = await import('@/api/agents');
    vi.mocked(agentsApi.list).mockResolvedValueOnce({
      data: [
        { state: 'PASS', attestation_mode: 'Push' },
      ],
    } as never);
    const { container } = renderChart();
    await vi.waitFor(() => {
      expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
    });
  });
});
