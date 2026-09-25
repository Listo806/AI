import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

/**
 * What each channel actually produced: sign-ups, paying customers, the money
 * from the activation payment, the money from renewals, and the monthly value
 * still running.
 *
 * It reads the records that already exist, the customer row and the billing
 * rows, rather than a second database of its own. Every purchase carries a copy
 * of where the customer came from, taken at the moment they paid, so a campaign
 * total cannot drift when the same person comes back later through a different
 * channel. Customers who paid before that copy existed fall back to the values
 * on their own record, which is why both appear in the expressions below.
 */

// The dimensions a report can be grouped by, and how each one is read. The key
// is what the caller asks for; the value is SQL. Nothing from the request is
// ever put into the query itself.
const DIMENSIONS: Record<string, { first: string; last: string; label: string }> = {
  landing_page: {
    label: 'Landing page',
    first: `COALESCE(NULLIF(s.acquisition->'first_touch'->>'landing_page', ''),
                     NULLIF(s.acquisition->'first_touch'->>'landing_route', ''),
                     NULLIF(u.first_touch_landing_page, ''),
                     NULLIF(u.first_touch_landing_route, ''),
                     NULLIF(u.landing_page, ''))`,
    last: `COALESCE(NULLIF(s.acquisition->'last_touch'->>'landing_page', ''),
                    NULLIF(u.last_touch_landing_page, ''),
                    NULLIF(u.last_touch_landing_route, ''))`,
  },
  campaign: {
    label: 'Campaign',
    first: `COALESCE(NULLIF(s.acquisition->'first_touch'->>'campaign', ''),
                     NULLIF(u.first_touch_campaign, ''), NULLIF(u.utm_campaign, ''))`,
    last: `COALESCE(NULLIF(s.acquisition->'last_touch'->>'campaign', ''),
                    NULLIF(u.last_touch_campaign, ''))`,
  },
  source: {
    label: 'Source',
    first: `COALESCE(NULLIF(s.acquisition->'first_touch'->>'source', ''),
                     NULLIF(u.first_touch_source, ''), NULLIF(u.utm_source, ''))`,
    last: `COALESCE(NULLIF(s.acquisition->'last_touch'->>'source', ''),
                    NULLIF(u.last_touch_source, ''))`,
  },
  medium: {
    label: 'Medium',
    first: `COALESCE(NULLIF(s.acquisition->'first_touch'->>'medium', ''),
                     NULLIF(u.first_touch_medium, ''), NULLIF(u.utm_medium, ''))`,
    last: `COALESCE(NULLIF(s.acquisition->'last_touch'->>'medium', ''),
                    NULLIF(u.last_touch_medium, ''))`,
  },
  channel: {
    label: 'Channel',
    first: `COALESCE(NULLIF(s.acquisition->'first_touch'->>'channel', ''),
                     NULLIF(u.first_touch_channel, ''))`,
    last: `COALESCE(NULLIF(s.acquisition->'last_touch'->>'channel', ''),
                    NULLIF(u.last_touch_channel, ''))`,
  },
  keyword_theme: {
    label: 'Keyword theme',
    first: `COALESCE(NULLIF(s.acquisition->'first_touch'->>'keyword_theme', ''),
                     NULLIF(u.first_touch_keyword_theme, ''), NULLIF(u.utm_term, ''))`,
    last: `COALESCE(NULLIF(s.acquisition->'last_touch'->>'keyword_theme', ''),
                    NULLIF(u.last_touch_keyword_theme, ''))`,
  },
  campaign_cluster: {
    label: 'Campaign cluster',
    first: `COALESCE(NULLIF(s.acquisition->'first_touch'->>'campaign_cluster', ''),
                     NULLIF(u.first_touch_campaign_cluster, ''))`,
    last: `COALESCE(NULLIF(s.acquisition->'last_touch'->>'campaign_cluster', ''),
                    NULLIF(u.last_touch_campaign_cluster, ''))`,
  },
  country: {
    label: 'Country',
    first: `COALESCE(NULLIF(s.acquisition->>'country', ''), NULLIF(u.signup_country, ''))`,
    last: `COALESCE(NULLIF(s.acquisition->>'country', ''), NULLIF(u.signup_country, ''))`,
  },
  region: {
    label: 'Region or state',
    first: `COALESCE(NULLIF(s.acquisition->>'region', ''), NULLIF(u.signup_region, ''))`,
    last: `COALESCE(NULLIF(s.acquisition->>'region', ''), NULLIF(u.signup_region, ''))`,
  },
  city: {
    label: 'City',
    first: `COALESCE(NULLIF(s.acquisition->>'city', ''), NULLIF(u.signup_city, ''))`,
    last: `COALESCE(NULLIF(s.acquisition->>'city', ''), NULLIF(u.signup_city, ''))`,
  },
  language: {
    label: 'Language',
    first: `COALESCE(NULLIF(s.acquisition->'first_touch'->>'language', ''),
                     NULLIF(u.first_touch_language, ''), NULLIF(u.preferred_language, ''))`,
    last: `COALESCE(NULLIF(s.acquisition->'last_touch'->>'language', ''),
                    NULLIF(u.last_touch_language, ''), NULLIF(u.preferred_language, ''))`,
  },
  plan: {
    label: 'Plan',
    first: `COALESCE(NULLIF(s.plan_key, ''), NULLIF(u.selected_plan, ''), NULLIF(u.plan, ''))`,
    last: `COALESCE(NULLIF(s.plan_key, ''), NULLIF(u.selected_plan, ''), NULLIF(u.plan, ''))`,
  },
};

