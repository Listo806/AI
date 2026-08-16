/**
 * Lead Generator — live provider connectors.
 *
 * Real HTTP integrations for the implemented providers (DataForSEO discovery,
 * Hunter email finding, ZeroBounce verification). Every call is gated on the
 * presence of server-side credentials, so with no keys these are dormant and
 * the engine returns honest empty results — it never fabricates data.
 *
 * The pure helpers (normalizeBusiness / scoreLead / dedupeKey / domainFromUrl)
 * carry no I/O so they can be unit-tested without any provider account.
 */

const TIMEOUT_MS = 20000;

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  CA: 'Canada',
  AU: 'Australia',
  GB: 'United Kingdom',
  ES: 'Spain',
  MX: 'Mexico',
  CO: 'Colombia',
  BR: 'Brazil',
  CL: 'Chile',
  AR: 'Argentina',
  EC: 'Ecuador',
};

const COUNTRY_LANG: Record<string, string> = {
  US: 'en',
  CA: 'en',
  AU: 'en',
  GB: 'en',
  ES: 'es',
  MX: 'es',
  CO: 'es',
  CL: 'es',
  AR: 'es',
  EC: 'es',
  BR: 'pt',
};

/** Hard cap on how many businesses a single search will process. */
export const MAX_LEADS = 100;

export interface NormalizedLead {
  businessName: string | null;
  contactName: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  domain: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  social: Record<string, any>;
  source: string;
  sourceUrl: string | null;
  sourceProvider: string;
  enrichment: Record<string, any>;
  emailVerified?: boolean;
  aiScore?: number;
  aiBand?: string;
  dedupeKey?: string;
  status?: string;
}

// ---------------------------------------------------------------------------
// Pure helpers (no I/O — safe to unit-test).
// ---------------------------------------------------------------------------
function clean(v: any): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t || null;
}

