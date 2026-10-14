// Same-origin proxy to the API, so the refresh-token cookie is first-party
// (Safari blocks the cross-site one and signs people out on reload).
//
// Off until both are set in Vercel:
//   API_ORIGIN          the Render API, e.g. https://your-api.onrender.com
//   VITE_API_BASE_URL   "/" (the web app then calls /api/... on its own origin)
// and on Render: AUTH_COOKIE_SAME_SITE=Lax.
//
// vercel.json rewrites /api/<path> to /api/proxy?path=<path>.
export const config = { runtime: 'edge' };

const HOP_BY_HOP = ['host', 'connection', 'content-length', 'accept-encoding'];

export default async function handler(request) {
  const origin = process.env.API_ORIGIN;
  if (!origin) {
    return Response.json(
      { error: { code: 'PROXY_NOT_CONFIGURED', message: 'API_ORIGIN is not set for this deployment.' } },
      { status: 503 },
    );
  }

  const incoming = new URL(request.url);
  const path = incoming.searchParams.get('path') ?? '';
  incoming.searchParams.delete('path');
  const target = new URL(`/api/${path}`, origin);
  target.search = incoming.searchParams.toString();

  const headers = new Headers(request.headers);
  for (const name of HOP_BY_HOP) headers.delete(name);

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