@Injectable()
export class AcquisitionReportService {
  constructor(private readonly db: DatabaseService) {}

  /** The dimensions a caller may ask for, for the admin screen to offer. */
  dimensions() {
    return Object.entries(DIMENSIONS).map(([key, d]) => ({ key, label: d.label }));
  }

  /**
   * One row per value of the chosen dimension.
   *
   * `basis` picks which visit the row is credited to: the first one that ever
   * brought the customer, or the one that brought them back when they signed
   * up. Both are stored, so neither has to be guessed at report time.
   */
  async report(params: {
    dimension?: string;
    basis?: string;
    from?: string;
    to?: string;
    limit?: number;
  }) {
    const key = DIMENSIONS[String(params.dimension || 'campaign')]
      ? String(params.dimension || 'campaign')
      : 'campaign';
    const basis = String(params.basis || 'first') === 'last' ? 'last' : 'first';
    const expr = DIMENSIONS[key][basis];
    const limit = Math.min(Math.max(Number(params.limit) || 100, 1), 500);

    const args: any[] = [];
    const window: string[] = [];
    if (params.from) {
      args.push(params.from);
      window.push(`u.created_at >= $${args.length}::timestamptz`);
    }
    if (params.to) {
      args.push(params.to);
      window.push(`u.created_at < ($${args.length}::timestamptz + interval '1 day')`);
    }
    const where = window.length ? `WHERE ${window.join(' AND ')}` : '';
    args.push(limit);

    // One pass over the customers, with their subscription and its charges
    // hanging off it. A customer with no subscription still counts as a sign-up,
    // which is the point of the report.
    const sql = `
      WITH live AS (
        SELECT DISTINCT ON (s.user_id) s.*
          FROM nuvei_subscriptions s
         ORDER BY s.user_id, s.created_at DESC
      ),
      money AS (
        SELECT t.subscription_id,
               SUM(t.amount) FILTER (WHERE t.kind = 'activation')::float AS activation_revenue,
               SUM(t.amount) FILTER (WHERE t.kind = 'recurring')::float AS renewal_revenue,
               COUNT(*) FILTER (WHERE t.kind = 'recurring')::int AS renewals
          FROM nuvei_transactions t
         WHERE LOWER(COALESCE(t.status, '')) = 'success'
           AND UPPER(COALESCE(t.currency, 'USD')) = 'USD'
         GROUP BY t.subscription_id
      )
      SELECT COALESCE(${expr}, 'Unknown') AS key,
             COUNT(*)::int AS signups,
             COUNT(*) FILTER (WHERE s.id IS NOT NULL)::int AS checkouts_started,
             COUNT(*) FILTER (WHERE s.status IN ('trialing', 'active'))::int AS paying_customers,
             COALESCE(SUM(m.activation_revenue), 0)::float AS activation_revenue,
             COALESCE(SUM(m.renewal_revenue), 0)::float AS renewal_revenue,
             COALESCE(SUM(m.activation_revenue), 0)::float
               + COALESCE(SUM(m.renewal_revenue), 0)::float AS total_revenue,
             COALESCE(SUM(m.renewals), 0)::int AS renewals,
             COALESCE(SUM(s.monthly_amount) FILTER (WHERE s.status IN ('trialing', 'active')), 0)::float AS mrr
        FROM users u
        LEFT JOIN live s ON s.user_id = u.id
        LEFT JOIN money m ON m.subscription_id = s.id
        ${where}
       GROUP BY 1
       ORDER BY total_revenue DESC, signups DESC
       LIMIT $${args.length}
    `;

    const { rows } = await this.db.query(sql, args);
    const totals = rows.reduce(
      (acc: any, r: any) => {
        acc.signups += Number(r.signups || 0);
        acc.paying_customers += Number(r.paying_customers || 0);
        acc.activation_revenue += Number(r.activation_revenue || 0);
        acc.renewal_revenue += Number(r.renewal_revenue || 0);
        acc.total_revenue += Number(r.total_revenue || 0);
        acc.mrr += Number(r.mrr || 0);
        return acc;
      },
      { signups: 0, paying_customers: 0, activation_revenue: 0, renewal_revenue: 0, total_revenue: 0, mrr: 0 },
    );
    return {
      dimension: key,
      label: DIMENSIONS[key].label,
      basis,
      rows,
      totals,
      note:
        'Revenue is counted in US dollars from successful charges. An organic ' +
        'search keyword is never inferred; keyword themes come from campaign ' +
        'parameters, and Search Console is the source for organic queries.',
    };
  }
}
