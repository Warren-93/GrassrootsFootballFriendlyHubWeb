import type { ApiResult } from './result';
import { fail, ok } from './result';
import { tokenStore } from '../auth/tokenStore';
import type { TokenResponse } from './types';

// Production builds call the API through this site's own /api proxy
// (api/proxy.js), so the refresh cookie is first-party: Safari and every
// iPhone browser drop a cross-site one, which signs people out on reload.
// VITE_API_DIRECT=true opts out and calls VITE_API_BASE_URL directly.
// "/" (or empty) also means the proxy.
const callsApiDirectly = !import.meta.env.PROD || import.meta.env.VITE_API_DIRECT === 'true';
const configuredBase = callsApiDirectly ? (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8090') : '/';
export const API_BASE_URL = configuredBase === '/' ? '' : configuredBase.replace(/\/$/, '');

// Auth endpoints ask for the cookie flow: the API sets the refresh token as an
// httpOnly cookie (scoped to /api/v1/auth) instead of returning it, so the
// browser has to send and accept credentials on these calls.
const AUTH_PATH_PREFIX = '/api/v1/auth/';
const COOKIE_MODE_HEADERS = { 'X-Auth-Mode': 'cookie' };

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Gets a fresh access token from the refresh cookie (or the in-memory refresh
 * token where the API returned one). Also how a reloaded page restores its
 * session, since the access token only ever lives in memory.
 */
export async function tryRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    for (let attempt = 0; ; attempt++) {
      const outcome = await refreshOnce();
      if (outcome !== 'retry') return outcome === 'ok';
      // Only a 401 means the session is over. A network error or a 5xx is
      // usually the free Render instance waking up, so wait and try again
      // rather than signing the user out.
      if (attempt >= REFRESH_RETRY_DELAYS_MS.length) return false;
      await new Promise((resolve) => setTimeout(resolve, REFRESH_RETRY_DELAYS_MS[attempt]));
    }
  })();
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

/** Waits between refresh attempts that failed for a reason other than a 401. */
export const REFRESH_RETRY_DELAYS_MS = [1000, 3000, 8000];

async function refreshOnce(): Promise<'ok' | 'expired' | 'retry'> {
  const refreshToken = tokenStore.refreshToken();
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...COOKIE_MODE_HEADERS },
      credentials: 'include',
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
    });
    if (response.status >= 500) return 'retry';
    if (!response.ok) return 'expired';
    const body = (await response.json()) as TokenResponse;
    tokenStore.set(body.accessToken, body.refreshToken);
    return 'ok';
  } catch {
    return 'retry';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  auth?: boolean;
  headers?: Record<string, string>;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  // An empty VITE_API_BASE_URL means "same origin" (the API proxied under /api).
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.error?.message === 'string') return body.error.message;
    if (typeof body?.message === 'string') return body.message;
    if (typeof body?.error === 'string') return body.error;
  } catch {
    // Body wasn't JSON - fall through to the status-based message.
  }
  return `Request failed (${response.status})`;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const { method = 'GET', body, query, auth = true, headers: extraHeaders } = options;

  const doFetch = async (): Promise<Response> => {
    const isAuthPath = path.startsWith(AUTH_PATH_PREFIX);
    const headers: Record<string, string> = { ...(isAuthPath ? COOKIE_MODE_HEADERS : {}), ...extraHeaders };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth) {
      const accessToken = tokenStore.accessToken();
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    }
    return fetch(buildUrl(path, query), {
      method,
      headers,
      credentials: isAuthPath ? 'include' : 'same-origin',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  try {
    let response = await doFetch();

    if (response.status === 401 && auth) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        response = await doFetch();
      } else {
        tokenStore.clear();
      }
    }

    if (!response.ok) {
      return fail(await parseErrorMessage(response), response.status);
    }
    // Some endpoints answer 200 with no body (verify email, password reset,
    // block team, ...), so any empty success is a success, not just 204.
    const text = await response.text();
    return ok((text ? JSON.parse(text) : undefined) as T);
  } catch {
    return fail('Network error - check your connection and try again.');
  }
}

export const apiClient = {
  get: <T>(path: string, query?: RequestOptions['query'], auth = true) =>
    request<T>(path, { method: 'GET', query, auth }),
  post: <T>(path: string, body?: unknown, auth = true, headers?: Record<string, string>) =>
    request<T>(path, { method: 'POST', body, auth, headers }),
  put: <T>(path: string, body?: unknown, auth = true) => request<T>(path, { method: 'PUT', body, auth }),
  patch: <T>(path: string, body?: unknown, auth = true) => request<T>(path, { method: 'PATCH', body, auth }),
  delete: <T>(path: string, auth = true) => request<T>(path, { method: 'DELETE', auth }),
};
