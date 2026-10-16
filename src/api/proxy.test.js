import { afterEach, describe, expect, it, vi } from 'vitest';
import handler from '../../api/proxy.js';

function forwardedHeaders() {
  const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  return async (headers) => {
    await handler(new Request('https://kickabout.example/api/proxy?path=v1/auth/refresh', { method: 'POST', headers }));
    return fetchMock.mock.calls[0][1].headers;
  };
}

describe('api proxy', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('vouches for requests from the site it serves', async () => {
    const send = forwardedHeaders();
    const headers = await send({ origin: 'https://kickabout.example', host: 'kickabout.example', 'x-auth-mode': 'cookie' });
    expect(headers.get('x-web-proxy')).toBe('same-origin');
    expect(headers.get('x-auth-mode')).toBe('cookie');
    expect(headers.get('origin')).toBeNull();
  });

  it("doesn't vouch for another site, even if it sends the header itself", async () => {
    const send = forwardedHeaders();
    const headers = await send({ origin: 'https://attacker.vercel.app', host: 'kickabout.example', 'x-web-proxy': 'same-origin' });
    expect(headers.get('x-web-proxy')).toBeNull();
    expect(headers.get('origin')).toBe('https://attacker.vercel.app');
  });
});
