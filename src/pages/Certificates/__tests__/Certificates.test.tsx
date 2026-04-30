import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Certificates } from '../Certificates';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/api/certificates', () => ({
  certificatesApi: {
    expirySummary: vi.fn().mockResolvedValue({
      data: { expired: 2, expiring_30d: 5, expiring_90d: 12, valid: 100, total: 107, timeline_90d: [] },
    }),
    list: vi.fn().mockResolvedValue({
      data: {
        items: [
          {
            id: 'cert-1',
            type: 'ek',
            subject_dn: 'CN=TPM-EK',
            issuer_dn: 'CN=TPM-Vendor-CA',
            serial_number: 'AA:BB:CC',
            not_before: '2025-01-01T00:00:00Z',
            not_after: '2026-12-31T00:00:00Z',
            public_key_algorithm: 'RSA',
            public_key_size: 2048,
            signature_algorithm: 'SHA256withRSA',
            san: [],
            key_usage: ['digitalSignature'],
            extended_key_usage: [],
            status: 'valid',
            associated_entity: 'agent-001',
            chain: [],
            validation_status: 'valid',
            chain_valid: null,
            expiry_category: 'valid',
          },
          {
            id: 'cert-2',
            type: 'mtls',
            subject_dn: 'CN=agent-mtls',
            issuer_dn: 'CN=Keylime-CA',
            serial_number: 'DD:EE:FF',
            not_before: '2025-06-01T00:00:00Z',
            not_after: '2025-07-15T00:00:00Z',
            public_key_algorithm: 'ECDSA',
            public_key_size: 256,
            signature_algorithm: 'SHA256withECDSA',
            san: [],
            key_usage: [],
            extended_key_usage: [],
            status: 'critical',
            associated_entity: 'agent-002',
            chain: [],
            validation_status: 'valid',
            chain_valid: null,
            expiry_category: 'critical_7d',
          },
        ],
      },
    }),
    timeline: vi.fn().mockResolvedValue({
      data: [
        { date: '2025-07-01', count: 3, expiry_category: 'warning_30d' },
        { date: '2025-08-15', count: 1, expiry_category: 'warning_90d' },
      ],
    }),
  },
}));

vi.mock('@/api/client', () => ({
  default: { get: vi.fn() },
  getBackendUrl: () => 'http://localhost:8080',
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
  mockNavigate.mockClear();
});

describe('Certificates page', () => {
  it('renders KPI cards with summary values', async () => {
    renderWithProviders(<Certificates />);
    expect(await screen.findByText('2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('107')).toBeInTheDocument();
  });

  it('renders certificate table with data', async () => {
    renderWithProviders(<Certificates />);
    expect(await screen.findByText('agent-001')).toBeInTheDocument();
    expect(screen.getByText('agent-002')).toBeInTheDocument();
  });

  it('renders type filter buttons', async () => {
    renderWithProviders(<Certificates />);
    await screen.findByText('agent-001');
    const allBtn = screen.getByRole('button', { name: 'All' });
    expect(allBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'EK' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'AK' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'mTLS' })).toBeInTheDocument();
  });

  it('activates filter button on click', async () => {
    renderWithProviders(<Certificates />);
    await screen.findByText('agent-001');
    const ekBtn = screen.getByRole('button', { name: 'EK' });
    fireEvent.click(ekBtn);
    expect(ekBtn).toHaveAttribute('aria-pressed', 'true');
    const allBtn = screen.getByRole('button', { name: 'All' });
    expect(allBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('navigates to certificate detail on row click', async () => {
    renderWithProviders(<Certificates />);
    const row = await screen.findByText('agent-001');
    fireEvent.click(row.closest('tr')!);
    expect(mockNavigate).toHaveBeenCalledWith('/certificates/cert-1');
  });

  it('renders timeline legend for accessibility', async () => {
    renderWithProviders(<Certificates />);
    expect(await screen.findByText('Valid (>90d)')).toBeInTheDocument();
    expect(screen.getByText('Emergency (1d)')).toBeInTheDocument();
    expect(screen.getByText('Action (30d)')).toBeInTheDocument();
  });

  it('renders page header', () => {
    renderWithProviders(<Certificates />);
    expect(screen.getByText('Certificates')).toBeInTheDocument();
    expect(screen.getByText('Monitor certificate lifecycle and prevent expiry outages')).toBeInTheDocument();
  });
});
