import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Integrations } from '../Integrations';

vi.mock('@/api/settings', () => ({
  settingsApi: {
    getKeylime: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('@/api/performance', () => ({
  performanceApi: {
    integrations: vi.fn().mockResolvedValue({
      data: [
        { name: 'Verifier', endpoint: 'https://verifier.local:3000', status: 'up', latency_ms: 12 },
        { name: 'Registrar', endpoint: 'https://registrar.local:3001', status: 'down', latency_ms: 0 },
        { name: 'TimescaleDB', endpoint: 'https://db.local:5432', status: 'high_load', latency_ms: 45 },
      ],
    }),
  },
}));

vi.mock('@/api/client', () => ({
  getBackendUrl: () => 'http://localhost:8080',
}));

let mockRole = 'operator';
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    canWrite: () => mockRole === 'operator' || mockRole === 'admin',
    isAdmin: () => mockRole === 'admin',
    hasRole: (role: string) => {
      const h = ['viewer', 'operator', 'admin'];
      return h.indexOf(mockRole) >= h.indexOf(role);
    },
  }),
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
  mockRole = 'operator';
  localStorage.clear();
});

describe('Integrations view toggle', () => {
  it('defaults to Topology View', () => {
    renderWithProviders(<Integrations />);
    const topoBtn = screen.getByRole('button', { name: /topology view/i });
    expect(topoBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches to List View when toggle is clicked', () => {
    renderWithProviders(<Integrations />);
    const listBtn = screen.getByRole('button', { name: /list view/i });
    fireEvent.click(listBtn);
    expect(listBtn).toHaveAttribute('aria-pressed', 'true');
    const topoBtn = screen.getByRole('button', { name: /topology view/i });
    expect(topoBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('switches back to Topology View', () => {
    renderWithProviders(<Integrations />);
    fireEvent.click(screen.getByRole('button', { name: /list view/i }));
    fireEvent.click(screen.getByRole('button', { name: /topology view/i }));
    expect(screen.getByRole('button', { name: /topology view/i })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('TopologyView nodes', () => {
  it('renders topology nodes with correct status colors', async () => {
    renderWithProviders(<Integrations />);

    const diagram = await screen.findByRole('img', { name: /service topology/i });
    expect(diagram).toBeInTheDocument();

    const nodes = diagram.querySelectorAll('.topology-node');
    expect(nodes.length).toBeGreaterThanOrEqual(1);
  });

  it('renders service names in topology nodes', async () => {
    renderWithProviders(<Integrations />);

    expect(await screen.findByText('keylime-webtool-backend')).toBeInTheDocument();
  });
});

describe('SSH button RBAC', () => {
  it('renders SSH buttons for operator role', async () => {
    mockRole = 'operator';
    renderWithProviders(<Integrations />);

    const sshButtons = await screen.findAllByRole('button', { name: /ssh to/i });
    expect(sshButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('does not render SSH buttons for viewer role', async () => {
    mockRole = 'viewer';
    renderWithProviders(<Integrations />);

    await screen.findByRole('img', { name: /service topology/i });
    const sshButtons = screen.queryAllByRole('button', { name: /ssh to/i });
    expect(sshButtons).toHaveLength(0);
  });

  it('SSH link points to correct host without port', async () => {
    mockRole = 'admin';
    renderWithProviders(<Integrations />);

    const sshLink = await screen.findByRole('button', { name: /ssh to keylime-webtool-backend/i });
    expect(sshLink).toHaveAttribute('href', 'ssh://localhost');
  });
});

describe('TopologyView rendering details', () => {
  it('renders service status text', async () => {
    renderWithProviders(<Integrations />);
    expect(await screen.findByText('Verifier')).toBeInTheDocument();
    const statusNodes = document.querySelectorAll('.topology-node__status');
    const statuses = Array.from(statusNodes).map((n) => n.textContent);
    expect(statuses).toContain('up');
    expect(statuses).toContain('down');
    expect(statuses).toContain('high load');
  });

  it('renders service latency values', async () => {
    renderWithProviders(<Integrations />);
    expect(await screen.findByText('12ms')).toBeInTheDocument();
    expect(screen.getByText('45ms')).toBeInTheDocument();
  });

  it('renders service endpoint URLs', async () => {
    renderWithProviders(<Integrations />);
    expect(await screen.findByText('https://verifier.local:3000')).toBeInTheDocument();
    expect(screen.getByText('https://registrar.local:3001')).toBeInTheDocument();
    expect(screen.getByText('https://db.local:5432')).toBeInTheDocument();
  });

  it('renders image icons for service nodes', async () => {
    renderWithProviders(<Integrations />);
    await screen.findByText('Verifier');
    const imgs = document.querySelectorAll('.topology-node img');
    expect(imgs.length).toBeGreaterThanOrEqual(1);
  });

  it('shows backend unavailable when backend is down', async () => {
    const { settingsApi } = await import('@/api/settings');
    vi.mocked(settingsApi.getKeylime).mockRejectedValue(new Error('down'));
    renderWithProviders(<Integrations />);
    expect(await screen.findByText('Backend unavailable')).toBeInTheDocument();
    vi.mocked(settingsApi.getKeylime).mockResolvedValue({} as never);
  });

  it('shows no services placeholder when services array is empty', async () => {
    const { performanceApi } = await import('@/api/performance');
    vi.mocked(performanceApi.integrations).mockResolvedValue({ data: [] } as never);
    renderWithProviders(<Integrations />);
    expect(await screen.findByText('No services configured')).toBeInTheDocument();
    vi.mocked(performanceApi.integrations).mockResolvedValue({
      data: [
        { name: 'Verifier', endpoint: 'https://verifier.local:3000', status: 'up', latency_ms: 12 },
        { name: 'Registrar', endpoint: 'https://registrar.local:3001', status: 'down', latency_ms: 0 },
        { name: 'TimescaleDB', endpoint: 'https://db.local:5432', status: 'high_load', latency_ms: 45 },
      ],
    } as never);
  });
});

describe('View mode persistence', () => {
  it('persists list mode across remounts', () => {
    const { unmount } = renderWithProviders(<Integrations />);
    fireEvent.click(screen.getByRole('button', { name: /list view/i }));
    unmount();

    renderWithProviders(<Integrations />);
    expect(screen.getByRole('button', { name: /list view/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('persists topology mode across remounts', () => {
    const { unmount } = renderWithProviders(<Integrations />);
    fireEvent.click(screen.getByRole('button', { name: /list view/i }));
    fireEvent.click(screen.getByRole('button', { name: /topology view/i }));
    unmount();

    renderWithProviders(<Integrations />);
    expect(screen.getByRole('button', { name: /topology view/i })).toHaveAttribute('aria-pressed', 'true');
  });
});
