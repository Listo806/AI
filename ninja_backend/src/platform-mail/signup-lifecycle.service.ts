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

  // Recovery ships independently of the abandoned sequence via its own flag, so
  // the incomplete-registration recovery email can be turned on on its own.
  private recoveryEnabled(): boolean {
    return (
      String(this.config.get('RECOVERY_EMAILS_ENABLED') || '')
        .trim()
        .toLowerCase() === 'true'
    );
  }

  // Free-user onboarding sequence ships behind its own flag (default OFF) so it can
  // be tested and enabled independently of the abandoned/recovery sequences.
  private freeOnboardingEnabled(): boolean {
    return (
      String(this.config.get('FREE_ONBOARDING_EMAILS_ENABLED') || '')
        .trim()
        .toLowerCase() === 'true'
    );
  }

  // New client-approved onboarding sequence (Day 0/1/2/4/6/9/12) behind its own
  // flag (default OFF) so it can be tested and enabled on its own.
  private onboardingEnabled(): boolean {
    return (
      String(this.config.get('ONBOARDING_EMAILS_ENABLED') || '')
        .trim()
        .toLowerCase() === 'true'
    );
  }

  // Checkout-pending recovery email (paid plan selected, unpaid) behind its own
  // flag (default OFF).
  private checkoutRecoveryEnabled(): boolean {
    return (
      String(this.config.get('CHECKOUT_RECOVERY_EMAILS_ENABLED') || '')
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

  // Runs every minute so the recovery email lands close to the ~1-2 min target
  // after an incomplete registration. Hard off unless RECOVERY_EMAILS_ENABLED.
  @Cron(CronExpression.EVERY_MINUTE)
  async sweepRecovery(): Promise<void> {
    if (!this.recoveryEnabled()) return; // hard off by default
    try {
      await this.mailer.sendRecoveryDue();
    } catch (err: any) {
      this.logger.error(`recovery sweep failed: ${err?.message}`);
    }
  }

  // Every minute so email #1 lands near "immediately" after a Free signup. Hard
  // off unless FREE_ONBOARDING_EMAILS_ENABLED.
  @Cron(CronExpression.EVERY_MINUTE)
  async sweepFreeOnboarding(): Promise<void> {
    if (!this.freeOnboardingEnabled()) return; // hard off by default
    try {
      await this.mailer.sendFreeOnboardingDue();
    } catch (err: any) {
      this.logger.error(`free-onboarding sweep failed: ${err?.message}`);
    }
  }

  // Every minute so email #1 lands near "immediately" after a new signup. Hard
  // off unless ONBOARDING_EMAILS_ENABLED.
  @Cron(CronExpression.EVERY_MINUTE)
  async sweepOnboarding(): Promise<void> {
    if (!this.onboardingEnabled()) return; // hard off by default
    try {
      await this.mailer.sendOnboardingDue();
    } catch (err: any) {
      this.logger.error(`onboarding sweep failed: ${err?.message}`);
    }
  }

  // Checkout-recovery: send due emails, re-checking payment per row (paid users
  // are canceled, never sent). Hard off unless CHECKOUT_RECOVERY_EMAILS_ENABLED.
  @Cron(CronExpression.EVERY_5_MINUTES)
  async sweepCheckoutRecovery(): Promise<void> {
    if (!this.checkoutRecoveryEnabled()) return; // hard off by default
    try {
      await this.mailer.sendCheckoutRecoveryDue();
    } catch (err: any) {
      this.logger.error(`checkout-recovery sweep failed: ${err?.message}`);
    }
  }
}
