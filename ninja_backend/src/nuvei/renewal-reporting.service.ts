import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';

/**
 * Renewal revenue, reported from the server.
 *
 * The first payment is reported by the browser, which is present and can carry
 * the click identifiers. A renewal is charged by a scheduled job a month later
 * with nobody watching, so the only way it can reach an analytics account is
 * from here.
 *
 * What this does and does not do, deliberately:
 *
 *  - It sends a `purchase` event to Google Analytics 4 through the Measurement
 *    Protocol, carrying the real amount and the provider's transaction id.
 *  - It sends each charge at most once. The charge row is stamped when the
 *    event is accepted, and the transaction id doubles as the deduplication
 *    key on Google's side.
 *  - It stays off until GA4_MEASUREMENT_ID and GA4_API_SECRET are set, so
 *    nothing is sent from an environment that was not configured on purpose.
 *  - It does NOT report renewals to Google Ads. Uploading offline conversions
 *    needs an Ads developer token and an authorised account, and a renewal
 *    counted as an Ads conversion changes how the campaigns bid. That is a
 *    decision for the account owner, not a side effect of a code change.
 */
@Injectable()
export class RenewalReportingService {
  private readonly logger = new Logger('RenewalReporting');
  private columnReady = false;

  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
  ) {}

  private get measurementId(): string {
    return String(this.config.get('GA4_MEASUREMENT_ID') || '').trim();
  }

  private get apiSecret(): string {
    return String(this.config.get('GA4_API_SECRET') || '').trim();
  }

  enabled(): boolean {
    return !!this.measurementId && !!this.apiSecret;
  }

  private async ensureColumn(): Promise<void> {
    if (this.columnReady) return;
    await this.db.query(
      `ALTER TABLE nuvei_transactions ADD COLUMN IF NOT EXISTS analytics_reported_at TIMESTAMPTZ`,
    );
    this.columnReady = true;
  }

  /**
   * Report one settled renewal. Safe to call from the billing path: it never
   * throws, never blocks, and does nothing at all when analytics is not
   * configured.
   */
  async reportRenewal(input: {
    transactionRowId?: string | null;
    providerTransactionId?: string | null;
    userId?: string | null;
    subscriptionId?: string | null;
    amount?: number | null;
    currency?: string | null;
    planKey?: string | null;
  }): Promise<void> {
    try {
      if (!this.enabled()) return;
      const amount = Number(input.amount || 0);
      const transactionId = String(input.providerTransactionId || '').trim();
      if (!transactionId || !(amount > 0)) return;

      await this.ensureColumn();

      // Claim the row first: if this charge was already reported, stop. The
      // UPDATE only matches while the stamp is empty, so two workers racing
      // cannot both send it.
      if (input.transactionRowId) {
        const { rowCount } = await this.db.query(
          `UPDATE nuvei_transactions
              SET analytics_reported_at = NOW()
            WHERE id = $1 AND analytics_reported_at IS NULL`,
          [input.transactionRowId],
        );
        if (!rowCount) return;
      }

      // The customer's own acquisition, so the renewal lands in the same
      // reporting as the purchase it renews.
      let acquisition: any = {};
      if (input.subscriptionId) {
        const { rows } = await this.db.query(
          `SELECT acquisition FROM nuvei_subscriptions WHERE id = $1 LIMIT 1`,
          [input.subscriptionId],
        );
        acquisition = rows[0]?.acquisition || {};
      }

      const body = {
        // GA4 needs a client identifier. A renewal has no browser, so the
        // subscription is used: stable, ours, and not personal data.
        client_id: `renewal.${input.subscriptionId || input.userId || transactionId}`,
        ...(input.userId ? { user_id: String(input.userId) } : {}),
        non_personalized_ads: true,
        events: [
          {
            name: 'purchase',
            params: {
              transaction_id: transactionId,
              value: Number(amount.toFixed(2)),
              currency: String(input.currency || 'USD').toUpperCase(),
              payment_type: 'subscription_renewal',
              plan: input.planKey || undefined,
              campaign: acquisition?.first_touch?.campaign || undefined,
              source: acquisition?.first_touch?.source || undefined,
              medium: acquisition?.first_touch?.medium || undefined,
              engagement_time_msec: 1,
              items: input.planKey
                ? [
                    {
                      item_id: input.planKey,
                      item_name: `${input.planKey} renewal`,
                      price: Number(amount.toFixed(2)),
                      quantity: 1,
                    },
                  ]
                : undefined,
            },
          },
        ],
      };

      const url =
        'https://www.google-analytics.com/mp/collect' +
        `?measurement_id=${encodeURIComponent(this.measurementId)}` +
        `&api_secret=${encodeURIComponent(this.apiSecret)}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        this.logger.log(
          `renewal ${transactionId} reported to GA4: HTTP ${res.status} (${amount} ${input.currency || 'USD'})`,
        );
        if (!res.ok && input.transactionRowId) {
          // Let a later run try again rather than losing the renewal.
          await this.db.query(
            `UPDATE nuvei_transactions SET analytics_reported_at = NULL WHERE id = $1`,
            [input.transactionRowId],
          );
        }
      } finally {
        clearTimeout(timer);
      }
    } catch (err: any) {
      this.logger.warn(`renewal reporting skipped: ${err?.message || 'error'}`);
    }
  }
}
