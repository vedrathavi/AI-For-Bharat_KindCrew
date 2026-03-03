import { useAppStore } from "@/store/useAppStore";

export function useAuth() {
  const userInfo = useAppStore((state) => state.userInfo);
  const token = useAppStore((state) => state.token);
  const authReady = useAppStore((state) => state.authReady);
  const loading = useAppStore((state) => state.loading);
  const error = useAppStore((state) => state.error);
  const initializeAuth = useAppStore((state) => state.initializeAuth);
  const logout = useAppStore((state) => state.logout);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const setAuth = useAppStore((state) => state.setAuth);

  return {
    userInfo,
    token,
    authReady,
    loading,
    error,
    initializeAuth,
    logout,
    isAuthenticated,
    setAuth,
  };
}
