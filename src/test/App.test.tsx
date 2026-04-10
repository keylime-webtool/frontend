import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from '@/components/Layout/Sidebar';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Sidebar', () => {
  it('renders all navigation links', () => {
    renderWithProviders(<Sidebar />);

    expect(screen.getByText('Dashboard')).toBeDefined();
    expect(screen.getByText('Agents')).toBeDefined();
    expect(screen.getByText('Attestations')).toBeDefined();
    expect(screen.getByText('Policies')).toBeDefined();
    expect(screen.getByText('Certificates')).toBeDefined();
    expect(screen.getByText('Alerts')).toBeDefined();
    expect(screen.getByText('Performance')).toBeDefined();
    expect(screen.getByText('Audit Log')).toBeDefined();
    expect(screen.getByText('Integrations')).toBeDefined();
    expect(screen.getByText('Settings')).toBeDefined();
  });

  it('renders the Keylime Monitor branding', () => {
    renderWithProviders(<Sidebar />);

    expect(screen.getByText('Keylime Monitor')).toBeDefined();
  });
});
