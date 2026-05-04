import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';
import type { User } from '@/types';

const viewer: User = { id: '1', name: 'View', email: 'v@test.com', role: 'viewer' };
const operator: User = { id: '2', name: 'Op', email: 'o@test.com', role: 'operator' };
const admin: User = { id: '3', name: 'Adm', email: 'a@test.com', role: 'admin' };

beforeEach(() => {
  sessionStorage.clear();
  useAuthStore.setState({ user: null, isAuthenticated: false });
});

describe('authStore', () => {
  describe('login', () => {
    it('sets user and isAuthenticated', () => {
      useAuthStore.getState().login(viewer, 'tok-1');
      const s = useAuthStore.getState();
      expect(s.user).toEqual(viewer);
      expect(s.isAuthenticated).toBe(true);
    });

    it('stores token in sessionStorage', () => {
      useAuthStore.getState().login(operator, 'tok-2');
      expect(sessionStorage.getItem('access_token')).toBe('tok-2');
    });
  });

  describe('logout', () => {
    it('clears user and isAuthenticated', () => {
      useAuthStore.getState().login(admin, 'tok-3');
      useAuthStore.getState().logout();
      const s = useAuthStore.getState();
      expect(s.user).toBeNull();
      expect(s.isAuthenticated).toBe(false);
    });

    it('removes token from sessionStorage', () => {
      useAuthStore.getState().login(admin, 'tok-4');
      useAuthStore.getState().logout();
      expect(sessionStorage.getItem('access_token')).toBeNull();
    });
  });

  describe('hasRole', () => {
    it('returns false when no user is logged in', () => {
      expect(useAuthStore.getState().hasRole('viewer')).toBe(false);
    });

    it('viewer has viewer role only', () => {
      useAuthStore.getState().login(viewer, 't');
      expect(useAuthStore.getState().hasRole('viewer')).toBe(true);
      expect(useAuthStore.getState().hasRole('operator')).toBe(false);
      expect(useAuthStore.getState().hasRole('admin')).toBe(false);
    });

    it('operator has viewer and operator roles', () => {
      useAuthStore.getState().login(operator, 't');
      expect(useAuthStore.getState().hasRole('viewer')).toBe(true);
      expect(useAuthStore.getState().hasRole('operator')).toBe(true);
      expect(useAuthStore.getState().hasRole('admin')).toBe(false);
    });

    it('admin has all roles', () => {
      useAuthStore.getState().login(admin, 't');
      expect(useAuthStore.getState().hasRole('viewer')).toBe(true);
      expect(useAuthStore.getState().hasRole('operator')).toBe(true);
      expect(useAuthStore.getState().hasRole('admin')).toBe(true);
    });
  });

  describe('canWrite', () => {
    it('returns false for viewer', () => {
      useAuthStore.getState().login(viewer, 't');
      expect(useAuthStore.getState().canWrite()).toBe(false);
    });

    it('returns true for operator', () => {
      useAuthStore.getState().login(operator, 't');
      expect(useAuthStore.getState().canWrite()).toBe(true);
    });

    it('returns true for admin', () => {
      useAuthStore.getState().login(admin, 't');
      expect(useAuthStore.getState().canWrite()).toBe(true);
    });
  });

  describe('isAdmin', () => {
    it('returns false for viewer', () => {
      useAuthStore.getState().login(viewer, 't');
      expect(useAuthStore.getState().isAdmin()).toBe(false);
    });

    it('returns false for operator', () => {
      useAuthStore.getState().login(operator, 't');
      expect(useAuthStore.getState().isAdmin()).toBe(false);
    });

    it('returns true for admin', () => {
      useAuthStore.getState().login(admin, 't');
      expect(useAuthStore.getState().isAdmin()).toBe(true);
    });
  });
});
