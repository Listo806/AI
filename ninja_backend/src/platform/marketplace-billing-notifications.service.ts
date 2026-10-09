import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';
import { PlatformMailerService } from '../platform-mail/platform-mailer.service';

/** Marketplace-only receipt and expiration reminders. No card details are stored. */
@Injectable()
export class MarketplaceBillingNotificationsService {
  private readonly logger = new Logger(MarketplaceBillingNotificationsService.name);
  constructor(private readonly db: DatabaseService, private readonly mailer: PlatformMailerService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async process(): Promise<void> {
    await this.db.query(`CREATE TABLE IF NOT EXISTS marketplace_billing_notifications (
      enrollment_id uuid NOT NULL REFERENCES marketplace_plan_enrollments(id),
      kind text NOT NULL, status text NOT NULL DEFAULT 'sending',
      claimed_at timestamptz NOT NULL DEFAULT NOW(), sent_at timestamptz,
      PRIMARY KEY(enrollment_id,kind)
    )`).catch(() => null); // Enrollment table may not exist before first Marketplace request.
    const exists = await this.db.query(`SELECT to_regclass('public.marketplace_billing_notifications') AS name`);
    if (!exists.rows[0]?.name) return;
    const due = await this.db.query(`SELECT e.id,e.user_id,e.plan_key,e.price_cents,e.currency,
      e.current_period_end,e.current_period_start,u.email,
      CASE WHEN e.status='active' AND e.price_cents>0 AND e.current_period_end BETWEEN NOW() AND NOW()+INTERVAL '7 days'
        THEN 'expiry_7d'
        WHEN e.status='active' AND e.price_cents>0 AND e.provider_transaction_id IS NOT NULL
        THEN 'receipt'
        ELSE NULL END AS kind
      FROM marketplace_plan_enrollments e JOIN users u ON u.id=e.user_id
      WHERE e.status='active' AND e.price_cents>0 AND u.email IS NOT NULL
      AND (e.current_period_end BETWEEN NOW() AND NOW()+INTERVAL '7 days' OR e.provider_transaction_id IS NOT NULL)
      ORDER BY e.created_at DESC LIMIT 250`);
    for (const row of due.rows) {
      // Receipts and reminders are separate notifications, each sent at most once.
      const kinds = row.current_period_end && new Date(row.current_period_end).getTime() <= Date.now()+7*86400000
        ? ['receipt','expiry_7d'] : ['receipt'];
      for (const kind of kinds) {
        const claim = await this.db.query(`INSERT INTO marketplace_billing_notifications(enrollment_id,kind)
          VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING enrollment_id`,[row.id,kind]);
        if (!claim.rows.length) continue;
        const end = row.current_period_end ? new Date(row.current_period_end).toISOString().slice(0,10) : '—';
        const amount = (Number(row.price_cents)/100).toFixed(2);
        const subject = kind==='receipt' ? 'ListoQasa payment receipt' : 'Your ListoQasa plan is nearing expiration';
        const html = kind==='receipt'
          ? `<p>Your ListoQasa ${row.plan_key} payment of ${row.currency} ${amount} has been verified.</p><p>Current paid period ends: ${end}.</p>`
          : `<p>Your ListoQasa ${row.plan_key} access expires on ${end}.</p><p>Visit your Marketplace Subscription page to renew securely.</p>`;
        try {
          const result = await this.mailer.sendCustomEmail({to:row.email,userId:row.user_id,subject,html,template:`marketplace_${kind}`});
          if (!result.sent) throw new Error(result.reason || 'Email delivery failed');
          await this.db.query(`UPDATE marketplace_billing_notifications SET status='sent',sent_at=NOW() WHERE enrollment_id=$1 AND kind=$2`,[row.id,kind]);
        } catch(err) {
          this.logger.warn(`Marketplace email ${kind} failed for enrollment ${row.id}: ${String(err)}`);
          // Retry after a cooldown; never send twice concurrently.
          await this.db.query(`DELETE FROM marketplace_billing_notifications WHERE enrollment_id=$1 AND kind=$2 AND status='sending'`,[row.id,kind]);
        }
      }
    }
  }
}
