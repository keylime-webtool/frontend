import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TopBar } from '../TopBar';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const admin: User = { id: '1', name: 'Jane Doe', email: 'j@t.com', role: 'admin' };

beforeEach(() => {
  mockNavigate.mockClear();
  sessionStorage.clear();
  useAuthStore.setState({ user: admin, isAuthenticated: true });
});

function renderTopBar(props?: Partial<Parameters<typeof TopBar>[0]>) {
  const defaults = {
    selectedTimeRange: '24h',
    onTimeRangeChange: vi.fn(),
    onToggleSidebar: vi.fn(),
  };
  return render(
    <MemoryRouter>
      <TopBar {...defaults} {...props} />
    </MemoryRouter>,
  );
}

describe('TopBar', () => {
  it('renders user initials from name', () => {
    renderTopBar();
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders user name', () => {
    renderTopBar();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('renders "?" for guest when no user', () => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    renderTopBar();
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('renders time range buttons', () => {
    renderTopBar();
    expect(screen.getByText('1h')).toBeInTheDocument();
    expect(screen.getByText('6h')).toBeInTheDocument();
    expect(screen.getByText('24h')).toBeInTheDocument();
    expect(screen.getByText('7d')).toBeInTheDocument();
    expect(screen.getByText('30d')).toBeInTheDocument();
  });

  it('calls onTimeRangeChange when a time button is clicked', () => {
    const onChange = vi.fn();
    renderTopBar({ onTimeRangeChange: onChange });
    fireEvent.click(screen.getByText('7d'));
    expect(onChange).toHaveBeenCalledWith('7d');
  });

  it('submits search and navigates to agents', () => {
    renderTopBar();
    const input = screen.getByLabelText('Search agents');
    fireEvent.change(input, { target: { value: 'abc-123' } });
    fireEvent.submit(input.closest('form')!);
    expect(mockNavigate).toHaveBeenCalledWith('/agents?q=abc-123');
  });

  it('calls onToggleSidebar', () => {
    const toggle = vi.fn();
    renderTopBar({ onToggleSidebar: toggle });
    fireEvent.click(screen.getByLabelText('Toggle sidebar'));
    expect(toggle).toHaveBeenCalledOnce();
  });

  it('navigates to settings page', () => {
    renderTopBar();
    fireEvent.click(screen.getByLabelText('Settings'));
    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });
});
