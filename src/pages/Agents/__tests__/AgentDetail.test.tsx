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
});
