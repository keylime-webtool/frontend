import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from '../Layout';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { name: 'Test', role: 'admin' },
    isAuthenticated: true,
    logout: vi.fn(),
    canWrite: () => true,
    isAdmin: () => true,
    hasRole: () => true,
  }),
}));

vi.mock('@/hooks/useWebSocket', () => ({
  useWebSocket: () => ({ connected: false }),
}));

vi.mock('@/api/alerts', () => ({
  alertsApi: { summary: vi.fn().mockResolvedValue({ data: {} }) },
}));

function renderLayout() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Layout', () => {
  it('renders sidebar and topbar', () => {
    renderLayout();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders time range selector in top bar', () => {
    renderLayout();
    expect(screen.getByLabelText(/time range/i)).toBeInTheDocument();
  });

  it('renders sidebar toggle button', () => {
    renderLayout();
    const toggle = screen.getByLabelText(/toggle sidebar/i);
    expect(toggle).toBeInTheDocument();
  });

  it('collapses sidebar on toggle click', () => {
    renderLayout();
    const toggle = screen.getByLabelText(/toggle sidebar/i);
    fireEvent.click(toggle);
    const layout = document.querySelector('.layout');
    expect(layout?.classList.contains('layout--sidebar-collapsed')).toBe(true);
  });

  it('expands sidebar on second toggle click', () => {
    renderLayout();
    const toggle = screen.getByLabelText(/toggle sidebar/i);
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    const layout = document.querySelector('.layout');
    expect(layout?.classList.contains('layout--sidebar-collapsed')).toBe(false);
  });
});
