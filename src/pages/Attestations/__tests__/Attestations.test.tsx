import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, Outlet } from 'react-router-dom';
import { Attestations } from '../Attestations';

vi.mock('@/api/attestations', () => ({
  attestationsApi: {
    summary: vi.fn().mockResolvedValue({
      data: {
        total_successful: 150,
        total_failed: 5,
        average_latency_ms: 42,
        success_rate: 96.77,
      },
    }),
    failures: vi.fn().mockResolvedValue({
      data: [
        {
          agent_id: 'agent-001',
          detail: 'PCR mismatch',
          failure_type: 'pcr_validation',
          severity: 'critical',
          timestamp: '2025-01-01T00:00:00Z',
        },
      ],
    }),
  },
}));

function OutletWrapper() {
  return <Outlet context={{ timeRange: '24h' }} />;
}

function renderAttestations() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/attestations']}>
        <Routes>
          <Route element={<OutletWrapper />}>
            <Route path="/attestations" element={<Attestations />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Attestations', () => {
  it('renders page title and subtitle', () => {
    renderAttestations();
    expect(screen.getByText('Attestation Analytics')).toBeInTheDocument();
    expect(screen.getByText(/Analyze attestation patterns/)).toBeInTheDocument();
  });

  it('renders KPI cards with summary data', async () => {
    renderAttestations();
    expect(await screen.findByText('150')).toBeInTheDocument();
    expect(await screen.findByText('5')).toBeInTheDocument();
    expect(await screen.findByText('42ms')).toBeInTheDocument();
    expect(await screen.findByText('96.77%')).toBeInTheDocument();
  });

  it('renders failure categorization with failure events', async () => {
    renderAttestations();
    expect(await screen.findByText('pcr validation')).toBeInTheDocument();
    expect(await screen.findByText('PCR mismatch')).toBeInTheDocument();
    expect(await screen.findByText('agent-001')).toBeInTheDocument();
  });

  it('renders section headings', () => {
    renderAttestations();
    expect(screen.getByText('Failure Categorization')).toBeInTheDocument();
    expect(screen.getByText('Hourly Volume')).toBeInTheDocument();
    expect(screen.getByText('Correlated Incidents')).toBeInTheDocument();
  });

  it('renders 100.0% for perfect success rate', async () => {
    const { attestationsApi } = await import('@/api/attestations');
    vi.mocked(attestationsApi.summary).mockResolvedValueOnce({
      data: {
        total_successful: 100,
        total_failed: 0,
        average_latency_ms: 10,
        success_rate: 100,
      },
    } as never);
    renderAttestations();
    expect(await screen.findByText('100.0%')).toBeInTheDocument();
  });
});
