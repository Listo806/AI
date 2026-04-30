import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ConfigService } from '../config/config.service';
import { SiteAssistOrchestratorService } from './site-assist-orchestrator.service';
import { SiteAssistTurnDto } from './dto/site-assist-turn.dto';
import { SiteAssistState, SiteAssistTurnResponse } from './site-assist.types';

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 40;

@Injectable()
export class SiteAssistService {
  private readonly logger = new Logger(SiteAssistService.name);
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
    private readonly orchestrator: SiteAssistOrchestratorService,
  ) {}

  private assertApiKey(headerVal?: string): void {
    const expected = this.config.get('SITE_ASSIST_API_KEY');
    if (!expected?.trim()) return;
    if (!headerVal || headerVal !== expected) {
      throw new UnauthorizedException('Invalid or missing site assist API key');
    }
  }

  private rateLimit(ip: string): void {
    const key = ip || 'unknown';
    const now = Date.now();
    const windowStart = now - RATE_WINDOW_MS;
    const prev = this.hits.get(key) || [];
    const next = prev.filter((t) => t > windowStart);
    if (next.length >= RATE_MAX) {
      this.logger.warn(`Site assist rate limit: ${key}`);
      throw new HttpException('Too many requests. Try again shortly.', HttpStatus.TOO_MANY_REQUESTS);
    }
    next.push(now);
    this.hits.set(key, next);
  }

  private truncateIp(ip: string): string {
    return (ip || '').slice(0, 45);
  }

  private truncateUa(ua: string): string {
    return (ua || '').slice(0, 2000);
  }

  async handleTurn(
    dto: SiteAssistTurnDto,
    clientIp: string,
    userAgent: string,
    apiKeyHeader?: string,
  ): Promise<SiteAssistTurnResponse> {
    this.assertApiKey(apiKeyHeader);
    this.rateLimit(this.truncateIp(clientIp));

    if (!dto.sessionId) {
      const session = await this.createSession(dto.locale, clientIp, userAgent);
      const res = this.orchestrator.welcomeResponse(session.id, dto.locale);
      await this.appendMessage(session.id, 'assistant', res.text, {
        buttons: res.buttons,
        links: res.links,
        type: res.type,
      });
      return res;
    }

    const row = await this.getSession(dto.sessionId);
    if (!row) {
      throw new NotFoundException('Session not found or expired');
    }

    if (!dto.message?.trim() && !dto.actionId?.trim()) {
      throw new BadRequestException('Provide message and/or actionId');
    }

    await this.updateSessionMeta(row.id, dto.locale);

    const userBody = [
      dto.actionId ? `[action:${dto.actionId.trim()}]` : '',
      dto.message?.trim() || '',
    ]
      .filter(Boolean)
      .join('\n');

    await this.appendMessage(row.id, 'user', userBody || '(empty)', null);

    const priorMessages = await this.listChatMessages(row.id);
    priorMessages.pop();

    const state = (row.state || { stage: 'welcome' }) as SiteAssistState;

    const { newState, response } = await this.orchestrator.processTurn({
      sessionId: row.id,
      locale: dto.locale,
      state,
      message: dto.message?.trim(),
      actionId: dto.actionId?.trim(),
      priorMessages,
    });

    await this.updateSessionState(row.id, newState);
    await this.appendMessage(row.id, 'assistant', response.text, {
      buttons: response.buttons,
      links: response.links,
      type: response.type,
    });

    return response;
  }

  private async createSession(
    locale: string,
    clientIp: string,
    userAgent: string,
  ): Promise<{ id: string }> {
    const initialState: SiteAssistState = { stage: 'welcome' };
    const { rows } = await this.db.query(
      `INSERT INTO site_assist_sessions (locale, client_ip, user_agent, state)
       VALUES ($1, $2, $3, $4::jsonb)
       RETURNING id`,
      [
        locale,
        this.truncateIp(clientIp),
        this.truncateUa(userAgent),
        JSON.stringify(initialState),
      ],
    );
    return { id: rows[0].id };
  }

  private async getSession(id: string): Promise<{
    id: string;
    locale: string;
    state: SiteAssistState;
  } | null> {
    const { rows } = await this.db.query(
      `SELECT id, locale, state FROM site_assist_sessions WHERE id = $1`,
      [id],
    );
    if (!rows.length) return null;
    const r = rows[0];
    return {
      id: r.id,
      locale: r.locale,
      state: typeof r.state === 'string' ? JSON.parse(r.state) : r.state,
    };
  }

  private async updateSessionMeta(id: string, locale: string): Promise<void> {
    await this.db.query(
      `UPDATE site_assist_sessions SET locale = $2, updated_at = NOW() WHERE id = $1`,
      [id, locale],
    );
  }

  private async updateSessionState(id: string, state: SiteAssistState): Promise<void> {
    await this.db.query(
      `UPDATE site_assist_sessions SET state = $2::jsonb, updated_at = NOW() WHERE id = $1`,
      [id, JSON.stringify(state)],
    );
  }

  private async appendMessage(
    sessionId: string,
    role: 'user' | 'assistant' | 'system',
    body: string,
    payload: Record<string, unknown> | null,
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO site_assist_messages (session_id, role, body, payload)
       VALUES ($1, $2, $3, $4::jsonb)`,
      [sessionId, role, body, payload ? JSON.stringify(payload) : null],
    );
  }

  private async listChatMessages(
    sessionId: string,
  ): Promise<{ role: 'user' | 'assistant'; body: string }[]> {
    const { rows } = await this.db.query(
      `SELECT role, body FROM site_assist_messages
       WHERE session_id = $1 AND role IN ('user','assistant')
       ORDER BY created_at ASC`,
      [sessionId],
    );
    return rows.map((r: { role: string; body: string }) => ({
      role: r.role as 'user' | 'assistant',
      body: r.body || '',
    }));
  }
}
