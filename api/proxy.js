// Same-origin proxy to the API, so the refresh-token cookie is first-party
// (Safari blocks the cross-site one and signs people out on reload).
//
// Production builds of the web app always call /api/... on their own origin
// (set VITE_API_DIRECT=true to skip this proxy). The API it forwards to is
// API_ORIGIN, else VITE_API_BASE_URL when that is a full URL, else the Render
// API below. No Render setting is needed: the cookie is first-party either way.
//
// vercel.json rewrites /api/<path> to /api/proxy?path=<path>.
//
// When the browser's Origin is this site, the call is same-origin, so the
// proxy drops Origin and tells the API with X-Web-Proxy: same-origin instead.
// The API then uses the sign-in cookie without needing this site's address in
// its CORS list. Requests from other sites keep their Origin, so CORS applies.
export const config = { runtime: 'edge' };

const HOP_BY_HOP = ['host', 'connection', 'content-length', 'accept-encoding'];
const PROXY_HEADER = 'x-web-proxy';
const DEFAULT_API_ORIGIN = 'https://grassrootsfootballfriendlyhubapi.onrender.com';

export function isSameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? new URL(request.url).host;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function apiOrigin() {
  if (process.env.API_ORIGIN) return process.env.API_ORIGIN;
  const base = process.env.VITE_API_BASE_URL ?? '';
  return /^https?:\/\//.test(base) ? new URL(base).origin : DEFAULT_API_ORIGIN;
}

export default async function handler(request) {
  const origin = apiOrigin();

  const incoming = new URL(request.url);
  const path = incoming.searchParams.get('path') ?? '';
  incoming.searchParams.delete('path');
  const target = new URL(`/api/${path}`, origin);
  target.search = incoming.searchParams.toString();

  const headers = new Headers(request.headers);
  for (const name of HOP_BY_HOP) headers.delete(name);
  headers.delete(PROXY_HEADER);
  if (isSameOrigin(request)) {
    headers.delete('origin');
    headers.set(PROXY_HEADER, 'same-origin');
  }

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: 'manual',
  });

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('content-length');
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}
