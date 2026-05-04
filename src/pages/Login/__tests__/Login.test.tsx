import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Login } from '../Login';
import { useAuthStore } from '@/store/authStore';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  mockNavigate.mockClear();
  sessionStorage.clear();
  useAuthStore.setState({ user: null, isAuthenticated: false });
});

describe('Login page', () => {
  it('renders the brand heading', () => {
    render(<MemoryRouter><Login /></MemoryRouter>);
    expect(screen.getByText('Keylime Monitoring Dashboard')).toBeInTheDocument();
  });

  it('renders OIDC and Demo login buttons', () => {
    render(<MemoryRouter><Login /></MemoryRouter>);
    expect(screen.getByText('Sign in with OIDC/SAML')).toBeInTheDocument();
    expect(screen.getByText('Demo Login (Development)')).toBeInTheDocument();
  });

  it('demo login sets auth state and navigates home', () => {
    render(<MemoryRouter><Login /></MemoryRouter>);
    fireEvent.click(screen.getByText('Demo Login (Development)'));
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.role).toBe('admin');
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('OIDC button also triggers demo login in dev mode', () => {
    render(<MemoryRouter><Login /></MemoryRouter>);
    fireEvent.click(screen.getByText('Sign in with OIDC/SAML'));
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
