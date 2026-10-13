import type { ApiResult } from './result';
import { fail, ok } from './result';
import { tokenStore } from '../auth/tokenStore';
import type { TokenResponse } from './types';

// Empty by default: the API is reached through this site's own origin (a
// Vercel rewrite in production, the Vite proxy in development), which keeps
// the refresh cookie first-party. Set VITE_API_BASE_URL only to point at an
// API on another origin, which needs that origin to allow credentialed CORS.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

/** Asks the API to send the refresh token as an httpOnly cookie instead of in the body. */
export const AUTH_MODE_HEADER = { 'X-Auth-Mode': 'cookie' };

let refreshInFlight: Promise<boolean> | null = null;

/** Exchanges the refresh cookie for a new access token. False when there is no valid session. */
export async function tryRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const response = await fetch(buildUrl('/api/v1/auth/refresh'), {
        method: 'POST',
        headers: AUTH_MODE_HEADER,
        credentials: 'include',
      });
      if (!response.ok) return false;
      const body = (await response.json()) as TokenResponse;
      tokenStore.set(body.accessToken);
      return true;
    } catch {
      return false;
    }
  })();
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
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
    const headers: Record<string, string> = { ...extraHeaders };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth) {
      const accessToken = tokenStore.accessToken();
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    }
    return fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'include',
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
    if (response.status === 204) {
      return ok(undefined as T);
    }
    return ok((await response.json()) as T);
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
