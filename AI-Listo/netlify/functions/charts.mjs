// Netlify Functions v2: default-export a Web Request -> Response handler.
// The generated Worker is a private dependency, not a second Netlify Function.
import worker from '../../charts-source/worker/index.js';

const VERIFY_URL = process.env.CHARTS_AUTH_CHECK_URL || 'https://backend.cortexaaicrm.com/api/charts/validate';
const PREFIX = '/charts/app';
const ALLOWED_ORIGINS = new Set(['https://cortexaaicrm.com', 'https://www.cortexaaicrm.com']);
const PRIVATE_HEADERS = {
  'cache-control': 'private, no-store',
  'x-content-type-options': 'nosniff',
  'x-robots-tag': 'noindex, nofollow',
};
const reply = (message, status) => new Response(message, { status, headers: PRIVATE_HEADERS });

export default async function charts(request) {
  const method = request.method.toUpperCase();
  if (!['GET', 'HEAD', 'POST'].includes(method)) return reply('Method not allowed', 405);

  const url = new URL(request.url);
  // Netlify forwards splat routes as /.netlify/functions/charts/<asset>.
  // Resolve the asset from the actual request path instead of relying on a
  // rewrite query parameter that can be lost by the platform.
  const functionPrefix = '/.netlify/functions/charts';
  let internalPath;
  if (url.pathname === functionPrefix || url.pathname === `${functionPrefix}/`) {
    internalPath = '/';
  } else if (url.pathname.startsWith(`${functionPrefix}/`)) {
    internalPath = url.pathname.slice(functionPrefix.length);
  } else {
    // Compatibility with Netlify versions that preserve the original URL.
    if (url.pathname === PREFIX || url.pathname === `${PREFIX}/`) internalPath = '/';
    else if (url.pathname.startsWith(`${PREFIX}/`)) internalPath = url.pathname.slice(PREFIX.length);
    else return reply('Not found', 404);
  }
  // Do not route an asset request to the dashboard HTML by accident.
  if (internalPath.includes('\\') || internalPath.split('/').includes('..')) return reply('Not found', 404);
  const target = new URL(`https://charts.internal${internalPath}${url.search}`);
  if (target.pathname !== internalPath) return reply('Not found', 404);

  // PWA metadata and app icons contain no account or market data. Browsers may
  // fetch the manifest without the Charts session cookie; serve only these
  // exact resources anonymously, while keeping HTML, scripts and APIs gated.
  const publicMetadata = new Set([
    '/manifest.webmanifest', '/favicon.png', '/apple-touch-icon.png',
    '/icon-192.png', '/icon-512.png',
  ]);
  if ((method === 'GET' || method === 'HEAD') && publicMetadata.has(internalPath)) {
    try {
      const result = await worker.fetch(new Request(target, { method }), {}, {});
      const headers = new Headers({
        'cache-control': 'public, max-age=300',
        'x-content-type-options': 'nosniff',
        'x-robots-tag': 'noindex, nofollow',
      });
      headers.set('content-type', result.headers.get('content-type') || 'application/octet-stream');
      return new Response(method === 'HEAD' ? null : result.body, { status: result.status, headers });
    } catch { return reply('Charts metadata unavailable', 502); }
  }

  // Authenticate all dashboard HTML, executable scripts, styles, and API requests.
  // Never trust browser-provided identity headers.
  let identity;
  try {
    const auth = await fetch(VERIFY_URL, {
      method: 'GET',
      headers: { cookie: request.headers.get('cookie') || '' },
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
    });
    if (auth.ok) {
      const data = await auth.json();
      if (data?.ok === true && (typeof data.userId === 'string' || typeof data.userId === 'number')) {
        identity = String(data.userId);
      }
    }
  } catch { /* Fail closed when the CRM backend is unavailable. */ }
  if (!identity) return reply('Charts sign-in required', 401);

  if (method === 'POST') {
    if (!ALLOWED_ORIGINS.has(request.headers.get('origin') || '')) return reply('Invalid origin', 403);
    if (internalPath !== '/api/analysis') return reply('Method not allowed', 405);
  }

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  headers.set('x-cortexa-authenticated-user', identity);
  // Assert the validated session to the private Worker, never to the browser.
  const workerEnv = {};
  if (internalPath === '/api/analysis') {
    const secret = process.env.CHARTS_TRUSTED_PROXY_SECRET;
    if (typeof secret !== 'string' || secret.length < 32) {
      return reply('Charts AI proxy is not configured', 503);
    }
    headers.set('x-cortexa-proxy-secret', secret);
    headers.set('origin', target.origin);
    workerEnv.CHARTS_TRUSTED_PROXY_SECRET = secret;
  }
  // Analysis uses the existing OpenAI key on Render; no AI key is present on Netlify.
  // The browser has already passed the CRM session check above.
  if (internalPath === '/api/analysis' && method === 'POST') {
    const buffer = await request.arrayBuffer();
    if (buffer.byteLength > 180000) return reply('Request too large', 413);
    try {
      const upstream = await fetch('https://backend.cortexaaicrm.com/api/charts/analysis/internal', {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(29000),
        headers: {
          'content-type': 'application/json',
          'x-cortexa-proxy-secret': workerEnv.CHARTS_TRUSTED_PROXY_SECRET,
          'x-cortexa-authenticated-user': identity,
        },
        body: buffer,
      });
      const data = await upstream.text();
      if (data.length > 60000) return reply('Analysis response too large', 502);
      const outHeaders = new Headers(PRIVATE_HEADERS);
      outHeaders.set('content-type', 'application/json; charset=utf-8');
      return new Response(data, { status: upstream.status, headers: outHeaders });
    } catch {
      return Response.json({error:{code:'AI_BACKEND_UNAVAILABLE',message:'Cortexa AI backend is temporarily unavailable.'}},
        {status:503,headers:PRIVATE_HEADERS});
    }
  }
  let body;
  if (method === 'POST') {
    const buffer = await request.arrayBuffer();
    if (buffer.byteLength > 180000) return reply('Request too large', 413);
    body = buffer;
  }
  try {
    const result = await worker.fetch(new Request(target, { method, headers, body }), workerEnv, {});
    const resultHeaders = new Headers(PRIVATE_HEADERS);
    resultHeaders.set('content-type', result.headers.get('content-type') || 'application/octet-stream');
    return new Response(method === 'HEAD' ? null : result.body, { status: result.status, headers: resultHeaders });
  } catch { return reply('Charts service unavailable', 502); }
}
