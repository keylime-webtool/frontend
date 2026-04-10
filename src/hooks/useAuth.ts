import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { user, isAuthenticated, login, logout, hasRole, canWrite, isAdmin } = useAuthStore();

  return {
    user,
    isAuthenticated,
    login,
    logout,
    hasRole,
    canWrite,
    isAdmin,
  };
}
