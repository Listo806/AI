import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ConversationsService } from './conversations.service';

/** Master Funnel entry greeting (Spanish) */
const MASTER_ENTRY_MESSAGE =
  'Hola 👋 Soy el asistente de CORTEXA.\n¿Buscas 1) Comprar/Alquilar, 2) Vender, 3) CRM para Agentes, o 4) Soporte?';

/** Property Flow entry greeting */
const PROPERTY_ENTRY_MESSAGE =
  'Hola 👋 Gracias por tu interés en esta propiedad.\n¿Qué te gustaría saber? 1) Disponibilidad, 2) Precio/detalles, 3) Agendar visita, 4) Hablar con el vendedor/agente';

export type FlowType = 'master' | 'property';

export type MasterFunnelIntent = 'buyer_search' | 'seller_listing' | 'agent_crm' | 'general_support';

@Injectable()
export class WhatsAppFlowOrchestratorService {
  private readonly logger = new Logger(WhatsAppFlowOrchestratorService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly conversations: ConversationsService,
  ) {}

  /**
   * Determine flow: Property if lead.property_id or conversation.source_meta.property_id exists, else Master.
   */
  async determineFlow(leadId: string, conversationId: string): Promise<FlowType> {
    const { rows } = await this.db.query(
      `SELECT l.property_id, c.source_meta
       FROM leads l
       JOIN conversations c ON c.lead_id = l.id AND c.id = $2
       WHERE l.id = $1`,
      [leadId, conversationId],
    );
    if (!rows.length) return 'master';
    const row = rows[0];
    if (row?.property_id) return 'property';
    const meta = row?.source_meta;
    if (meta && typeof meta === 'object' && meta.property_id) return 'property';
    return 'master';
  }

  /**
   * Parse [src:xxx] from message body. Returns parsed source or null.
   */
  parseSourceFromBody(body: string): string | null {
    const match = (body || '').match(/\[src:([a-z0-9_]+)\]/i);
    return match ? match[1] : null;
  }

  /**
   * Map user reply 1-4 to Master Funnel intent.
   */
  mapReplyToIntent(text: string): MasterFunnelIntent | null {
    const t = (text || '').trim();
    if (/^1$|^uno$|^comprar|alquilar|buy|rent/i.test(t)) return 'buyer_search';
    if (/^2$|^dos$|^vender|sell|listar/i.test(t)) return 'seller_listing';
    if (/^3$|^tres$|^agente|crm|agent/i.test(t)) return 'agent_crm';
    if (/^4$|^cuatro$|^soporte|support|otro/i.test(t)) return 'general_support';
    return null;
  }

  /**
   * Get entry message for flow and whether it's a new conversation.
   */
  getEntryMessage(flow: FlowType, _created: boolean): string {
    if (flow === 'property') return PROPERTY_ENTRY_MESSAGE;
    return MASTER_ENTRY_MESSAGE;
  }

  /**
   * Merge updates into conversation source_meta (partial update).
   */
  async mergeConversationSourceMeta(
    conversationId: string,
    updates: Record<string, unknown>,
  ): Promise<void> {
    await this.conversations.mergeSourceMeta(conversationId, updates);
  }

  /**
   * Check if last inbound (lead) message was within 24h.
   */
  async isWithin24hWindow(conversationId: string): Promise<boolean> {
    const { rows } = await this.db.query(
      `SELECT created_at FROM lead_messages
       WHERE conversation_id = $1 AND direction = 'inbound' AND sender_type = 'lead'
       ORDER BY created_at DESC LIMIT 1`,
      [conversationId],
    );
    if (!rows.length) return true;
    const lastAt = new Date(rows[0].created_at).getTime();
    return Date.now() - lastAt < 24 * 60 * 60 * 1000;
  }
}
