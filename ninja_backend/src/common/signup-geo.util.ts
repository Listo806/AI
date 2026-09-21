// Registration-country capture for new sign-ups.
//
// The backend is served through Cloudflare, so every request carries a reliable
// `cf-ipcountry` header (the visitor's country, for free, no external call). We use
// that first and only fall back to an IP geolocation lookup when it is missing or
// non-specific. The country is taken from the connection at sign-up, never from the
// email/name/phone, and the IP itself is never stored.

import { canonicalUsState, normalizeRegion } from './us-states.util';

// Cloudflare returns these for anonymizers/unknowns/regions rather than a country.
const CF_INVALID = new Set(['', 'XX', 'T1', 'ZZ', 'AP', 'EU']);

// The state column ships in migration 166, which is not auto-run here, so make
// sure it exists before the first write. Once per process, like the others.
let geoColumnsReady = false;
async function ensureGeoColumns(db: {
  query: (sql: string, params?: any[]) => Promise<any>;
}): Promise<void> {
  if (geoColumnsReady) return;
  await db.query(
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_region VARCHAR(80)`,
  );
  geoColumnsReady = true;
}

// The visitor's country from the CDN request headers (Cloudflare cf-ipcountry),
// validated to a real ISO-3166 alpha-2 code. Returns null when absent/non-specific.
export function countryFromHeaders(headers: any): string | null {
  const raw =
    headers?.['cf-ipcountry'] ??
    headers?.['Cf-Ipcountry'] ??
    headers?.['CF-IPCountry'];
  const cf = String(raw || '')
    .trim()
    .toUpperCase();
  return /^[A-Z]{2}$/.test(cf) && !CF_INVALID.has(cf) ? cf : null;
}

// The visitor's state or region from the CDN request headers, when Cloudflare is
// configured to send it. Free and instant when present; otherwise the IP lookup
// below fills it in. Validated like the country header is, so nothing arbitrary
// from a request can reach the reports.
export function regionFromHeaders(headers: any): string | null {
  const raw =
    headers?.['cf-region'] ??
    headers?.['Cf-Region'] ??
    headers?.['CF-Region'] ??
    headers?.['cf-region-name'];
  const name = String(raw || '').trim();
  if (!name || name.length > 60) return null;
  return /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]*$/.test(name) ? name : null;
}

// Best client IP for the fallback geo lookup: the real visitor address that
// Cloudflare/Render forward, not the proxy hop.
export function clientIpFromHeaders(headers: any, req?: any): string | null {
  const xff = headers?.['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) return xff.split(',')[0].trim();
  return (
    headers?.['cf-connecting-ip'] ||
    headers?.['x-real-ip'] ||
    req?.ip ||
    req?.socket?.remoteAddress ||
    null
  );
}

/**
 * Best-effort IP geolocation via free, no-key services: the country and, when
 * the provider gives one, the state or region. Returns nulls on any failure, a
 * private or loopback address, or a bad response. Never throws.
 */
export async function lookupGeoByIp(
  ip?: string | null,
): Promise<{ country: string | null; region: string | null }> {
  const raw = String(ip || '').trim();
  if (
    !raw ||
    raw === '::1' ||
    raw.startsWith('127.') ||
    raw.startsWith('10.') ||
    raw.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(raw) ||
    raw.startsWith('::ffff:127.') ||
    raw.startsWith('::ffff:10.') ||
    raw.startsWith('169.254.')
  ) {
    return { country: null, region: null };
  }
  const attempt = async (
    url: string,
    pick: (j: any) => { country?: any; region?: any } | null,
  ): Promise<{ country: string | null; region: string | null } | null> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) return null;
      const j: any = await res.json();
      const picked = pick(j);
      const code = picked?.country;
      if (typeof code !== 'string' || !/^[A-Za-z]{2}$/.test(code)) return null;
      const region = String(picked?.region ?? '').trim();
      return {
        country: code.toUpperCase(),
        region: region && region.length <= 80 ? region : null,
      };
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  };
  const enc = encodeURIComponent(raw);
  const first = await attempt(
    `https://ipwho.is/${enc}?fields=success,country_code,region`,
    (j) => (j && j.success ? { country: j.country_code, region: j.region } : null),
  );
  // A provider can answer with a country but no region, so try the second one
  // for the missing half rather than stopping at the first usable answer.
  if (first?.country && first.region) return first;
  const second = await attempt(`https://ipapi.co/${enc}/json/`, (j) =>
    j && !j.error ? { country: j.country, region: j.region } : null,
  );
  return {
    country: first?.country || second?.country || null,
    region: first?.region || second?.region || null,
  };
}

// Resolve and permanently store the registration country for a freshly-created
// user: the Cloudflare header when present, otherwise an IP lookup. The state or
// region is stored alongside it, for United States sign-ups, because the admin
// reports those by state. Fully guarded and idempotent (never overwrites an
// existing value) so it can be fire-and-forget and can never affect the sign-up
// that spawned it.
export async function captureSignupCountry(
  db: { query: (sql: string, params?: any[]) => Promise<any> },
  userId: string,
  geo: { country?: string | null; region?: string | null; ip?: string | null },
): Promise<void> {
  try {
    let code =
      geo.country && /^[A-Z]{2}$/.test(String(geo.country))
        ? String(geo.country).toUpperCase()
        : null;
    let region = normalizeRegion(geo.region);

    // One lookup covers both, and runs whenever either half is still missing.
    // It is fire-and-forget, so it never delays the sign-up that spawned it.
    if (!code || !region) {
      const found = await lookupGeoByIp(geo.ip);
      code = code || found.country;
      region = region || normalizeRegion(found.region);
    }
    if (!code && !region) return;

    // The columns exist on every database the admin has read from, but the
    // /auth/signup path can run before that, so make sure once per process.
    await ensureGeoColumns(db);

    if (code) {
      await db.query(
        `UPDATE users SET signup_country = $1 WHERE id = $2 AND signup_country IS NULL`,
        [code, userId],
      );
    }
    if (region) {
      // A United States state is stored in one spelling so the admin can
      // compare states; anywhere else keeps the name the provider gave.
      const value = code === 'US' ? canonicalUsState(region) || region : region;
      await db.query(
        `UPDATE users SET signup_region = $1
          WHERE id = $2 AND COALESCE(signup_region, '') = ''`,
        [value.slice(0, 80), userId],
      );
    }
  } catch {
    /* best-effort: registration-country capture must never break sign-up */
  }
}
