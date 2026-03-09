import { StateCreator } from "zustand";
import { extractUserFromToken } from "@/lib/jwtDecode";
import { API_URL } from "@/lib/constants";

type UserInfo = {
  userId: string;
  email: string;
  name: string;
  givenName?: string | null;
  familyName?: string | null;
  profileImage?: string | null;
  role?: string;
};

export type AuthSlice = {
  userInfo: UserInfo | null;
  token: string | null;
  authReady: boolean;
  loading: boolean;
  error: string | null;
  setAuth: (payload: { token: string; user: UserInfo }) => void;
  clearAuth: () => void;
  initializeAuth: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
};

export const createAuthSlice: StateCreator<AuthSlice, [], [], AuthSlice> = (
  set,
  get,
) => ({
  userInfo: null,
  token: null,
  authReady: false,
  loading: false,
  error: null,

  setAuth: ({ token, user }) =>
    set({
      token,
      userInfo: user,
      authReady: true,
      loading: false,
      error: null,
    }),

  clearAuth: () =>
    set({
      token: null,
      userInfo: null,
      authReady: true,
      loading: false,
      error: null,
    }),

  initializeAuth: async () => {
    const currentState = get();
    const token = currentState.token;

    // Skip if already authenticated with valid user info
    if (currentState.authReady && currentState.userInfo && token) {
      return;
    }

    if (!token) {
      set({ authReady: true, userInfo: null, loading: false, error: null });
      return;
    }

    set({ loading: true, error: null });

    try {
      // Decode JWT to extract user info (no API call needed)
      const user = extractUserFromToken(token);

      if (!user) {
        get().clearAuth();
        return;
      }

      set({ userInfo: user, authReady: true, loading: false, error: null });
    } catch (error: unknown) {
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message ||
            "Failed to validate session"
          : "Failed to validate session";
      set({
        token: null,
        userInfo: null,
        authReady: true,
        loading: false,
        error: message,
      });
    }
  },

  logout: async () => {
    try {
      // Clear Zustand persisted state first
      get().clearAuth();

      // Clear all localStorage (in case of any residual data)
      localStorage.clear();

      // Call backend logout to destroy session and redirect to Cognito logout
      // This will clear Cognito session cookies and redirect back to login
      const logoutUrl = API_URL
        ? `${API_URL.replace(/\/$/, "")}/api/auth/logout`
        : "/api/auth/logout";
      window.location.href = logoutUrl;
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback: clear local state and redirect manually
      get().clearAuth();
      localStorage.clear();
      window.location.href = "/";
    }
  },

  isAuthenticated: () => !!get().token && !!get().userInfo,
});
