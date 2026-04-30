import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import { LeadMessagesService } from './lead-messages.service';
import * as nodemailer from 'nodemailer';

export interface SendEmailDto {
  leadId: string;
  subject: string;
  body: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly from: string;
  private readonly isConfigured: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly db: DatabaseService,
    private readonly leadMessages: LeadMessagesService,
  ) {
    const host = config.get('SMTP_HOST');
    const port = config.getNumber('SMTP_PORT', 587);
    const user = config.get('SMTP_USER');
    const pass = config.get('SMTP_PASS');
    this.from = config.get('EMAIL_FROM') || user || '';

    if (host && user && pass && this.from) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(port) || 587,
        secure: port === 465,
        auth: { user, pass },
      });
      this.isConfigured = true;
      this.logger.log('Email (SMTP) configured');
    } else {
      this.transporter = null;
      this.isConfigured = false;
      this.logger.warn('Email not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_FROM.');
    }
  }

  getIsConfigured(): boolean {
    return this.isConfigured;
  }

  /**
   * Send email to a lead. Per-lead, per-action only. No bulk.
   */
  async sendForLead(dto: SendEmailDto, userId: string, teamId: string | null): Promise<{ messageId: string }> {
    if (!this.isConfigured || !this.transporter) {
      throw new BadRequestException('Email is not configured');
    }

    const { rows } = await this.db.query(
      `SELECT id, email, team_id, created_by FROM leads WHERE id = $1`,
      [dto.leadId],
    );
    if (!rows.length) throw new BadRequestException('Lead not found');
    const lead = rows[0];
    const allowed = lead.team_id === teamId || lead.created_by === userId;
    if (!allowed) throw new BadRequestException('Lead not found');

    const to = lead.email;
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      throw new BadRequestException('Lead has no valid email address');
    }

    const info = await this.transporter.sendMail({
      from: this.from,
      to,
      subject: dto.subject,
      text: dto.body,
      html: dto.body.replace(/\n/g, '<br>'),
    });

    await this.leadMessages.create({
      lead_id: dto.leadId,
      channel: 'email',
      direction: 'outbound',
      external_id: info.messageId || null,
      body: dto.body,
      subject: dto.subject,
      status: 'sent',
    });

    await this.db.query(
      `UPDATE leads SET last_contacted_at = NOW(), last_activity_at = NOW(), last_action_type = 'email', last_action_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [dto.leadId],
    );

    return { messageId: info.messageId || '' };
  }
}
