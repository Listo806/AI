import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class WebhooksService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Fire webhooks for a given event. Called from LeadsService / PropertiesService.
   * Runs fully async — never throws, never blocks the caller.
   */
  async triggerWebhooks(eventName: string, teamId: string, data: Record<string, any>): Promise<void> {
    try {
      const { rows: endpoints } = await this.db.query(
        `SELECT id, url, secret_token
         FROM webhook_endpoints
         WHERE team_id = $1
           AND is_active = true
           AND events @> $2::jsonb`,
        [teamId, JSON.stringify([eventName])],
      );

      if (endpoints.length === 0) return;

      const payload = JSON.stringify({
        event: eventName,
        timestamp: new Date().toISOString(),
        team_id: teamId,
        data,
      });

      const deliveries = endpoints.map((ep) => this.deliver(ep, eventName, payload, teamId));
      await Promise.allSettled(deliveries);
    } catch (err) {
      // Never let webhook errors propagate to the caller
      console.error('[WebhooksService] triggerWebhooks error:', err);
    }
  }

  /** POST the payload to one endpoint and log the result. */
  private async deliver(
    endpoint: { id: string; url: string; secret_token: string | null },
    eventName: string,
    payload: string,
    teamId: string,
  ): Promise<void> {
    const start = Date.now();
    let statusCode: number | null = null;
    let success = false;
    let errorMessage: string | null = null;

    try {
      if (!this.isSafeWebhookUrl(endpoint.url)) {
        throw new Error('Blocked non-public webhook URL');
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (endpoint.secret_token) {
        headers['X-CORTEXA-Webhook-Secret'] = endpoint.secret_token;
        // Sign the body so receivers can verify authenticity. Sent alongside
        // the legacy secret header so existing receivers keep working.
        headers['X-CORTEXA-Signature'] =
          'sha256=' +
          createHmac('sha256', endpoint.secret_token).update(payload).digest('hex');
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body: payload,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      statusCode = response.status;
      success = response.ok;

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        errorMessage = `HTTP ${response.status}: ${body.slice(0, 500)}`;
      }
    } catch (err: any) {
      errorMessage = err.name === 'AbortError' ? 'Timeout after 10s' : (err.message || String(err));
    }

    const responseTimeMs = Date.now() - start;

    try {
      await this.db.query(
        `INSERT INTO webhook_logs (team_id, endpoint_id, event_name, endpoint_url, status_code, success, response_time_ms, error_message)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [teamId, endpoint.id, eventName, endpoint.url, statusCode, success, responseTimeMs, errorMessage],
      );
    } catch (logErr) {
      console.error('[WebhooksService] Failed to log webhook delivery:', logErr);
    }
  }

  // ── CRUD ──────────────────────────────────────────────────────────

  async create(teamId: string, dto: { url: string; events: string[]; is_active?: boolean; secret_token?: string }) {
    if (!this.isSafeWebhookUrl(dto.url)) {
      throw new BadRequestException('Webhook URL must be a public http or https URL');
    }
    const { rows } = await this.db.query(
      `INSERT INTO webhook_endpoints (team_id, url, events, is_active, secret_token)
       VALUES ($1, $2, $3::jsonb, $4, $5)
       RETURNING id, team_id AS "teamId", url, events, is_active AS "isActive", secret_token AS "secretToken",
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [teamId, dto.url, JSON.stringify(dto.events), dto.is_active !== false, dto.secret_token || null],
    );
    return rows[0];
  }

  async findAll(teamId: string) {
    const { rows } = await this.db.query(
      `SELECT id, team_id AS "teamId", url, events, is_active AS "isActive",
              secret_token AS "secretToken", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM webhook_endpoints
       WHERE team_id = $1
       ORDER BY created_at DESC`,
      [teamId],
    );
    return rows;
  }

  async findOne(id: string, teamId: string) {
    const { rows } = await this.db.query(
      `SELECT id, team_id AS "teamId", url, events, is_active AS "isActive",
              secret_token AS "secretToken", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM webhook_endpoints
       WHERE id = $1 AND team_id = $2`,
      [id, teamId],
    );
    if (!rows.length) throw new NotFoundException('Webhook endpoint not found');
    return rows[0];
  }

  async update(id: string, teamId: string, dto: { url?: string; events?: string[]; is_active?: boolean; secret_token?: string }) {
    // Verify ownership
    await this.findOne(id, teamId);

    if (dto.url !== undefined && !this.isSafeWebhookUrl(dto.url)) {
      throw new BadRequestException('Webhook URL must be a public http or https URL');
    }

    const updates: string[] = [];
    const values: any[] = [];
    let p = 1;

    if (dto.url !== undefined) { updates.push(`url = $${p++}`); values.push(dto.url); }
    if (dto.events !== undefined) { updates.push(`events = $${p++}::jsonb`); values.push(JSON.stringify(dto.events)); }
    if (dto.is_active !== undefined) { updates.push(`is_active = $${p++}`); values.push(dto.is_active); }
    if (dto.secret_token !== undefined) { updates.push(`secret_token = $${p++}`); values.push(dto.secret_token || null); }

    if (updates.length === 0) return this.findOne(id, teamId);

    updates.push(`updated_at = NOW()`);
    values.push(id, teamId);

    const { rows } = await this.db.query(
      `UPDATE webhook_endpoints SET ${updates.join(', ')}
       WHERE id = $${p++} AND team_id = $${p}
       RETURNING id, team_id AS "teamId", url, events, is_active AS "isActive",
                 secret_token AS "secretToken", created_at AS "createdAt", updated_at AS "updatedAt"`,
      values,
    );
    return rows[0];
  }

  async toggleActive(id: string, teamId: string) {
    await this.findOne(id, teamId);

    const { rows } = await this.db.query(
      `UPDATE webhook_endpoints SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1 AND team_id = $2
       RETURNING id, team_id AS "teamId", url, events, is_active AS "isActive",
                 secret_token AS "secretToken", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [id, teamId],
    );
    return rows[0];
  }

  async remove(id: string, teamId: string): Promise<void> {
    await this.findOne(id, teamId);
    await this.db.query('DELETE FROM webhook_endpoints WHERE id = $1 AND team_id = $2', [id, teamId]);
  }

  // ── Logs ──────────────────────────────────────────────────────────

  async getLogs(teamId: string, limit = 50, offset = 0) {
    const { rows } = await this.db.query(
      `SELECT id, event_name AS "eventName", endpoint_url AS "endpointUrl",
              status_code AS "statusCode", success, response_time_ms AS "responseTimeMs",
              error_message AS "errorMessage", created_at AS "createdAt"
       FROM webhook_logs
       WHERE team_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [teamId, limit, offset],
    );
    return rows;
  }

  // ── Test ──────────────────────────────────────────────────────────

  async sendTest(id: string, teamId: string) {
    const endpoint = await this.findOne(id, teamId);

    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      team_id: teamId,
      data: { message: 'This is a test webhook from CORTEXA CRM' },
    };
    const body = JSON.stringify(testPayload);

    const start = Date.now();
    let statusCode: number | null = null;
    let success = false;
    let errorMessage: string | null = null;

    try {
      if (!this.isSafeWebhookUrl(endpoint.url)) {
        throw new Error('Blocked non-public webhook URL');
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (endpoint.secretToken) {
        headers['X-CORTEXA-Webhook-Secret'] = endpoint.secretToken;
        headers['X-CORTEXA-Signature'] =
          'sha256=' +
          createHmac('sha256', endpoint.secretToken).update(body).digest('hex');
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      statusCode = response.status;
      success = response.ok;

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        errorMessage = `HTTP ${response.status}: ${body.slice(0, 500)}`;
      }
    } catch (err: any) {
      errorMessage = err.name === 'AbortError' ? 'Timeout after 10s' : (err.message || String(err));
    }

    const responseTimeMs = Date.now() - start;

    // Log it
    await this.db.query(
      `INSERT INTO webhook_logs (team_id, endpoint_id, event_name, endpoint_url, status_code, success, response_time_ms, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [teamId, id, 'test', endpoint.url, statusCode, success, responseTimeMs, errorMessage],
    );

    return { success, statusCode, responseTimeMs, errorMessage };
  }

  // ── Security ──────────────────────────────────────────────────────
  // Basic SSRF guard: allow only public http(s) URLs, blocking loopback,
  // private, and link-local / cloud-metadata address ranges.
  private isSafeWebhookUrl(rawUrl: string): boolean {
    let u: URL;
    try {
      u = new URL(rawUrl);
    } catch {
      return false;
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;

    const host = u.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      return false;
    }

    const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4) {
      const a = Number(ipv4[1]);
      const b = Number(ipv4[2]);
      if (a === 0 || a === 10 || a === 127) return false;
      if (a === 169 && b === 254) return false; // link-local + cloud metadata
      if (a === 172 && b >= 16 && b <= 31) return false;
      if (a === 192 && b === 168) return false;
    }

    if (
      host === '::1' ||
      host === '[::1]' ||
      host.startsWith('fc') ||
      host.startsWith('fd') ||
      host.startsWith('fe80')
    ) {
      return false;
    }

    return true;
  }
}
