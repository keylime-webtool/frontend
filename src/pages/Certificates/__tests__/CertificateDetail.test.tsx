import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CertificateDetail } from '../CertificateDetail';
import type { Certificate } from '@/types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockEkCert: Certificate = {
  id: 'cert-ek-1',
  type: 'ek',
  subject_dn: 'CN=TPM-EK,O=Vendor',
  issuer_dn: 'CN=TPM-Vendor-CA',
  serial_number: 'AA:BB:CC:DD',
  not_before: '2025-01-01T00:00:00Z',
  not_after: '2026-12-31T00:00:00Z',
  public_key_algorithm: 'RSA',
  public_key_size: 2048,
  signature_algorithm: 'SHA256withRSA',
  san: ['dns:tpm.example.com', 'ip:192.168.1.1'],
  key_usage: ['digitalSignature', 'keyEncipherment'],
  extended_key_usage: ['serverAuth'],
  status: 'valid',
  associated_entity: 'agent-001',
  validation_status: 'valid',
  chain_valid: true,
  chain: [
    {
      id: 'cert-ca-1',
      type: 'ek',
      subject_dn: 'CN=Root-CA',
      issuer_dn: 'CN=Root-CA',
      serial_number: '11:22:33',
      not_before: '2020-01-01T00:00:00Z',
      not_after: '2030-12-31T00:00:00Z',
      public_key_algorithm: 'RSA',
      public_key_size: 4096,
      signature_algorithm: 'SHA256withRSA',
      san: [],
      key_usage: [],
      extended_key_usage: [],
      status: 'valid',
      associated_entity: '',
      validation_status: 'valid',
      chain_valid: null,
      chain: [],
      expiry_category: 'valid',
    },
  ],
  expiry_category: 'valid',
};

const mockMtlsCert: Certificate = {
  ...mockEkCert,
  id: 'cert-mtls-1',
  type: 'mtls',
  subject_dn: 'CN=agent-mtls',
  chain: [],
  san: [],
  key_usage: [],
  extended_key_usage: [],
};

let currentCert: Certificate = mockEkCert;

vi.mock('@/api/certificates', () => ({
  certificatesApi: {
    get: vi.fn().mockImplementation(() =>
      Promise.resolve({ data: currentCert }),
    ),
    downloadPem: vi.fn().mockResolvedValue({
      data: new Blob(['-----BEGIN CERTIFICATE-----'], { type: 'application/x-pem-file' }),
    }),
    downloadDer: vi.fn().mockResolvedValue({
      data: new Blob([new Uint8Array([0x30])], { type: 'application/x-x509-ca-cert' }),
    }),
  },
}));

vi.mock('@/api/client', () => ({
  default: { get: vi.fn() },
  getBackendUrl: () => 'http://localhost:8080',
}));

function renderWithProviders(certId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/certificates/${certId}`]}>
        <Routes>
          <Route path="/certificates/:id" element={<CertificateDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockNavigate.mockClear();
  currentCert = mockEkCert;
});

describe('CertificateDetail page', () => {
  it('renders certificate detail fields', async () => {
    renderWithProviders('cert-ek-1');
    expect(await screen.findByText('Certificate Details')).toBeInTheDocument();
    expect(screen.getByText('AA:BB:CC:DD')).toBeInTheDocument();
    expect(screen.getByText('2048 bits')).toBeInTheDocument();
    const subjectDns = screen.getAllByText('CN=TPM-EK,O=Vendor');
    expect(subjectDns.length).toBeGreaterThanOrEqual(2);
  });

  it('shows certificate chain with chain_valid badge', async () => {
    renderWithProviders('cert-ek-1');
    expect(await screen.findByText('Certificate Chain')).toBeInTheDocument();
    expect(screen.getByText('Leaf Certificate')).toBeInTheDocument();
    expect(screen.getByText('Root CA')).toBeInTheDocument();
    expect(screen.getByText('CN=Root-CA')).toBeInTheDocument();
    expect(screen.getByText('chain valid')).toBeInTheDocument();
  });

  it('hides chain section for non-EK certs', async () => {
    currentCert = mockMtlsCert;
    renderWithProviders('cert-mtls-1');
    await screen.findByText('Certificate Details');
    expect(screen.queryByText('Certificate Chain')).not.toBeInTheDocument();
  });

  it('shows SANs when present', async () => {
    renderWithProviders('cert-ek-1');
    expect(await screen.findByText('Subject Alternative Names')).toBeInTheDocument();
    expect(screen.getByText('dns:tpm.example.com')).toBeInTheDocument();
    expect(screen.getByText('ip:192.168.1.1')).toBeInTheDocument();
  });

  it('shows key usage badges', async () => {
    renderWithProviders('cert-ek-1');
    expect(await screen.findByText('Key Usage')).toBeInTheDocument();
    expect(screen.getByText('digitalSignature')).toBeInTheDocument();
    expect(screen.getByText('keyEncipherment')).toBeInTheDocument();
  });

  it('shows extended key usage badges', async () => {
    renderWithProviders('cert-ek-1');
    expect(await screen.findByText('Extended Key Usage')).toBeInTheDocument();
    expect(screen.getByText('serverAuth')).toBeInTheDocument();
  });

  it('renders download buttons', async () => {
    renderWithProviders('cert-ek-1');
    expect(await screen.findByRole('button', { name: /download.*pem/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download.*der/i })).toBeInTheDocument();
  });

  it('navigates back on Back button click', async () => {
    renderWithProviders('cert-ek-1');
    const backBtn = await screen.findByRole('button', { name: /back to certificates list/i });
    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/certificates');
  });

  it('triggers PEM download on button click', async () => {
    const { certificatesApi } = await import('@/api/certificates');
    renderWithProviders('cert-ek-1');
    const pemBtn = await screen.findByRole('button', { name: /download.*pem/i });
    fireEvent.click(pemBtn);
    await vi.waitFor(() => {
      expect(certificatesApi.downloadPem).toHaveBeenCalledWith('cert-ek-1');
    });
  });
});
