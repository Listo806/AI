import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
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
// and the abandoned-signup sequence. Uses the same platform SMTP env as the
// password-reset mailer (SMTP_HOST/PORT/USER/PASS, EMAIL_FROM). Every send is
// best-effort and recorded in email_log with open/click tracking; a missing SMTP
// config never throws, it logs a 'skipped' row so the gap is visible.
@Injectable()
export class PlatformMailerService {
  private readonly logger = new Logger(PlatformMailerService.name);
  private schemaReady = false;

  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
  ) {}

  // Self-healing schema: migrations are not auto-run here, so create the
  // lifecycle columns / log table on first use (idempotent, cached per process).
  async ensureSchema(): Promise<void> {
    if (this.schemaReady) return;
    try {
      const userCols = [
        `preferred_language VARCHAR(5) DEFAULT 'en'`,
        `welcome_email_sent_at TIMESTAMPTZ`,
        `abandoned_email_sent_at TIMESTAMPTZ`,
        `abandoned_stage SMALLINT NOT NULL DEFAULT 0`,
        `checkout_status VARCHAR(24) DEFAULT 'registered'`,
        `registered_at TIMESTAMPTZ DEFAULT NOW()`,
        `landing_page TEXT`,
        `utm_source TEXT`,
        `utm_medium TEXT`,
        `utm_campaign TEXT`,
        `utm_term TEXT`,
        `utm_content TEXT`,
        `gclid TEXT`,
        `offer_used VARCHAR(32)`,
      ];
      for (const c of userCols) {
        await this.db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${c}`);
      }
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
          track_token UUID,
          scheduled_at TIMESTAMPTZ,
          sent_at TIMESTAMPTZ,
          opened_at TIMESTAMPTZ,
          clicked_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`);
      const logCols = [
        `track_token UUID`,
        `scheduled_at TIMESTAMPTZ`,
        `sent_at TIMESTAMPTZ`,
        `opened_at TIMESTAMPTZ`,
        `clicked_at TIMESTAMPTZ`,
      ];
      for (const c of logCols) {
        await this.db.query(
          `ALTER TABLE email_log ADD COLUMN IF NOT EXISTS ${c}`,
        );
      }
      await this.db.query(
        `CREATE INDEX IF NOT EXISTS idx_email_log_user ON email_log(user_id)`,
      );
      await this.db.query(
        `CREATE INDEX IF NOT EXISTS idx_email_log_created ON email_log(created_at DESC)`,
      );
      await this.db.query(
        `CREATE INDEX IF NOT EXISTS idx_email_log_track ON email_log(track_token)`,
      );
      this.schemaReady = true;
    } catch (err: any) {
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

  appUrl(): string {
    return (
      this.config.get('APP_URL') ||
      this.config.get('FRONTEND_URL') ||
      'https://www.cortexaaicrm.com'
    );
  }

  private backendUrl(): string {
    return (
      this.config.get('BACKEND_URL') || 'https://backend.cortexaaicrm.com'
    );
  }

  private supportEmail(): string {
    return this.config.get('SUPPORT_EMAIL') || 'support@cortexaaicrm.com';
  }

  // Wrap outbound http(s) links with a click-tracking redirect and append an
  // invisible open-tracking pixel, both routed through our own backend (no email
  // provider needed). The mailto: support link and the pixel itself are untouched.
  private addTracking(html: string, token: string): string {
    const base = `${this.backendUrl()}/api/email/track`;
    const tracked = html.replace(
      /href="(https?:\/\/[^"]+)"/g,
      (_m, url) => `href="${base}/click/${token}?u=${encodeURIComponent(url)}"`,
    );
    return `${tracked}<img src="${base}/open/${token}.png" alt="" width="1" height="1" style="display:none" />`;
  }

  private async logRow(row: {
    userId?: string | null;
    to: string;
    template: TemplateName;
    language: MailLang | string;
    subject?: string;
    status: 'sent' | 'skipped' | 'error';
    error?: string;
    token: string;
  }): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO email_log
           (user_id, to_email, template, language, subject, status, error, track_token, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          row.userId || null,
          row.to,
          row.template,
          String(row.language || 'en').slice(0, 5),
          row.subject || null,
          row.status,
          row.error || null,
          row.token,
          row.status === 'sent' ? new Date() : null,
        ],
      );
    } catch (err: any) {
      this.logger.error(`email_log insert failed: ${err?.message}`);
    }
  }

  // Send a localized template. Never throws. Records exactly one email_log row
  // per attempt, with a tracking token for open/click.
  async send(opts: {
    to: string;
    userId?: string | null;
    template: TemplateName;
    language?: string;
    vars: TemplateVars;
  }): Promise<SendResult> {
    await this.ensureSchema();
    const token = crypto.randomUUID();
    const rendered = renderTemplate(opts.template, opts.language, opts.vars);
    const html = this.addTracking(rendered.html, token);

    const tx = this.buildTransport();
    if (!tx) {
      this.logger.warn(
        `Platform email '${opts.template}' not sent to ${opts.to}: SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_FROM).`,
      );
      await this.logRow({
        userId: opts.userId,
        to: opts.to,
        template: opts.template,
        language: opts.language || 'en',
        subject: rendered.subject,
        status: 'skipped',
        error: 'smtp_not_configured',
        token,
      });
      return { sent: false, status: 'skipped', reason: 'smtp_not_configured' };
    }

    try {
      await tx.transporter.sendMail({
        from: tx.from,
        to: opts.to,
        subject: rendered.subject,
        text: rendered.text,
        html,
      });
      await this.logRow({
        userId: opts.userId,
        to: opts.to,
        template: opts.template,
        language: opts.language || 'en',
        subject: rendered.subject,
        status: 'sent',
        token,
      });
      return { sent: true, status: 'sent' };
    } catch (err: any) {
      this.logger.error(
        `Platform email '${opts.template}' to ${opts.to} failed: ${err?.message}`,
      );
      await this.logRow({
        userId: opts.userId,
        to: opts.to,
        template: opts.template,
        language: opts.language || 'en',
        subject: rendered.subject,
        status: 'error',
        error: err?.message?.slice(0, 500),
        token,
      });
      return { sent: false, status: 'error', reason: err?.message };
    }
  }

  // Full welcome vars: login button + dashboard link + support contact.
  private welcomeVars(name?: string | null): TemplateVars {
    const app = this.appUrl();
    return {
      name,
      ctaUrl: `${app}/sign-in`,
      dashboardUrl: `${app}/dashboard`,
      supportEmail: this.supportEmail(),
    };
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
      vars: this.welcomeVars(name),
    });
  }

  // Same once-only claim keyed by Paddle subscription id.
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
      vars: this.welcomeVars(name),
    });
  }

  // --- Open / click tracking (called by the tracking controller) ---

  async recordOpen(token: string): Promise<void> {
    try {
      await this.db.query(
        `UPDATE email_log SET opened_at = COALESCE(opened_at, NOW()) WHERE track_token = $1`,
        [token],
      );
    } catch (err: any) {
      this.logger.error(`recordOpen failed: ${err?.message}`);
    }
  }

  async recordClick(token: string): Promise<void> {
    try {
      await this.db.query(
        `UPDATE email_log
            SET clicked_at = COALESCE(clicked_at, NOW()),
                opened_at = COALESCE(opened_at, NOW())
          WHERE track_token = $1`,
        [token],
      );
    } catch (err: any) {
      this.logger.error(`recordClick failed: ${err?.message}`);
    }
  }

  // Recent delivery log for the admin tracking view.
  async recentLog(limit = 100): Promise<any[]> {
    await this.ensureSchema();
    const n = Math.min(Math.max(Number(limit) || 100, 1), 500);
    const { rows } = await this.db.query(
      `SELECT id, user_id, to_email, template, language, subject, status, error,
              provider, scheduled_at, sent_at, opened_at, clicked_at, created_at
         FROM email_log
        ORDER BY created_at DESC
        LIMIT $1`,
      [n],
    );
    return rows;
  }
}
