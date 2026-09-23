// Registration-country capture for new sign-ups.
//
// The hosting platform's edge puts a `cf-ipcountry` header on every request, so
// the visitor's country is free and needs no external call. It does NOT carry the
// state or region, so that half comes from an IP geolocation lookup. The location
// is taken from the connection at sign-up, never from the email/name/phone, and
// the IP itself is never stored.

import { canonicalUsState, normalizeRegion } from './us-states.util';

// Cloudflare returns these for anonymizers/unknowns/regions rather than a country.
const CF_INVALID = new Set(['', 'XX', 'T1', 'ZZ', 'AP', 'EU']);

// The keyless geolocation services limit by caller address, and this server
// shares one with every other application on the platform, so a refusal from one
// of them means nothing about the next. Each is rested on its own.
const restingUntil: Record<string, number> = {};
const REST_AFTER_REFUSAL_MS = 30 * 60 * 1000;

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
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = String(headers?.[k] ?? '').trim();
      if (v) return v;
    }
    return '';
  };
  // Cloudflare's visitor location headers: the name when it is sent, otherwise
  // the code, which the state list turns into a name.
  const raw =
    pick('cf-region', 'Cf-Region', 'CF-Region', 'cf-region-name') ||
    pick('cf-region-code', 'Cf-Region-Code', 'CF-Region-Code');
  if (!raw || raw.length > 60) return null;
  return /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]*$/.test(raw) ? raw : null;
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

type GeoAnswer = { country: string | null; region: string | null };

/**
 * The geolocation services we ask, best first. Each returns the country and the
 * state or region for an address.
 *
 * GEO_API_TOKEN (an ipinfo.io token, free tier) is optional but preferred: a
 * token is counted against our own allowance instead of the shared address of
 * the host, so it cannot be refused because a neighbour was busy. Without it the
 * keyless services below still answer, they are simply not guaranteed to.
 */
function geoProviders(
  ip: string,
): Array<{ name: string; url: string; pick: (j: any) => { country?: any; region?: any } | null }> {
  const enc = encodeURIComponent(ip);
  const token = String(
    process.env.GEO_API_TOKEN || process.env.IPINFO_TOKEN || '',
  ).trim();
  const list: Array<{
    name: string;
    url: string;
    pick: (j: any) => { country?: any; region?: any } | null;
  }> = [];
  if (token) {
    list.push({
      name: 'ipinfo.io',
      url: `https://ipinfo.io/${enc}/json?token=${encodeURIComponent(token)}`,
      pick: (j) => (j && !j.error ? { country: j.country, region: j.region } : null),
    });
  }
  list.push(
    {
      name: 'get.geojs.io',
      url: `https://get.geojs.io/v1/ip/geo/${enc}.json`,
      pick: (j) => (j && j.country_code ? { country: j.country_code, region: j.region } : null),
    },
    {
      name: 'reallyfreegeoip.org',
      url: `https://reallyfreegeoip.org/json/${enc}`,
      pick: (j) => (j && j.country_code ? { country: j.country_code, region: j.region_name } : null),
    },
    {
      name: 'ipwho.is',
      url: `https://ipwho.is/${enc}?fields=success,country_code,region`,
      pick: (j) => (j && j.success ? { country: j.country_code, region: j.region } : null),
    },
    {
      name: 'ipapi.co',
      url: `https://ipapi.co/${enc}/json/`,
      pick: (j) => (j && !j.error ? { country: j.country, region: j.region } : null),
    },
  );
  if (!token) {
    // Without a token this one allows a small daily volume per address, so it
    // goes last rather than not at all.
    list.push({
      name: 'ipinfo.io',
      url: `https://ipinfo.io/${enc}/json`,
      pick: (j) => (j && !j.error ? { country: j.country, region: j.region } : null),
    });
  }
  return list;
}

/**
 * Best-effort IP geolocation: the country and, when the provider gives one, the
 * state or region. Each service is asked in turn until both halves are known.
 * Returns nulls on any failure, a private or loopback address, or a bad
 * response. Never throws.
 */
export async function lookupGeoByIp(ip?: string | null): Promise<GeoAnswer> {
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
    name: string,
    url: string,
    pick: (j: any) => { country?: any; region?: any } | null,
  ): Promise<GeoAnswer | null> => {
    // A service that has just refused us is left alone for a while, so a busy
    // one never costs every sign-up a wasted second.
    if (Date.now() < (restingUntil[name] || 0)) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        if (res.status === 429 || res.status === 403) {
          restingUntil[name] = Date.now() + REST_AFTER_REFUSAL_MS;
        }
        console.warn(`[geo] ${name} answered HTTP ${res.status}`);
        return null;
      }
      const j: any = await res.json();
      const picked = pick(j);
      const code = picked?.country;
      if (typeof code !== 'string' || !/^[A-Za-z]{2}$/.test(code)) {
        console.warn(`[geo] ${name} gave no usable country`);
        return null;
      }
      const region = String(picked?.region ?? '').trim();
      return {
        country: code.toUpperCase(),
        region: region && region.length <= 80 ? region : null,
      };
    } catch (err: any) {
      console.warn(`[geo] ${name} lookup failed: ${err?.name || 'error'}`);
      return null;
    } finally {
      clearTimeout(timer);
    }
  };

  // Ask each service in turn, keeping whichever half it supplies, and stop as
  // soon as the country and the region are both known.
  const found: GeoAnswer = { country: null, region: null };
  for (const provider of geoProviders(raw)) {
    const answer = await attempt(provider.name, provider.url, provider.pick);
    if (answer) {
      found.country = found.country || answer.country;
      found.region = found.region || answer.region;
      if (found.country && found.region) break;
    }
  }
  return found;
}

// Resolve and permanently store the registration country for a freshly-created
// user: the edge header when present, otherwise an IP lookup. The state or
// region is stored alongside it, and comes from the lookup, since the edge sends
// only the country. United States sign-ups need it because the admin reports
// those by state. Fully guarded and idempotent (never overwrites an existing
// value) so it can be fire-and-forget and can never affect the sign-up that
// spawned it.
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
    // One line per sign-up, so a location that never arrives can be traced.
    console.log(
      `[geo] signup location: country ${code || 'unknown'}, region ${region || 'unknown'}`,
    );

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
