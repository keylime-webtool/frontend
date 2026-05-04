import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AgentList } from '../AgentList';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/api/agents', () => ({
  agentsApi: {
    list: vi.fn().mockResolvedValue({
      data: {
        items: [
          { id: 'agent-001', ip: '10.0.0.1', port: 9002, state: 'GET_QUOTE', attestation_mode: 'Pull', last_attestation: '2025-06-01T10:00:00Z', failure_count: 0 },
          { id: 'agent-002', ip: '10.0.0.2', port: 9002, state: 'FAILED', attestation_mode: 'Pull', last_attestation: '2025-06-01T09:00:00Z', failure_count: 3 },
        ],
        total_pages: 1,
        total_items: 2,
      },
    }),
    search: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

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

function renderList() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AgentList />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockNavigate.mockClear();
});

describe('AgentList page', () => {
  it('renders page header', () => {
    renderList();
    expect(screen.getByText('Agents')).toBeInTheDocument();
  });

  it('renders agent rows', async () => {
    renderList();
    expect(await screen.findByText('agent-001')).toBeInTheDocument();
    expect(screen.getByText('agent-002')).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderList();
    expect(screen.getByLabelText('Search agents')).toBeInTheDocument();
  });

  it('renders state and mode filter selects', () => {
    renderList();
    expect(screen.getByLabelText('Filter by state')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by mode')).toBeInTheDocument();
  });

  it('renders Show All Agents reset button', () => {
    renderList();
    expect(screen.getByText('Show All Agents')).toBeInTheDocument();
  });

  it('renders agent state chart section', async () => {
    renderList();
    await screen.findByText('agent-001');
    expect(screen.getByText('Agent State Distribution')).toBeInTheDocument();
  });
});
