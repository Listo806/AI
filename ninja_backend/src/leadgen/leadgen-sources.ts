/**
 * Lead Generator — source connector registry.
 *
 * Each entry is an external data provider the engine can call. Connection is
 * decided purely by the presence of server-side env credentials, so a provider
 * is "connected" only once its keys are configured. Until then the engine
 * reports the source as not connected and returns NO results for it — it never
 * fabricates leads, contacts, scores, or source URLs.
 *
 * Provider choice is the web-verified recommendation delivered to the client:
 * DataForSEO (discovery) + FullEnrich/Hunter (enrichment) + ZeroBounce
 * (verification) + InfobelPRO/OpenCorporates (registry). All secrets stay
 * server-side; no key is ever returned to the client.
 */

export type SourceKind = 'discovery' | 'enrichment' | 'verification' | 'registry';

export interface LeadgenSource {
  key: string;
  name: string;
  kind: SourceKind;
  role: string;
  /** ISO-3166 alpha-2 codes the provider covers, or 'all'. */
  countries: string[] | 'all';
  /** Every env var that must be present (non-empty) for the source to be connected. */
  envVars: string[];
}

/**
 * The eleven approved launch markets (ISO alpha-2). Order is display order.
 * United Kingdom is 'GB' at the ISO level.
 */
export const LAUNCH_COUNTRIES = [
  'US', 'CA', 'AU', 'GB', 'ES', 'MX', 'CO', 'BR', 'CL', 'AR', 'EC',
];

export const LEADGEN_SOURCES: LeadgenSource[] = [
  {
    key: 'dataforseo',
    name: 'DataForSEO',
    kind: 'discovery',
    role: 'Business discovery — Google-Maps-grade business listings (name, address, phone, website). Terms permit storage into a customer CRM.',
    countries: 'all',
    envVars: ['LEADGEN_DATAFORSEO_LOGIN', 'LEADGEN_DATAFORSEO_PASSWORD'],
  },
  {
    key: 'fullenrich',
    name: 'FullEnrich',
    kind: 'enrichment',
    role: 'Contact enrichment — waterfall across 20+ providers for verified email and phone. Best international/LATAM coverage.',
    countries: 'all',
    envVars: ['LEADGEN_FULLENRICH_API_KEY'],
  },
  {
    key: 'hunter',
    name: 'Hunter.io',
    kind: 'enrichment',
    role: 'Email finding + verification from a company domain. Works across Spanish and Portuguese markets.',
    countries: 'all',
    envVars: ['LEADGEN_HUNTER_API_KEY'],
  },
  {
    key: 'zerobounce',
    name: 'ZeroBounce',
    kind: 'verification',
    role: 'Email verification gate — country-agnostic validity check before a lead can enter the CRM.',
    countries: 'all',
    envVars: ['LEADGEN_ZEROBOUNCE_API_KEY'],
  },
  {
    key: 'infobelpro',
    name: 'InfobelPRO',
    kind: 'registry',
    role: 'LATAM firmographic depth — the only structured source covering Ecuador, Chile and Argentina by registry.',
    countries: ['US', 'CA', 'AU', 'GB', 'ES', 'MX', 'CO', 'BR', 'CL', 'AR', 'EC'],
    envVars: ['LEADGEN_INFOBELPRO_API_KEY'],
  },
  {
    key: 'opencorporates',
    name: 'OpenCorporates',
    kind: 'registry',
    role: 'Cross-border legal-entity verification and de-duplication.',
    countries: 'all',
    envVars: ['LEADGEN_OPENCORPORATES_API_KEY'],
  },
];

/** True only if every required env var for the source is present and non-empty. */
export function sourceConnected(src: LeadgenSource): boolean {
  return src.envVars.every((v) => {
    const val = process.env[v];
    return typeof val === 'string' && val.trim().length > 0;
  });
}

/** Public status of every source (no secrets). Safe to return to the client. */
export function sourcesStatus() {
  return LEADGEN_SOURCES.map((s) => ({
    key: s.key,
    name: s.name,
    kind: s.kind,
    role: s.role,
    countries: s.countries,
    connected: sourceConnected(s),
  }));
}

/** Connected sources of a given kind, honoring server-side credentials. */
export function connectedByKind(kind: SourceKind): LeadgenSource[] {
  return LEADGEN_SOURCES.filter((s) => s.kind === kind && sourceConnected(s));
}

export function anyConnected(kind: SourceKind): boolean {
  return connectedByKind(kind).length > 0;
}
