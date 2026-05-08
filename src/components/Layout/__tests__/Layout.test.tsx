import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from '../Layout';
import { useVisualizationStore } from '@/store/visualizationStore';

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

beforeEach(() => {
  useVisualizationStore.setState({ defaultTimeRange: '24h' });
});

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

  it('initializes time range from visualization store defaultTimeRange', () => {
    useVisualizationStore.setState({ defaultTimeRange: '7d' });
    renderLayout();
    const btn = screen.getByText('7d');
    expect(btn.classList.contains('topbar__time-btn--active')).toBe(true);
  });

  it('uses updated defaultTimeRange on remount', () => {
    useVisualizationStore.setState({ defaultTimeRange: '1h' });
    renderLayout();
    const btn1h = screen.getByText('1h');
    expect(btn1h.classList.contains('topbar__time-btn--active')).toBe(true);
  });

  describe('sidebar drag resize', () => {
    it('sets cursor on mousedown', () => {
      renderLayout();
      const handle = document.querySelector('.layout__resize-handle')!;
      fireEvent.mouseDown(handle);
      expect(document.body.style.cursor).toBe('col-resize');
      expect(document.body.style.userSelect).toBe('none');
    });

    it('updates sidebar width on mousemove after mousedown', () => {
      renderLayout();
      const handle = document.querySelector('.layout__resize-handle')!;
      fireEvent.mouseDown(handle);
      fireEvent.mouseMove(document, { clientX: 300 });
      const layout = document.querySelector('.layout') as HTMLElement;
      expect(layout.style.getPropertyValue('--sidebar-width')).toBe('300px');
    });

    it('does not update sidebar on mousemove without mousedown', () => {
      renderLayout();
      const layout = document.querySelector('.layout') as HTMLElement;
      const initialWidth = layout.style.getPropertyValue('--sidebar-width');
      fireEvent.mouseMove(document, { clientX: 300 });
      expect(layout.style.getPropertyValue('--sidebar-width')).toBe(initialWidth);
    });

    it('resets cursor on mouseup', () => {
      renderLayout();
      const handle = document.querySelector('.layout__resize-handle')!;
      fireEvent.mouseDown(handle);
      fireEvent.mouseUp(document);
      expect(document.body.style.cursor).toBe('');
      expect(document.body.style.userSelect).toBe('');
    });

    it('clamps width to MIN_SIDEBAR (180)', () => {
      renderLayout();
      const handle = document.querySelector('.layout__resize-handle')!;
      fireEvent.mouseDown(handle);
      fireEvent.mouseMove(document, { clientX: 50 });
      const layout = document.querySelector('.layout') as HTMLElement;
      expect(layout.style.getPropertyValue('--sidebar-width')).toBe('180px');
    });

    it('clamps width to MAX_SIDEBAR (400)', () => {
      renderLayout();
      const handle = document.querySelector('.layout__resize-handle')!;
      fireEvent.mouseDown(handle);
      fireEvent.mouseMove(document, { clientX: 800 });
      const layout = document.querySelector('.layout') as HTMLElement;
      expect(layout.style.getPropertyValue('--sidebar-width')).toBe('400px');
    });

    it('hides resize handle when sidebar is collapsed', () => {
      renderLayout();
      fireEvent.click(screen.getByLabelText(/toggle sidebar/i));
      expect(document.querySelector('.layout__resize-handle')).toBeNull();
    });
  });
});
