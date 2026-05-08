import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('renders columns with expected headers', async () => {
    renderList();
    await screen.findByText('agent-001');
    expect(screen.getByText('Agent ID')).toBeInTheDocument();
    expect(screen.getByText('IP:Port')).toBeInTheDocument();
    expect(screen.getByText('Mode')).toBeInTheDocument();
    expect(screen.getByText('State')).toBeInTheDocument();
    expect(screen.getByText('Last Attestation')).toBeInTheDocument();
    expect(screen.getByText('Failures')).toBeInTheDocument();
  });

  it('displays IP:port for agents', async () => {
    renderList();
    expect(await screen.findByText('10.0.0.1:9002')).toBeInTheDocument();
    expect(screen.getByText('10.0.0.2:9002')).toBeInTheDocument();
  });

  it('updates search param on search input change', async () => {
    renderList();
    const input = screen.getByLabelText('Search agents');
    fireEvent.change(input, { target: { value: 'agent-001' } });
    expect((input as HTMLInputElement).value).toBe('agent-001');
  });

  it('changes state filter via select', async () => {
    renderList();
    await screen.findByText('agent-001');
    const select = screen.getByLabelText('Filter by state');
    fireEvent.change(select, { target: { value: 'FAILED' } });
    expect((select as HTMLSelectElement).value).toBe('FAILED');
  });

  it('changes mode filter via select', async () => {
    renderList();
    await screen.findByText('agent-001');
    const select = screen.getByLabelText('Filter by mode');
    fireEvent.change(select, { target: { value: 'Pull' } });
    expect((select as HTMLSelectElement).value).toBe('Pull');
  });

  it('navigates to agent detail on row click', async () => {
    renderList();
    const row = await screen.findByText('agent-001');
    fireEvent.click(row.closest('tr')!);
    expect(mockNavigate).toHaveBeenCalledWith('/agents/agent-001');
  });

  it('resets filters when Show All Agents is clicked', async () => {
    renderList();
    await screen.findByText('agent-001');
    fireEvent.click(screen.getByText('Show All Agents'));
  });

  it('shows error state when query fails', async () => {
    const { agentsApi } = await import('@/api/agents');
    vi.mocked(agentsApi.list).mockRejectedValue(new Error('Network error'));
    renderList();
    expect(await screen.findByText('Failed to load agents')).toBeInTheDocument();
    vi.mocked(agentsApi.list).mockResolvedValue({
      data: {
        items: [
          { id: 'agent-001', ip: '10.0.0.1', port: 9002, state: 'GET_QUOTE', attestation_mode: 'Pull', last_attestation: '2025-06-01T10:00:00Z', failure_count: 0 },
        ],
        total_pages: 1,
        total_items: 1,
      },
    } as never);
  });

  it('shows loading state initially', () => {
    renderList();
    expect(screen.getByText('Loading agents...')).toBeInTheDocument();
  });
});
