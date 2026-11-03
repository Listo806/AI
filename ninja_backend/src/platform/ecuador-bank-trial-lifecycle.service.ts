import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';
import { PlatformMailerService } from '../platform-mail/platform-mailer.service';

/** Hourly Ecuador bank-payment lifecycle. No automatic charges. */
@Injectable()
export class EcuadorBankTrialLifecycleService {
  private readonly logger = new Logger(EcuadorBankTrialLifecycleService.name);
  constructor(private readonly db: DatabaseService, private readonly mailer: PlatformMailerService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async run() {
    await this.db.query(`CREATE TABLE IF NOT EXISTS cortexa_ec_trial_notifications (
      subscription_id uuid NOT NULL, period_end timestamptz NOT NULL, kind text NOT NULL,
      sent_at timestamptz, claimed_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY(subscription_id,period_end,kind))`);
    // Expiry is authoritative at request time as well (SubscriptionActiveGuard).
    // This worker updates persisted state and prevents stale billing dashboards.
    const expired = await this.db.query(`UPDATE subscriptions SET status='past_due',updated_at=now()
      WHERE provider='ecuador_bank' AND status='active' AND current_period_end<=now()
      RETURNING team_id`);
    for (const row of expired.rows) {
      await this.db.query(`UPDATE users SET payment_status='past_due',updated_at=now()
        WHERE id=(SELECT owner_id FROM teams WHERE id=$1)`,[row.team_id]);
    }
    const due = await this.db.query(`SELECT s.id,s.current_period_end,u.id AS user_id,u.email,u.plan,
      CASE WHEN t.offer_type='trial' THEN 'trial' ELSE 'monthly' END AS period_type
      FROM subscriptions s JOIN teams tm ON tm.id=s.team_id
      JOIN users u ON u.id=tm.owner_id
      LEFT JOIN LATERAL (SELECT offer_type FROM cortexa_ec_bank_transfers
        WHERE user_id=u.id AND status='verified' ORDER BY reviewed_at DESC LIMIT 1) t ON true
      WHERE s.provider='ecuador_bank' AND s.status='active'
        AND s.current_period_end > now() AND s.current_period_end<=now()+interval '3 days'
        AND u.email IS NOT NULL ORDER BY s.current_period_end LIMIT 250`);
    for (const row of due.rows) {
      const kind = row.period_type === 'trial' ? 'trial_expiry_3d' : 'renewal_3d';
      const claimed = await this.db.query(`INSERT INTO cortexa_ec_trial_notifications(subscription_id,period_end,kind)
        VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING subscription_id`,[row.id,row.current_period_end,kind]);
      if (!claimed.rows.length) continue;
      const date = new Date(row.current_period_end).toISOString().slice(0,10);
      const plan = ['solo','business','scale'].includes(String(row.plan)) ? row.plan : 'solo';
      const url = `https://www.cortexaaicrm.com/es-ec/checkout?plan=${plan}&billing=monthly&source=renewal`;
      try {
        const result = await this.mailer.sendCustomEmail({to:row.email,userId:row.user_id,
          subject:'Cortexa: tu acceso vence pronto',template:'cortexa_ec_expiry',
          html:`<p>Tu acceso a Cortexa vence el ${date} (UTC).</p><p>Para continuar, realiza una nueva transferencia bancaria y espera su verificación.</p><p><a href="${url}">Continuar con tu plan</a></p><p>Tu cuenta y tus datos se conservarán aunque venza el acceso.</p>`});
        if (!result.sent) throw new Error(result.reason || 'Email not sent');
        await this.db.query(`UPDATE cortexa_ec_trial_notifications SET sent_at=now() WHERE subscription_id=$1 AND period_end=$2 AND kind=$3`,[row.id,row.current_period_end,kind]);
      } catch (err) {
        this.logger.warn(`Reminder failed for subscription ${row.id}: ${String(err)}`);
        await this.db.query(`DELETE FROM cortexa_ec_trial_notifications WHERE subscription_id=$1 AND period_end=$2 AND kind=$3 AND sent_at IS NULL`,[row.id,row.current_period_end,kind]);
      }
    }
  }
}
