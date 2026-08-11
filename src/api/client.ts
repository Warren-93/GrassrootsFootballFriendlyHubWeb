import type { ApiResult } from './result';
import { fail, ok } from './result';
import { tokenStore } from '../auth/tokenStore';
import type { TokenResponse } from './types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8090';

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const refreshToken = tokenStore.refreshToken();
    if (!refreshToken) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) return false;
      const body = (await response.json()) as TokenResponse;
      tokenStore.set(body.accessToken, body.refreshToken);
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
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${API_BASE_URL}${path}`);
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
    if (typeof body?.message === 'string') return body.message;
    if (typeof body?.error === 'string') return body.error;
  } catch {
    // Body wasn't JSON - fall through to the status-based message.
  }
  return `Request failed (${response.status})`;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const { method = 'GET', body, query, auth = true } = options;

  const doFetch = async (): Promise<Response> => {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth) {
      const accessToken = tokenStore.accessToken();
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    }
    return fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  try {
    let response = await doFetch();

    if (response.status === 401 && auth && tokenStore.refreshToken()) {
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
  post: <T>(path: string, body?: unknown, auth = true) => request<T>(path, { method: 'POST', body, auth }),
  put: <T>(path: string, body?: unknown, auth = true) => request<T>(path, { method: 'PUT', body, auth }),
  patch: <T>(path: string, body?: unknown, auth = true) => request<T>(path, { method: 'PATCH', body, auth }),
  delete: <T>(path: string, auth = true) => request<T>(path, { method: 'DELETE', auth }),
};
