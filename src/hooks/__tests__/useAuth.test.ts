import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../useAuth';

beforeEach(() => {
  sessionStorage.clear();
});

describe('useAuth', () => {
  it('returns auth state and methods', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current).toHaveProperty('user');
    expect(result.current).toHaveProperty('isAuthenticated');
    expect(result.current).toHaveProperty('login');
    expect(result.current).toHaveProperty('logout');
    expect(result.current).toHaveProperty('hasRole');
    expect(result.current).toHaveProperty('canWrite');
    expect(result.current).toHaveProperty('isAdmin');
  });

  it('login sets user and isAuthenticated', () => {
    const { result } = renderHook(() => useAuth());
    act(() => {
      result.current.login({ id: '1', email: 'a@b.com', name: 'Test', role: 'admin' }, 'test-token');
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.role).toBe('admin');
  });

  it('logout clears user', () => {
    const { result } = renderHook(() => useAuth());
    act(() => {
      result.current.login({ id: '1', email: 'a@b.com', name: 'Test', role: 'admin' }, 'test-token');
    });
    act(() => {
      result.current.logout();
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('canWrite returns true for operator and admin', () => {
    const { result } = renderHook(() => useAuth());
    act(() => {
      result.current.login({ id: '1', email: 'a@b.com', name: 'Test', role: 'operator' }, 't');
    });
    expect(result.current.canWrite()).toBe(true);
  });

  it('canWrite returns false for viewer', () => {
    const { result } = renderHook(() => useAuth());
    act(() => {
      result.current.login({ id: '1', email: 'a@b.com', name: 'Test', role: 'viewer' }, 't');
    });
    expect(result.current.canWrite()).toBe(false);
  });

  it('isAdmin returns true only for admin', () => {
    const { result } = renderHook(() => useAuth());
    act(() => {
      result.current.login({ id: '1', email: 'a@b.com', name: 'Test', role: 'admin' }, 't');
    });
    expect(result.current.isAdmin()).toBe(true);
  });

  it('hasRole checks role hierarchy', () => {
    const { result } = renderHook(() => useAuth());
    act(() => {
      result.current.login({ id: '1', email: 'a@b.com', name: 'Test', role: 'operator' }, 't');
    });
    expect(result.current.hasRole('viewer')).toBe(true);
    expect(result.current.hasRole('operator')).toBe(true);
    expect(result.current.hasRole('admin')).toBe(false);
  });
});
