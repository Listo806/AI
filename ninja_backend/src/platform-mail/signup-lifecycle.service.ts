import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';
import { ConfigService } from '../config/config.service';
import { PlatformMailerService } from './platform-mailer.service';
import { TemplateName } from './templates';

/**
 * Abandoned-signup email sequence.
 *
 * A user row is created at signup but access is gated on payment. Someone who
 * registered but never paid is an "abandoned signup". They receive up to three
 * emails, in their language, each checking payment first:
 *   stage 0 -> abandoned_1  (~7 min after signup) "your account is ready"
 *   stage 1 -> abandoned_2  (~24h)                 Business Editorial
 *   stage 2 -> abandoned_3  (~72h)                 final reminder
 *
 * SAFETY — default OFF. It only runs when ABANDONED_SIGNUP_EMAILS_ENABLED='true'.
 * Each recipient is claimed atomically (abandoned_stage advanced inside the same
 * UPDATE that selects it), so overlapping runs never double-send. The eligibility
 * filter excludes anyone paid (payment_status='active' / checkout_status='paid' /
 * welcome_email_sent_at set), so the sequence stops the moment payment completes.
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

  private continueUrl(): string {
    return (
      this.config.get('ABANDONED_SIGNUP_CTA_URL') ||
      `${this.mailer.appUrl()}/trial`
    );
  }

  private editorialUrl(lang: string): string {
    const prefix = lang === 'es' ? '/es' : lang === 'pt' ? '/pt' : '';
    return `${this.mailer.appUrl()}${prefix}/editorial/business`;
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sweepAbandonedSignups(): Promise<void> {
    if (!this.enabled()) return; // hard off by default
    await this.mailer.ensureSchema();

    // Each stage: unpaid sign-ups old enough for the next email.
    await this.runStage(0, 'abandoned_1', "INTERVAL '7 minutes'");
    await this.runStage(1, 'abandoned_2', "INTERVAL '24 hours'");
    await this.runStage(2, 'abandoned_3', "INTERVAL '72 hours'");
  }

  // Atomically claim a bounded batch at `fromStage` that is old enough, advance
  // it to fromStage+1, and send the email. The eligibility re-checks payment, so
  // a customer who paid is never emailed.
  private async runStage(
    fromStage: number,
    template: TemplateName,
    minAge: string,
  ): Promise<void> {
    let claimed: any[] = [];
    try {
      const { rows } = await this.db.query(
        `
        WITH eligible AS (
          SELECT id
            FROM users
           WHERE created_at < NOW() - ${minAge}
             AND created_at > NOW() - INTERVAL '14 days'
             AND COALESCE(payment_status, '') <> 'active'
             AND COALESCE(checkout_status, '') <> 'paid'
             AND welcome_email_sent_at IS NULL
             AND abandoned_stage = $1
             AND role = 'owner'
             AND email IS NOT NULL
           ORDER BY created_at ASC
           LIMIT 100
           FOR UPDATE SKIP LOCKED
        )
        UPDATE users u
           SET abandoned_stage = $2,
               abandoned_email_sent_at = NOW()
          FROM eligible e
         WHERE u.id = e.id
        RETURNING u.id, u.email, COALESCE(u.preferred_language, 'en') AS lang, u.name
        `,
        [fromStage, fromStage + 1],
      );
      claimed = rows;
    } catch (err: any) {
      this.logger.error(
        `abandoned stage ${fromStage} claim failed: ${err?.message}`,
      );
      return;
    }

    if (!claimed.length) return;
    this.logger.log(`abandoned ${template}: sending ${claimed.length} email(s)`);

    for (const u of claimed) {
      const vars: any = { name: u.name, ctaUrl: this.continueUrl() };
      if (template === 'abandoned_2') vars.editorialUrl = this.editorialUrl(u.lang);
      await this.mailer.send({
        to: u.email,
        userId: u.id,
        template,
        language: u.lang,
        vars,
      });
    }
  }
}
