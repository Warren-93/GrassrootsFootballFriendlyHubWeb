import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './client';
import { tokenStore } from '../auth/tokenStore';

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('apiClient', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns ok:true with the parsed body on a successful request', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(200, { id: '42', name: 'Team A' }));

    const result = await apiClient.get<{ id: string; name: string }>('/api/v1/teams/42');

    expect(result).toEqual({ ok: true, value: { id: '42', name: 'Team A' } });
  });

  it('surfaces the backend error envelope message on failure', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(404, { error: { code: 'TEAM_NOT_FOUND', message: 'That team could not be found.' } }),
    );

    const result = await apiClient.get('/api/v1/teams/missing');

    expect(result).toEqual({ ok: false, message: 'That team could not be found.', status: 404 });
  });

  it('falls back to a status-based message when the error body is not JSON', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('not json');
      },
    } as unknown as Response);

    const result = await apiClient.get('/api/v1/teams/1');

    expect(result).toEqual({ ok: false, message: 'Request failed (500)', status: 500 });
  });

  it('returns a network-error message when fetch itself throws', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const result = await apiClient.get('/api/v1/teams/1');

    expect(result).toEqual({ ok: false, message: 'Network error - check your connection and try again.' });
  });

  it('refreshes an expired access token once and retries the original request', async () => {
    tokenStore.set('expired-access-token', 'valid-refresh-token');
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(401, { error: { message: 'expired' } })) // first attempt
      .mockResolvedValueOnce(jsonResponse(200, { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' })) // refresh call
      .mockResolvedValueOnce(jsonResponse(200, { id: '1' })); // retried original request

    const result = await apiClient.get<{ id: string }>('/api/v1/teams/mine');

    expect(result).toEqual({ ok: true, value: { id: '1' } });
    expect(tokenStore.accessToken()).toBe('new-access-token');
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('clears stored tokens when the refresh attempt itself fails', async () => {
    tokenStore.set('expired-access-token', 'stale-refresh-token');
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(401, { error: { message: 'expired' } }))
      .mockResolvedValueOnce(jsonResponse(401, { error: { message: 'invalid refresh token' } }));

    const result = await apiClient.get('/api/v1/teams/mine');

    expect(result.ok).toBe(false);
    expect(tokenStore.accessToken()).toBeNull();
    expect(tokenStore.refreshToken()).toBeNull();
  });
});
