/**
 * Server-side events to Google Analytics 4 through the Measurement Protocol.
 *
 * Same posture as the renewal reporting (nuvei/renewal-reporting.service.ts):
 *  - off unless BOTH GA4_MEASUREMENT_ID and GA4_API_SECRET are set, so nothing
 *    is sent from an environment that was not configured on purpose;
 *  - GA4 only. Nothing here is ever sent to Google Ads;
 *  - never throws and never blocks the caller for more than a few seconds:
 *    analytics must not hold up a payment or an email.
 *
 * Callers own their idempotency (a claimed database stamp) so each real event
 * is sent once.
 */

type ConfigLike = { get: (key: string) => any };

export interface Ga4Settings {
  measurementId: string;
  apiSecret: string;
}

export function ga4Settings(config: ConfigLike | null | undefined): Ga4Settings | null {
  const read = (k: string) =>
    String((config && config.get(k)) ?? process.env[k] ?? '').trim();
  const measurementId = read('GA4_MEASUREMENT_ID');
  const apiSecret = read('GA4_API_SECRET');
  return measurementId && apiSecret ? { measurementId, apiSecret } : null;
}

/**
 * A GA client id as the browser sends it ("123456789.1700000000"), or null.
 * Anything else is dropped so arbitrary strings never reach GA4.
 */
export function cleanGaClientId(value: any): string | null {
  const v = String(value ?? '').trim();
  return /^\d{1,20}\.\d{1,20}$/.test(v) ? v : null;
}

/** Drop undefined / null / empty values: GA4 rejects nothing, but keeps reports clean. */
function compact(params: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = typeof v === 'string' ? v.slice(0, 100) : v;
  }
  return out;
}

/**
 * Send one event. Returns true when GA4 accepted the request (2xx), false when
 * analytics is off or the request failed.
 */
export async function sendGa4Event(
  config: ConfigLike | null | undefined,
  input: {
    clientId: string;
    userId?: string | null;
    name: string;
    params: Record<string, any>;
  },
  log?: (msg: string) => void,
): Promise<boolean> {
  try {
    const settings = ga4Settings(config);
    if (!settings) return false;
    const body = {
      client_id: input.clientId,
      ...(input.userId ? { user_id: String(input.userId) } : {}),
      non_personalized_ads: true,
      events: [
        {
          name: input.name,
          params: compact({ engagement_time_msec: 1, ...input.params }),
        },
      ],
    };
    const url =
      'https://www.google-analytics.com/mp/collect' +
      `?measurement_id=${encodeURIComponent(settings.measurementId)}` +
      `&api_secret=${encodeURIComponent(settings.apiSecret)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      log?.(`GA4 ${input.name} sent: HTTP ${res.status}`);
      return res.ok;
    } finally {
      clearTimeout(timer);
    }
  } catch (err: any) {
    log?.(`GA4 ${input.name} skipped: ${err?.message || 'error'}`);
    return false;
  }
}
