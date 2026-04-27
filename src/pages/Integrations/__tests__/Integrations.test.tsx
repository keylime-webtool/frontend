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
  it('defaults to List View', () => {
    renderWithProviders(<Integrations />);
    const listBtn = screen.getByRole('button', { name: /list view/i });
    expect(listBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches to Topology View when toggle is clicked', async () => {
    renderWithProviders(<Integrations />);
    const topoBtn = screen.getByRole('button', { name: /topology view/i });
    fireEvent.click(topoBtn);
    expect(topoBtn).toHaveAttribute('aria-pressed', 'true');
    const listBtn = screen.getByRole('button', { name: /list view/i });
    expect(listBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('switches back to List View', () => {
    renderWithProviders(<Integrations />);
    fireEvent.click(screen.getByRole('button', { name: /topology view/i }));
    fireEvent.click(screen.getByRole('button', { name: /list view/i }));
    expect(screen.getByRole('button', { name: /list view/i })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('TopologyView nodes', () => {
  it('renders topology nodes with correct status colors', async () => {
    renderWithProviders(<Integrations />);
    fireEvent.click(screen.getByRole('button', { name: /topology view/i }));

    const diagram = await screen.findByRole('img', { name: /service topology/i });
    expect(diagram).toBeInTheDocument();

    const nodes = diagram.querySelectorAll('.topology-node');
    expect(nodes.length).toBeGreaterThanOrEqual(1);
  });

  it('renders service names in topology nodes', async () => {
    renderWithProviders(<Integrations />);
    fireEvent.click(screen.getByRole('button', { name: /topology view/i }));

    expect(await screen.findByText('keylime-webtool-backend')).toBeInTheDocument();
  });
});

describe('SSH button RBAC', () => {
  it('renders SSH buttons for operator role', async () => {
    mockRole = 'operator';
    renderWithProviders(<Integrations />);
    fireEvent.click(screen.getByRole('button', { name: /topology view/i }));

    const sshButtons = await screen.findAllByRole('button', { name: /ssh to/i });
    expect(sshButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('does not render SSH buttons for viewer role', async () => {
    mockRole = 'viewer';
    renderWithProviders(<Integrations />);
    fireEvent.click(screen.getByRole('button', { name: /topology view/i }));

    await screen.findByRole('img', { name: /service topology/i });
    const sshButtons = screen.queryAllByRole('button', { name: /ssh to/i });
    expect(sshButtons).toHaveLength(0);
  });

  it('SSH link points to correct host without port', async () => {
    mockRole = 'admin';
    renderWithProviders(<Integrations />);
    fireEvent.click(screen.getByRole('button', { name: /topology view/i }));

    const sshLink = await screen.findByRole('button', { name: /ssh to keylime-webtool-backend/i });
    expect(sshLink).toHaveAttribute('href', 'ssh://localhost');
  });
});

describe('View mode persistence', () => {
  it('persists topology mode across remounts', () => {
    const { unmount } = renderWithProviders(<Integrations />);
    fireEvent.click(screen.getByRole('button', { name: /topology view/i }));
    unmount();

    renderWithProviders(<Integrations />);
    expect(screen.getByRole('button', { name: /topology view/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('persists list mode across remounts', () => {
    const { unmount } = renderWithProviders(<Integrations />);
    fireEvent.click(screen.getByRole('button', { name: /topology view/i }));
    fireEvent.click(screen.getByRole('button', { name: /list view/i }));
    unmount();

    renderWithProviders(<Integrations />);
    expect(screen.getByRole('button', { name: /list view/i })).toHaveAttribute('aria-pressed', 'true');
  });
});
