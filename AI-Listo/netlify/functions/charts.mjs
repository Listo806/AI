import worker from './charts-worker.mjs';

// Only this Netlify Function exposes the private Charts worker. Never publish
// charts-source or the generated worker as static website assets.
const VERIFY_URL = process.env.CHARTS_AUTH_CHECK_URL || 'https://backend.cortexaaicrm.com/api/charts/validate';
const PREFIX = '/charts/app';
const allowMethods = new Set(['GET','HEAD','POST']);
const response = (status, body) => ({statusCode:status, headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff','x-robots-tag':'noindex, nofollow'},body});
export async function handler(event) {
  const method = (event.httpMethod || 'GET').toUpperCase();
  if (!allowMethods.has(method)) return response(405,'Method not allowed');
  const raw = event.rawUrl || `https://www.cortexaaicrm.com${event.path || '/'}`;
  const parsed = new URL(raw);
  const suffix = event.queryStringParameters?.chartPath;
  const path = suffix === undefined ? PREFIX : PREFIX + '/' + suffix.replace(/^\/+/, '');
  parsed.searchParams.delete('chartPath');
  if (path !== PREFIX && !path.startsWith(PREFIX + '/')) return response(404,'Not found');
  const cookie = event.headers?.cookie || event.headers?.Cookie || '';
  let identity;
  try {
    const auth = await fetch(VERIFY_URL,{headers:{cookie},redirect:'manual',signal:AbortSignal.timeout(5000)});
    if (auth.status === 200) {
      const data = await auth.json();
      if (data?.ok === true && typeof data.userId === 'string' && data.userId) identity = data.userId;
    }
  } catch {}
  if (!identity) return response(401,'Charts sign-in required');
  // Cross-origin calls are rejected. Internal identity headers are never trusted.
  if (method === 'POST') {
    const origin = event.headers?.origin || event.headers?.Origin || '';
    if (!origin || !['https://cortexaaicrm.com','https://www.cortexaaicrm.com'].includes(origin)) return response(403,'Invalid origin');
    if (!path.endsWith('/api/analysis')) return response(405,'Method not allowed');
  }
  const internalPath = path.slice(PREFIX.length) || '/';
  const target = new URL('https://charts.internal' + internalPath + parsed.search);
  const headers = new Headers();
  if (event.headers?.['content-type']) headers.set('content-type',event.headers['content-type']);
  headers.set('x-cortexa-authenticated-user',identity);
  let body;
  if (method === 'POST') {
    body = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64') : Buffer.from(event.body || '');
    if (body.length > 180000) return response(413,'Request too large');
  }
  try {
    const result = await worker.fetch(new Request(target,{method,headers,body}),{},{});
    const buffer = Buffer.from(await result.arrayBuffer());
    const contentType = result.headers.get('content-type') || 'application/octet-stream';
    return {statusCode:result.status,isBase64Encoded:true,headers:{'content-type':contentType,'cache-control':'private, no-store','x-content-type-options':'nosniff','x-robots-tag':'noindex, nofollow'},body:buffer.toString('base64')};
  } catch { return response(502,'Charts service unavailable'); }
}
