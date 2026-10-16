import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient, tryRefresh } from './client';
import { tokenStore } from '../auth/tokenStore';

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  } as Response;
}

describe('apiClient', () => {
  beforeEach(() => {
    tokenStore.clear();
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

  it('treats an empty 200 body as success, not a network error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(200, undefined));

    const result = await apiClient.post('/api/v1/auth/verify-email/confirm', { token: 't' }, false);

    expect(result).toEqual({ ok: true, value: undefined });
  });

  it('returns the body of a 202 Accepted response', async () => {
    const invited = { status: 'INVITED', invite: { id: 'i1', email: 'new@example.com' } };
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(202, invited));

    const result = await apiClient.post('/api/v1/teams/t1/members', { email: 'new@example.com', role: 'TEAM_MANAGER' });

    expect(result).toEqual({ ok: true, value: invited });
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

  it('refreshes from the httpOnly cookie when no refresh token is held in memory', async () => {
    tokenStore.set('expired-access-token');
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(401, { error: { message: 'expired' } }))
      .mockResolvedValueOnce(jsonResponse(200, { accessToken: 'new-access-token' }))
      .mockResolvedValueOnce(jsonResponse(200, { id: '1' }));

    const result = await apiClient.get<{ id: string }>('/api/v1/teams/mine');

    expect(result).toEqual({ ok: true, value: { id: '1' } });
    const [url, init] = vi.mocked(fetch).mock.calls[1];
    expect(url).toContain('/api/v1/auth/refresh');
    expect(init?.credentials).toBe('include');
    expect((init!.headers as Record<string, string>)['X-Auth-Mode']).toBe('cookie');
    expect(init?.body).toBe('{}');
    expect(tokenStore.accessToken()).toBe('new-access-token');
    expect(tokenStore.refreshToken()).toBeNull();
  });

  it('asks for the cookie flow on auth endpoints only', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(200, { accessToken: 'a' }))
      .mockResolvedValueOnce(jsonResponse(200, { id: '1' }));

    await apiClient.post('/api/v1/auth/login', { email: 'a@b.c', password: 'x' }, false);
    await apiClient.get('/api/v1/teams/mine');

    const [, loginInit] = vi.mocked(fetch).mock.calls[0];
    expect(loginInit?.credentials).toBe('include');
    expect((loginInit!.headers as Record<string, string>)['X-Auth-Mode']).toBe('cookie');
    const [, teamInit] = vi.mocked(fetch).mock.calls[1];
    expect(teamInit?.credentials).toBe('same-origin');
    expect((teamInit!.headers as Record<string, string>)['X-Auth-Mode']).toBeUndefined();
  });

  it('retries the refresh while the API is waking up instead of signing out', async () => {
    vi.useFakeTimers();
    vi.mocked(fetch)
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(jsonResponse(504, undefined))
      .mockResolvedValueOnce(jsonResponse(200, { accessToken: 'fresh-access-token' }));

    const refreshed = tryRefresh();
    await vi.runAllTimersAsync();

    expect(await refreshed).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(tokenStore.accessToken()).toBe('fresh-access-token');
    vi.useRealTimers();
  });

  it('gives up straight away when the refresh cookie has expired', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(401, { error: { message: 'expired' } }));

    expect(await tryRefresh()).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);
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
