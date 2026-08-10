import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import { DatabaseService } from '../database/database.service';
import { ConfigService } from '../config/config.service';
import { renderTemplate, TemplateName, TemplateVars } from './templates';

export interface SendResult {
  sent: boolean;
  status: 'sent' | 'skipped' | 'error';
  reason?: string;
}

// Platform (transactional) email sender for lifecycle mail: welcome-on-payment
// and the scheduled abandoned-signup sequence.
//
// Delivery provider: SendGrid (platform SENDGRID_API_KEY + SENDGRID_FROM_EMAIL)
// when configured, else SMTP (SMTP_HOST/PORT/USER/PASS, EMAIL_FROM). SendGrid
// gives real delivered/open/click via its Event Webhook (mapped by a per-email
// track_token in custom_args); the SMTP path uses our own open-pixel + click
// redirect. Every send/attempt is recorded in email_log for admin tracking, and
// nothing throws to the caller.
@Injectable()
export class PlatformMailerService {
  private readonly logger = new Logger(PlatformMailerService.name);
  private schemaReady = false;

  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
  ) {}

  // ---- schema (self-healing; migrations are not auto-run here) ----
  async ensureSchema(): Promise<void> {
    if (this.schemaReady) return;
    try {
      const userCols = [
        `preferred_language VARCHAR(5) DEFAULT 'en'`,
        `welcome_email_sent_at TIMESTAMPTZ`,
        `getting_started_email_sent_at TIMESTAMPTZ`,
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
        `billing_cycle VARCHAR(10)`,
        `plan_status VARCHAR(24) DEFAULT 'active'`,
        `paddle_customer_id TEXT`,
        `paddle_subscription_id TEXT`,
        `signup_source VARCHAR(32)`,
        `upgraded_at TIMESTAMPTZ`,
        `deleted_at TIMESTAMPTZ`,
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
          delivered_at TIMESTAMPTZ,
          opened_at TIMESTAMPTZ,
          clicked_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`);
      const logCols = [
        `track_token UUID`,
        `scheduled_at TIMESTAMPTZ`,
        `sent_at TIMESTAMPTZ`,
        `delivered_at TIMESTAMPTZ`,
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
      await this.db.query(
        `CREATE INDEX IF NOT EXISTS idx_email_log_due ON email_log(status, scheduled_at)`,
      );
      this.schemaReady = true;
    } catch (err: any) {
      this.logger.error(`email schema ensure failed: ${err?.message}`);
    }
  }

  // ---- config / urls ----
  appUrl(): string {
    return (
      this.config.get('APP_URL') ||
      this.config.get('FRONTEND_URL') ||
      'https://www.cortexaaicrm.com'
    );
  }
  private backendUrl(): string {
    return this.config.get('BACKEND_URL') || 'https://backend.cortexaaicrm.com';
  }
  private supportEmail(): string {
    return this.config.get('SUPPORT_EMAIL') || 'support@cortexaaicrm.com';
  }
  private continueUrl(): string {
    return (
      this.config.get('ABANDONED_SIGNUP_CTA_URL') || `${this.appUrl()}/trial`
    );
  }
  private editorialUrl(lang: string): string {
    const prefix = lang === 'es' ? '/es' : lang === 'pt' ? '/pt' : '';
    return `${this.appUrl()}${prefix}/editorial/business`;
  }
  // Onboarding / account-setup page for the getting-started email (never the
  // plain homepage).
  private onboardingUrl(): string {
    return (
      this.config.get('ONBOARDING_URL') ||
      `${this.appUrl()}/dashboard/ai-cortexa-setup`
    );
  }
  // Billing page for retry-payment and reactivate links.
  private billingUrl(): string {
    return this.config.get('BILLING_URL') || `${this.appUrl()}/account/billing`;
  }

  private sendgridConfig(): { key: string; from: string; name?: string } | null {
    const key = this.config.get('SENDGRID_API_KEY');
    const from =
      this.config.get('SENDGRID_FROM_EMAIL') || this.config.get('EMAIL_FROM');
    const name = this.config.get('SENDGRID_FROM_NAME');
    return key && from ? { key, from, name } : null;
  }

  // SendGrid requires from.email to be a BARE address. Our EMAIL_FROM is often
  // stored in SMTP "Display Name <email@x>" form (accepted by nodemailer, but
  // rejected by SendGrid as "the from email does not contain a valid address").
  // Parse either shape into { email, name } so the same verified sender works on
  // both providers, and default a friendly From name when none is given.
  private parseSender(
    raw: string,
    fallbackName?: string,
  ): { email: string; name?: string } | null {
    const s = String(raw || '').trim();
    if (!s) return null;
    const m = s.match(/^\s*(.*?)\s*<\s*([^<>]+?)\s*>\s*$/);
    const email = (m ? m[2] : s).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
    const name = (m && m[1] ? m[1] : fallbackName || '')
      .replace(/^["']|["']$/g, '')
      .trim();
    return name ? { email, name } : { email };
  }

  private buildSmtp() {
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

  // Our own open-pixel + click-redirect, used only on the SMTP path (SendGrid
  // does its own tracking natively + via the Event Webhook).
  private addTracking(html: string, token: string): string {
    const base = `${this.backendUrl()}/api/email/track`;
    const tracked = html.replace(
      /href="(https?:\/\/[^"]+)"/g,
      (_m, url) => `href="${base}/click/${token}?u=${encodeURIComponent(url)}"`,
    );
    return `${tracked}<img src="${base}/open/${token}.png" alt="" width="1" height="1" style="display:none" />`;
  }

  // ---- low-level delivery (SendGrid preferred, else SMTP) ----
  private async deliver(opts: {
    to: string;
    subject: string;
    html: string;
    text: string;
    token: string;
  }): Promise<{ ok: boolean; provider: string; error?: string }> {
    const sg = this.sendgridConfig();
    if (sg) {
      const sender = this.parseSender(sg.from, sg.name || 'Cortexa AI CRM');
      if (!sender) {
        return {
          ok: false,
          provider: 'sendgrid',
          error:
            `invalid_sender: the configured sender ("${sg.from}") is not a valid email address. ` +
            `Set SENDGRID_FROM_EMAIL to your verified bare sender (e.g. no-reply@cortexaaicrm.com) ` +
            `and optionally SENDGRID_FROM_NAME for the display name.`,
        };
      }
      try {
        const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sg.key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [
              { to: [{ email: opts.to }], custom_args: { token: opts.token } },
            ],
            from: sender,
            subject: opts.subject,
            content: [{ type: 'text/html', value: opts.html }],
            custom_args: { token: opts.token },
            tracking_settings: {
              click_tracking: { enable: true, enable_text: false },
              open_tracking: { enable: true },
            },
          }),
        });
        if (!res.ok) {
          const t = await res.text().catch(() => '');
          return {
            ok: false,
            provider: 'sendgrid',
            error: `sendgrid ${res.status}: ${t.slice(0, 300)}`,
          };
        }
        return { ok: true, provider: 'sendgrid' };
      } catch (err: any) {
        return { ok: false, provider: 'sendgrid', error: err?.message };
      }
    }
    const tx = this.buildSmtp();
    if (!tx) return { ok: false, provider: 'smtp', error: 'smtp_not_configured' };
    try {
      await tx.transporter.sendMail({
        from: tx.from,
        to: opts.to,
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
      });
      return { ok: true, provider: 'smtp' };
    } catch (err: any) {
      return { ok: false, provider: 'smtp', error: err?.message };
    }
  }

  private providerName(): string {
    return this.sendgridConfig() ? 'sendgrid' : 'smtp';
  }

  private htmlFor(rawHtml: string, token: string): string {
    // SendGrid tracks natively; only the SMTP path needs our pixel/redirect.
    return this.sendgridConfig() ? rawHtml : this.addTracking(rawHtml, token);
  }

  // ---- immediate send (welcome) : inserts a fresh email_log row ----
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
    const html = this.htmlFor(rendered.html, token);

    const result = await this.deliver({
      to: opts.to,
      subject: rendered.subject,
      html,
      text: rendered.text,
      token,
    });
    const status: 'sent' | 'skipped' | 'error' = result.ok
      ? 'sent'
      : result.error === 'smtp_not_configured'
        ? 'skipped'
        : 'error';
    if (status === 'error') {
      this.logger.error(
        `Platform email '${opts.template}' to ${opts.to} failed: ${result.error}`,
      );
    } else if (status === 'skipped') {
      this.logger.warn(
        `Platform email '${opts.template}' not sent to ${opts.to}: no email provider configured (set SENDGRID_API_KEY + SENDGRID_FROM_EMAIL, or SMTP_*).`,
      );
    }
    try {
      await this.db.query(
        `INSERT INTO email_log
           (user_id, to_email, template, language, subject, status, error, provider, track_token, sent_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          opts.userId || null,
          opts.to,
          opts.template,
          String(opts.language || 'en').slice(0, 5),
          rendered.subject,
          status,
          result.ok ? null : result.error?.slice(0, 500),
          result.provider,
          token,
          status === 'sent' ? new Date() : null,
        ],
      );
    } catch (err: any) {
      this.logger.error(`email_log insert failed: ${err?.message}`);
    }
    return {
      sent: result.ok,
      status,
      reason: result.ok ? undefined : result.error,
    };
  }

  // ---- admin free-form email (composed from the Customers hub) ----
  // Sends a raw subject/html through the same provider (SendGrid preferred, else
  // SMTP) and records it in email_log like any other send. Never throws.
  async sendCustomEmail(opts: {
    to: string;
    userId?: string | null;
    subject: string;
    html: string;
    text?: string;
  }): Promise<SendResult> {
    await this.ensureSchema();
    const token = crypto.randomUUID();
    const html = this.htmlFor(opts.html, token);
    const result = await this.deliver({
      to: opts.to,
      subject: opts.subject,
      html,
      text: opts.text || opts.html.replace(/<[^>]+>/g, ' '),
      token,
    });
    const status: 'sent' | 'skipped' | 'error' = result.ok
      ? 'sent'
      : result.error === 'smtp_not_configured'
        ? 'skipped'
        : 'error';
    try {
      await this.db.query(
        `INSERT INTO email_log
           (user_id, to_email, template, language, subject, status, error, provider, track_token, sent_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          opts.userId || null,
          opts.to,
          'admin_custom',
          'en',
          opts.subject,
          status,
          result.ok ? null : result.error?.slice(0, 500),
          result.provider,
          token,
          status === 'sent' ? new Date() : null,
        ],
      );
    } catch (err: any) {
      this.logger.error(`admin_custom email_log insert failed: ${err?.message}`);
    }
    return {
      sent: result.ok,
      status,
      reason: result.ok ? undefined : result.error,
    };
  }

  // ---- abandoned sequence: schedule at signup, cancel on pay, worker sends ----

  // Queue the 3 abandoned emails as 'scheduled' rows. Idempotent per user (only
  // schedules templates that are not already queued/sent for them).
  async scheduleAbandonedSequence(
    userId: string,
    email: string,
    lang: string,
  ): Promise<void> {
    if (!userId || !email) return;
    await this.ensureSchema();
    const plan: Array<[TemplateName, string]> = [
      ['abandoned_1', "INTERVAL '7 minutes'"],
      ['abandoned_2', "INTERVAL '24 hours'"],
      ['abandoned_3', "INTERVAL '72 hours'"],
    ];
    for (const [template, iv] of plan) {
      try {
        await this.db.query(
          `INSERT INTO email_log
             (user_id, to_email, template, language, status, scheduled_at, track_token, created_at)
           SELECT $1, $2, $3, $4, 'scheduled', NOW() + ${iv}, gen_random_uuid(), NOW()
            WHERE NOT EXISTS (
              SELECT 1 FROM email_log
               WHERE user_id = $1 AND template = $3
                 AND status IN ('scheduled', 'sent')
            )`,
          [userId, email, template, String(lang || 'en').slice(0, 5)],
        );
      } catch (err: any) {
        this.logger.error(`schedule ${template} failed: ${err?.message}`);
      }
    }
  }

  // Cancel any still-pending abandoned emails for a user (called on payment).
  async cancelScheduled(userId: string): Promise<void> {
    if (!userId) return;
    await this.ensureSchema();
    try {
      await this.db.query(
        `UPDATE email_log SET status = 'canceled'
          WHERE user_id = $1 AND status = 'scheduled'`,
        [userId],
      );
    } catch (err: any) {
      this.logger.error(`cancelScheduled failed: ${err?.message}`);
    }
  }

  // Cron worker: send scheduled abandoned emails that are due, re-checking
  // payment for each (a paid user's remaining queue is canceled, not sent).
  async sendScheduledDue(): Promise<void> {
    await this.ensureSchema();
    let due: any[] = [];
    try {
      const { rows } = await this.db.query(
        `SELECT el.id, el.track_token, el.template, el.language, el.to_email, el.user_id,
                u.name, u.payment_status, u.checkout_status, u.welcome_email_sent_at
           FROM email_log el
           JOIN users u ON u.id = el.user_id
          WHERE el.status = 'scheduled'
            AND el.scheduled_at <= NOW()
          ORDER BY el.scheduled_at ASC
          LIMIT 200`,
      );
      due = rows;
    } catch (err: any) {
      this.logger.error(`sendScheduledDue query failed: ${err?.message}`);
      return;
    }

    for (const r of due) {
      const paid =
        r.payment_status === 'active' ||
        r.checkout_status === 'paid' ||
        r.welcome_email_sent_at;
      if (paid) {
        await this.db.query(
          `UPDATE email_log SET status = 'canceled' WHERE id = $1`,
          [r.id],
        );
        continue;
      }
      // Atomic claim so overlapping runs never double-send this row.
      const claim = await this.db.query(
        `UPDATE email_log SET status = 'sending'
          WHERE id = $1 AND status = 'scheduled' RETURNING id`,
        [r.id],
      );
      if (!claim.rows.length) continue;

      const vars: TemplateVars = {
        name: r.name,
        ctaUrl: this.continueUrl(),
      };
      if (r.template === 'abandoned_2') {
        vars.editorialUrl = this.editorialUrl(r.language);
      }
      const rendered = renderTemplate(r.template, r.language, vars);
      const token = r.track_token || crypto.randomUUID();
      const html = this.htmlFor(rendered.html, token);
      const result = await this.deliver({
        to: r.to_email,
        subject: rendered.subject,
        html,
        text: rendered.text,
        token,
      });
      const status = result.ok
        ? 'sent'
        : result.error === 'smtp_not_configured'
          ? 'skipped'
          : 'error';
      await this.db.query(
        `UPDATE email_log
            SET status = $2,
                subject = $3,
                provider = $4,
                error = $5,
                track_token = $6,
                sent_at = CASE WHEN $2 = 'sent' THEN NOW() ELSE sent_at END
          WHERE id = $1`,
        [
          r.id,
          status,
          rendered.subject,
          result.provider,
          result.ok ? null : result.error?.slice(0, 500),
          token,
        ],
      );
      if (status === 'skipped') {
        // No provider yet: put it back to scheduled so it is retried once set up.
        await this.db.query(
          `UPDATE email_log SET status = 'scheduled' WHERE id = $1`,
          [r.id],
        );
      }
    }
  }

  // ---- welcome ----
  private welcomeVars(name?: string | null): TemplateVars {
    const app = this.appUrl();
    return {
      name,
      ctaUrl: `${app}/sign-in`,
      dashboardUrl: `${app}/dashboard`,
      supportEmail: this.supportEmail(),
    };
  }
  private gettingStartedVars(name?: string | null): TemplateVars {
    return {
      name,
      ctaUrl: this.onboardingUrl(),
      supportEmail: this.supportEmail(),
    };
  }
  private billingEmailVars(name?: string | null): TemplateVars {
    return {
      name,
      ctaUrl: this.billingUrl(),
      supportEmail: this.supportEmail(),
    };
  }

  // Resolve a recipient (email + language + name) by our user id or by the
  // linked Paddle subscription id. Used by the event-driven billing emails.
  private async resolveRecipient(opts: {
    userId?: string | null;
    subId?: string | null;
  }): Promise<{ id: string; email: string; lang: string; name: string } | null> {
    try {
      if (opts.userId) {
        const { rows } = await this.db.query(
          `SELECT id, email, COALESCE(preferred_language, 'en') AS lang, name
             FROM users WHERE id = $1`,
          [opts.userId],
        );
        return rows[0] || null;
      }
      if (opts.subId) {
        const { rows } = await this.db.query(
          `SELECT id, email, COALESCE(preferred_language, 'en') AS lang, name
             FROM users WHERE paddle_subscription_id = $1`,
          [opts.subId],
        );
        return rows[0] || null;
      }
    } catch (err: any) {
      this.logger.error(`resolveRecipient failed: ${err?.message}`);
    }
    return null;
  }

  async sendWelcomeOnceByUserId(userId: string): Promise<SendResult | null> {
    await this.ensureSchema();
    let claim;
    try {
      claim = await this.db.query(
        `UPDATE users SET welcome_email_sent_at = NOW()
          WHERE id = $1 AND welcome_email_sent_at IS NULL
        RETURNING email, COALESCE(preferred_language, 'en') AS lang, name`,
        [userId],
      );
    } catch (err: any) {
      this.logger.error(`welcome claim failed for ${userId}: ${err?.message}`);
      return null;
    }
    if (!claim.rows.length) return null;
    await this.cancelScheduled(userId);
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

  async sendWelcomeOnceBySubscription(subId: string): Promise<SendResult | null> {
    await this.ensureSchema();
    let claim;
    try {
      claim = await this.db.query(
        `UPDATE users SET welcome_email_sent_at = NOW()
          WHERE paddle_subscription_id = $1 AND welcome_email_sent_at IS NULL
        RETURNING id, email, COALESCE(preferred_language, 'en') AS lang, name`,
        [subId],
      );
    } catch (err: any) {
      this.logger.error(`welcome claim by sub failed: ${err?.message}`);
      return null;
    }
    if (!claim.rows.length) return null;
    const { id, email, lang, name } = claim.rows[0];
    await this.cancelScheduled(id);
    if (!email) return null;
    return this.send({
      to: email,
      userId: id,
      template: 'welcome',
      language: lang,
      vars: this.welcomeVars(name),
    });
  }

  // ---- getting started (once-only, right after the welcome) ----
  async sendGettingStartedOnce(opts: {
    userId?: string | null;
    subId?: string | null;
  }): Promise<SendResult | null> {
    await this.ensureSchema();
    let claim;
    try {
      if (opts.userId) {
        claim = await this.db.query(
          `UPDATE users SET getting_started_email_sent_at = NOW()
            WHERE id = $1 AND getting_started_email_sent_at IS NULL
          RETURNING id, email, COALESCE(preferred_language, 'en') AS lang, name`,
          [opts.userId],
        );
      } else if (opts.subId) {
        claim = await this.db.query(
          `UPDATE users SET getting_started_email_sent_at = NOW()
            WHERE paddle_subscription_id = $1 AND getting_started_email_sent_at IS NULL
          RETURNING id, email, COALESCE(preferred_language, 'en') AS lang, name`,
          [opts.subId],
        );
      } else {
        return null;
      }
    } catch (err: any) {
      this.logger.error(`getting-started claim failed: ${err?.message}`);
      return null;
    }
    if (!claim.rows.length) return null;
    const { id, email, lang, name } = claim.rows[0];
    if (!email) return null;
    return this.send({
      to: email,
      userId: id,
      template: 'getting_started',
      language: lang,
      vars: this.gettingStartedVars(name),
    });
  }

  // ---- billing lifecycle (event-driven; deduped upstream by webhook_events) ----
  async sendPaymentFailed(opts: {
    userId?: string | null;
    subId?: string | null;
  }): Promise<SendResult | null> {
    const r = await this.resolveRecipient(opts);
    if (!r || !r.email) return null;
    return this.send({
      to: r.email,
      userId: r.id,
      template: 'payment_failed',
      language: r.lang,
      vars: this.billingEmailVars(r.name),
    });
  }

  async sendSubscriptionCanceled(opts: {
    userId?: string | null;
    subId?: string | null;
  }): Promise<SendResult | null> {
    const r = await this.resolveRecipient(opts);
    if (!r || !r.email) return null;
    return this.send({
      to: r.email,
      userId: r.id,
      template: 'subscription_canceled',
      language: r.lang,
      vars: this.billingEmailVars(r.name),
    });
  }

  // ---- admin test send (verify any template to any address, no real payment) ----
  // Sends a chosen template with representative sample vars, and logs it like any
  // real send so it shows up in the admin email log. Used by the admin test tool.
  async sendTestEmail(opts: {
    to: string;
    template: TemplateName;
    language?: string;
  }): Promise<SendResult> {
    await this.ensureSchema();
    const name = 'Test';
    let vars: TemplateVars;
    switch (opts.template) {
      case 'welcome':
        vars = this.welcomeVars(name);
        break;
      case 'getting_started':
        vars = this.gettingStartedVars(name);
        break;
      case 'payment_failed':
      case 'subscription_canceled':
        vars = this.billingEmailVars(name);
        break;
      default:
        // abandoned_1 / abandoned_2 / abandoned_3
        vars = { name, ctaUrl: this.continueUrl() };
        if (opts.template === 'abandoned_2') {
          vars.editorialUrl = this.editorialUrl(opts.language || 'en');
        }
    }
    return this.send({
      to: opts.to,
      template: opts.template,
      language: opts.language,
      vars,
    });
  }

  // ---- engagement tracking ----
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

  // SendGrid Event Webhook: array of events, each carrying our custom_args.token.
  async recordSendgridEvents(events: any[]): Promise<void> {
    if (!Array.isArray(events)) return;
    await this.ensureSchema();
    for (const ev of events) {
      const token = ev?.token || ev?.custom_args?.token;
      if (!token) continue;
      try {
        if (ev.event === 'delivered') {
          await this.db.query(
            `UPDATE email_log SET delivered_at = COALESCE(delivered_at, NOW()) WHERE track_token = $1`,
            [token],
          );
        } else if (ev.event === 'open') {
          await this.db.query(
            `UPDATE email_log SET opened_at = COALESCE(opened_at, NOW()),
                    delivered_at = COALESCE(delivered_at, NOW()) WHERE track_token = $1`,
            [token],
          );
        } else if (ev.event === 'click') {
          await this.db.query(
            `UPDATE email_log SET clicked_at = COALESCE(clicked_at, NOW()),
                    opened_at = COALESCE(opened_at, NOW()),
                    delivered_at = COALESCE(delivered_at, NOW()) WHERE track_token = $1`,
            [token],
          );
        } else if (ev.event === 'bounce' || ev.event === 'dropped') {
          await this.db.query(
            `UPDATE email_log SET status = 'error', error = $2 WHERE track_token = $1`,
            [token, String(ev.event)],
          );
        }
      } catch (err: any) {
        this.logger.error(`sendgrid event failed: ${err?.message}`);
      }
    }
  }

  // Recent delivery log for the admin tracking view.
  async recentLog(limit = 100): Promise<any[]> {
    await this.ensureSchema();
    const n = Math.min(Math.max(Number(limit) || 100, 1), 500);
    const { rows } = await this.db.query(
      `SELECT id, user_id, to_email, template, language, subject, status, error,
              provider, scheduled_at, sent_at, delivered_at, opened_at, clicked_at, created_at
         FROM email_log
        ORDER BY created_at DESC
        LIMIT $1`,
      [n],
    );
    return rows;
  }
}
