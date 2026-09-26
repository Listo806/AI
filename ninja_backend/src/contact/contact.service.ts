import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import { PlatformMailerService } from '../platform-mail/platform-mailer.service';

type ContactInput = {
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  topic: string | null;
  message: string;
  language: string;
  pagePath: string | null;
};

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const DEFAULT_TO = 'support@cortexaaicrm.com';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);
  private readonly hits = new Map<string, number[]>();
  private tableReady: Promise<void> | null = null;

  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
    private readonly mailer: PlatformMailerService,
  ) {}

  // ---- storage (runtime ensure; migration 174 creates the same table) ----
  private ensureTable(): Promise<void> {
    if (!this.tableReady) {
      this.tableReady = this.db
        .query(
          `CREATE TABLE IF NOT EXISTS contact_messages (
             id BIGSERIAL PRIMARY KEY,
             name TEXT NOT NULL,
             email TEXT NOT NULL,
             phone TEXT,
             company TEXT,
             topic TEXT,
             message TEXT NOT NULL,
             language VARCHAR(8),
             page_path TEXT,
             ip TEXT,
             user_agent TEXT,
             email_to TEXT,
             email_status VARCHAR(16) NOT NULL DEFAULT 'pending',
             email_error TEXT,
             emailed_at TIMESTAMPTZ,
             created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
           )`,
        )
        .then(() =>
          this.db.query(
            `CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages (created_at DESC)`,
          ),
        )
        .then(() => undefined)
        .catch((err) => {
          this.tableReady = null; // retry on the next submission
          throw err;
        });
    }
    return this.tableReady;
  }

  // ---- spam protection: simple in-memory per-IP sliding window ----
  private rateLimited(ip: string): boolean {
    const key = ip || 'unknown';
    const now = Date.now();
    const recent = (this.hits.get(key) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (recent.length >= RATE_LIMIT_MAX) {
      this.hits.set(key, recent);
      return true;
    }
    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > 5000) {
      for (const [k, v] of this.hits) {
        if (!v.some((t) => now - t < RATE_LIMIT_WINDOW_MS)) this.hits.delete(k);
      }
    }
    return false;
  }

  private str(v: unknown): string {
    return typeof v === 'string' || typeof v === 'number' ? String(v).trim() : '';
  }

  // Single-line fields: no control characters / line breaks.
  private oneLine(v: unknown): string {
    return this.str(v)
      .replace(/[\u0000-\u001f\u007f]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  private validate(body: any): ContactInput {
    const errors: string[] = [];
    const name = this.oneLine(body?.name ?? body?.fullName);
    const email = this.oneLine(body?.email).toLowerCase();
    const phone = this.oneLine(body?.phone);
    const company = this.oneLine(body?.company);
    const topic = this.oneLine(body?.topic ?? body?.subject ?? body?.reason);
    const message = this.str(body?.message).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');
    const lang = this.oneLine(body?.language).slice(0, 2).toLowerCase();
    const pagePath = this.oneLine(body?.pagePath);

    if (!name) errors.push('name is required');
    else if (name.length > 120) errors.push('name must be at most 120 characters');
    if (!email) errors.push('email is required');
    else if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      errors.push('email must be a valid email address');
    }
    if (phone.length > 40) errors.push('phone must be at most 40 characters');
    if (company.length > 160) errors.push('company must be at most 160 characters');
    if (topic.length > 100) errors.push('topic must be at most 100 characters');
    if (!message) errors.push('message is required');
    else if (message.length > 5000) errors.push('message must be at most 5000 characters');
    if (pagePath.length > 300) errors.push('pagePath must be at most 300 characters');

    if (errors.length) {
      throw new BadRequestException({ success: false, message: errors.join('; '), errors });
    }
    return {
      name,
      email,
      phone: phone || null,
      company: company || null,
      topic: topic || null,
      message,
      language: ['en', 'es', 'pt'].includes(lang) ? lang : 'en',
      pagePath: pagePath || null,
    };
  }

  private esc(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private buildEmail(m: ContactInput, id: string | null) {
    const row = (label: string, value: string | null) =>
      `<tr><td style="padding:6px 12px 6px 0;vertical-align:top;color:#475569;white-space:nowrap"><b>${label}</b></td>` +
      `<td style="padding:6px 0;color:#0f172a">${value ? this.esc(value) : '<span style="color:#94a3b8">-</span>'}</td></tr>`;
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#0f172a;max-width:680px">
        <h2 style="margin:0 0 12px;font-size:18px">New contact form message</h2>
        <table cellpadding="0" cellspacing="0" style="border-collapse:collapse">
          ${row('Name', m.name)}
          ${row('Email', m.email)}
          ${row('Phone', m.phone)}
          ${row('Company', m.company)}
          ${row('Reason', m.topic)}
          ${row('Language', m.language)}
          ${row('Page', m.pagePath)}
        </table>
        <h3 style="margin:18px 0 6px;font-size:15px">Message</h3>
        <div style="white-space:pre-wrap;border:1px solid #e2e8f0;border-radius:8px;padding:12px;background:#f8fafc">${this.esc(m.message)}</div>
        <p style="margin-top:16px;color:#64748b;font-size:12px">Reply to this email to answer ${this.esc(m.name)} directly.${id ? ` Reference #${this.esc(id)}.` : ''}</p>
      </div>`;
    const text = [
      'New contact form message',
      `Name: ${m.name}`,
      `Email: ${m.email}`,
      `Phone: ${m.phone || '-'}`,
      `Company: ${m.company || '-'}`,
      `Reason: ${m.topic || '-'}`,
      `Language: ${m.language}`,
      `Page: ${m.pagePath || '-'}`,
      '',
      m.message,
    ].join('\n');
    return { html, text };
  }

  async submit(body: any, ip: string, userAgent: string) {
    // Honeypot: real visitors never see/fill the hidden "website" field. Bots get
    // an ordinary-looking success so they do not retry, and nothing is sent.
    if (this.str(body?.website) || this.str(body?.hp)) {
      this.rateLimited(ip);
      this.logger.warn('contact form honeypot triggered; submission dropped');
      return { success: true };
    }

    const input = this.validate(body);

    if (this.rateLimited(ip)) {
      throw new HttpException(
        { success: false, message: 'Too many messages. Please try again in a few minutes.' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const to = (this.config.get('CONTACT_FORM_TO') || '').trim() || DEFAULT_TO;

    // 1) Store first, so the message is never lost even if email fails.
    let id: string | null = null;
    try {
      await this.ensureTable();
      const res = await this.db.query(
        `INSERT INTO contact_messages
           (name, email, phone, company, topic, message, language, page_path, ip, user_agent, email_to)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING id`,
        [
          input.name,
          input.email,
          input.phone,
          input.company,
          input.topic,
          input.message,
          input.language,
          input.pagePath,
          ip ? ip.slice(0, 64) : null,
          userAgent ? userAgent.slice(0, 400) : null,
          to,
        ],
      );
      id = res.rows?.[0]?.id != null ? String(res.rows[0].id) : null;
    } catch (err: any) {
      this.logger.error(`contact message could not be stored: ${err?.message}`);
    }

    // 2) Email the support inbox through the platform mailer (same sender config
    //    as the other transactional emails), reply-to = the visitor.
    const { html, text } = this.buildEmail(input, id);
    let sent = false;
    let reason: string | undefined;
    try {
      const result = await this.mailer.sendCustomEmail({
        to,
        subject: `New contact form message: ${input.name}`.slice(0, 200),
        html,
        text,
        template: 'contact_form',
        language: input.language,
        replyTo: { email: input.email, name: input.name },
      });
      sent = result.sent;
      reason = result.reason;
    } catch (err: any) {
      reason = err?.message || 'send_failed';
    }

    if (id) {
      try {
        await this.db.query(
          `UPDATE contact_messages
              SET email_status = $2, email_error = $3, emailed_at = $4
            WHERE id = $1`,
          [id, sent ? 'sent' : 'failed', sent ? null : String(reason || '').slice(0, 500), sent ? new Date() : null],
        );
      } catch (err: any) {
        this.logger.error(`contact message #${id} status update failed: ${err?.message}`);
      }
    }

    if (!sent) {
      this.logger.error(
        `contact message ${id ? `#${id} stored but ` : ''}email failed: ${String(reason || '').slice(0, 300)}`,
      );
      throw new BadGatewayException({
        success: false,
        stored: Boolean(id),
        message: 'Your message could not be emailed right now. Please try again or email support@cortexaaicrm.com.',
      });
    }

    this.logger.log(`contact message ${id ? `#${id} ` : ''}emailed`);
    return { success: true, id };
  }
}
