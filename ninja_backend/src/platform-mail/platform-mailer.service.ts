import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { DatabaseService } from '../database/database.service';
import { ConfigService } from '../config/config.service';
import {
  MailLang,
  renderTemplate,
  TemplateName,
  TemplateVars,
} from './templates';

export interface SendResult {
  sent: boolean;
  status: 'sent' | 'skipped' | 'error';
  reason?: string;
}

// Platform (transactional) email sender for lifecycle mail: welcome-on-payment
// and abandoned-signup. Uses the same platform SMTP env as the password-reset
// mailer (SMTP_HOST/PORT/USER/PASS, EMAIL_FROM). Every send is best-effort and
// recorded in email_log for admin tracking; a missing SMTP config never throws,
// it logs a 'skipped' row so the gap is visible.
@Injectable()
export class PlatformMailerService {
  private readonly logger = new Logger(PlatformMailerService.name);
  private schemaReady = false;

  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
  ) {}

  // Self-healing schema: the platform runs migrations lazily, so create the
  // lifecycle columns / log table on first use (idempotent, cached per process).
  async ensureSchema(): Promise<void> {
    if (this.schemaReady) return;
    try {
      await this.db.query(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) DEFAULT 'en'`,
      );
      await this.db.query(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ`,
      );
      await this.db.query(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS abandoned_email_sent_at TIMESTAMPTZ`,
      );
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS email_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID,
          to_email TEXT NOT NULL,
          template VARCHAR(64) NOT NULL,
          language VARCHAR(5) NOT NULL DEFAULT 'en',
          subject TEXT,
          status VARCHAR(16) NOT NULL DEFAULT 'sent',
          error TEXT,
          provider VARCHAR(32) NOT NULL DEFAULT 'smtp',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`);
      await this.db.query(
        `CREATE INDEX IF NOT EXISTS idx_email_log_user ON email_log(user_id)`,
      );
      await this.db.query(
        `CREATE INDEX IF NOT EXISTS idx_email_log_created ON email_log(created_at DESC)`,
      );
      this.schemaReady = true;
    } catch (err: any) {
      // Do not cache failure — retry on the next call.
      this.logger.error(`email schema ensure failed: ${err?.message}`);
    }
  }

  private buildTransport() {
    const host = this.config.get('SMTP_HOST');
    const user = this.config.get('SMTP_USER');
    const pass = this.config.get('SMTP_PASS');
    const from = this.config.get('EMAIL_FROM') || user;
    const port = Number(this.config.get('SMTP_PORT')) || 587;
    if (!host || !user || !pass || !from) return null;
    return {
      from,
      transporter: nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      }),
    };
  }

  private async log(row: {
    userId?: string | null;
    to: string;
    template: TemplateName;
    language: MailLang | string;
    subject?: string;
    status: 'sent' | 'skipped' | 'error';
    error?: string;
  }): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO email_log (user_id, to_email, template, language, subject, status, error)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          row.userId || null,
          row.to,
          row.template,
          String(row.language || 'en').slice(0, 5),
          row.subject || null,
          row.status,
          row.error || null,
        ],
      );
    } catch (err: any) {
      this.logger.error(`email_log insert failed: ${err?.message}`);
    }
  }

  // Send a localized template. Never throws — returns a result the caller can
  // ignore. Records exactly one email_log row per attempt.
  async send(opts: {
    to: string;
    userId?: string | null;
    template: TemplateName;
    language?: string;
    vars: TemplateVars;
  }): Promise<SendResult> {
    await this.ensureSchema();
    const rendered = renderTemplate(opts.template, opts.language, opts.vars);

    const tx = this.buildTransport();
    if (!tx) {
      this.logger.warn(
        `Platform email '${opts.template}' not sent to ${opts.to}: SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_FROM).`,
      );
      await this.log({
        userId: opts.userId,
        to: opts.to,
        template: opts.template,
        language: opts.language || 'en',
        subject: rendered.subject,
        status: 'skipped',
        error: 'smtp_not_configured',
      });
      return { sent: false, status: 'skipped', reason: 'smtp_not_configured' };
    }

    try {
      await tx.transporter.sendMail({
        from: tx.from,
        to: opts.to,
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
      });
      await this.log({
        userId: opts.userId,
        to: opts.to,
        template: opts.template,
        language: opts.language || 'en',
        subject: rendered.subject,
        status: 'sent',
      });
      return { sent: true, status: 'sent' };
    } catch (err: any) {
      this.logger.error(
        `Platform email '${opts.template}' to ${opts.to} failed: ${err?.message}`,
      );
      await this.log({
        userId: opts.userId,
        to: opts.to,
        template: opts.template,
        language: opts.language || 'en',
        subject: rendered.subject,
        status: 'error',
        error: err?.message?.slice(0, 500),
      });
      return { sent: false, status: 'error', reason: err?.message };
    }
  }

  // Atomically claim + send the once-only welcome email after a confirmed
  // payment. The claim (welcome_email_sent_at IS NULL -> NOW()) guarantees a
  // single send even across duplicate/overlapping Paddle webhook deliveries.
  async sendWelcomeOnceByUserId(userId: string): Promise<SendResult | null> {
    await this.ensureSchema();
    let claim;
    try {
      claim = await this.db.query(
        `UPDATE users
            SET welcome_email_sent_at = NOW()
          WHERE id = $1 AND welcome_email_sent_at IS NULL
        RETURNING email, COALESCE(preferred_language, 'en') AS lang, name`,
        [userId],
      );
    } catch (err: any) {
      this.logger.error(`welcome claim failed for ${userId}: ${err?.message}`);
      return null;
    }
    if (!claim.rows.length) return null; // already sent, or user gone
    const { email, lang, name } = claim.rows[0];
    if (!email) return null;
    return this.send({
      to: email,
      userId,
      template: 'welcome',
      language: lang,
      vars: { name, ctaUrl: this.appUrl() },
    });
  }

  // Same once-only claim keyed by Paddle subscription id (webhook paths that
  // only know the subscription, not our user id).
  async sendWelcomeOnceBySubscription(subId: string): Promise<SendResult | null> {
    await this.ensureSchema();
    let claim;
    try {
      claim = await this.db.query(
        `UPDATE users
            SET welcome_email_sent_at = NOW()
          WHERE paddle_subscription_id = $1 AND welcome_email_sent_at IS NULL
        RETURNING id, email, COALESCE(preferred_language, 'en') AS lang, name`,
        [subId],
      );
    } catch (err: any) {
      this.logger.error(
        `welcome claim by sub failed for ${subId}: ${err?.message}`,
      );
      return null;
    }
    if (!claim.rows.length) return null;
    const { id, email, lang, name } = claim.rows[0];
    if (!email) return null;
    return this.send({
      to: email,
      userId: id,
      template: 'welcome',
      language: lang,
      vars: { name, ctaUrl: this.appUrl() },
    });
  }

  appUrl(): string {
    return (
      this.config.get('APP_URL') ||
      this.config.get('FRONTEND_URL') ||
      'https://app.cortexa.com'
    );
  }

  // Recent delivery log for the admin tracking view.
  async recentLog(limit = 100): Promise<any[]> {
    await this.ensureSchema();
    const n = Math.min(Math.max(Number(limit) || 100, 1), 500);
    const { rows } = await this.db.query(
      `SELECT id, user_id, to_email, template, language, subject, status, error, provider, created_at
         FROM email_log
        ORDER BY created_at DESC
        LIMIT $1`,
      [n],
    );
    return rows;
  }
}
