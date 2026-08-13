// Registration-country capture for new sign-ups.
//
// The backend is served through Cloudflare, so every request carries a reliable
// `cf-ipcountry` header (the visitor's country, for free, no external call). We use
// that first and only fall back to an IP geolocation lookup when it is missing or
// non-specific. The country is taken from the connection at sign-up, never from the
// email/name/phone, and the IP itself is never stored.

// Cloudflare returns these for anonymizers/unknowns/regions rather than a country.
const CF_INVALID = new Set(['', 'XX', 'T1', 'ZZ', 'AP', 'EU']);

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

// Best-effort IP geolocation via free, no-key services. Returns null on any
// failure, a private/loopback IP, or a bad response. Never throws.
export async function lookupCountryByIp(
  ip?: string | null,
): Promise<string | null> {
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
    return null;
  }
  const attempt = async (
    url: string,
    pick: (j: any) => any,
  ): Promise<string | null> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) return null;
      const j: any = await res.json();
      const code = pick(j);
      return typeof code === 'string' && /^[A-Za-z]{2}$/.test(code)
        ? code.toUpperCase()
        : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  };
  const enc = encodeURIComponent(raw);
  return (
    (await attempt(`https://ipwho.is/${enc}?fields=success,country_code`, (j) =>
      j && j.success ? j.country_code : null,
    )) ||
    (await attempt(`https://ipapi.co/${enc}/json/`, (j) =>
      j && !j.error ? j.country : null,
    ))
  );
}

// Resolve and permanently store the registration country for a freshly-created
// user: the Cloudflare header when present, otherwise an IP lookup. Fully guarded
// and idempotent (never overwrites an existing value) so it can be fire-and-forget
// and can never affect the sign-up that spawned it.
export async function captureSignupCountry(
  db: { query: (sql: string, params?: any[]) => Promise<any> },
  userId: string,
  geo: { country?: string | null; ip?: string | null },
): Promise<void> {
  try {
    let code =
      geo.country && /^[A-Z]{2}$/.test(String(geo.country))
        ? String(geo.country).toUpperCase()
        : null;
    if (!code) code = await lookupCountryByIp(geo.ip);
    if (!code) return;
    // The signup_country column is ensured by the trial signup path and the admin
    // read path; a plain UPDATE here avoids a per-signup ALTER table lock.
    await db.query(
      `UPDATE users SET signup_country = $1 WHERE id = $2 AND signup_country IS NULL`,
      [code, userId],
    );
  } catch {
    /* best-effort: registration-country capture must never break sign-up */
  }
}
