import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Policies } from '../Policies';

vi.mock('@/api/policies', () => ({
  policiesApi: {
    list: vi.fn().mockResolvedValue({
      data: {
        items: [
          {
            id: 'pol-1',
            name: 'IMA Default',
            kind: 'ima',
            checksum: 'abcdef1234567890abcdef',
            approval_state: 'approved',
            updated_date: '2025-01-10',
          },
          {
            id: 'pol-2',
            name: 'Boot Policy',
            kind: 'measured_boot',
            checksum: null,
            approval_state: 'draft',
            updated_date: '2025-01-12',
          },
        ],
      },
    }),
  },
}));

let mockRole = 'operator';
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    canWrite: () => mockRole === 'operator' || mockRole === 'admin',
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
});

describe('Policies', () => {
  it('renders page title and subtitle', () => {
    renderWithProviders(<Policies />);
    expect(screen.getByText('Policies')).toBeInTheDocument();
    expect(screen.getByText(/Manage IMA and Measured Boot/)).toBeInTheDocument();
  });

  it('renders policy list', async () => {
    renderWithProviders(<Policies />);
    expect(await screen.findByText('IMA Default')).toBeInTheDocument();
    expect(screen.getByText('Boot Policy')).toBeInTheDocument();
  });

  it('renders kind labels correctly', async () => {
    renderWithProviders(<Policies />);
    expect(await screen.findByText('IMA')).toBeInTheDocument();
    expect(screen.getByText('Measured Boot')).toBeInTheDocument();
  });

  it('renders truncated checksum', async () => {
    renderWithProviders(<Policies />);
    expect(await screen.findByText('abcdef123456...')).toBeInTheDocument();
  });

  it('shows New Policy and Import buttons for operators', async () => {
    renderWithProviders(<Policies />);
    await screen.findByText('IMA Default');
    expect(screen.getByText('New Policy')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
  });

  it('hides write buttons for viewers', async () => {
    mockRole = 'viewer';
    renderWithProviders(<Policies />);
    await screen.findByText('IMA Default');
    expect(screen.queryByText('New Policy')).not.toBeInTheDocument();
    expect(screen.queryByText('Import')).not.toBeInTheDocument();
  });

  it('renders search input', () => {
    renderWithProviders(<Policies />);
    expect(screen.getByRole('searchbox', { name: /search policies/i })).toBeInTheDocument();
  });

  it('renders approval workflow steps', () => {
    renderWithProviders(<Policies />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Impact Analysis')).toBeInTheDocument();
    expect(screen.getByText('Pending Approval')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Applied')).toBeInTheDocument();
  });

  it('deduplicates policies with the same id', async () => {
    const { policiesApi } = await import('@/api/policies');
    vi.mocked(policiesApi.list).mockResolvedValueOnce({
      data: {
        items: [
          { id: 'dup-1', name: 'DupPolicy', kind: 'ima', checksum: null, approval_state: 'draft', updated_date: '' },
          { id: 'dup-1', name: 'DupPolicy', kind: 'ima', checksum: null, approval_state: 'draft', updated_date: '' },
        ],
      },
    } as never);
    renderWithProviders(<Policies />);
    const items = await screen.findAllByText('DupPolicy');
    expect(items).toHaveLength(1);
  });
});
