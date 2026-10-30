import { marketplaceRequest } from './marketplaceApi';

// First eligible ad click is retained for up to 90 days. Never store PII here.
const KEY = 'lq_ads_first_click_v1';
const MAX_AGE = 90 * 24 * 60 * 60 * 1000;
const CLICK_KEYS = ['gclid', 'gbraid', 'wbraid'];
const valid = value => typeof value === 'string' && /^[a-zA-Z0-9_.-]{5,512}$/.test(value);

export function captureMarketplaceAdClick() {
  if (typeof window === 'undefined') return;
  try {
    const current = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (current && Date.now() - current.capturedAt < MAX_AGE && CLICK_KEYS.some(k => valid(current[k]))) return;
    const query = new URLSearchParams(window.location.search);
    const click = Object.fromEntries(CLICK_KEYS.filter(k => valid(query.get(k))).map(k => [k, query.get(k)]));
    if (Object.keys(click).length) localStorage.setItem(KEY, JSON.stringify({ ...click, capturedAt: Date.now() }));
    else if (current) localStorage.removeItem(KEY);
  } catch { /* Browser may restrict storage. */ }
}

export async function attachMarketplaceAdClick(enrollmentId) {
  if (!enrollmentId || typeof window === 'undefined') return false;
  let click;
  try { click = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return false; }
  if (!click || Date.now() - click.capturedAt > MAX_AGE) return false;
  const body = Object.fromEntries(CLICK_KEYS.filter(k => valid(click[k])).map(k => [k, click[k]]));
  if (!Object.keys(body).length) return false;
  // Backend validates enrollment ownership and accepts the first attribution only.
  const result = await marketplaceRequest('/marketplace/plans/attribution', {
    method: 'POST', body: JSON.stringify({ enrollmentId, ...body }),
  });
  return result?.saved === true;
}
