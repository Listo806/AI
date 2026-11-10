/**
 * Netlify Function custom route for production Charts display calculations.
 * Requires the existing signed cortexa_charts cookie to pass Render validation.
 * No Cloudflare Worker, secret, or AI_USAGE_GATE binding is required for this route.
 * Does not change CRM login or NestJS main.ts.
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
globalThis.Indicators = require('./_charts-engine/indicators.cjs');
globalThis.Heisenberg = require('./_charts-engine/heisenberg-engine.cjs');
const { engineResponse } = require('./_charts-engine/engine-response.cjs');

export const config = { path: '/charts/app/api/engine' };

const headers = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const json = (error, status) => Response.json({error}, {status, headers});
const backend = 'https://backend.cortexaaicrm.com/api/charts/validate';

export default async function handler(request) {
  if (request.method !== 'POST') return json('METHOD', 405);
  const url = new URL(request.url);
  if (!['https://www.cortexaaicrm.com','https://cortexaaicrm.com'].includes(url.origin)) return json('ORIGIN',403);
  if (request.headers.get('origin') !== url.origin) return json('ORIGIN',403);
  const referer = request.headers.get('referer') || '';
  if (!referer.startsWith(url.origin + '/charts/app/')) return json('REFERER',403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return json('CONTENT_TYPE',415);
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > 900000) return json('TOO_LARGE',413);
  const cookie = request.headers.get('cookie') || '';
  if (!/(?:^|;\s*)cortexa_charts=/.test(cookie)) return json('SESSION_REQUIRED',401);
  let session;
  try {
    const response = await fetch(backend, {method:'GET', headers:{cookie, accept:'application/json'}, signal:AbortSignal.timeout(8000), redirect:'error'});
    if (!response.ok) return json(response.status === 403 ? 'FORBIDDEN' : 'SESSION_REQUIRED', response.status === 403 ? 403 : 401);
    session = await response.json();
    if (session?.ok !== true || typeof session.userId !== 'string' || !session.userId) return json('SESSION_REQUIRED',401);
  } catch { return json('AUTH_UNAVAILABLE',503); }
  // Trusted identity is created only after validation by the existing CRM backend.
  // The internal proxy secret never needs to be configured in Netlify.
  const internalSecret = 'charts-engine-internal-validated-request-only';
  const trustedHeaders = new Headers(request.headers);
  trustedHeaders.set('x-cortexa-proxy-secret', internalSecret);
  trustedHeaders.set('x-cortexa-authenticated-user', session.userId);
  trustedHeaders.set('origin', url.origin);
  const trustedRequest = new Request(request.url, {method:'POST',headers:trustedHeaders,body:request.body,duplex:'half'});
  try { return await engineResponse(trustedRequest, {CHARTS_TRUSTED_PROXY_SECRET:internalSecret}); }
  catch { return json('ENGINE_UNAVAILABLE',503); }
}
