import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '../config/config.service';
import { PlatformMailerService } from './platform-mailer.service';

/**
 * Abandoned-signup sequence worker.
 *
 * The 3 emails are queued as 'scheduled' rows in email_log at signup
 * (PlatformMailerService.scheduleAbandonedSequence): abandoned_1 ~7 min,
 * abandoned_2 ~24h (Business Editorial), abandoned_3 ~72h. This cron just sends
 * the ones that are due, re-checking payment for each — a paid user's remaining
 * queue is canceled, never sent — and payment success cancels the queue directly.
 *
 * SAFETY — default OFF. Sending only runs when ABANDONED_SIGNUP_EMAILS_ENABLED
 * is 'true', so no lifecycle mail goes out until an operator turns it on.
 */
@Injectable()
export class SignupLifecycleService {
  private readonly logger = new Logger(SignupLifecycleService.name);

  constructor(
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
    try {
      await this.mailer.sendScheduledDue();
    } catch (err: any) {
      this.logger.error(`abandoned sweep failed: ${err?.message}`);
    }
  }
}
