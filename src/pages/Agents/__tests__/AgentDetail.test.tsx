import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AgentDetailPage } from '../AgentDetail';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/api/agents', () => ({
  agentsApi: {
    get: vi.fn().mockResolvedValue({
      data: {
        id: 'agent-001',
        ip: '10.0.0.1',
        port: 9002,
        state: 'GET_QUOTE',
        attestation_mode: 'Pull',
        tpm_policy: '{"0":["0xabcd"],"mask":"0x1"}',
      },
    }),
    timeline: vi.fn().mockResolvedValue({ data: [] }),
    imaLog: vi.fn().mockResolvedValue({ data: { entries: [] } }),
    bootLog: vi.fn().mockResolvedValue({ data: { entries: [] } }),
    certificates: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'c1', type: 'ek', subject_dn: 'CN=TPM-EK', issuer_dn: 'CN=Vendor',
          serial_number: 'AA', not_before: '2025-01-01', not_after: '2027-12-31',
          public_key_algorithm: 'RSA', public_key_size: 2048, signature_algorithm: 'SHA256',
          san: [], key_usage: [], extended_key_usage: [], status: 'valid',
          expiry_category: 'valid', associated_entity: 'agent-001',
          validation_status: 'valid', chain_valid: null, chain: [],
        },
      ],
    }),
    raw: vi.fn().mockResolvedValue({ data: { test: 'data' } }),
  },
}));

vi.mock('@/api/client', () => ({
  default: { get: vi.fn() },
  getBackendUrl: () => 'http://localhost:8080',
}));

function renderDetail() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/agents/agent-001']}>
        <Routes>
          <Route path="/agents/:id" element={<AgentDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockNavigate.mockClear();
});

