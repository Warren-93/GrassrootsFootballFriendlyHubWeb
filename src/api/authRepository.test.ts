import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authRepository } from './authRepository';
import { tokenStore } from '../auth/tokenStore';

describe('authRepository.oauthSignIn', () => {
  beforeEach(() => {
    tokenStore.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses the same cookie flow as password sign-in and keeps the access token in memory', async () => {
    const body = { accessToken: 'access-token', tokenType: 'Bearer', expiresIn: 900, newUser: true };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(body),
    } as Response);

    const result = await authRepository.oauthSignIn('apple', { idToken: 'apple-id-token', displayName: 'Sam Coach' });

    expect(result).toEqual({ ok: true, value: body });
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toContain('/api/v1/auth/oauth/apple');
    expect(init?.method).toBe('POST');
    expect(init?.credentials).toBe('include');
    expect((init!.headers as Record<string, string>)['X-Auth-Mode']).toBe('cookie');
    expect((init!.headers as Record<string, string>).Authorization).toBeUndefined();
    expect(init?.body).toBe(JSON.stringify({ idToken: 'apple-id-token', displayName: 'Sam Coach' }));
    expect(tokenStore.accessToken()).toBe('access-token');
    expect(tokenStore.refreshToken()).toBeNull();
  });
});
