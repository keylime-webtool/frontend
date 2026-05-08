import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from '../Sidebar';

vi.mock('@/api/performance', () => ({
  performanceApi: { integrations: vi.fn().mockResolvedValue({ data: [] }) },
}));

vi.mock('@/api/settings', () => ({
  settingsApi: { getKeylime: vi.fn().mockResolvedValue({ data: {} }) },
}));

vi.mock('@/api/client', () => ({
  default: { get: vi.fn() },
  getBackendUrl: () => 'http://localhost:8080',
}));

function renderSidebar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Sidebar', () => {
  it('renders the brand logo link', () => {
    renderSidebar();
    expect(screen.getByText('Keylime Dashboard')).toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    renderSidebar();
    const labels = [
      'Dashboard', 'Agents', 'Policies', 'Alerts', 'Attestations',
      'Certificates', 'Performance', 'Audit Log', 'Integrations', 'Settings',
    ];
    for (const label of labels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('renders nav element with accessible label', () => {
    renderSidebar();
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  });

  it('does not show alert indicator when all services are up', () => {
    renderSidebar();
    expect(screen.queryByLabelText('Service down')).not.toBeInTheDocument();
  });

  it('shows alert indicator when backend is down', async () => {
    const { settingsApi } = await import('@/api/settings');
    vi.mocked(settingsApi.getKeylime).mockRejectedValue(new Error('Network error'));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <Sidebar />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByLabelText('Service down')).toBeInTheDocument();
    vi.mocked(settingsApi.getKeylime).mockResolvedValue({ data: {} } as never);
  });

  it('shows alert indicator when a service is down', async () => {
    const { performanceApi } = await import('@/api/performance');
    vi.mocked(performanceApi.integrations).mockResolvedValue({
      data: [
        { name: 'Verifier', endpoint: 'https://v:3000', status: 'down', latency_ms: 0 },
      ],
    } as never);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <Sidebar />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByLabelText('Service down')).toBeInTheDocument();
    vi.mocked(performanceApi.integrations).mockResolvedValue({ data: [] } as never);
  });
});
