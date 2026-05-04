import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from '../Sidebar';

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

function renderSidebar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Sidebar', () => {
  it('renders the brand logo link', () => {
    renderSidebar();
    expect(screen.getByText('Keylime Dashboard')).toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    renderSidebar();
    const labels = [
      'Dashboard', 'Agents', 'Policies', 'Alerts', 'Attestations',
      'Certificates', 'Performance', 'Audit Log', 'Integrations', 'Settings',
    ];
    for (const label of labels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('renders nav element with accessible label', () => {
    renderSidebar();
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  });
});
