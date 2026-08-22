import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import { DatabaseService } from '../database/database.service';
import { ConfigService } from '../config/config.service';
import { renderTemplate, TemplateName, TemplateVars } from './templates';
import { getPlan } from '../plans/plan-config';

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
        // Incomplete-registration recovery (Free-plan recovery email).
        `recovery_email_sent_at TIMESTAMPTZ`,
        `recovery_token TEXT`,
        `recovery_token_expires TIMESTAMPTZ`,
        `recovery_activated_at TIMESTAMPTZ`,
        `recovery_source VARCHAR(48)`,
        // Email marketing opt-out, hard-bounce suppression, and a stable
        // per-user unsubscribe token for the onboarding footer link.
        `email_opt_out BOOLEAN NOT NULL DEFAULT false`,
        `email_opt_out_at TIMESTAMPTZ`,
        `email_bounced_at TIMESTAMPTZ`,
        `email_unsub_token TEXT`,
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
        // Manual (admin-triggered) single-customer sends: 'auto' vs 'manual',
        // which admin sent it, and a dedupe key for accidental double sends.
        `send_type VARCHAR(16) NOT NULL DEFAULT 'auto'`,
        `sent_by_admin_id UUID`,
        `manual_idempotency_key TEXT`,
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
      // One row per (user, Free-onboarding template) ever, so concurrent
      // enrollments (e.g. a double-clicked "Select Free") can never duplicate.
      // The sequence-uniqueness indexes must apply to AUTOMATIC rows only, so a
      // manual admin send of the same template to the same customer does not
      // collide with their queued/sent sequence row. Recreate them scoped to
      // send_type='auto' (drop first so an older, unscoped index is replaced).
      await this.db.query(`DROP INDEX IF EXISTS idx_email_log_free_uniq`);
      await this.db.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_email_log_free_uniq
           ON email_log(user_id, template)
          WHERE template IN ('free_welcome','free_plan_value','free_ai','free_team','free_upgrade')
            AND send_type = 'auto'`,
      );
      await this.db.query(`DROP INDEX IF EXISTS idx_email_log_onb_uniq`);
      await this.db.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_email_log_onb_uniq
           ON email_log(user_id, template)
          WHERE template IN ('onb_welcome','onb_support','onb_ai','onb_invite_team','onb_connect','onb_system','onb_ready','onb_team')
            AND send_type = 'auto'`,
      );
      // Dedupe key for manual admin sends: at most one row per idempotency key,
      // so a double-clicked "Send Email" can never deliver twice.
      await this.db.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_email_log_manual_idem
           ON email_log(manual_idempotency_key)
          WHERE manual_idempotency_key IS NOT NULL`,
      );
      this.schemaReady = true;
    } catch (err: any) {
      this.logger.error(`email schema ensure failed: ${err?.message}`);
    }
  }

  // ---- config / urls ----
  // Email CTAs need ONE absolute base URL. APP_URL / FRONTEND_URL are sometimes set
  // to a comma-separated CORS origin LIST (e.g. "a.com,https://www.a.com,http://localhost:5173"),
  // which would otherwise produce a broken link like "<list>/activate-free". Resolve
  // to a single clean origin: prefer the first https, non-localhost entry, then any
  // non-localhost entry, then the first entry; strip a trailing slash.
  appUrl(): string {
    const raw =
      this.config.get('APP_URL') ||
      this.config.get('FRONTEND_URL') ||
      'https://www.cortexaaicrm.com';
    const parts = String(raw)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const isLocal = (u: string) => /localhost|127\.0\.0\.1|:\d{2,5}\b/i.test(u);
    const pick =
      parts.find((p) => /^https:\/\//i.test(p) && !isLocal(p)) ||
      parts.find((p) => !isLocal(p)) ||
      parts[0] ||
      'https://www.cortexaaicrm.com';
    return pick.replace(/\/+$/, '');
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
            // Replies (and the "Reply to this email" button) route to the real
            // support inbox regardless of the verified From sender.
            reply_to: { email: this.supportEmail() },
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
        replyTo: this.supportEmail(),
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

  // ---- incomplete-registration recovery (Free-plan recovery email) ----

  private recoveryUrl(rawToken: string): string {
    const base =
      this.config.get('RECOVERY_CTA_BASE_URL') ||
      `${this.appUrl()}/activate-free`;
    return `${base}?token=${encodeURIComponent(rawToken)}`;
  }

  private hashRecoveryToken(raw: string): string {
    return crypto.createHash('sha256').update(String(raw)).digest('hex');
  }

  // Queue the single recovery email as a 'scheduled' row, ~2 minutes out.
  // Idempotent per user (only one recovery row is ever queued/sent), so at most
  // one recovery email is ever sent per incomplete registration.
  async scheduleRecoveryEmail(
    userId: string,
    email: string,
    lang: string,
  ): Promise<void> {
    if (!userId || !email) return;
    await this.ensureSchema();
    try {
      await this.db.query(
        `INSERT INTO email_log
           (user_id, to_email, template, language, status, scheduled_at, track_token, created_at)
         SELECT $1, $2, 'recovery', $3, 'scheduled', NOW() + INTERVAL '2 minutes', gen_random_uuid(), NOW()
          WHERE NOT EXISTS (
            SELECT 1 FROM email_log
             WHERE user_id = $1 AND template = 'recovery'
               AND status IN ('scheduled', 'sending', 'sent')
          )`,
        [userId, email, String(lang || 'en').slice(0, 5)],
      );
    } catch (err: any) {
      this.logger.error(`schedule recovery failed: ${err?.message}`);
    }
  }

  // Cron worker: send due recovery emails, re-checking the account per row so a
  // user who has since activated ANY plan (Free or paid) is canceled, never sent.
  // A fresh single-use activation token is minted at send time; only its hash is
  // stored on the user. At most one recovery email per account.
  async sendRecoveryDue(): Promise<void> {
    await this.ensureSchema();
    let due: any[] = [];
    try {
      const { rows } = await this.db.query(
        `SELECT el.id, el.track_token, el.language, el.to_email, el.user_id,
                u.name, u.payment_status, u.checkout_status, u.selected_plan,
                u.recovery_email_sent_at
           FROM email_log el
           JOIN users u ON u.id = el.user_id
          WHERE el.template = 'recovery'
            AND el.status = 'scheduled'
            AND el.scheduled_at <= NOW()
          ORDER BY el.scheduled_at ASC
          LIMIT 200`,
      );
      due = rows;
    } catch (err: any) {
      this.logger.error(`sendRecoveryDue query failed: ${err?.message}`);
      return;
    }

    for (const r of due) {
      const ps = String(r.payment_status || '').toLowerCase();
      const cs = String(r.checkout_status || '').toLowerCase();
      // Account has moved on (chose/activated any plan) — cancel, do not send.
      const hasPlan =
        ps === 'free' ||
        ps === 'active' ||
        ps === 'paid' ||
        cs === 'free' ||
        cs === 'paid' ||
        !!r.selected_plan;
      if (hasPlan || r.recovery_email_sent_at) {
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

      // Fresh single-use activation token (7-day expiry). Store only the hash.
      const rawToken = crypto.randomBytes(32).toString('hex');
      try {
        await this.db.query(
          `UPDATE users
              SET recovery_token = $2,
                  recovery_token_expires = NOW() + INTERVAL '7 days',
                  updated_at = NOW()
            WHERE id = $1`,
          [r.user_id, this.hashRecoveryToken(rawToken)],
        );
      } catch (err: any) {
        this.logger.error(`recovery token store failed: ${err?.message}`);
        await this.db.query(
          `UPDATE email_log SET status = 'scheduled' WHERE id = $1`,
          [r.id],
        );
        continue;
      }

      const rendered = renderTemplate('recovery', r.language, {
        name: r.name,
        ctaUrl: this.recoveryUrl(rawToken),
      });
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
            SET status = $2, subject = $3, provider = $4, error = $5, track_token = $6,
                sent_at = CASE WHEN $2 = 'sent' THEN NOW() ELSE sent_at END
          WHERE id = $1`,
        [
          r.id,
          status,
          rendered.subject,
          result.provider,
          result.error || null,
          token,
        ],
      );
      if (result.ok) {
        await this.db.query(
          `UPDATE users SET recovery_email_sent_at = NOW()
            WHERE id = $1 AND recovery_email_sent_at IS NULL`,
          [r.user_id],
        );
      } else if (status === 'skipped') {
        // No email provider configured yet — reset to retry on a later run.
        await this.db.query(
          `UPDATE email_log SET status = 'scheduled' WHERE id = $1`,
          [r.id],
        );
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
            AND el.template IN ('abandoned_1', 'abandoned_2', 'abandoned_3')
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

  // ---- Free-user onboarding sequence (signup, day 3, 5, 7, 10) ----

  // Stable per-user unsubscribe token, created lazily and stored once.
  private async getOrCreateUnsubToken(userId: string): Promise<string | null> {
    if (!userId) return null;
    try {
      const { rows } = await this.db.query(
        `SELECT email_unsub_token FROM users WHERE id = $1`,
        [userId],
      );
      if (rows[0]?.email_unsub_token) return rows[0].email_unsub_token;
      const tok = crypto.randomBytes(24).toString('hex');
      await this.db.query(
        `UPDATE users SET email_unsub_token = COALESCE(email_unsub_token, $2) WHERE id = $1`,
        [userId, tok],
      );
      const { rows: after } = await this.db.query(
        `SELECT email_unsub_token FROM users WHERE id = $1`,
        [userId],
      );
      return after[0]?.email_unsub_token || tok;
    } catch {
      return null;
    }
  }

  private unsubUrl(token: string): string {
    return `${this.backendUrl()}/api/email/unsubscribe?token=${encodeURIComponent(token)}`;
  }

  // Enqueue the 5 Free-onboarding emails. Idempotent per (user, template) via the
  // NOT EXISTS guard, so the same signup can never enroll twice.
  async scheduleFreeOnboardingSequence(
    userId: string,
    email: string,
    lang?: string,
  ): Promise<void> {
    if (!userId || !email) return;
    await this.ensureSchema();
    const plan: Array<[TemplateName, string]> = [
      ['free_welcome', "INTERVAL '1 minute'"],
      ['free_plan_value', "INTERVAL '3 days'"],
      ['free_ai', "INTERVAL '5 days'"],
      ['free_team', "INTERVAL '7 days'"],
      ['free_upgrade', "INTERVAL '10 days'"],
    ];
    try {
      for (const [template, iv] of plan) {
        await this.db.query(
          `INSERT INTO email_log
             (user_id, to_email, template, language, status, scheduled_at, track_token, created_at)
           SELECT $1, $2, $3, $4, 'scheduled', NOW() + ${iv}, gen_random_uuid(), NOW()
            WHERE NOT EXISTS (
              SELECT 1 FROM email_log
               WHERE user_id = $1 AND template = $3
                 AND status IN ('scheduled', 'sending', 'sent'))
           ON CONFLICT DO NOTHING`,
          [userId, email, template, String(lang || 'en').slice(0, 5)],
        );
      }
    } catch (err: any) {
      this.logger.error(
        `scheduleFreeOnboardingSequence failed: ${err?.message}`,
      );
    }
  }

  // Per-template CTA (deep-linked to the authenticated page), first name, support,
  // unsubscribe link, and the real Free-plan AI allowance for email #3.
  private freeOnboardingVars(
    template: string,
    name: string | null,
    unsubscribeUrl: string | null,
  ): TemplateVars {
    const app = this.appUrl();
    const cta: Record<string, string> = {
      free_welcome: `${app}/dashboard/home`,
      free_plan_value: `${app}/dashboard/home`,
      free_ai: `${app}/dashboard/ai-center`,
      free_team: `${app}/dashboard/team`,
      free_upgrade: `${app}/pricing`,
    };
    const vars: TemplateVars = {
      name: name ? String(name).trim().split(/\s+/)[0] : null,
      ctaUrl: cta[template] || `${app}/dashboard/home`,
      supportEmail: this.supportEmail(),
    };
    if (unsubscribeUrl) vars.unsubscribeUrl = unsubscribeUrl;
    const addr = this.config.get('EMAIL_BUSINESS_ADDRESS');
    if (addr) vars.businessAddress = addr;
    if (template === 'free_ai') {
      vars.aiAllowance = getPlan('free').limits.aiConversationsPerMonth ?? null;
    }
    return vars;
  }

  // Cron worker: send due Free-onboarding emails, stopping the sequence on upgrade
  // to paid, marketing opt-out, or a hard bounce. Separate from sendScheduledDue.
  async sendFreeOnboardingDue(): Promise<void> {
    await this.ensureSchema();
    let due: any[] = [];
    try {
      const { rows } = await this.db.query(
        `SELECT el.id, el.track_token, el.template, el.language, el.to_email, el.user_id,
                u.name, u.payment_status, u.checkout_status, u.email_opt_out,
                u.email_bounced_at, u.email_unsub_token
           FROM email_log el
           JOIN users u ON u.id = el.user_id
          WHERE el.status = 'scheduled'
            AND el.scheduled_at <= NOW()
            AND el.template IN ('free_welcome','free_plan_value','free_ai','free_team','free_upgrade')
          ORDER BY el.scheduled_at ASC
          LIMIT 200`,
      );
      due = rows;
    } catch (err: any) {
      this.logger.error(`sendFreeOnboardingDue query failed: ${err?.message}`);
      return;
    }

    // At most one Free email per user per sweep, so a backlog (e.g. the flag was
    // off for days, then enabled) goes out one step at a time, not all at once.
    const seenUsers = new Set<string>();
    for (const r of due) {
      const paid =
        r.payment_status === 'active' ||
        r.payment_status === 'paid' ||
        r.checkout_status === 'paid';
      if (paid || r.email_opt_out || r.email_bounced_at) {
        await this.db.query(
          `UPDATE email_log SET status = 'canceled' WHERE id = $1`,
          [r.id],
        );
        continue;
      }
      if (seenUsers.has(r.user_id)) continue;

      // Never send a marketing email without an unsubscribe link. If the token
      // can't be minted (transient DB issue), leave the row scheduled to retry.
      const unsubTok =
        r.email_unsub_token || (await this.getOrCreateUnsubToken(r.user_id));
      if (!unsubTok) continue;

      const claim = await this.db.query(
        `UPDATE email_log SET status = 'sending'
          WHERE id = $1 AND status = 'scheduled' RETURNING id`,
        [r.id],
      );
      if (!claim.rows.length) continue;
      seenUsers.add(r.user_id);

      const vars = this.freeOnboardingVars(
        r.template,
        r.name,
        this.unsubUrl(unsubTok),
      );
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
            SET status = $2, subject = $3, provider = $4, error = $5, track_token = $6,
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
        await this.db.query(
          `UPDATE email_log SET status = 'scheduled' WHERE id = $1`,
          [r.id],
        );
      }
    }
  }

  // Public: opt a user out of marketing/onboarding mail by their unsubscribe
  // token (used by the unsubscribe endpoint) and cancel their queued Free emails.
  async unsubscribeByToken(token: string): Promise<boolean> {
    if (!token) return false;
    await this.ensureSchema();
    try {
      const res = await this.db.query(
        `UPDATE users
            SET email_opt_out = true,
                email_opt_out_at = COALESCE(email_opt_out_at, NOW())
          WHERE email_unsub_token = $1`,
        [token],
      );
      if (res.rowCount) {
        await this.db.query(
          `UPDATE email_log SET status = 'canceled'
            WHERE status = 'scheduled'
              AND user_id IN (SELECT id FROM users WHERE email_unsub_token = $1)`,
          [token],
        );
      }
      return (res.rowCount || 0) > 0;
    } catch (err: any) {
      this.logger.error(`unsubscribeByToken failed: ${err?.message}`);
      return false;
    }
  }

  // ---- Checkout-pending recovery (paid plan selected, payment not completed) ----
  // A dedicated recovery email for customers who start a paid-plan checkout but
  // leave without paying. Scheduled a short delay after the paid plan is selected;
  // the worker ALWAYS re-checks payment and cancels if the account has since paid,
  // so we never tell a paying customer to "finish checkout". Behind
  // CHECKOUT_RECOVERY_EMAILS_ENABLED (default OFF).

  // Resume-checkout link for the customer's selected plan (matches the frontend
  // /checkout?plan=&billing=&source= route), so the CTA drops them straight back
  // into the right checkout with minimal friction.
  private checkoutUrl(plan?: string | null, billing?: string | null): string {
    const base =
      this.config.get('CHECKOUT_RECOVERY_CTA_URL') || `${this.appUrl()}/checkout`;
    const p = String(plan || '').trim();
    const b = ['monthly', 'annual'].includes(String(billing || ''))
      ? String(billing)
      : 'monthly';
    const qs: string[] = [];
    if (p) qs.push(`plan=${encodeURIComponent(p)}`);
    qs.push(`billing=${encodeURIComponent(b)}`);
    qs.push('source=recovery');
    return `${base}?${qs.join('&')}`;
  }

  private async checkoutRecoveryVars(user: {
    id: string;
    email: string;
    lang: string;
    name: string;
  }): Promise<TemplateVars> {
    const first = user.name ? String(user.name).trim().split(/\s+/)[0] : null;
    let plan: string | null = null;
    let billing: string | null = null;
    try {
      const { rows } = await this.db.query(
        `SELECT selected_plan, billing_cycle FROM users WHERE id = $1`,
        [user.id],
      );
      plan = rows[0]?.selected_plan || null;
      billing = rows[0]?.billing_cycle || null;
    } catch {
      /* best-effort: fall back to a plan-less checkout link */
    }
    const url = this.checkoutUrl(plan, billing);
    const tok = await this.getOrCreateUnsubToken(user.id);
    const vars: TemplateVars = {
      name: first,
      ctaUrl: url,
      checkoutUrl: url,
      appUrl: `${this.appUrl()}/dashboard/home`,
      supportEmail: this.supportEmail(),
    };
    if (tok) vars.unsubscribeUrl = this.unsubUrl(tok);
    return vars;
  }

  // Queue ONE checkout-recovery email ~30 min after a paid plan is selected.
  // Idempotent per user (auto rows only), so re-selecting a plan won't duplicate.
  async scheduleCheckoutRecovery(
    userId: string,
    email: string,
    lang?: string,
  ): Promise<void> {
    if (!userId || !email) return;
    await this.ensureSchema();
    try {
      await this.db.query(
        `INSERT INTO email_log
           (user_id, to_email, template, language, status, scheduled_at, track_token, created_at)
         SELECT $1, $2, 'checkout_recovery', $3, 'scheduled', NOW() + INTERVAL '30 minutes', gen_random_uuid(), NOW()
          WHERE NOT EXISTS (
            SELECT 1 FROM email_log
             WHERE user_id = $1 AND template = 'checkout_recovery'
               AND send_type = 'auto' AND status IN ('scheduled','sending','sent'))`,
        [userId, email, String(lang || 'en').slice(0, 5)],
      );
    } catch (err: any) {
      this.logger.error(`scheduleCheckoutRecovery failed: ${err?.message}`);
    }
  }

  // Cron worker: send due checkout-recovery emails, re-checking payment per row.
  // A customer who has since paid (or hard-bounced) is canceled, never sent.
  async sendCheckoutRecoveryDue(): Promise<void> {
    await this.ensureSchema();
    let due: any[] = [];
    try {
      const { rows } = await this.db.query(
        `SELECT el.id, el.track_token, el.language, el.to_email, el.user_id,
                u.name, u.payment_status, u.checkout_status, u.selected_plan,
                u.billing_cycle, u.welcome_email_sent_at, u.email_bounced_at
           FROM email_log el
           JOIN users u ON u.id = el.user_id
          WHERE el.template = 'checkout_recovery' AND el.send_type = 'auto'
            AND el.status = 'scheduled' AND el.scheduled_at <= NOW()
          ORDER BY el.scheduled_at ASC
          LIMIT 200`,
      );
      due = rows;
    } catch (err: any) {
      this.logger.error(`sendCheckoutRecoveryDue query failed: ${err?.message}`);
      return;
    }

    for (const r of due) {
      const ps = String(r.payment_status || '').toLowerCase();
      const cs = String(r.checkout_status || '').toLowerCase();
      // ALWAYS re-check: never send "finish your checkout" to someone who has
      // completed it — including a real trial ('trialing'), since they checked out
      // successfully into the trial.
      const paid =
        ps === 'active' ||
        ps === 'paid' ||
        ps === 'trialing' ||
        cs === 'paid' ||
        !!r.welcome_email_sent_at;
      if (paid || r.email_bounced_at) {
        await this.db.query(
          `UPDATE email_log SET status = 'canceled' WHERE id = $1`,
          [r.id],
        );
        continue;
      }
      const claim = await this.db.query(
        `UPDATE email_log SET status = 'sending'
          WHERE id = $1 AND status = 'scheduled' RETURNING id`,
        [r.id],
      );
      if (!claim.rows.length) continue;

      const first = r.name ? String(r.name).trim().split(/\s+/)[0] : null;
      const url = this.checkoutUrl(r.selected_plan, r.billing_cycle);
      const tok = await this.getOrCreateUnsubToken(r.user_id);
      const vars: TemplateVars = {
        name: first,
        ctaUrl: url,
        checkoutUrl: url,
        appUrl: `${this.appUrl()}/dashboard/home`,
        supportEmail: this.supportEmail(),
      };
      if (tok) vars.unsubscribeUrl = this.unsubUrl(tok);
      const rendered = renderTemplate('checkout_recovery', r.language, vars);
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
            SET status = $2, subject = $3, provider = $4, error = $5, track_token = $6,
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
        await this.db.query(
          `UPDATE email_log SET status = 'scheduled' WHERE id = $1`,
          [r.id],
        );
      }
    }
  }

  // ---- "Out of AI credits" sequence (Day 0 / Day 2 / Day 5) ----
  // Triggered by AiUnitsService the moment a Free account's AI balance hits 0.
  // Emails the account OWNER. Rows are queued here; sending is gated by the cron
  // behind AI_CREDITS_EMAILS_ENABLED (default OFF). Every send re-checks the live
  // balance/plan and cancels the rest the moment they buy credits or upgrade.

  // Deep-link the CTA to the in-app AI-Unit purchase; support/unsubscribe tokens.
  private aiCreditsVars(
    first: string | null,
    unsubscribeUrl: string | null,
  ): TemplateVars {
    const app = this.appUrl();
    const vars: TemplateVars = {
      name: first,
      ctaUrl: `${app}/dashboard/ai-center?buy=ai-credits`,
      appUrl: `${app}/dashboard/home`,
      aiUnitsUrl: `${app}/dashboard/ai-center?buy=ai-credits`,
      supportEmail: this.supportEmail(),
    };
    if (unsubscribeUrl) vars.unsubscribeUrl = unsubscribeUrl;
    return vars;
  }

  // Queue the Day 0/2/5 sequence for the owner of `teamId`. Idempotent: never
  // opens a second concurrent sequence for the same user.
  async startAiCreditsSequence(teamId: string): Promise<void> {
    if (!teamId) return;
    await this.ensureSchema();
    try {
      const { rows } = await this.db.query(
        `SELECT u.id, u.email, COALESCE(u.preferred_language,'en') AS lang
           FROM teams t JOIN users u ON u.id = t.owner_id
          WHERE t.id = $1 LIMIT 1`,
        [teamId],
      );
      const owner = rows[0];
      if (!owner?.id || !owner?.email) return;

      const active = await this.db.query(
        `SELECT 1 FROM email_log
          WHERE user_id = $1 AND template = 'ai_credits_out' AND send_type = 'auto'
            AND status IN ('scheduled','sending') LIMIT 1`,
        [owner.id],
      );
      if (active.rows.length) return;

      const plan: Array<string> = [
        "INTERVAL '1 minute'", // Day 0 — near-immediate
        "INTERVAL '2 days'", // Day 2
        "INTERVAL '5 days'", // Day 5 — final
      ];
      for (const iv of plan) {
        await this.db.query(
          `INSERT INTO email_log
             (user_id, to_email, template, language, status, scheduled_at, track_token, created_at)
           VALUES ($1, $2, 'ai_credits_out', $3, 'scheduled', NOW() + ${iv}, gen_random_uuid(), NOW())`,
          [owner.id, owner.email, String(owner.lang || 'en').slice(0, 5)],
        );
      }
      this.logger.log(`AI-credits sequence queued for team ${teamId} (user ${owner.id})`);
    } catch (err: any) {
      this.logger.error(`startAiCreditsSequence failed: ${err?.message}`);
    }
  }

  // Cancel any still-scheduled out-of-credits emails for the owner of `teamId`
  // (called the moment they buy credits, so the sequence stops immediately).
  async cancelAiCreditsSequence(teamId: string): Promise<void> {
    if (!teamId) return;
    await this.ensureSchema();
    try {
      await this.db.query(
        `UPDATE email_log SET status = 'canceled'
          WHERE template = 'ai_credits_out' AND status = 'scheduled'
            AND user_id IN (SELECT owner_id FROM teams WHERE id = $1)`,
        [teamId],
      );
    } catch (err: any) {
      this.logger.error(`cancelAiCreditsSequence failed: ${err?.message}`);
    }
  }

  // Cron worker: send due out-of-credits emails. Re-checks the live balance/plan
  // per row — a customer who has since bought credits or upgraded is canceled,
  // never sent. One email per user per sweep. Hard off unless the cron flag is on.
  async sendAiCreditsDue(): Promise<void> {
    await this.ensureSchema();
    let due: any[] = [];
    try {
      const { rows } = await this.db.query(
        `SELECT el.id, el.track_token, el.language, el.to_email, el.user_id,
                u.name, u.payment_status, u.checkout_status,
                u.email_opt_out, u.email_bounced_at, u.email_unsub_token,
                COALESCE(u.team_id, (SELECT id FROM teams WHERE owner_id = u.id LIMIT 1)) AS team_id
           FROM email_log el
           JOIN users u ON u.id = el.user_id
          WHERE el.template = 'ai_credits_out' AND el.send_type = 'auto'
            AND el.status = 'scheduled' AND el.scheduled_at <= NOW()
          ORDER BY el.scheduled_at ASC
          LIMIT 200`,
      );
      due = rows;
    } catch (err: any) {
      this.logger.error(`sendAiCreditsDue query failed: ${err?.message}`);
      return;
    }

    const seenUsers = new Set<string>();
    for (const r of due) {
      // A paid/unlimited plan is never out of AI, so it never gets this email.
      const paid =
        r.payment_status === 'active' ||
        r.payment_status === 'paid' ||
        r.payment_status === 'trialing' ||
        r.checkout_status === 'paid';
      // Re-check the LIVE balance: any remaining credits (a purchase) stops it.
      let hasCredits = false;
      if (!paid && r.team_id) {
        try {
          const bal = await this.db.query(
            `SELECT a.free_used, a.purchased_balance,
                    COALESCE((c.config->>'freeAllowance')::int, 50) AS allowance
               FROM ai_unit_accounts a
               LEFT JOIN ai_unit_config c ON c.id = 1
              WHERE a.team_id = $1`,
            [r.team_id],
          );
          const a = bal.rows[0];
          if (a) {
            const remaining =
              Math.max(0, (a.allowance || 50) - (a.free_used || 0)) +
              Math.max(0, a.purchased_balance || 0);
            hasCredits = remaining > 0;
          }
        } catch {
          // If the balance can't be read, do NOT send (fail safe).
          hasCredits = true;
        }
      }
      if (paid || hasCredits || r.email_opt_out || r.email_bounced_at) {
        await this.db.query(
          `UPDATE email_log SET status = 'canceled'
            WHERE user_id = $1 AND template = 'ai_credits_out' AND status = 'scheduled'`,
          [r.user_id],
        );
        continue;
      }
      if (seenUsers.has(r.user_id)) continue;

      const unsubTok =
        r.email_unsub_token || (await this.getOrCreateUnsubToken(r.user_id));

      const claim = await this.db.query(
        `UPDATE email_log SET status = 'sending'
          WHERE id = $1 AND status = 'scheduled' RETURNING id`,
        [r.id],
      );
      if (!claim.rows.length) continue;
      seenUsers.add(r.user_id);

      const first = r.name ? String(r.name).trim().split(/\s+/)[0] : null;
      const vars = this.aiCreditsVars(
        first,
        unsubTok ? this.unsubUrl(unsubTok) : null,
      );
      const rendered = renderTemplate('ai_credits_out', r.language, vars);
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
            SET status = $2, subject = $3, provider = $4, error = $5, track_token = $6,
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
        await this.db.query(
          `UPDATE email_log SET status = 'scheduled' WHERE id = $1`,
          [r.id],
        );
      }
    }
  }

  // ---- New client-approved onboarding sequence (Day 0/1/2/4/6/9/12) ----
  // The 7 approved designs (onb_* templates). Replaces the older Free-onboarding
  // sequence for new Free signups (so there is exactly one welcome), reuses the
  // same provider/log/tracking pipeline, and is default OFF behind
  // ONBOARDING_EMAILS_ENABLED. #6 (onb_team, Day 12) is suppressed for accounts
  // that already hold an active Team workspace entitlement.
  private readonly ONBOARDING_PLAN: Array<[TemplateName, string]> = [
    ['onb_welcome', "INTERVAL '1 minute'"], // Day 0
    ['onb_support', "INTERVAL '1 day'"], // Day 1
    ['onb_ai', "INTERVAL '2 days'"], // Day 2
    ['onb_invite_team', "INTERVAL '3 days'"], // Day 3 — invite your team
    ['onb_connect', "INTERVAL '4 days'"], // Day 4
    ['onb_system', "INTERVAL '6 days'"], // Day 6
    ['onb_ready', "INTERVAL '9 days'"], // Day 9
    ['onb_team', "INTERVAL '12 days'"], // Day 12
  ];

  // Deep-linked CTA targets + support/unsubscribe tokens for the onboarding
  // designs. In-app links open the account's dashboard (locale handled by the
  // app); /pricing is the public commercial page.
  private onboardingVars(
    first: string | null,
    unsubscribeUrl: string | null,
  ): TemplateVars {
    const app = this.appUrl();
    const vars: TemplateVars = {
      name: first,
      ctaUrl: `${app}/dashboard/home`,
      appUrl: `${app}/dashboard/home`,
      aiAgentUrl: `${app}/dashboard/ai-center`,
      aiUnitsUrl: `${app}/dashboard/ai-center`,
      upgradeUrl: `${app}/pricing`,
      workspaceUrl: `${app}/pricing`,
      teamWorkspaceUrl: `${app}/dashboard/team`,
      supportEmail: this.supportEmail(),
    };
    if (unsubscribeUrl) vars.unsubscribeUrl = unsubscribeUrl;
    return vars;
  }

  // Enqueue the 7 onboarding emails. Idempotent per (user, template) via the
  // NOT EXISTS guard + unique index. Also cancels any still-scheduled OLD
  // Free-onboarding rows for this user, so the two sequences never overlap.
  async scheduleOnboardingSequence(
    userId: string,
    email: string,
    lang?: string,
  ): Promise<void> {
    if (!userId || !email) return;
    await this.ensureSchema();
    try {
      await this.db.query(
        `UPDATE email_log SET status = 'canceled'
          WHERE user_id = $1 AND status = 'scheduled'
            AND template IN ('free_welcome','free_plan_value','free_ai','free_team','free_upgrade')`,
        [userId],
      );
      for (const [template, iv] of this.ONBOARDING_PLAN) {
        await this.db.query(
          `INSERT INTO email_log
             (user_id, to_email, template, language, status, scheduled_at, track_token, created_at)
           SELECT $1, $2, $3, $4, 'scheduled', NOW() + ${iv}, gen_random_uuid(), NOW()
            WHERE NOT EXISTS (
              SELECT 1 FROM email_log
               WHERE user_id = $1 AND template = $3
                 AND status IN ('scheduled', 'sending', 'sent'))
           ON CONFLICT DO NOTHING`,
          [userId, email, template, String(lang || 'en').slice(0, 5)],
        );
      }
    } catch (err: any) {
      this.logger.error(`scheduleOnboardingSequence failed: ${err?.message}`);
    }
  }

  // Cron worker: send due onboarding emails. Stops on upgrade-to-paid, marketing
  // opt-out, or a hard bounce; suppresses the Day-12 Team email when the account
  // already owns the Team workspace; one email per user per sweep.
  async sendOnboardingDue(): Promise<void> {
    await this.ensureSchema();
    let due: any[] = [];
    try {
      const { rows } = await this.db.query(
        `SELECT el.id, el.track_token, el.template, el.language, el.to_email, el.user_id,
                u.name, u.payment_status, u.checkout_status, u.email_opt_out,
                u.email_bounced_at, u.email_unsub_token
           FROM email_log el
           JOIN users u ON u.id = el.user_id
          WHERE el.status = 'scheduled'
            AND el.scheduled_at <= NOW()
            AND el.template IN ('onb_welcome','onb_support','onb_ai','onb_invite_team','onb_connect','onb_system','onb_ready','onb_team')
          ORDER BY el.scheduled_at ASC
          LIMIT 200`,
      );
      due = rows;
    } catch (err: any) {
      this.logger.error(`sendOnboardingDue query failed: ${err?.message}`);
      return;
    }

    const seenUsers = new Set<string>();
    for (const r of due) {
      const paid =
        r.payment_status === 'active' ||
        r.payment_status === 'paid' ||
        r.checkout_status === 'paid';
      if (paid || r.email_opt_out || r.email_bounced_at) {
        await this.db.query(
          `UPDATE email_log SET status = 'canceled' WHERE id = $1`,
          [r.id],
        );
        continue;
      }
      // Day-12 Team Workspace email: suppress if the account already holds an
      // active 'team' workspace entitlement. Owners may have users.team_id NULL
      // and own their team via teams.owner_id, so resolve both.
      if (r.template === 'onb_team') {
        try {
          const { rows: ent } = await this.db.query(
            `SELECT 1 FROM workspace_entitlements we
              WHERE we.workspace_id = 'team' AND we.status = 'active'
                AND we.team_id = COALESCE(
                  (SELECT team_id FROM users WHERE id = $1),
                  (SELECT id FROM teams WHERE owner_id = $1 LIMIT 1))
              LIMIT 1`,
            [r.user_id],
          );
          if (ent.length) {
            await this.db.query(
              `UPDATE email_log SET status = 'canceled' WHERE id = $1`,
              [r.id],
            );
            continue;
          }
        } catch {
          /* entitlement check failed — fall through and send (non-fatal) */
        }
      }
      if (seenUsers.has(r.user_id)) continue;

      const unsubTok =
        r.email_unsub_token || (await this.getOrCreateUnsubToken(r.user_id));
      if (!unsubTok) continue;

      const claim = await this.db.query(
        `UPDATE email_log SET status = 'sending'
          WHERE id = $1 AND status = 'scheduled' RETURNING id`,
        [r.id],
      );
      if (!claim.rows.length) continue;
      seenUsers.add(r.user_id);

      const first = r.name ? String(r.name).trim().split(/\s+/)[0] : null;
      const vars = this.onboardingVars(first, this.unsubUrl(unsubTok));
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
            SET status = $2, subject = $3, provider = $4, error = $5, track_token = $6,
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
        await this.db.query(
          `UPDATE email_log SET status = 'scheduled' WHERE id = $1`,
          [r.id],
        );
      }
    }
  }

  // Send all 7 onboarding emails to one address on demand, so the sequence can
  // be reviewed in a real inbox before the automation is switched on. Independent
  // of ONBOARDING_EMAILS_ENABLED and the scheduled queue.
  async sendOnboardingTest(
    to: string,
    language = 'en',
  ): Promise<Array<{ template: TemplateName; sent: boolean; status: string; reason?: string }>> {
    const sequence: TemplateName[] = [
      'onb_welcome',
      'onb_support',
      'onb_ai',
      'onb_invite_team',
      'onb_connect',
      'onb_system',
      'onb_ready',
      'onb_team',
    ];
    const out: Array<{ template: TemplateName; sent: boolean; status: string; reason?: string }> = [];
    for (const template of sequence) {
      const r = await this.sendTestEmail({ to, template, language });
      out.push({ template, sent: r.sent, status: r.status, reason: r.reason });
    }
    return out;
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
      case 'free_welcome':
      case 'free_plan_value':
      case 'free_ai':
      case 'free_team':
      case 'free_upgrade':
        // Same vars the live sequence uses (deep-linked CTA, first name, real AI
        // allowance for free_ai). A sample unsubscribe token renders the footer
        // link; it isn't a real subscriber token, so clicking it just reports an
        // invalid link, which is correct for a test recipient.
        vars = this.freeOnboardingVars(
          opts.template,
          name,
          this.unsubUrl('test-sample'),
        );
        break;
      case 'onb_welcome':
      case 'onb_support':
      case 'onb_ai':
      case 'onb_invite_team':
      case 'onb_connect':
      case 'onb_system':
      case 'onb_ready':
      case 'onb_team':
        // Same vars the live sequence uses (deep-linked CTAs, first name, support
        // + a sample unsubscribe token that reports an invalid link if clicked).
        vars = this.onboardingVars(name, this.unsubUrl('test-sample'));
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

  // Send all 5 Free-onboarding emails to one address on demand, so the sequence
  // can be reviewed in a real inbox before the automation is switched on. This
  // is independent of FREE_ONBOARDING_EMAILS_ENABLED and the scheduled queue.
  async sendFreeOnboardingTest(
    to: string,
    language = 'en',
  ): Promise<Array<{ template: TemplateName; sent: boolean; status: string; reason?: string }>> {
    const sequence: TemplateName[] = [
      'free_welcome',
      'free_plan_value',
      'free_ai',
      'free_team',
      'free_upgrade',
    ];
    const out: Array<{ template: TemplateName; sent: boolean; status: string; reason?: string }> = [];
    for (const template of sequence) {
      const r = await this.sendTestEmail({ to, template, language });
      out.push({ template, sent: r.sent, status: r.status, reason: r.reason });
    }
    return out;
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
          // Suppress future lifecycle mail to a hard-bouncing address.
          await this.db.query(
            `UPDATE users u SET email_bounced_at = COALESCE(email_bounced_at, NOW())
               FROM email_log el WHERE el.track_token = $1 AND u.id = el.user_id`,
            [token],
          );
        } else if (
          ev.event === 'unsubscribe' ||
          ev.event === 'group_unsubscribe' ||
          ev.event === 'spamreport'
        ) {
          // Honor SendGrid-side unsubscribe / spam report as a marketing opt-out.
          await this.db.query(
            `UPDATE users u
                SET email_opt_out = true,
                    email_opt_out_at = COALESCE(email_opt_out_at, NOW())
               FROM email_log el WHERE el.track_token = $1 AND u.id = el.user_id`,
            [token],
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

  // Scoped log read for the key-guarded onboarding test endpoint: returns ONLY
  // the onboarding rows for one specific recipient, so the test tool never
  // exposes any other customer's mail.
  async onboardingTestLog(toEmail: string, limit = 20): Promise<any[]> {
    await this.ensureSchema();
    const n = Math.min(Math.max(Number(limit) || 20, 1), 50);
    try {
      const { rows } = await this.db.query(
        `SELECT template, language, subject, status, error, provider,
                sent_at, created_at
           FROM email_log
          WHERE to_email = $1
            AND template IN ('onb_welcome','onb_support','onb_ai','onb_invite_team','onb_connect','onb_system','onb_ready','onb_team')
          ORDER BY created_at DESC
          LIMIT $2`,
        [toEmail, n],
      );
      return rows;
    } catch {
      return [];
    }
  }

  // ---- manual (admin) single-customer send: dropdown of production templates ----
  // Builds the right TemplateVars for ANY catalog template, reusing the exact
  // same builders the automatic emails use (same copy, same personalization).
  private async buildVarsForTemplate(
    template: TemplateName,
    user: { id: string; email: string; lang: string; name: string },
  ): Promise<TemplateVars> {
    const name = user.name;
    const first = name ? String(name).trim().split(/\s+/)[0] : null;
    if (template === 'checkout_recovery') {
      return this.checkoutRecoveryVars(user);
    }
    if (template === 'ai_credits_out') {
      // Reuse the exact vars the automatic sequence uses: CTA deep-links to the
      // in-app AI-Unit purchase popup, real support email, per-user unsubscribe.
      const tok = await this.getOrCreateUnsubToken(user.id);
      return this.aiCreditsVars(first, tok ? this.unsubUrl(tok) : null);
    }
    if (template.startsWith('onb_')) {
      const tok = await this.getOrCreateUnsubToken(user.id);
      return this.onboardingVars(first, tok ? this.unsubUrl(tok) : null);
    }
    if (template.startsWith('free_')) {
      const tok = await this.getOrCreateUnsubToken(user.id);
      return this.freeOnboardingVars(
        template,
        name,
        tok ? this.unsubUrl(tok) : null,
      );
    }
    switch (template) {
      case 'welcome':
        return this.welcomeVars(name);
      case 'getting_started':
        return this.gettingStartedVars(name);
      case 'payment_failed':
      case 'subscription_canceled':
        return this.billingEmailVars(name);
      case 'abandoned_1':
      case 'abandoned_2':
      case 'abandoned_3': {
        const vars: TemplateVars = { name, ctaUrl: this.continueUrl() };
        if (template === 'abandoned_2') {
          vars.editorialUrl = this.editorialUrl(user.lang);
        }
        return vars;
      }
      default:
        return { name, ctaUrl: this.appUrl() };
    }
  }

  // Render a template for one customer in THEIR language, using their real first
  // name — for the admin preview. No send, no log, no state change.
  async previewCustomerEmail(
    userId: string,
    template: TemplateName,
  ): Promise<{
    ok: boolean;
    error?: string;
    customerName?: string | null;
    email?: string;
    template?: TemplateName;
    language?: string;
    subject?: string;
    html?: string;
  }> {
    await this.ensureSchema();
    const user = await this.resolveRecipient({ userId });
    if (!user || !user.email) {
      return { ok: false, error: 'Customer not found or has no email address.' };
    }
    const vars = await this.buildVarsForTemplate(template, user);
    const rendered = renderTemplate(template, user.lang, vars);
    return {
      ok: true,
      customerName: user.name || null,
      email: user.email,
      template,
      language: String(user.lang || 'en').slice(0, 2).toLowerCase(),
      subject: rendered.subject,
      html: rendered.html,
    };
  }

  // Send ONE template email to ONE customer, in their language, through the same
  // SendGrid pipeline. Logged as a MANUAL send (send_type='manual' + admin id).
  // Never touches lifecycle columns or the scheduled sequence, so it cannot alter
  // the customer's automatic onboarding. Guarded against accidental double sends.
  async sendManualToCustomer(opts: {
    userId: string;
    template: TemplateName;
    adminId?: string | null;
    idempotencyKey?: string | null;
  }): Promise<{
    ok: boolean;
    status: 'sent' | 'skipped' | 'error' | 'duplicate' | 'not_found';
    reason?: string;
    subject?: string;
    to?: string;
    language?: string;
    template?: TemplateName;
  }> {
    await this.ensureSchema();
    const user = await this.resolveRecipient({ userId: opts.userId });
    if (!user || !user.email) {
      return {
        ok: false,
        status: 'not_found',
        reason: 'Customer not found or has no email address.',
      };
    }
    // Double-send protection: same idempotency key already used, OR the same
    // template was manually sent to this customer within the last 60 seconds.
    if (opts.idempotencyKey) {
      const dup = await this.db.query(
        `SELECT 1 FROM email_log WHERE manual_idempotency_key = $1 LIMIT 1`,
        [opts.idempotencyKey],
      );
      if (dup.rows.length) {
        return {
          ok: false,
          status: 'duplicate',
          reason: 'This email was already sent (duplicate request ignored).',
        };
      }
    }
    const recent = await this.db.query(
      `SELECT 1 FROM email_log
        WHERE user_id = $1 AND template = $2 AND send_type = 'manual' AND status = 'sent'
          AND created_at > NOW() - INTERVAL '60 seconds' LIMIT 1`,
      [user.id, opts.template],
    );
    if (recent.rows.length) {
      return {
        ok: false,
        status: 'duplicate',
        reason: 'The same email was just sent to this customer moments ago.',
      };
    }

    const vars = await this.buildVarsForTemplate(opts.template, user);
    const token = crypto.randomUUID();
    const rendered = renderTemplate(opts.template, user.lang, vars);
    const html = this.htmlFor(rendered.html, token);
    const result = await this.deliver({
      to: user.email,
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

    try {
      await this.db.query(
        `INSERT INTO email_log
           (user_id, to_email, template, language, subject, status, error, provider,
            track_token, sent_at, send_type, sent_by_admin_id, manual_idempotency_key)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'manual',$11,$12)`,
        [
          user.id,
          user.email,
          opts.template,
          String(user.lang || 'en').slice(0, 5),
          rendered.subject,
          status,
          result.ok ? null : result.error?.slice(0, 500),
          result.provider,
          token,
          status === 'sent' ? new Date() : null,
          opts.adminId || null,
          opts.idempotencyKey || null,
        ],
      );
    } catch (err: any) {
      // Unique idempotency-key violation = a concurrent duplicate; treat as such.
      if (
        String(err?.message || '')
          .toLowerCase()
          .includes('idx_email_log_manual_idem')
      ) {
        return {
          ok: false,
          status: 'duplicate',
          reason: 'This email was already sent (duplicate request ignored).',
        };
      }
      this.logger.error(`manual send log insert failed: ${err?.message}`);
    }
    if (status === 'error') {
      this.logger.error(
        `Manual email '${opts.template}' to ${user.email} failed: ${result.error}`,
      );
    }
    return {
      ok: result.ok,
      status,
      reason: result.ok ? undefined : result.error,
      subject: rendered.subject,
      to: user.email,
      language: String(user.lang || 'en').slice(0, 2).toLowerCase(),
      template: opts.template,
    };
  }
}
