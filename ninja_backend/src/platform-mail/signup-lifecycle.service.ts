import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';
import { ConfigService } from '../config/config.service';
import { PlatformMailerService } from './platform-mailer.service';

/**
 * Abandoned-signup email sweep.
 *
 * A user row is created at signup but access is gated on payment_status. Someone
 * who registered but never paid is an "abandoned signup". This sweep emails them
 * once, in their chosen language, with a link to finish activation (the $7 offer).
 *
 * SAFETY — default OFF. It only runs when ABANDONED_SIGNUP_EMAILS_ENABLED='true',
 * so no lifecycle mail can ever go out until an operator turns it on after review
 * (and after SMTP is configured). The recipient is claimed atomically
 * (abandoned_email_sent_at IS NULL -> NOW()) inside the same UPDATE that selects
 * it, so overlapping runs can never double-send. Only unpaid self-signups in a
 * 10-minute-to-24-hour window are targeted; paid or already-welcomed users are
 * excluded.
 */
@Injectable()
export class SignupLifecycleService {
  private readonly logger = new Logger(SignupLifecycleService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
    private readonly mailer: PlatformMailerService,
  ) {}

  private enabled(): boolean {
    return (
      String(this.config.get('ABANDONED_SIGNUP_EMAILS_ENABLED') || '')
        .trim()
        .toLowerCase() === 'true'
    );
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sweepAbandonedSignups(): Promise<void> {
    if (!this.enabled()) return; // hard off by default
    await this.mailer.ensureSchema();

    const offer = this.config.get('ABANDONED_SIGNUP_OFFER_LABEL') || '$7';
    const ctaUrl =
      this.config.get('ABANDONED_SIGNUP_CTA_URL') ||
      `${this.mailer.appUrl()}/trial`;

    let claimed: any[] = [];
    try {
      // Claim a bounded batch atomically: the CTE selects eligible rows and the
      // UPDATE stamps abandoned_email_sent_at in one statement, so a concurrent
      // run cannot pick the same user.
      const { rows } = await this.db.query(
        `
        WITH eligible AS (
          SELECT id
            FROM users
           WHERE created_at < NOW() - INTERVAL '10 minutes'
             AND created_at > NOW() - INTERVAL '24 hours'
             AND COALESCE(payment_status, '') <> 'active'
             AND abandoned_email_sent_at IS NULL
             AND welcome_email_sent_at IS NULL
             AND role = 'owner'
             AND email IS NOT NULL
           ORDER BY created_at ASC
           LIMIT 100
           FOR UPDATE SKIP LOCKED
        )
        UPDATE users u
           SET abandoned_email_sent_at = NOW()
          FROM eligible e
         WHERE u.id = e.id
        RETURNING u.id, u.email, COALESCE(u.preferred_language, 'en') AS lang, u.name
        `,
      );
      claimed = rows;
    } catch (err: any) {
      this.logger.error(`abandoned-signup claim failed: ${err?.message}`);
      return;
    }

    if (!claimed.length) return;
    this.logger.log(`abandoned-signup: sending ${claimed.length} email(s)`);

    for (const u of claimed) {
      await this.mailer.send({
        to: u.email,
        userId: u.id,
        template: 'abandoned_signup',
        language: u.lang,
        vars: { name: u.name, ctaUrl, offer },
      });
    }
  }
}
