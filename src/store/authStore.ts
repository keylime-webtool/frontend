import { create } from 'zustand';
import type { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  canWrite: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: !!sessionStorage.getItem('access_token'),

  login: (user: User, token: string) => {
    sessionStorage.setItem('access_token', token);
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    sessionStorage.removeItem('access_token');
    set({ user: null, isAuthenticated: false });
  },

  hasRole: (role: UserRole) => {
    const { user } = get();
    if (!user) return false;
    const hierarchy: UserRole[] = ['viewer', 'operator', 'admin'];
    return hierarchy.indexOf(user.role) >= hierarchy.indexOf(role);
  },

  canWrite: () => get().hasRole('operator'),
  isAdmin: () => get().hasRole('admin'),
}));
