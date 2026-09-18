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
  landingRoute: string | null;
  firstVisitAt: string | null;
}

function text(value: any, max = 120): string | null {
  const v = String(value ?? '').trim();
  return v ? v.slice(0, max) : null;
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
    landingRoute: text(ft.landingRoute ?? dto?.landingRoute ?? dto?.landingPage, 400),
    firstVisitAt: when(ft.firstVisitAt ?? dto?.firstVisitAt),
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
    await db.query(
      `UPDATE users
          SET first_touch_source = $1,
              first_touch_medium = $2,
              first_touch_campaign = $3,
              first_touch_landing_route = $4,
              first_visit_at = COALESCE($5::timestamptz, NOW())
        WHERE id = $6
          AND COALESCE(first_touch_source, '') = ''`,
      [ft.source, ft.medium, ft.campaign, ft.landingRoute, ft.firstVisitAt, userId],
    );
  } catch {
    /* best-effort: attribution must never break a sign-up */
  }
}
