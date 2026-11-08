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
  const suffix = url.searchParams.get('chartPath');
  // Netlify rewrite: /charts/app/* -> /.netlify/functions/charts?chartPath=:splat
  // Preserve all other query params (timeframe, symbols, etc.).
  const path = suffix === null ? PREFIX : `${PREFIX}/${suffix.replace(/^\/+/, '')}`;
  url.searchParams.delete('chartPath');
  if (path !== PREFIX && !path.startsWith(`${PREFIX}/`)) return reply('Not found', 404);
  // Do not allow dot-segment escapes into another route.
  const internalPath = path.slice(PREFIX.length) || '/';
  const target = new URL(`https://charts.internal${internalPath}${url.search}`);
  if (target.pathname !== internalPath) return reply('Not found', 404);

  // Authentication must be checked for EVERY asset, page and API request.
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
  let body;
  if (method === 'POST') {
    const buffer = await request.arrayBuffer();
    if (buffer.byteLength > 180000) return reply('Request too large', 413);
    body = buffer;
  }
  try {
    const result = await worker.fetch(new Request(target, { method, headers, body }), {}, {});
    const resultHeaders = new Headers(PRIVATE_HEADERS);
    resultHeaders.set('content-type', result.headers.get('content-type') || 'application/octet-stream');
    return new Response(method === 'HEAD' ? null : result.body, { status: result.status, headers: resultHeaders });
  } catch { return reply('Charts service unavailable', 502); }
}
