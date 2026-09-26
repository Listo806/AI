/**
 * First-touch acquisition: where a customer originally came from.
 *
 * The browser records the first visit it ever sees (utm values, the route the
 * visitor landed on, and the moment it happened) and sends it with the sign-up.
 * We store it once. A later visit through Google, social or direct traffic must
 * never change it, so every write here is guarded by "only if still empty".
 *
 * This is deliberately separate from the registration country, which
 * signup-geo.util.ts resolves from the request; the two never touch each other.
 */

// Printed business card carrying a QR code: the one offline channel we label by
// name, because the client reports on it. Everything else keeps its raw utm.
const BUSINESS_CARD = 'business_card';

const LABELS: Record<string, { source: string; medium: string; campaign: string }> = {
  [BUSINESS_CARD]: { source: 'Business Card', medium: 'QR Code', campaign: 'Offline' },
};

export interface FirstTouch {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  term: string | null;
  content: string | null;
  landingRoute: string | null;
  landingPage: string | null;
  channel: string | null;
  keywordTheme: string | null;
  campaignCluster: string | null;
  language: string | null;
  /** Google Ads ad group (utm_adgroup / ValueTrack {adgroupid}), when tagged. */
  adGroup: string | null;
  /** mobile | tablet | desktop, as the browser saw it. */
  device: string | null;
  firstVisitAt: string | null;
}

/** The same shape for the visit that brought a customer back. */
export interface LastTouch extends Omit<FirstTouch, 'firstVisitAt'> {
  referrerHost: string | null;
  lastVisitAt: string | null;
}

function text(value: any, max = 120): string | null {
  const v = String(value ?? '').trim();
  return v ? v.slice(0, max) : null;
}

/** Only the three device categories the site reports; anything else is dropped. */
function deviceOf(value: any): string | null {
  const v = String(value ?? '').trim().toLowerCase();
  return ['mobile', 'tablet', 'desktop'].includes(v) ? v : null;
}

/** A timestamp we are willing to store: a real date, never in the future. */
function when(value: any): string | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const t = Date.parse(raw);
  if (!Number.isFinite(t)) return null;
  return new Date(Math.min(t, Date.now())).toISOString();
}

/**
 * Read the first-touch block out of a sign-up payload. Accepts the explicit
 * `firstTouch` object the site sends, and falls back to the utm fields that
 * older callers (and the exit-intent popup) already send, so no sign-up path
 * loses its attribution.
 */
export function firstTouchFromDto(dto: any): FirstTouch {
  const ft = (dto && typeof dto.firstTouch === 'object' && dto.firstTouch) || {};
  const utm = (dto && typeof dto.utm === 'object' && dto.utm) || {};
  const source = text(ft.source ?? utm.source ?? dto?.utmSource);
  const medium = text(ft.medium ?? utm.medium ?? dto?.utmMedium);
  const campaign = text(ft.campaign ?? utm.campaign ?? dto?.utmCampaign);
  return {
    source,
    medium,
    campaign,
    term: text(ft.term ?? utm.term ?? dto?.utmTerm),
    content: text(ft.content ?? utm.content ?? dto?.utmContent),
    landingRoute: text(ft.landingRoute ?? dto?.landingRoute ?? dto?.landingPage, 400),
    landingPage: text(ft.landingPage ?? dto?.landingPage, 400),
    channel: text(ft.channel),
    // The advertiser's own keyword theme, never a guess at what someone typed
    // into a search engine: search engines do not tell us that, and Search
    // Console is where aggregate query data belongs.
    keywordTheme: text(ft.keywordTheme ?? ft.term ?? utm.term),
    campaignCluster: text(ft.campaignCluster),
    language: text(ft.language ?? dto?.language, 8),
    adGroup: text(ft.adGroup ?? dto?.adGroup),
    device: deviceOf(ft.device ?? dto?.device),
    firstVisitAt: when(ft.firstVisitAt ?? dto?.firstVisitAt),
  };
}

/**
 * Read the last-touch block: the visit that brought the customer back. Absent
 * for someone who signed up on their first visit, in which case the first touch
 * already describes it.
 */
export function lastTouchFromDto(dto: any): LastTouch | null {
  const lt = (dto && typeof dto.lastTouch === 'object' && dto.lastTouch) || null;
  if (!lt) return null;
  const source = text(lt.source);
  const medium = text(lt.medium);
  if (!source && !medium && !lt.campaign && !lt.landingRoute && !lt.adGroup) return null;
  return {
    source,
    medium,
    campaign: text(lt.campaign),
    term: text(lt.term),
    content: text(lt.content),
    landingRoute: text(lt.landingRoute, 400),
    landingPage: text(lt.landingPage, 400),
    channel: text(lt.channel),
    keywordTheme: text(lt.keywordTheme ?? lt.term),
    campaignCluster: text(lt.campaignCluster),
    language: text(lt.language, 8),
    adGroup: text(lt.adGroup),
    device: deviceOf(lt.device),
    referrerHost: text(lt.referrerHost, 200),
    lastVisitAt: when(lt.lastVisitAt),
  };
}

/** Human-readable channel for a stored first-touch source, for reports. */
export function acquisitionLabels(source?: string | null) {
  return LABELS[String(source ?? '').trim().toLowerCase()] || null;
}

export function isBusinessCard(source?: string | null): boolean {
  return String(source ?? '').trim().toLowerCase() === BUSINESS_CARD;
}

/**
 * The acquisition fields as an admin should read them: the channel in words for
 * the channels we name, the raw values otherwise, and the older utm columns as a
 * fallback for customers who registered before this was recorded. One place, so
 * the customer detail and the CSV export can never disagree.
 */
