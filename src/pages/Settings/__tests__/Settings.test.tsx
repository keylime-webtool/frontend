import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Settings } from '../Settings';
import { useVisualizationStore } from '@/store/visualizationStore';

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
  useVisualizationStore.setState({
    theme: 'light',
    autoRefresh: true,
    refreshInterval: 30,
    defaultTimeRange: '24h',
    showChartLabels: true,
    tablePageSize: 25,
    timezone: 'UTC',
    timezoneAutoDetect: true,
    dateFormat: 'DD-MM-YYYY',
    timeFormat: '24h',
    integrationsViewMode: 'topology',
  });
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

  describe('Keylime Connection section', () => {
    it('switches to mock mode and populates URLs', async () => {
      renderWithProviders(<Settings />);
      await waitFor(() => {
        expect((screen.getByLabelText('Verifier URL') as HTMLInputElement).value).toBe('https://localhost:8881');
      });
      fireEvent.click(screen.getByRole('button', { name: 'Mock' }));
      await waitFor(() => {
        expect((screen.getByLabelText('Verifier URL') as HTMLInputElement).value).toBe('http://localhost:3000');
      });
      expect((screen.getByLabelText('Registrar URL') as HTMLInputElement).value).toBe('http://localhost:3001');
    });

    it('switches back to production mode and populates URLs', async () => {
      renderWithProviders(<Settings />);
      await waitFor(() => {
        expect((screen.getByLabelText('Verifier URL') as HTMLInputElement).value).toBe('https://localhost:8881');
      });
      fireEvent.click(screen.getByRole('button', { name: 'Mock' }));
      await waitFor(() => {
        expect((screen.getByLabelText('Verifier URL') as HTMLInputElement).value).toBe('http://localhost:3000');
      });
      fireEvent.click(screen.getByRole('button', { name: 'Production' }));
      await waitFor(() => {
        expect((screen.getByLabelText('Verifier URL') as HTMLInputElement).value).toBe('https://localhost:8881');
      });
    });

    it('shows HTTP warning when verifier URL uses http://', async () => {
      renderWithProviders(<Settings />);
      await waitFor(() => {
        expect((screen.getByLabelText('Verifier URL') as HTMLInputElement).value).toBe('https://localhost:8881');
      });
      fireEvent.click(screen.getByRole('button', { name: 'Mock' }));
      await waitFor(() => {
        expect(screen.getByText(/Keylime Verifier typically requires HTTPS/)).toBeInTheDocument();
      });
    });

    it('shows HTTP warning when registrar URL uses http://', async () => {
      renderWithProviders(<Settings />);
      await waitFor(() => {
        expect((screen.getByLabelText('Registrar URL') as HTMLInputElement).value).toBe('https://localhost:8891');
      });
      fireEvent.click(screen.getByRole('button', { name: 'Mock' }));
      await waitFor(() => {
        expect(screen.getByText(/Keylime Registrar typically requires HTTPS/)).toBeInTheDocument();
      });
    });

    it('enables Apply Changes when a URL is modified', async () => {
      renderWithProviders(<Settings />);
      await waitFor(() => {
        expect(screen.getByLabelText('Backend URL')).toBeInTheDocument();
      });
      const backendInput = screen.getByLabelText('Backend URL');
      fireEvent.change(backendInput, { target: { value: 'http://new-host:9090' } });
      const applyBtn = screen.getByText('Apply Changes');
      expect(applyBtn).not.toBeDisabled();
    });

    it('sends seed_mock_data true when applying in mock mode', async () => {
      const { settingsApi } = await import('@/api/settings');
      renderWithProviders(<Settings />);
      await waitFor(() => {
        expect((screen.getByLabelText('Verifier URL') as HTMLInputElement).value).toBe('https://localhost:8881');
      });
      fireEvent.click(screen.getByRole('button', { name: 'Mock' }));
      await waitFor(() => {
        expect((screen.getByLabelText('Verifier URL') as HTMLInputElement).value).toBe('http://localhost:3000');
      });
      fireEvent.click(screen.getByText('Apply Changes'));
      await waitFor(() => {
        expect(settingsApi.updateKeylime).toHaveBeenCalledWith(
          expect.objectContaining({ seed_mock_data: true }),
        );
      });
    });

    it('sends seed_mock_data false when applying in production mode', async () => {
      const { settingsApi } = await import('@/api/settings');
      renderWithProviders(<Settings />);
      await waitFor(() => {
        expect((screen.getByLabelText('Verifier URL') as HTMLInputElement).value).toBe('https://localhost:8881');
      });
      // Switch to mock then back to production to create a diff from saved values
      fireEvent.click(screen.getByRole('button', { name: 'Mock' }));
      await waitFor(() => {
        expect((screen.getByLabelText('Verifier URL') as HTMLInputElement).value).toBe('http://localhost:3000');
      });
      fireEvent.click(screen.getByRole('button', { name: 'Production' }));
      await waitFor(() => {
        expect((screen.getByLabelText('Verifier URL') as HTMLInputElement).value).toBe('https://localhost:8881');
      });
      // Manually change a URL so Apply is enabled (production URLs match saved, so no diff otherwise)
      fireEvent.change(screen.getByLabelText('Verifier URL'), { target: { value: 'https://verifier.example.com:8881' } });
      fireEvent.click(screen.getByText('Apply Changes'));
      await waitFor(() => {
        expect(settingsApi.updateKeylime).toHaveBeenCalledWith(
          expect.objectContaining({ seed_mock_data: false }),
        );
      });
    });
  });

  describe('Certificates section', () => {
    it('shows certificate directory input by default', () => {
      renderWithProviders(<Settings />);
      fireEvent.click(screen.getByRole('button', { name: 'Keylime Certificates' }));
      expect(screen.getByLabelText('Certificate directory')).toBeInTheDocument();
    });

    it('switches between directory and manual mode', () => {
      renderWithProviders(<Settings />);
      fireEvent.click(screen.getByRole('button', { name: 'Keylime Certificates' }));
      fireEvent.click(screen.getByRole('button', { name: 'Manually' }));
      expect(screen.getByLabelText('CA certificate path')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'By directory' }));
      expect(screen.getByLabelText('Certificate directory')).toBeInTheDocument();
    });

    it('updates certificate directory input', () => {
      renderWithProviders(<Settings />);
      fireEvent.click(screen.getByRole('button', { name: 'Keylime Certificates' }));
      const dirInput = screen.getByLabelText('Certificate directory');
      fireEvent.change(dirInput, { target: { value: '/custom/path' } });
      expect((dirInput as HTMLInputElement).value).toBe('/custom/path');
    });

    it('updates manual cert path inputs', () => {
      renderWithProviders(<Settings />);
      fireEvent.click(screen.getByRole('button', { name: 'Keylime Certificates' }));
      fireEvent.click(screen.getByRole('button', { name: 'Manually' }));
      fireEvent.change(screen.getByLabelText('CA certificate path'), { target: { value: '/ca.crt' } });
      fireEvent.change(screen.getByLabelText('Client certificate path'), { target: { value: '/cert.crt' } });
      fireEvent.change(screen.getByLabelText('Client key path'), { target: { value: '/key.pem' } });
      expect((screen.getByLabelText('CA certificate path') as HTMLInputElement).value).toBe('/ca.crt');
    });
  });

  describe('Visualization section interactions', () => {
    it('changes theme via select', () => {
      renderWithProviders(<Settings />);
      fireEvent.click(screen.getByRole('button', { name: 'Visualization' }));
      fireEvent.change(screen.getByLabelText('Theme'), { target: { value: 'dark' } });
      expect(useVisualizationStore.getState().theme).toBe('dark');
    });

    it('toggles auto-refresh checkbox', () => {
      renderWithProviders(<Settings />);
      fireEvent.click(screen.getByRole('button', { name: 'Visualization' }));
      const checkbox = screen.getByLabelText('Auto-refresh toggle');
      fireEvent.click(checkbox);
      expect(useVisualizationStore.getState().autoRefresh).toBe(false);
    });

    it('changes refresh interval', () => {
      renderWithProviders(<Settings />);
      fireEvent.click(screen.getByRole('button', { name: 'Visualization' }));
      fireEvent.change(screen.getByLabelText('Refresh interval'), { target: { value: '60' } });
      expect(useVisualizationStore.getState().refreshInterval).toBe(60);
    });

    it('changes default time range', () => {
      renderWithProviders(<Settings />);
      fireEvent.click(screen.getByRole('button', { name: 'Visualization' }));
      fireEvent.change(screen.getByLabelText('Default time range'), { target: { value: '7d' } });
      expect(useVisualizationStore.getState().defaultTimeRange).toBe('7d');
    });

    it('toggles chart labels', () => {
      renderWithProviders(<Settings />);
      fireEvent.click(screen.getByRole('button', { name: 'Visualization' }));
      fireEvent.click(screen.getByLabelText('Show chart labels'));
      expect(useVisualizationStore.getState().showChartLabels).toBe(false);
    });

    it('changes table page size', () => {
      renderWithProviders(<Settings />);
      fireEvent.click(screen.getByRole('button', { name: 'Visualization' }));
      fireEvent.change(screen.getByLabelText('Table page size'), { target: { value: '50' } });
      expect(useVisualizationStore.getState().tablePageSize).toBe(50);
    });

    it('toggles timezone auto-detect', () => {
      renderWithProviders(<Settings />);
      fireEvent.click(screen.getByRole('button', { name: 'Visualization' }));
      fireEvent.click(screen.getByLabelText('Auto-detect timezone'));
      expect(useVisualizationStore.getState().timezoneAutoDetect).toBe(false);
    });

    it('changes date format', () => {
      renderWithProviders(<Settings />);
      fireEvent.click(screen.getByRole('button', { name: 'Visualization' }));
      fireEvent.change(screen.getByLabelText('Date format'), { target: { value: 'YYYY-MM-DD' } });
      expect(useVisualizationStore.getState().dateFormat).toBe('YYYY-MM-DD');
    });

    it('changes time format', () => {
      renderWithProviders(<Settings />);
      fireEvent.click(screen.getByRole('button', { name: 'Visualization' }));
      fireEvent.change(screen.getByLabelText('Time format'), { target: { value: '12h' } });
      expect(useVisualizationStore.getState().timeFormat).toBe('12h');
    });
  });

  describe('Compliance section', () => {
    it('renders View Report and Export PDF buttons for each framework', () => {
      renderWithProviders(<Settings />);
      fireEvent.click(screen.getByRole('button', { name: 'Compliance Reports' }));
      const viewBtns = screen.getAllByText('View Report');
      const exportBtns = screen.getAllByText('Export PDF');
      expect(viewBtns.length).toBeGreaterThanOrEqual(3);
      expect(exportBtns.length).toBeGreaterThanOrEqual(3);
    });
  });
});
