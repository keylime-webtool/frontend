import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Settings } from '../Settings';

vi.mock('@/api/settings', () => ({
  settingsApi: {
    getKeylime: vi.fn().mockResolvedValue({
      data: { verifier_url: 'https://localhost:8881', registrar_url: 'https://localhost:8891' },
    }),
    updateKeylime: vi.fn().mockResolvedValue({ data: {} }),
    getCertificates: vi.fn().mockResolvedValue({
      data: { cert_path: null, key_path: null, ca_cert_path: null },
    }),
    updateCertificates: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock('@/api/client', () => ({
  getBackendUrl: () => 'http://localhost:8080',
  setBackendUrl: vi.fn(),
}));

let mockRole = 'admin';
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { role: mockRole },
    isAdmin: () => mockRole === 'admin',
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
  mockRole = 'admin';
  localStorage.clear();
});

describe('Settings', () => {
  it('renders page title', () => {
    renderWithProviders(<Settings />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders navigation sections', () => {
    renderWithProviders(<Settings />);
    expect(screen.getAllByText('Keylime Connection').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: 'Keylime Certificates' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Visualization' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Compliance Reports' })).toBeInTheDocument();
  });

  it('switches to Visualization section', () => {
    renderWithProviders(<Settings />);
    fireEvent.click(screen.getByRole('button', { name: 'Visualization' }));
    expect(screen.getByLabelText('Theme')).toBeInTheDocument();
    expect(screen.getByLabelText('Auto-refresh toggle')).toBeInTheDocument();
  });

  it('switches to Compliance section and shows frameworks', () => {
    renderWithProviders(<Settings />);
    fireEvent.click(screen.getByRole('button', { name: 'Compliance Reports' }));
    expect(screen.getByText('NIST SP 800-155/193')).toBeInTheDocument();
    expect(screen.getByText('PCI DSS 4.0')).toBeInTheDocument();
    expect(screen.getByText('SOC 2 Type II')).toBeInTheDocument();
  });

  it('shows alert thresholds for admin', () => {
    renderWithProviders(<Settings />);
    fireEvent.click(screen.getByRole('button', { name: 'Alert Thresholds' }));
    expect(screen.getByText('Alert threshold configuration')).toBeInTheDocument();
  });

  it('shows admin required message for non-admin on alert thresholds', () => {
    mockRole = 'viewer';
    renderWithProviders(<Settings />);
    fireEvent.click(screen.getByRole('button', { name: 'Alert Thresholds' }));
    expect(screen.getByText('Admin access required')).toBeInTheDocument();
  });

  it('renders Keylime Connection with URL inputs', () => {
    renderWithProviders(<Settings />);
    expect(screen.getByLabelText('Backend URL')).toBeInTheDocument();
    expect(screen.getByLabelText('Verifier URL')).toBeInTheDocument();
    expect(screen.getByLabelText('Registrar URL')).toBeInTheDocument();
  });

  it('renders mock/production mode toggle', () => {
    renderWithProviders(<Settings />);
    expect(screen.getByRole('button', { name: 'Mock' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Production' })).toBeInTheDocument();
  });

  it('switches to Certificates section', () => {
    renderWithProviders(<Settings />);
    fireEvent.click(screen.getByRole('button', { name: 'Keylime Certificates' }));
    expect(screen.getByRole('button', { name: 'By directory' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Manually' })).toBeInTheDocument();
  });

  it('switches to manual certificate mode', () => {
    renderWithProviders(<Settings />);
    fireEvent.click(screen.getByRole('button', { name: 'Keylime Certificates' }));
    fireEvent.click(screen.getByRole('button', { name: 'Manually' }));
    expect(screen.getByLabelText('CA certificate path')).toBeInTheDocument();
    expect(screen.getByLabelText('Client certificate path')).toBeInTheDocument();
    expect(screen.getByLabelText('Client key path')).toBeInTheDocument();
  });

  it('renders External Integrations section', () => {
    renderWithProviders(<Settings />);
    fireEvent.click(screen.getByRole('button', { name: 'External Integrations' }));
    expect(screen.getByText('SIEM and ticketing integrations')).toBeInTheDocument();
  });

  it('renders General Settings section', () => {
    renderWithProviders(<Settings />);
    fireEvent.click(screen.getByRole('button', { name: 'General Settings' }));
    expect(screen.getByText('Application preferences')).toBeInTheDocument();
  });
});
