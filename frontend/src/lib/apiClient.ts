import { buildApiUrl } from "./constants";
import { clearAccessToken, getAccessToken, setAccessToken } from "./authToken";
import { toast } from "sonner";

/**
 * Lazily-resolved reference to the Zustand store's setState function.
 * We use a lazy import to avoid circular dependency issues at module
 * initialization time. apiClient → useAppStore → authSlice → apiClient
 * would create a circular module graph; lazy resolution breaks the cycle.
 */
let _syncTokenToStore: ((token: string | null) => void) | null = null;

/**
 * Called once by useAppStore after the store is created. Provides a direct
 * pathway for apiClient to update the Zustand `token` field after a silent
 * token refresh, without importing the store at module level.
 */
export function registerTokenSync(
  syncFn: (token: string | null) => void,
): void {
  _syncTokenToStore = syncFn;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = fetch(buildApiUrl("/api/auth/refresh"), {
      method: "POST",
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const data = (await response.json()) as {
          data?: { accessToken?: string };
        };
        const token = data.data?.accessToken || null;
        // Update both stores atomically (no intermediate render cycle).
        setAccessToken(token);
        _syncTokenToStore?.(token);
        return token;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  const method = (init.method || "GET").toUpperCase();
  const urlStr = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;

  const headers = new Headers(init.headers);
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });

  const duration = Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime);
  if (process.env.NODE_ENV === "development") {
    console.log(`[API] ${method} ${urlStr} status=${response.status} duration=${duration}ms`);
  }

  if (response.status !== 401 || String(input).includes("/api/auth/refresh")) {
    return response;
  }

  const refreshedToken = await refreshAccessToken();
  if (!refreshedToken) {
    const hadToken = !!token;
    clearAccessToken();
    _syncTokenToStore?.(null);
    if (typeof window !== "undefined" && hadToken) {
      toast.error("Your session has expired. Please sign in again.");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    }
    return response;
  }

  headers.set("Authorization", `Bearer ${refreshedToken}`);
  return fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });
}