describe('AgentDetailPage', () => {
  it('renders agent id and state badge', async () => {
    renderDetail();
    expect(await screen.findByText('agent-001')).toBeInTheDocument();
    expect(screen.getByText('GET_QUOTE')).toBeInTheDocument();
  });

  it('renders back button', async () => {
    renderDetail();
    const back = await screen.findByLabelText('Back to agents list');
    fireEvent.click(back);
    expect(mockNavigate).toHaveBeenCalledWith('/agents');
  });

  it('renders all tab buttons', async () => {
    renderDetail();
    await screen.findByText('agent-001');
    for (const tab of ['TPM Policy', 'IMA Log', 'Boot Log', 'Certificates', 'Timeline', 'Raw Data']) {
      expect(screen.getByRole('tab', { name: tab })).toBeInTheDocument();
    }
  });

  it('TPM Policy tab shows PCR index and mask', async () => {
    renderDetail();
    await screen.findByText('agent-001');
    expect(screen.getByText('0x1')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('0xabcd')).toBeInTheDocument();
  });

  it('Certificates tab shows cert cards', async () => {
    renderDetail();
    await screen.findByText('agent-001');
    fireEvent.click(screen.getByRole('tab', { name: 'Certificates' }));
    expect(await screen.findByText('EK Certificate')).toBeInTheDocument();
  });

  it('Timeline tab shows empty placeholder', async () => {
    renderDetail();
    await screen.findByText('agent-001');
    fireEvent.click(screen.getByRole('tab', { name: 'Timeline' }));
    expect(await screen.findByText('No attestation timeline data')).toBeInTheDocument();
  });

  it('IMA Log tab shows empty state', async () => {
    renderDetail();
    await screen.findByText('agent-001');
    fireEvent.click(screen.getByRole('tab', { name: 'IMA Log' }));
    expect(await screen.findByText('No IMA log entries')).toBeInTheDocument();
  });

  it('Boot Log tab shows empty state', async () => {
    renderDetail();
    await screen.findByText('agent-001');
    fireEvent.click(screen.getByRole('tab', { name: 'Boot Log' }));
    expect(await screen.findByText('No boot log entries')).toBeInTheDocument();
  });

  it('IMA Log tab shows entries when data exists', async () => {
    const { agentsApi } = await import('@/api/agents');
    vi.mocked(agentsApi.imaLog).mockResolvedValueOnce({
      data: {
        entries: [
          { pcr: 10, template_name: 'ima-ng', filename: '/bin/bash', filedata_hash: 'sha256:abc123' },
        ],
      },
    } as never);
    renderDetail();
    await screen.findByText('agent-001');
    fireEvent.click(screen.getByRole('tab', { name: 'IMA Log' }));
    expect(await screen.findByText('/bin/bash')).toBeInTheDocument();
    expect(screen.getByText('ima-ng')).toBeInTheDocument();
    expect(screen.getByText('sha256:abc123')).toBeInTheDocument();
  });

  it('Boot Log tab shows entries when data exists', async () => {
    const { agentsApi } = await import('@/api/agents');
    vi.mocked(agentsApi.bootLog).mockResolvedValueOnce({
      data: {
        entries: [
          { pcr: 0, event_type: 'EV_POST_CODE', event_data: 'POST CODE', digest: '0xdeadbeef' },
        ],
      },
    } as never);
    renderDetail();
    await screen.findByText('agent-001');
    fireEvent.click(screen.getByRole('tab', { name: 'Boot Log' }));
    expect(await screen.findByText('EV_POST_CODE')).toBeInTheDocument();
    expect(screen.getByText('POST CODE')).toBeInTheDocument();
    expect(screen.getByText('0xdeadbeef')).toBeInTheDocument();
  });

  it('Raw Data tab shows JSON data', async () => {
    renderDetail();
    await screen.findByText('agent-001');
    fireEvent.click(screen.getByRole('tab', { name: 'Raw Data' }));
    expect(await screen.findByText(/test/)).toBeInTheDocument();
  });

  it('Raw Data tab copy button exists', async () => {
    renderDetail();
    await screen.findByText('agent-001');
    fireEvent.click(screen.getByRole('tab', { name: 'Raw Data' }));
    expect(await screen.findByLabelText('Copy raw data to clipboard')).toBeInTheDocument();
  });

  it('Raw Data tab source buttons are rendered', async () => {
    renderDetail();
    await screen.findByText('agent-001');
    fireEvent.click(screen.getByRole('tab', { name: 'Raw Data' }));
    await screen.findByText(/test/);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Backend')).toBeInTheDocument();
    expect(screen.getByText('Registrar')).toBeInTheDocument();
    expect(screen.getByText('Verifier')).toBeInTheDocument();
  });

  it('Raw Data tab switches source on button click', async () => {
    renderDetail();
    await screen.findByText('agent-001');
    fireEvent.click(screen.getByRole('tab', { name: 'Raw Data' }));
    await screen.findByText(/test/);
    fireEvent.click(screen.getByText('Backend'));
    const { agentsApi } = await import('@/api/agents');
    expect(agentsApi.raw).toHaveBeenCalledWith('agent-001', 'backend');
  });

  it('TPM Policy tab shows raw policy when JSON is invalid', async () => {
    const { agentsApi } = await import('@/api/agents');
    vi.mocked(agentsApi.get).mockResolvedValueOnce({
      data: {
        id: 'agent-001', ip: '10.0.0.1', port: 9002,
        state: 'GET_QUOTE', attestation_mode: 'Pull',
        tpm_policy: 'not-valid-json',
      },
    } as never);
    renderDetail();
    expect(await screen.findByText('not-valid-json')).toBeInTheDocument();
  });

  it('TPM Policy tab shows placeholder when no policy', async () => {
    const { agentsApi } = await import('@/api/agents');
    vi.mocked(agentsApi.get).mockResolvedValueOnce({
      data: {
        id: 'agent-001', ip: '10.0.0.1', port: 9002,
        state: 'GET_QUOTE', attestation_mode: 'Pull',
        tpm_policy: null,
      },
    } as never);
    renderDetail();
    expect(await screen.findByText('No TPM policy configured')).toBeInTheDocument();
  });
});
