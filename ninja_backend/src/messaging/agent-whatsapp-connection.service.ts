import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { DatabaseService } from '../database/database.service';
import { encrypt, decrypt } from '../common/encryption.util';
import { UsageService } from '../plans/usage.service';
import twilio from 'twilio';

export interface AgentConnectionStatus {
  connected: boolean;
  whatsappNumber?: string;
  provider: 'twilio';
}

export interface AgentConnectionForSend {
  subAccountSid: string;
  authToken: string;
  whatsappNumber: string;
}

@Injectable()
export class AgentWhatsAppConnectionService {
  private readonly logger = new Logger(AgentWhatsAppConnectionService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly db: DatabaseService,
    private readonly usage: UsageService,
  ) {}

  /**
   * Connect agent's WhatsApp (Twilio sub-account). Verify then store.
   */
  async connect(agentId: string, dto: { twilioSubAccountSid: string; twilioAuthToken: string; whatsappNumber: string }): Promise<AgentConnectionStatus> {
    const sid = dto.twilioSubAccountSid.trim();
    const token = dto.twilioAuthToken;
    const num = dto.whatsappNumber.startsWith('+') ? dto.whatsappNumber : `+${dto.whatsappNumber}`;
    if (!/^\+[1-9]\d{1,14}$/.test(num)) {
      throw new BadRequestException('whatsappNumber must be E.164');
    }

    // Free plans may connect a limited number of WhatsApp numbers. Re-connecting
    // this agent's own number is always allowed; exceeding the cap is not.
    await this.usage.assertCanConnectWhatsapp(null, agentId);

    const client = (twilio as any)(sid, token);
    try {
      await client.api.accounts(sid).fetch();
    } catch (e: any) {
      this.logger.warn(`Agent WhatsApp connect: Twilio verify failed for agent ${agentId}: ${e?.message || e}`);
      throw new BadRequestException('Invalid Twilio sub-account credentials');
    }

    const encrypted = encrypt(token);
    await this.db.query(
      `INSERT INTO agent_whatsapp_connections (agent_id, whatsapp_number, provider, external_account_id, encrypted_auth_token, status, updated_at)
       VALUES ($1, $2, 'twilio', $3, $4, 'connected', NOW())
       ON CONFLICT (agent_id) DO UPDATE SET
         whatsapp_number = EXCLUDED.whatsapp_number,
         provider = EXCLUDED.provider,
         external_account_id = EXCLUDED.external_account_id,
         encrypted_auth_token = EXCLUDED.encrypted_auth_token,
         status = 'connected',
         updated_at = NOW()`,
      [agentId, num, sid, encrypted],
    );
    this.logger.log(`Agent WhatsApp connected: agent=${agentId} number=${this.maskNumber(num)}`);
    return { connected: true, whatsappNumber: num, provider: 'twilio' };
  }

  /**
   * Disconnect agent's WhatsApp. Sets status to disconnected.
   */
  async disconnect(agentId: string): Promise<void> {
    const { rowCount } = await this.db.query(
      `UPDATE agent_whatsapp_connections SET status = 'disconnected', updated_at = NOW() WHERE agent_id = $1`,
      [agentId],
    );
    if (rowCount) this.logger.log(`Agent WhatsApp disconnected: agent=${agentId}`);
  }

  /**
   * Get connection status for agent (no secrets).
   */
  async getStatus(agentId: string): Promise<AgentConnectionStatus> {
    const { rows } = await this.db.query(
      `SELECT whatsapp_number, status FROM agent_whatsapp_connections WHERE agent_id = $1`,
      [agentId],
    );
    if (!rows.length || rows[0].status !== 'connected') {
      return { connected: false, provider: 'twilio' };
    }
    return {
      connected: true,
      whatsappNumber: this.maskNumber(rows[0].whatsapp_number),
      provider: 'twilio',
    };
  }

  /**
   * Get connection credentials for sending. Returns null if disconnected or missing.
   */
  async getForSend(agentId: string): Promise<AgentConnectionForSend | null> {
    const { rows } = await this.db.query(
      `SELECT external_account_id, encrypted_auth_token, whatsapp_number FROM agent_whatsapp_connections WHERE agent_id = $1 AND status = 'connected'`,
      [agentId],
    );
    if (!rows.length) return null;
    try {
      const authToken = decrypt(rows[0].encrypted_auth_token);
      return {
        subAccountSid: rows[0].external_account_id,
        authToken,
        whatsappNumber: rows[0].whatsapp_number,
      };
    } catch (e) {
      this.logger.warn(`Agent WhatsApp getForSend: decrypt failed for agent ${agentId}`);
      return null;
    }
  }

  /**
   * Resolve receiving number (To) to platform vs agent. Returns { type: 'platform' } or { type: 'agent', agentId }.
   */
  async resolveReceivingNumber(toRaw: string): Promise<{ type: 'platform' } | { type: 'agent'; agentId: string } | null> {
    const to = this.normalizeToE164(toRaw);
    if (!to) return null;
    const platform = this.normalizeToE164(this.config.get('TWILIO_WHATSAPP_FROM') || '');
    if (platform && to === platform) return { type: 'platform' };

    const { rows } = await this.db.query(
      `SELECT agent_id FROM agent_whatsapp_connections WHERE whatsapp_number = $1 AND status = 'connected'`,
      [to],
    );
    if (rows.length) return { type: 'agent', agentId: rows[0].agent_id };
    return null;
  }

  getPlatformFrom(): string | null {
    const v = this.config.get('TWILIO_WHATSAPP_FROM');
    if (!v || typeof v !== 'string') return null;
    const s = v.replace(/^whatsapp:/i, '').trim();
    return /^\+[1-9]\d{1,14}$/.test(s) ? s : null;
  }

  private normalizeToE164(addr: string): string | null {
    if (!addr || typeof addr !== 'string') return null;
    const s = addr.replace(/^whatsapp:/i, '').trim();
    return /^\+[1-9]\d{1,14}$/.test(s) ? s : null;
  }

  private maskNumber(n: string): string {
    if (!n || n.length < 6) return '***';
    return n.slice(0, 3) + '***' + n.slice(-4);
  }
}