export function domainFromUrl(url: any): string | null {
  const u = clean(url);
  if (!u) return null;
  try {
    const withProto = /^https?:\/\//i.test(u) ? u : `https://${u}`;
    const host = new URL(withProto).hostname.toLowerCase();
    return host.replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}

/**
 * Normalize a DataForSEO Google-Maps SERP item into our lead shape. Returns
 * null when the item has no usable business name.
 */
export function normalizeBusiness(it: any, country: string | null): NormalizedLead | null {
  if (!it || typeof it !== 'object') return null;
  const name = clean(it.title);
  if (!name) return null;
  const url = clean(it.url);
  const domain = clean(it.domain) || domainFromUrl(url);
  const website = url || (domain ? `https://${domain}` : null);
  const addressInfo = it.address_info && typeof it.address_info === 'object' ? it.address_info : {};
  return {
    businessName: name,
    contactName: null,
    title: null,
    email: null,
    phone: clean(it.phone),
    website,
    domain,
    address: clean(it.address) || clean(addressInfo.address),
    city: clean(addressInfo.city) || clean(it.city),
    region: clean(addressInfo.region) || clean(it.region),
    country,
    social: {},
    source: 'business_search',
    sourceUrl: url || (it.cid ? `https://www.google.com/maps?cid=${it.cid}` : null),
    sourceProvider: 'dataforseo',
    enrichment: {},
  };
}

/**
 * Documented lead score (0-100) computed only from REAL signals present on the
 * record — never a random or invented number:
 *   verified email +40 (or unverified email +20), phone +20, website +15,
 *   address/city +10, business name +5. Bands: Hot >=70, Warm 40-69, Cold <40.
 */
export function scoreLead(lead: Partial<NormalizedLead>): { score: number; band: string } {
  let s = 0;
  if (lead.emailVerified) s += 40;
  else if (lead.email) s += 20;
  if (lead.phone) s += 20;
  if (lead.website) s += 15;
  if (lead.city || lead.address) s += 10;
  if (lead.businessName) s += 5;
  s = Math.max(0, Math.min(100, s));
  const band = s >= 70 ? 'hot' : s >= 40 ? 'warm' : 'cold';
  return { score: s, band };
}

/** Stable dedupe key: prefer email, then domain, then normalized name+city. */
export function dedupeKey(lead: Partial<NormalizedLead>): string {
  if (lead.email) return `e:${lead.email.toLowerCase()}`;
  if (lead.domain) return `d:${lead.domain.toLowerCase()}`;
  const n = (lead.businessName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const c = (lead.city || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return `n:${n}|${c}`;
}

// ---------------------------------------------------------------------------
// HTTP plumbing.
// ---------------------------------------------------------------------------
async function httpJson(
  url: string,
  opts: any,
  timeout = TIMEOUT_MS,
): Promise<{ ok: boolean; json?: any; status?: number }> {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    if (!res.ok) return { ok: false, status: res.status };
    const json = await res.json();
    return { ok: true, json };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(to);
  }
}

function dataforseoAuth(): string | null {
  const login = process.env.LEADGEN_DATAFORSEO_LOGIN;
  const password = process.env.LEADGEN_DATAFORSEO_PASSWORD;
  if (!login || !password) return null;
  return 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64');
}

// ---------------------------------------------------------------------------
// Live connectors (dormant without credentials).
// ---------------------------------------------------------------------------

/**
 * Discover businesses via DataForSEO's Google Maps SERP (live/advanced). Loops
 * the requested launch countries until the limit is reached. Returns [] on any
 * error or missing credentials — never fabricated rows.
 */
export async function discoverBusinesses(criteria: any): Promise<NormalizedLead[]> {
  const auth = dataforseoAuth();
  if (!auth) return [];
  const keyword = String(criteria?.keywords || criteria?.industry || '').trim().slice(0, 200);
  if (!keyword) return [];

  const countries: string[] =
    Array.isArray(criteria?.countries) && criteria.countries.length ? criteria.countries : ['US'];
  const limit = Math.min(Number(criteria?.limit) || 50, MAX_LEADS);
  const location = String(criteria?.location || '').trim();

  const out: NormalizedLead[] = [];
  for (const cc of countries.slice(0, 4)) {
    if (out.length >= limit) break;
    const countryName = COUNTRY_NAMES[cc] || cc;
    const locationName = location ? `${location}, ${countryName}` : countryName;
    const body = [
      {
        keyword,
        location_name: locationName,
        language_code: COUNTRY_LANG[cc] || 'en',
        depth: Math.min(limit, 100),
      },
    ];
    const r = await httpJson(
      'https://api.dataforseo.com/v3/serp/google/maps/live/advanced',
      {
        method: 'POST',
        headers: { Authorization: auth, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      25000,
    );
    if (!r.ok || !r.json) continue;
    const items = r.json?.tasks?.[0]?.result?.[0]?.items;
    if (!Array.isArray(items)) continue;
    for (const it of items) {
      if (out.length >= limit) break;
      const b = normalizeBusiness(it, cc);
      if (b) out.push(b);
    }
  }
  return out;
}

/** Find one work email for a domain via Hunter.io domain-search. */
export async function findEmailForDomain(
  domain: string,
): Promise<{ email: string; confidence: number | null; sourceUrl: string | null } | null> {
  const key = process.env.LEADGEN_HUNTER_API_KEY;
  if (!key || !domain) return null;
  const r = await httpJson(
    `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&limit=1&api_key=${encodeURIComponent(key)}`,
    { method: 'GET' },
  );
  if (!r.ok || !r.json) return null;
  const e = r.json?.data?.emails?.[0];
  const value = clean(e?.value);
  if (!value) return null;
  return {
    email: value,
    confidence: typeof e?.confidence === 'number' ? e.confidence : null,
    sourceUrl: clean(e?.sources?.[0]?.uri),
  };
}

/** Verify an email's deliverability via ZeroBounce. */
export async function verifyEmail(
  email: string,
): Promise<{ status: string | null; valid: boolean } | null> {
  const key = process.env.LEADGEN_ZEROBOUNCE_API_KEY;
  if (!key || !email) return null;
  const r = await httpJson(
    `https://api.zerobounce.net/v2/validate?api_key=${encodeURIComponent(key)}&email=${encodeURIComponent(email)}`,
    { method: 'GET' },
  );
  if (!r.ok || !r.json) return null;
  const status = clean(r.json?.status);
  return { status, valid: status === 'valid' };
}