export function acquisitionView(row: any) {
  const labels = acquisitionLabels(row?.first_touch_source);
  return {
    first_touch_medium:
      labels?.medium || row?.first_touch_medium || row?.utm_medium || null,
    first_touch_campaign:
      labels?.campaign || row?.first_touch_campaign || row?.utm_campaign || null,
    first_touch_landing_route:
      row?.first_touch_landing_route || row?.landing_page || null,
    first_visit_at: row?.first_visit_at || null,
  };
}

/** Ad group + device columns (migration 173), shared by every ensure-list. */
export const ACQUISITION_EXTRA_COLUMNS = [
  'first_touch_ad_group TEXT',
  'first_touch_device VARCHAR(16)',
  'last_touch_ad_group TEXT',
  'last_touch_device VARCHAR(16)',
];

// The columns live in migration 164, which is not auto-run in this environment,
// so every write path makes sure they exist first. Done once per process.
let columnsReady = false;
export async function ensureAcquisitionColumns(db: {
  query: (sql: string, params?: any[]) => Promise<any>;
}): Promise<void> {
  if (columnsReady) return;
  for (const col of [
    'first_touch_source TEXT',
    'first_touch_medium TEXT',
    'first_touch_campaign TEXT',
    'first_touch_landing_route TEXT',
    'first_visit_at TIMESTAMPTZ',
    // The rest of the first visit, and the visit that brought them back.
    'first_touch_term TEXT',
    'first_touch_content TEXT',
    'first_touch_landing_page TEXT',
    'first_touch_channel TEXT',
    'first_touch_keyword_theme TEXT',
    'first_touch_campaign_cluster TEXT',
    'first_touch_language VARCHAR(8)',
    'last_touch_source TEXT',
    'last_touch_medium TEXT',
    'last_touch_campaign TEXT',
    'last_touch_term TEXT',
    'last_touch_content TEXT',
    'last_touch_landing_route TEXT',
    'last_touch_landing_page TEXT',
    'last_touch_channel TEXT',
    'last_touch_keyword_theme TEXT',
    'last_touch_campaign_cluster TEXT',
    'last_touch_referrer_host TEXT',
    'last_touch_language VARCHAR(8)',
    'last_visit_at TIMESTAMPTZ',
    ...ACQUISITION_EXTRA_COLUMNS,
  ]) {
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col}`);
  }
  columnsReady = true;
}

/**
 * Store the first touch for an account that has none yet. Used by sign-up paths
 * that create the user before the attribution is known. Write-once by
 * construction: the UPDATE only matches while the source is still empty, so a
 * returning customer can never overwrite where they originally came from.
 */
export async function captureFirstTouch(
  db: { query: (sql: string, params?: any[]) => Promise<any> },
  userId: string,
  dto: any,
): Promise<void> {
  try {
    const ft = firstTouchFromDto(dto);
    if (!ft.source && !ft.landingRoute) return;
    // The columns ship in migration 164, which is not auto-run here, so make
    // sure they exist before writing. Without this the UPDATE would fail and,
    // because the write happens once, the source would be lost for good.
    await ensureAcquisitionColumns(db);
    await db.query(
      `UPDATE users
          SET first_touch_source = $1,
              first_touch_medium = $2,
              first_touch_campaign = $3,
              first_touch_landing_route = $4,
              first_visit_at = COALESCE($5::timestamptz, NOW()),
              first_touch_term = $6,
              first_touch_content = $7,
              first_touch_landing_page = $8,
              first_touch_channel = $9,
              first_touch_keyword_theme = $10,
              first_touch_campaign_cluster = $11,
              first_touch_language = $12,
              first_touch_ad_group = $14,
              first_touch_device = $15
        WHERE id = $13
          AND COALESCE(first_touch_source, '') = ''`,
      [
        ft.source, ft.medium, ft.campaign, ft.landingRoute, ft.firstVisitAt,
        ft.term, ft.content, ft.landingPage, ft.channel, ft.keywordTheme,
        ft.campaignCluster, ft.language, userId, ft.adGroup, ft.device,
      ],
    );
  } catch {
    /* best-effort: attribution must never break a sign-up */
  }
}

/**
 * Store the visit that brought a customer back. Unlike the first touch this is
 * meant to change: it is rewritten on each sign-up event, and it never touches
 * the first-touch columns. When it is absent the first touch already describes
 * the visit, so nothing is written and nothing is guessed.
 */
export async function captureLastTouch(
  db: { query: (sql: string, params?: any[]) => Promise<any> },
  userId: string,
  dto: any,
): Promise<void> {
  try {
    const lt = lastTouchFromDto(dto);
    if (!lt) return;
    await ensureAcquisitionColumns(db);
    await db.query(
      `UPDATE users
          SET last_touch_source = $1,
              last_touch_medium = $2,
              last_touch_campaign = $3,
              last_touch_term = $4,
              last_touch_content = $5,
              last_touch_landing_route = $6,
              last_touch_landing_page = $7,
              last_touch_channel = $8,
              last_touch_keyword_theme = $9,
              last_touch_campaign_cluster = $10,
              last_touch_referrer_host = $11,
              last_touch_language = $12,
              last_visit_at = COALESCE($13::timestamptz, NOW()),
              last_touch_ad_group = $15,
              last_touch_device = $16
        WHERE id = $14`,
      [
        lt.source, lt.medium, lt.campaign, lt.term, lt.content, lt.landingRoute,
        lt.landingPage, lt.channel, lt.keywordTheme, lt.campaignCluster,
        lt.referrerHost, lt.language, lt.lastVisitAt, userId, lt.adGroup, lt.device,
      ],
    );
  } catch {
    /* best-effort: attribution must never break a sign-up */
  }
}
