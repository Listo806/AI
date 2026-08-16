import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const OWNER_ROLE = 'owner';

// Marketing Workspace backend. Reuses the Cortexa tenant model: the account boundary
// is the TEAM, so every row carries team_id and every query is scoped to the teams
// the caller can access. Industry-neutral: no vertical-specific fields. Budget (the
// plan) and recorded spend (mkt_campaign_costs) are kept strictly separate, and no
// external ad-platform metric is ever fabricated — it only ever comes from a real
// recorded cost or a legitimately connected integration.
@Injectable()
export class MarketingService {
  constructor(private readonly db: DatabaseService) {}

  private static readonly UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  private assertUuidOrBlank(value: string | undefined | null, label: string): void {
    if (value && !MarketingService.UUID_RE.test(String(value))) {
      throw new BadRequestException(`Invalid ${label} reference`);
    }
  }

  private schemaReady = false;

  private async ensureSchema(): Promise<void> {
    if (this.schemaReady) return;
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS mkt_campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        created_by UUID,
        campaign_number TEXT,
        name TEXT,
        campaign_type TEXT,
        channel TEXT,
        audience_id UUID,
        audience_name TEXT,
        status TEXT NOT NULL DEFAULT 'Draft',
        budget NUMERIC(14,2),
        owner_name TEXT,
        goals TEXT,
        tags TEXT[],
        notes TEXT,
        tracking TEXT,
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    for (const idx of [
      `CREATE INDEX IF NOT EXISTS idx_mkt_campaigns_team ON mkt_campaigns(team_id)`,
      `CREATE INDEX IF NOT EXISTS idx_mkt_campaigns_status ON mkt_campaigns(status)`,
      `CREATE INDEX IF NOT EXISTS idx_mkt_campaigns_type ON mkt_campaigns(campaign_type)`,
      `CREATE INDEX IF NOT EXISTS idx_mkt_campaigns_audience ON mkt_campaigns(audience_id)`,
      `CREATE INDEX IF NOT EXISTS idx_mkt_campaigns_start ON mkt_campaigns(start_date)`,
    ]) {
      await this.db.query(idx);
    }
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS mkt_campaign_costs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        created_by UUID,
        campaign_id UUID,
        amount NUMERIC(14,2),
        cost_date DATE,
        source TEXT DEFAULT 'Manual',
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await this.db.query(`CREATE INDEX IF NOT EXISTS idx_mkt_campaign_costs_team ON mkt_campaign_costs(team_id)`);
    await this.db.query(`CREATE INDEX IF NOT EXISTS idx_mkt_campaign_costs_campaign ON mkt_campaign_costs(campaign_id)`);
    await this.db.query(`CREATE INDEX IF NOT EXISTS idx_mkt_campaign_costs_date ON mkt_campaign_costs(cost_date)`);
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS mkt_activity (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        actor_id UUID,
        actor_name TEXT,
        action TEXT NOT NULL,
        subject TEXT,
        entity_type TEXT,
        entity_id UUID,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await this.db.query(`CREATE INDEX IF NOT EXISTS idx_mkt_activity_team ON mkt_activity(team_id)`);
    await this.db.query(`CREATE INDEX IF NOT EXISTS idx_mkt_activity_created ON mkt_activity(created_at)`);

    // ── Leads / touchpoints / conversions (attribution) ──────────────────────
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS mkt_leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        created_by UUID,
        contact_id UUID,
        name TEXT,
        email TEXT,
        phone TEXT,
        source TEXT,
        campaign_id UUID,
        campaign_name TEXT,
        status TEXT NOT NULL DEFAULT 'New',
        value NUMERIC(14,2),
        external_id TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    for (const idx of [
      `CREATE INDEX IF NOT EXISTS idx_mkt_leads_team ON mkt_leads(team_id)`,
      `CREATE INDEX IF NOT EXISTS idx_mkt_leads_campaign ON mkt_leads(campaign_id)`,
      `CREATE INDEX IF NOT EXISTS idx_mkt_leads_source ON mkt_leads(source)`,
      `CREATE INDEX IF NOT EXISTS idx_mkt_leads_status ON mkt_leads(status)`,
      `CREATE INDEX IF NOT EXISTS idx_mkt_leads_created ON mkt_leads(created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_mkt_leads_email ON mkt_leads(team_id, lower(email))`,
    ]) {
      await this.db.query(idx);
    }
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS mkt_touchpoints (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        lead_id UUID NOT NULL,
        campaign_id UUID,
        campaign_name TEXT,
        channel TEXT,
        touch_type TEXT,
        occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    for (const idx of [
      `CREATE INDEX IF NOT EXISTS idx_mkt_touchpoints_team ON mkt_touchpoints(team_id)`,
      `CREATE INDEX IF NOT EXISTS idx_mkt_touchpoints_lead ON mkt_touchpoints(lead_id)`,
      `CREATE INDEX IF NOT EXISTS idx_mkt_touchpoints_campaign ON mkt_touchpoints(campaign_id)`,
      `CREATE INDEX IF NOT EXISTS idx_mkt_touchpoints_occurred ON mkt_touchpoints(occurred_at)`,
    ]) {
      await this.db.query(idx);
    }
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS mkt_conversions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        created_by UUID,
        lead_id UUID,
        contact_id UUID,
        conversion_type TEXT,
        value NUMERIC(14,2),
        currency TEXT DEFAULT 'USD',
        attributed_campaign_id UUID,
        attributed_campaign_name TEXT,
        attributed_channel TEXT,
        attribution_model TEXT DEFAULT 'last_touch',
        source TEXT DEFAULT 'Manual',
        idempotency_key TEXT,
        occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await this.db.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_mkt_conversions_idem
         ON mkt_conversions(team_id, idempotency_key) WHERE idempotency_key IS NOT NULL`,
    );
    for (const idx of [
      `CREATE INDEX IF NOT EXISTS idx_mkt_conversions_team ON mkt_conversions(team_id)`,
      `CREATE INDEX IF NOT EXISTS idx_mkt_conversions_lead ON mkt_conversions(lead_id)`,
      `CREATE INDEX IF NOT EXISTS idx_mkt_conversions_campaign ON mkt_conversions(attributed_campaign_id)`,
      `CREATE INDEX IF NOT EXISTS idx_mkt_conversions_occurred ON mkt_conversions(occurred_at)`,
    ]) {
      await this.db.query(idx);
    }

    // ── Email / SMS messaging + events + suppression ─────────────────────────
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS mkt_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        created_by UUID,
        campaign_id UUID,
        channel TEXT NOT NULL DEFAULT 'Email',
        name TEXT,
        subject TEXT,
        body TEXT,
        from_name TEXT,
        from_address TEXT,
        audience_id UUID,
        audience_name TEXT,
        status TEXT NOT NULL DEFAULT 'Draft',
        scheduled_at TIMESTAMP,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    for (const idx of [
      `CREATE INDEX IF NOT EXISTS idx_mkt_messages_team ON mkt_messages(team_id)`,
      `CREATE INDEX IF NOT EXISTS idx_mkt_messages_campaign ON mkt_messages(campaign_id)`,
      `CREATE INDEX IF NOT EXISTS idx_mkt_messages_channel ON mkt_messages(channel)`,
      `CREATE INDEX IF NOT EXISTS idx_mkt_messages_status ON mkt_messages(status)`,
      `CREATE INDEX IF NOT EXISTS idx_mkt_messages_sent ON mkt_messages(sent_at)`,
    ]) {
      await this.db.query(idx);
    }
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS mkt_message_recipients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        message_id UUID NOT NULL,
        contact_id UUID,
        lead_id UUID,
        address TEXT,
        name TEXT,
        status TEXT NOT NULL DEFAULT 'Queued',
        sent_at TIMESTAMP,
        delivered_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    for (const idx of [
      `CREATE INDEX IF NOT EXISTS idx_mkt_msg_recips_team ON mkt_message_recipients(team_id)`,
      `CREATE INDEX IF NOT EXISTS idx_mkt_msg_recips_msg ON mkt_message_recipients(message_id)`,
      `CREATE INDEX IF NOT EXISTS idx_mkt_msg_recips_status ON mkt_message_recipients(status)`,
      `CREATE INDEX IF NOT EXISTS idx_mkt_msg_recips_addr ON mkt_message_recipients(team_id, lower(address))`,
    ]) {
      await this.db.query(idx);
    }
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS mkt_message_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        message_id UUID NOT NULL,
        recipient_id UUID,
        event_type TEXT NOT NULL,
        url TEXT,
        dedup_key TEXT,
        occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await this.db.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_mkt_msg_events_dedup
         ON mkt_message_events(team_id, dedup_key) WHERE dedup_key IS NOT NULL`,
    );
    for (const idx of [
      `CREATE INDEX IF NOT EXISTS idx_mkt_msg_events_team ON mkt_message_events(team_id)`,
      `CREATE INDEX IF NOT EXISTS idx_mkt_msg_events_msg ON mkt_message_events(message_id)`,
      `CREATE INDEX IF NOT EXISTS idx_mkt_msg_events_recip ON mkt_message_events(recipient_id)`,
      `CREATE INDEX IF NOT EXISTS idx_mkt_msg_events_type ON mkt_message_events(event_type)`,
      `CREATE INDEX IF NOT EXISTS idx_mkt_msg_events_occurred ON mkt_message_events(occurred_at)`,
    ]) {
      await this.db.query(idx);
    }
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS mkt_suppression (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        channel TEXT NOT NULL DEFAULT 'Email',
        address TEXT NOT NULL,
        reason TEXT,
        created_by UUID,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await this.db.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_mkt_suppression_addr
         ON mkt_suppression(team_id, channel, lower(address))`,
    );
    await this.db.query(`CREATE INDEX IF NOT EXISTS idx_mkt_suppression_team ON mkt_suppression(team_id)`);

    this.schemaReady = true;
  }

  private async getAccessibleTeamIds(
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<string[]> {
    if (role === OWNER_ROLE) {
      const { rows } = await this.db.query(
        `SELECT t.id FROM teams t
          WHERE t.owner_id = $1
             OR t.id = (SELECT team_id FROM users WHERE id = $1 AND team_id IS NOT NULL LIMIT 1)`,
        [userId],
      );
      return rows.map((r: { id: string }) => r.id);
    }
    if (userTeamId) return [userTeamId];
    return [];
  }

  private resolveTeamId(
    dtoTeamId: string | undefined,
    userTeamId: string | null,
    accessible: string[],
  ): string {
    const candidate =
      dtoTeamId && accessible.includes(dtoTeamId)
        ? dtoTeamId
        : userTeamId && accessible.includes(userTeamId)
          ? userTeamId
          : accessible[0];
    if (!candidate || !accessible.includes(candidate)) {
      throw new ForbiddenException('You do not have access to this team');
    }
    return candidate;
  }

  private async logActivity(
    teamId: string,
    action: string,
    subject: string | null,
    entityType: string | null,
    entityId: string | null,
    actorId: string | null,
    actorName: string | null,
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO mkt_activity (team_id, actor_id, actor_name, action, subject, entity_type, entity_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [teamId, actorId, actorName, action, subject, entityType, entityId],
    );
  }

  private async generateCampaignNumber(teamId: string): Promise<string> {
    const year = new Date().getFullYear();
    const { rows } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM mkt_campaigns
        WHERE team_id = $1 AND campaign_number LIKE $2`,
      [teamId, `CMP-${year}-%`],
    );
    const seq = (Number(rows[0]?.n) || 0) + 1;
    return `CMP-${year}-${String(seq).padStart(4, '0')}`;
  }

  // Spend is the SUM of recorded costs — NEVER the budget. Leads are the leads whose
  // originating campaign is this one; conversions are the ones attributed to it by
  // last-touch. All correlate on team_id so cross-account rows can never leak in.
  private readonly campaignSelect = `
    c.id, c.team_id AS "teamId", c.campaign_number AS "campaignNumber",
    c.name, c.campaign_type AS "campaignType", c.channel,
    c.audience_id AS "audienceId", c.audience_name AS "audienceName",
    c.status, c.budget, c.owner_name AS "ownerName",
    c.goals, c.tags, c.notes, c.tracking,
    c.start_date AS "startDate", c.end_date AS "endDate",
    COALESCE((SELECT SUM(mc.amount) FROM mkt_campaign_costs mc
               WHERE mc.campaign_id = c.id AND mc.team_id = c.team_id), 0) AS spend,
    COALESCE((SELECT COUNT(*) FROM mkt_leads ml
               WHERE ml.campaign_id = c.id AND ml.team_id = c.team_id), 0)::int AS leads,
    COALESCE((SELECT COUNT(*) FROM mkt_conversions mcv
               WHERE mcv.attributed_campaign_id = c.id AND mcv.team_id = c.team_id), 0)::int AS conversions,
    COALESCE((SELECT SUM(mcv.value) FROM mkt_conversions mcv
               WHERE mcv.attributed_campaign_id = c.id AND mcv.team_id = c.team_id), 0) AS revenue,
    c.created_at AS "createdAt", c.updated_at AS "updatedAt"
  `;

  async findAllCampaigns(
    userId: string,
    userTeamId: string | null,
    role: string,
    params: {
      search?: string; status?: string; campaignType?: string; channel?: string;
      page?: string; limit?: string;
    },
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    await this.ensureSchema();
    let page = parseInt(String(params.page ?? '1'), 10);
    let limit = parseInt(String(params.limit ?? '20'), 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    if (page > 1_000_000) page = 1_000_000;
    if (!Number.isFinite(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) return { data: [], total: 0, page, limit };

    const where: string[] = ['c.team_id = ANY($1)'];
    const vals: any[] = [accessible];
    let i = 2;
    if (params.status && params.status.trim()) {
      where.push(`c.status = $${i++}`);
      vals.push(params.status.trim());
    }
    if (params.campaignType && params.campaignType.trim()) {
      where.push(`c.campaign_type = $${i++}`);
      vals.push(params.campaignType.trim());
    }
    if (params.channel && params.channel.trim()) {
      where.push(`c.channel ILIKE $${i++}`);
      vals.push(`%${params.channel.trim()}%`);
    }
    if (params.search && params.search.trim()) {
      where.push(
        `(c.name ILIKE $${i} OR c.campaign_number ILIKE $${i} OR c.campaign_type ILIKE $${i} OR c.audience_name ILIKE $${i} OR c.owner_name ILIKE $${i})`,
      );
      vals.push(`%${params.search.trim()}%`);
      i++;
    }
    const whereSql = where.join(' AND ');
    const countRes = await this.db.query(
      `SELECT COUNT(*)::int AS total FROM mkt_campaigns c WHERE ${whereSql}`,
      vals,
    );
    const total = countRes.rows[0]?.total || 0;
    const dataRes = await this.db.query(
      `SELECT ${this.campaignSelect} FROM mkt_campaigns c
        WHERE ${whereSql} ORDER BY c.created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      [...vals, limit, (page - 1) * limit],
    );
    return { data: dataRes.rows, total, page, limit };
  }

  async findOneCampaign(id: string, userId: string, userTeamId: string | null, role: string): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Campaign not found');
    const { rows } = await this.db.query(
      `SELECT ${this.campaignSelect} FROM mkt_campaigns c
        WHERE c.id = $1 AND c.team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!rows.length) throw new NotFoundException('Campaign not found');
    return rows[0];
  }

  async createCampaign(dto: any, userId: string, userTeamId: string | null, role: string): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new ForbiddenException('You do not have access to this account');
    const teamId = this.resolveTeamId(dto.teamId, userTeamId, accessible);
    this.assertUuidOrBlank(dto.audienceId, 'audience');
    const campaignNumber =
      (dto.campaignNumber && dto.campaignNumber.trim()) ||
      (await this.generateCampaignNumber(teamId));
    const { rows } = await this.db.query(
      `INSERT INTO mkt_campaigns
         (team_id, created_by, campaign_number, name, campaign_type, channel,
          audience_id, audience_name, status, budget, owner_name, goals, tags, notes,
          tracking, start_date, end_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING id`,
      [
        teamId, userId, campaignNumber, dto.name || null, dto.campaignType || null,
        dto.channel || null, dto.audienceId || null, dto.audienceName || null,
        (dto.status && dto.status.trim()) || 'Draft', dto.budget ?? null,
        dto.ownerName || null, dto.goals || null,
        Array.isArray(dto.tags) ? dto.tags : null, dto.notes || null,
        dto.tracking || null, this.parseDateOnly(dto.startDate), this.parseDateOnly(dto.endDate),
      ],
    );
    await this.logActivity(teamId, 'Campaign created', dto.name || null, 'campaign', rows[0].id, userId, dto.ownerName || null).catch(() => undefined);
    return this.findOneCampaign(rows[0].id, userId, userTeamId, role);
  }

  async updateCampaign(id: string, dto: any, userId: string, userTeamId: string | null, role: string): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Campaign not found');
    const existing = await this.db.query(
      `SELECT team_id, status, name FROM mkt_campaigns WHERE id = $1 AND team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!existing.rows.length) throw new NotFoundException('Campaign not found');
    const prev = existing.rows[0];
    const teamId = prev.team_id;
    if (dto.audienceId !== undefined && dto.audienceId !== null) this.assertUuidOrBlank(dto.audienceId, 'audience');
    // Strict-validate DATE fields before they reach the raw column (impossible ISO
    // dates like 2024-02-30 pass @IsDateString but 500 on a DATE column).
    if (dto.startDate !== undefined) dto.startDate = this.parseDateOnly(dto.startDate);
    if (dto.endDate !== undefined) dto.endDate = this.parseDateOnly(dto.endDate);
    const colFor: Record<string, string> = {
      campaignNumber: 'campaign_number', name: 'name', campaignType: 'campaign_type',
      channel: 'channel', audienceId: 'audience_id', audienceName: 'audience_name',
      status: 'status', budget: 'budget', ownerName: 'owner_name', goals: 'goals',
      tags: 'tags', notes: 'notes', tracking: 'tracking',
      startDate: 'start_date', endDate: 'end_date',
    };
    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    for (const [key, col] of Object.entries(colFor)) {
      if ((dto as any)[key] !== undefined) {
        sets.push(`${col} = $${i++}`);
        vals.push((dto as any)[key]);
      }
    }
    if (!sets.length) return this.findOneCampaign(id, userId, userTeamId, role);
    sets.push(`updated_at = NOW()`);
    vals.push(id, teamId);
    await this.db.query(
      `UPDATE mkt_campaigns SET ${sets.join(', ')} WHERE id = $${i++} AND team_id = $${i++}`,
      vals,
    );
    // Log status transitions as their own activity (activated/paused/completed/...).
    if (dto.status !== undefined && dto.status !== prev.status) {
      const map: Record<string, string> = {
        Active: 'Campaign activated', Paused: 'Campaign paused', Completed: 'Campaign completed',
        Scheduled: 'Campaign scheduled', Canceled: 'Campaign canceled', Archived: 'Campaign archived',
      };
      await this.logActivity(teamId, map[dto.status] || 'Campaign updated', dto.name || prev.name, 'campaign', id, userId, null).catch(() => undefined);
    }
    return this.findOneCampaign(id, userId, userTeamId, role);
  }

  async removeCampaign(id: string, userId: string, userTeamId: string | null, role: string): Promise<{ success: boolean }> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Campaign not found');
    const res = await this.db.query(
      `DELETE FROM mkt_campaigns WHERE id = $1 AND team_id = ANY($2)`,
      [id, accessible],
    );
    if (!res.rowCount) throw new NotFoundException('Campaign not found');
    return { success: true };
  }

  async duplicateCampaign(id: string, userId: string, userTeamId: string | null, role: string): Promise<any> {
    const src = await this.findOneCampaign(id, userId, userTeamId, role);
    return this.createCampaign(
      {
        name: `${src.name || 'Campaign'} (Copy)`,
        campaignType: src.campaignType, channel: src.channel,
        audienceId: src.audienceId, audienceName: src.audienceName,
        status: 'Draft', budget: src.budget, ownerName: src.ownerName,
        goals: src.goals, tags: src.tags, notes: src.notes, tracking: src.tracking,
        startDate: src.startDate, endDate: src.endDate,
      },
      userId, userTeamId, role,
    );
  }

  // ─── Campaign costs (recorded spend, separate from budget) ───────────────────

  private async assertCampaignInTeam(campaignId: string, accessible: string[]): Promise<string> {
    const { rows } = await this.db.query(
      `SELECT team_id FROM mkt_campaigns WHERE id = $1 AND team_id = ANY($2) LIMIT 1`,
      [campaignId, accessible],
    );
    if (!rows.length) throw new NotFoundException('Campaign not found');
    return rows[0].team_id;
  }

  async listCosts(campaignId: string, userId: string, userTeamId: string | null, role: string): Promise<any[]> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Campaign not found');
    await this.assertCampaignInTeam(campaignId, accessible);
    const { rows } = await this.db.query(
      `SELECT id, campaign_id AS "campaignId", amount, cost_date AS "costDate",
              source, description, created_at AS "createdAt"
         FROM mkt_campaign_costs
        WHERE campaign_id = $1 AND team_id = ANY($2)
        ORDER BY cost_date DESC NULLS LAST, created_at DESC`,
      [campaignId, accessible],
    );
    return rows;
  }

  async createCost(campaignId: string, dto: any, userId: string, userTeamId: string | null, role: string): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new ForbiddenException('You do not have access to this account');
    const teamId = await this.assertCampaignInTeam(campaignId, accessible);
    const { rows } = await this.db.query(
      `INSERT INTO mkt_campaign_costs (team_id, created_by, campaign_id, amount, cost_date, source, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, campaign_id AS "campaignId", amount, cost_date AS "costDate", source, description, created_at AS "createdAt"`,
      [teamId, userId, campaignId, dto.amount ?? null, this.parseDateOnly(dto.costDate), (dto.source && dto.source.trim()) || 'Manual', dto.description || null],
    );
    return rows[0];
  }

  async removeCost(campaignId: string, costId: string, userId: string, userTeamId: string | null, role: string): Promise<{ success: boolean }> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Cost not found');
    await this.assertCampaignInTeam(campaignId, accessible);
    const res = await this.db.query(
      `DELETE FROM mkt_campaign_costs WHERE id = $1 AND campaign_id = $2 AND team_id = ANY($3)`,
      [costId, campaignId, accessible],
    );
    if (!res.rowCount) throw new NotFoundException('Cost not found');
    return { success: true };
  }

  // ─── Leads ───────────────────────────────────────────────────────────────────

  private readonly leadSelect = `
    l.id, l.team_id AS "teamId", l.contact_id AS "contactId", l.name, l.email, l.phone,
    l.source, l.campaign_id AS "campaignId", l.campaign_name AS "campaignName",
    l.status, l.value, l.external_id AS "externalId", l.notes,
    COALESCE((SELECT COUNT(*) FROM mkt_conversions mcv
               WHERE mcv.lead_id = l.id AND mcv.team_id = l.team_id), 0)::int AS conversions,
    l.created_at AS "createdAt", l.updated_at AS "updatedAt"
  `;

  async findAllLeads(
    userId: string,
    userTeamId: string | null,
    role: string,
    params: { search?: string; status?: string; source?: string; campaignId?: string; page?: string; limit?: string },
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    await this.ensureSchema();
    let page = parseInt(String(params.page ?? '1'), 10);
    let limit = parseInt(String(params.limit ?? '20'), 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    if (page > 1_000_000) page = 1_000_000;
    if (!Number.isFinite(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) return { data: [], total: 0, page, limit };

    const where: string[] = ['l.team_id = ANY($1)'];
    const vals: any[] = [accessible];
    let i = 2;
    if (params.status && params.status.trim()) { where.push(`l.status = $${i++}`); vals.push(params.status.trim()); }
    if (params.source && params.source.trim()) { where.push(`l.source = $${i++}`); vals.push(params.source.trim()); }
    if (params.campaignId && params.campaignId.trim()) {
      this.assertUuidOrBlank(params.campaignId, 'campaign');
      where.push(`l.campaign_id = $${i++}`); vals.push(params.campaignId.trim());
    }
    if (params.search && params.search.trim()) {
      where.push(`(l.name ILIKE $${i} OR l.email ILIKE $${i} OR l.phone ILIKE $${i} OR l.source ILIKE $${i} OR l.campaign_name ILIKE $${i})`);
      vals.push(`%${params.search.trim()}%`); i++;
    }
    const whereSql = where.join(' AND ');
    const countRes = await this.db.query(`SELECT COUNT(*)::int AS total FROM mkt_leads l WHERE ${whereSql}`, vals);
    const total = countRes.rows[0]?.total || 0;
    const dataRes = await this.db.query(
      `SELECT ${this.leadSelect} FROM mkt_leads l WHERE ${whereSql}
        ORDER BY l.created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      [...vals, limit, (page - 1) * limit],
    );
    return { data: dataRes.rows, total, page, limit };
  }

  async findOneLead(id: string, userId: string, userTeamId: string | null, role: string): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Lead not found');
    const { rows } = await this.db.query(
      `SELECT ${this.leadSelect} FROM mkt_leads l WHERE l.id = $1 AND l.team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!rows.length) throw new NotFoundException('Lead not found');
    return rows[0];
  }

  async createLead(dto: any, userId: string, userTeamId: string | null, role: string): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new ForbiddenException('You do not have access to this account');
    const teamId = this.resolveTeamId(dto.teamId, userTeamId, accessible);
    this.assertUuidOrBlank(dto.campaignId, 'campaign');
    this.assertUuidOrBlank(dto.contactId, 'contact');
    // Resolve the campaign name from a real in-team campaign when a campaign is given.
    let campaignName = dto.campaignName || null;
    if (dto.campaignId) {
      const { rows } = await this.db.query(
        `SELECT name FROM mkt_campaigns WHERE id = $1 AND team_id = $2 LIMIT 1`,
        [dto.campaignId, teamId],
      );
      if (!rows.length) throw new BadRequestException('Invalid campaign reference');
      campaignName = rows[0].name;
    }
    const { rows } = await this.db.query(
      `INSERT INTO mkt_leads
         (team_id, created_by, contact_id, name, email, phone, source, campaign_id, campaign_name, status, value, external_id, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [
        teamId, userId, dto.contactId || null, dto.name || null, dto.email || null, dto.phone || null,
        dto.source || null, dto.campaignId || null, campaignName,
        (dto.status && dto.status.trim()) || 'New', dto.value ?? null, dto.externalId || null, dto.notes || null,
      ],
    );
    const leadId = rows[0].id;
    // First touch: seed a touchpoint so attribution has real history from the start.
    if (dto.source || dto.campaignId) {
      await this.db.query(
        `INSERT INTO mkt_touchpoints (team_id, lead_id, campaign_id, campaign_name, channel, touch_type)
         VALUES ($1,$2,$3,$4,$5,'lead_created')`,
        [teamId, leadId, dto.campaignId || null, campaignName, dto.source || null],
      ).catch(() => undefined);
    }
    await this.logActivity(teamId, 'Lead captured', dto.name || dto.email || null, 'lead', leadId, userId, null).catch(() => undefined);
    return this.findOneLead(leadId, userId, userTeamId, role);
  }

  async updateLead(id: string, dto: any, userId: string, userTeamId: string | null, role: string): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Lead not found');
    const existing = await this.db.query(
      `SELECT team_id FROM mkt_leads WHERE id = $1 AND team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!existing.rows.length) throw new NotFoundException('Lead not found');
    const teamId = existing.rows[0].team_id;
    if (dto.campaignId !== undefined && dto.campaignId !== null) this.assertUuidOrBlank(dto.campaignId, 'campaign');
    if (dto.contactId !== undefined && dto.contactId !== null) this.assertUuidOrBlank(dto.contactId, 'contact');
    const colFor: Record<string, string> = {
      contactId: 'contact_id', name: 'name', email: 'email', phone: 'phone', source: 'source',
      campaignId: 'campaign_id', campaignName: 'campaign_name', status: 'status', value: 'value',
      externalId: 'external_id', notes: 'notes',
    };
    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    for (const [key, col] of Object.entries(colFor)) {
      if ((dto as any)[key] !== undefined) { sets.push(`${col} = $${i++}`); vals.push((dto as any)[key]); }
    }
    if (!sets.length) return this.findOneLead(id, userId, userTeamId, role);
    sets.push(`updated_at = NOW()`);
    vals.push(id, teamId);
    await this.db.query(`UPDATE mkt_leads SET ${sets.join(', ')} WHERE id = $${i++} AND team_id = $${i++}`, vals);
    return this.findOneLead(id, userId, userTeamId, role);
  }

  async removeLead(id: string, userId: string, userTeamId: string | null, role: string): Promise<{ success: boolean }> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Lead not found');
    const res = await this.db.query(`DELETE FROM mkt_leads WHERE id = $1 AND team_id = ANY($2)`, [id, accessible]);
    if (!res.rowCount) throw new NotFoundException('Lead not found');
    await this.db.query(`DELETE FROM mkt_touchpoints WHERE lead_id = $1 AND team_id = ANY($2)`, [id, accessible]).catch(() => undefined);
    return { success: true };
  }

  private async assertLeadInTeam(leadId: string, accessible: string[]): Promise<{ teamId: string; campaignId: string | null; campaignName: string | null; source: string | null }> {
    const { rows } = await this.db.query(
      `SELECT team_id, campaign_id, campaign_name, source FROM mkt_leads WHERE id = $1 AND team_id = ANY($2) LIMIT 1`,
      [leadId, accessible],
    );
    if (!rows.length) throw new NotFoundException('Lead not found');
    return { teamId: rows[0].team_id, campaignId: rows[0].campaign_id, campaignName: rows[0].campaign_name, source: rows[0].source };
  }

  async listTouchpoints(leadId: string, userId: string, userTeamId: string | null, role: string): Promise<any[]> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Lead not found');
    await this.assertLeadInTeam(leadId, accessible);
    const { rows } = await this.db.query(
      `SELECT id, campaign_id AS "campaignId", campaign_name AS "campaignName", channel,
              touch_type AS "touchType", occurred_at AS "occurredAt"
         FROM mkt_touchpoints WHERE lead_id = $1 AND team_id = ANY($2)
        ORDER BY occurred_at DESC`,
      [leadId, accessible],
    );
    return rows;
  }

  async createTouchpoint(leadId: string, dto: any, userId: string, userTeamId: string | null, role: string): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new ForbiddenException('You do not have access to this account');
    const lead = await this.assertLeadInTeam(leadId, accessible);
    this.assertUuidOrBlank(dto.campaignId, 'campaign');
    let campaignName = dto.campaignName || null;
    if (dto.campaignId) {
      const { rows } = await this.db.query(`SELECT name FROM mkt_campaigns WHERE id = $1 AND team_id = $2 LIMIT 1`, [dto.campaignId, lead.teamId]);
      if (!rows.length) throw new BadRequestException('Invalid campaign reference');
      campaignName = rows[0].name;
    }
    const occurredAt = this.parseTimestamp(dto.occurredAt);
    const { rows } = await this.db.query(
      `INSERT INTO mkt_touchpoints (team_id, lead_id, campaign_id, campaign_name, channel, touch_type, occurred_at)
       VALUES ($1,$2,$3,$4,$5,$6, COALESCE($7::timestamp, NOW()))
       RETURNING id, campaign_id AS "campaignId", campaign_name AS "campaignName", channel, touch_type AS "touchType", occurred_at AS "occurredAt"`,
      [lead.teamId, leadId, dto.campaignId || null, campaignName, dto.channel || null, dto.touchType || 'touch', occurredAt],
    );
    return rows[0];
  }

  // ─── Conversions (idempotent, last-touch attribution) ────────────────────────

  // Resolve the last-touch campaign for a lead at/before a conversion moment. Reads
  // only real touchpoints; falls back to the lead's originating campaign; null when
  // there is nothing real to attribute to (surfaced as "Unattributed").
  private async resolveLastTouch(
    teamId: string,
    leadId: string | null,
    occurredAt: string | null,
  ): Promise<{ campaignId: string | null; campaignName: string | null; channel: string | null }> {
    if (!leadId) return { campaignId: null, campaignName: null, channel: null };
    const tp = await this.db.query(
      `SELECT campaign_id, campaign_name, channel FROM mkt_touchpoints
        WHERE team_id = $1 AND lead_id = $2 AND campaign_id IS NOT NULL
          AND occurred_at <= COALESCE($3::timestamp, NOW())
        ORDER BY occurred_at DESC LIMIT 1`,
      [teamId, leadId, occurredAt],
    );
    if (tp.rows.length) {
      return { campaignId: tp.rows[0].campaign_id, campaignName: tp.rows[0].campaign_name, channel: tp.rows[0].channel };
    }
    const lead = await this.db.query(`SELECT campaign_id, campaign_name, source FROM mkt_leads WHERE id = $1 AND team_id = $2 LIMIT 1`, [leadId, teamId]);
    if (lead.rows.length) {
      return { campaignId: lead.rows[0].campaign_id, campaignName: lead.rows[0].campaign_name, channel: lead.rows[0].source };
    }
    return { campaignId: null, campaignName: null, channel: null };
  }

  private readonly conversionSelect = `
    v.id, v.team_id AS "teamId", v.lead_id AS "leadId", v.contact_id AS "contactId",
    v.conversion_type AS "conversionType", v.value, v.currency,
    v.attributed_campaign_id AS "attributedCampaignId",
    v.attributed_campaign_name AS "attributedCampaignName",
    v.attributed_channel AS "attributedChannel", v.attribution_model AS "attributionModel",
    v.source, v.idempotency_key AS "idempotencyKey",
    v.occurred_at AS "occurredAt", v.created_at AS "createdAt"
  `;

  async findAllConversions(
    userId: string,
    userTeamId: string | null,
    role: string,
    params: { search?: string; conversionType?: string; campaignId?: string; page?: string; limit?: string },
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    await this.ensureSchema();
    let page = parseInt(String(params.page ?? '1'), 10);
    let limit = parseInt(String(params.limit ?? '20'), 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    if (page > 1_000_000) page = 1_000_000;
    if (!Number.isFinite(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) return { data: [], total: 0, page, limit };

    const where: string[] = ['v.team_id = ANY($1)'];
    const vals: any[] = [accessible];
    let i = 2;
    if (params.conversionType && params.conversionType.trim()) { where.push(`v.conversion_type = $${i++}`); vals.push(params.conversionType.trim()); }
    if (params.campaignId && params.campaignId.trim()) {
      this.assertUuidOrBlank(params.campaignId, 'campaign');
      where.push(`v.attributed_campaign_id = $${i++}`); vals.push(params.campaignId.trim());
    }
    if (params.search && params.search.trim()) {
      where.push(`(v.conversion_type ILIKE $${i} OR v.attributed_campaign_name ILIKE $${i} OR v.attributed_channel ILIKE $${i} OR v.source ILIKE $${i})`);
      vals.push(`%${params.search.trim()}%`); i++;
    }
    const whereSql = where.join(' AND ');
    const countRes = await this.db.query(`SELECT COUNT(*)::int AS total FROM mkt_conversions v WHERE ${whereSql}`, vals);
    const total = countRes.rows[0]?.total || 0;
    const dataRes = await this.db.query(
      `SELECT ${this.conversionSelect} FROM mkt_conversions v WHERE ${whereSql}
        ORDER BY v.occurred_at DESC LIMIT $${i++} OFFSET $${i++}`,
      [...vals, limit, (page - 1) * limit],
    );
    return { data: dataRes.rows, total, page, limit };
  }

  async createConversion(dto: any, userId: string, userTeamId: string | null, role: string): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new ForbiddenException('You do not have access to this account');
    const teamId = this.resolveTeamId(dto.teamId, userTeamId, accessible);
    this.assertUuidOrBlank(dto.leadId, 'lead');
    this.assertUuidOrBlank(dto.contactId, 'contact');

    // A supplied lead must belong to this account — never trust the id blindly.
    let leadId: string | null = null;
    if (dto.leadId) {
      const lead = await this.assertLeadInTeam(dto.leadId, [teamId]);
      leadId = dto.leadId;
      void lead;
    }
    const occurredAt = this.parseTimestamp(dto.occurredAt);
    const attribution = await this.resolveLastTouch(teamId, leadId, occurredAt);
    const idem = dto.idempotencyKey && String(dto.idempotencyKey).trim() ? String(dto.idempotencyKey).trim() : null;

    // Idempotent write: the same (team, idempotency key) never double-counts.
    const insert = await this.db.query(
      `INSERT INTO mkt_conversions
         (team_id, created_by, lead_id, contact_id, conversion_type, value, currency,
          attributed_campaign_id, attributed_campaign_name, attributed_channel,
          attribution_model, source, idempotency_key, occurred_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'last_touch',$11,$12, COALESCE($13::timestamp, NOW()))
       ON CONFLICT (team_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
       RETURNING id`,
      [
        teamId, userId, leadId, dto.contactId || null, dto.conversionType || null,
        dto.value ?? null, (dto.currency && dto.currency.trim()) || 'USD',
        attribution.campaignId, attribution.campaignName, attribution.channel,
        (dto.source && dto.source.trim()) || 'Manual', idem, occurredAt,
      ],
    );
    let id: string;
    let duplicate = false;
    if (insert.rows.length) {
      id = insert.rows[0].id;
      await this.logActivity(teamId, 'Conversion recorded', dto.conversionType || null, 'conversion', id, userId, null).catch(() => undefined);
    } else {
      // Conflict: return the already-recorded conversion, count unchanged.
      const existing = await this.db.query(
        `SELECT id FROM mkt_conversions WHERE team_id = $1 AND idempotency_key = $2 LIMIT 1`,
        [teamId, idem],
      );
      if (!existing.rows.length) throw new BadRequestException('Could not record conversion');
      id = existing.rows[0].id;
      duplicate = true;
    }
    const { rows } = await this.db.query(`SELECT ${this.conversionSelect} FROM mkt_conversions v WHERE v.id = $1 LIMIT 1`, [id]);
    return { ...rows[0], duplicate };
  }

  async removeConversion(id: string, userId: string, userTeamId: string | null, role: string): Promise<{ success: boolean }> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Conversion not found');
    const res = await this.db.query(`DELETE FROM mkt_conversions WHERE id = $1 AND team_id = ANY($2)`, [id, accessible]);
    if (!res.rowCount) throw new NotFoundException('Conversion not found');
    return { success: true };
  }

  // ─── Attribution (last-touch) ────────────────────────────────────────────────

  // Attribution report over a window. Every figure is a real aggregate of recorded
  // conversions/costs, grouped by the last-touch campaign snapshot stored on each
  // conversion. Conversions with no real touch resolve to an "Unattributed" bucket
  // rather than being silently assigned to a campaign.
  async getAttribution(userId: string, userTeamId: string | null, role: string, range?: string): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    const model = 'last_touch';
    if (!accessible.length) {
      return { model, range: this.normalizeRange(range), totals: { conversions: 0, revenue: 0, spend: 0, roi: null }, byCampaign: [], byChannel: [] };
    }
    const r = this.normalizeRange(range);
    const bounds = this.rangeBounds(r); // { since } — null since = all time
    const convWhere = ['v.team_id = ANY($1)'];
    const convVals: any[] = [accessible];
    if (bounds.since) { convWhere.push(`v.occurred_at >= $2`); convVals.push(bounds.since); }
    const convWhereSql = convWhere.join(' AND ');

    const [byCampaign, byChannel, totals, spendRow] = await Promise.all([
      // Group by campaign_id ALONE so a renamed campaign stays a single row (its
      // frozen snapshot name must not split it — that would duplicate the id's spend
      // and leads, which are looked up by id below). Display the CURRENT campaign
      // name when the campaign still exists, else the snapshot, else 'Unattributed'.
      this.db.query(
        `SELECT v.attributed_campaign_id AS "campaignId",
                COALESCE(MAX(c.name), MAX(v.attributed_campaign_name), 'Unattributed') AS name,
                COUNT(*)::int AS conversions,
                COALESCE(SUM(v.value),0) AS revenue
           FROM mkt_conversions v
           LEFT JOIN mkt_campaigns c ON c.id = v.attributed_campaign_id AND c.team_id = v.team_id
          WHERE ${convWhereSql}
          GROUP BY v.attributed_campaign_id
          ORDER BY revenue DESC, conversions DESC LIMIT 50`,
        convVals,
      ),
      this.db.query(
        `SELECT COALESCE(v.attributed_channel, 'Unattributed') AS channel,
                COUNT(*)::int AS conversions,
                COALESCE(SUM(v.value),0) AS revenue
           FROM mkt_conversions v WHERE ${convWhereSql}
          GROUP BY v.attributed_channel ORDER BY revenue DESC, conversions DESC LIMIT 50`,
        convVals,
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS conversions, COALESCE(SUM(v.value),0) AS revenue
           FROM mkt_conversions v WHERE ${convWhereSql}`,
        convVals,
      ),
      this.db.query(
        bounds.since
          ? `SELECT COALESCE(SUM(amount),0) AS spend FROM mkt_campaign_costs WHERE team_id = ANY($1) AND cost_date >= $2`
          : `SELECT COALESCE(SUM(amount),0) AS spend FROM mkt_campaign_costs WHERE team_id = ANY($1)`,
        bounds.since ? [accessible, bounds.since] : [accessible],
      ),
    ]);

    // Per-campaign spend (attributable to real campaigns only) for ROI/CPL.
    const spendByCampaign = await this.db.query(
      bounds.since
        ? `SELECT campaign_id AS "campaignId", COALESCE(SUM(amount),0) AS spend FROM mkt_campaign_costs
            WHERE team_id = ANY($1) AND cost_date >= $2 GROUP BY campaign_id`
        : `SELECT campaign_id AS "campaignId", COALESCE(SUM(amount),0) AS spend FROM mkt_campaign_costs
            WHERE team_id = ANY($1) GROUP BY campaign_id`,
      bounds.since ? [accessible, bounds.since] : [accessible],
    );
    const leadsByCampaign = await this.db.query(
      bounds.since
        ? `SELECT campaign_id AS "campaignId", COUNT(*)::int AS leads FROM mkt_leads
            WHERE team_id = ANY($1) AND created_at >= $2 GROUP BY campaign_id`
        : `SELECT campaign_id AS "campaignId", COUNT(*)::int AS leads FROM mkt_leads
            WHERE team_id = ANY($1) GROUP BY campaign_id`,
      bounds.since ? [accessible, bounds.since] : [accessible],
    );
    const spendMap = new Map<string, number>();
    for (const s of spendByCampaign.rows) if (s.campaignId) spendMap.set(s.campaignId, this.money(s.spend));
    const leadsMap = new Map<string, number>();
    for (const l of leadsByCampaign.rows) if (l.campaignId) leadsMap.set(l.campaignId, Number(l.leads) || 0);

    const totalSpend = this.money(spendRow.rows[0].spend);
    const totalRevenue = this.money(totals.rows[0].revenue);
    return {
      model,
      range: r,
      totals: {
        conversions: Number(totals.rows[0].conversions) || 0,
        revenue: totalRevenue,
        spend: totalSpend,
        roi: totalSpend > 0 ? this.round1(((totalRevenue - totalSpend) / totalSpend) * 100) : null,
      },
      byCampaign: byCampaign.rows.map((c: any) => {
        const spend = c.campaignId ? (spendMap.get(c.campaignId) || 0) : 0;
        const leads = c.campaignId ? (leadsMap.get(c.campaignId) || 0) : 0;
        const revenue = this.money(c.revenue);
        return {
          campaignId: c.campaignId || null,
          name: c.name,
          conversions: Number(c.conversions) || 0,
          revenue,
          spend,
          leads,
          costPerLead: leads > 0 ? this.round2(spend / leads) : null,
          roi: spend > 0 ? this.round1(((revenue - spend) / spend) * 100) : null,
        };
      }),
      byChannel: byChannel.rows.map((c: any) => ({
        channel: c.channel,
        conversions: Number(c.conversions) || 0,
        revenue: this.money(c.revenue),
      })),
    };
  }

  // ─── Email / SMS messaging ───────────────────────────────────────────────────

  private readonly VALID_EVENTS = ['delivered', 'open', 'click', 'bounce', 'unsubscribe', 'complaint', 'spam', 'failed'];

  private readonly messageSelect = `
    m.id, m.team_id AS "teamId", m.campaign_id AS "campaignId", m.channel,
    m.name, m.subject, m.body, m.from_name AS "fromName", m.from_address AS "fromAddress",
    m.audience_id AS "audienceId", m.audience_name AS "audienceName", m.status,
    m.scheduled_at AS "scheduledAt", m.sent_at AS "sentAt",
    COALESCE((SELECT COUNT(*) FROM mkt_message_recipients r WHERE r.message_id = m.id AND r.team_id = m.team_id),0)::int AS recipients,
    COALESCE((SELECT COUNT(*) FROM mkt_message_recipients r WHERE r.message_id = m.id AND r.team_id = m.team_id AND r.delivered_at IS NOT NULL),0)::int AS delivered,
    -- Openers/clickers are counted ONLY among DELIVERED recipients, so the numerator
    -- is always a subset of the denominator and the rate can never exceed 100%.
    COALESCE((SELECT COUNT(*) FROM mkt_message_recipients r
               WHERE r.message_id = m.id AND r.team_id = m.team_id AND r.delivered_at IS NOT NULL
                 AND EXISTS (SELECT 1 FROM mkt_message_events e WHERE e.recipient_id = r.id AND e.team_id = r.team_id AND e.event_type = 'open')),0)::int AS opens,
    COALESCE((SELECT COUNT(*) FROM mkt_message_recipients r
               WHERE r.message_id = m.id AND r.team_id = m.team_id AND r.delivered_at IS NOT NULL
                 AND EXISTS (SELECT 1 FROM mkt_message_events e WHERE e.recipient_id = r.id AND e.team_id = r.team_id AND e.event_type = 'click')),0)::int AS clicks,
    m.created_at AS "createdAt", m.updated_at AS "updatedAt"
  `;

  async findAllMessages(
    userId: string, userTeamId: string | null, role: string,
    params: { search?: string; channel?: string; status?: string; page?: string; limit?: string },
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    await this.ensureSchema();
    let page = parseInt(String(params.page ?? '1'), 10);
    let limit = parseInt(String(params.limit ?? '20'), 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    if (page > 1_000_000) page = 1_000_000;
    if (!Number.isFinite(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) return { data: [], total: 0, page, limit };
    const where: string[] = ['m.team_id = ANY($1)'];
    const vals: any[] = [accessible];
    let i = 2;
    if (params.channel && params.channel.trim()) { where.push(`m.channel = $${i++}`); vals.push(params.channel.trim()); }
    if (params.status && params.status.trim()) { where.push(`m.status = $${i++}`); vals.push(params.status.trim()); }
    if (params.search && params.search.trim()) {
      where.push(`(m.name ILIKE $${i} OR m.subject ILIKE $${i} OR m.from_address ILIKE $${i})`);
      vals.push(`%${params.search.trim()}%`); i++;
    }
    const whereSql = where.join(' AND ');
    const countRes = await this.db.query(`SELECT COUNT(*)::int AS total FROM mkt_messages m WHERE ${whereSql}`, vals);
    const total = countRes.rows[0]?.total || 0;
    const dataRes = await this.db.query(
      `SELECT ${this.messageSelect} FROM mkt_messages m WHERE ${whereSql}
        ORDER BY m.created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      [...vals, limit, (page - 1) * limit],
    );
    return { data: dataRes.rows, total, page, limit };
  }

  async findOneMessage(id: string, userId: string, userTeamId: string | null, role: string): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Message not found');
    const { rows } = await this.db.query(
      `SELECT ${this.messageSelect} FROM mkt_messages m WHERE m.id = $1 AND m.team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!rows.length) throw new NotFoundException('Message not found');
    return rows[0];
  }

  async createMessage(dto: any, userId: string, userTeamId: string | null, role: string): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new ForbiddenException('You do not have access to this account');
    const teamId = this.resolveTeamId(dto.teamId, userTeamId, accessible);
    this.assertUuidOrBlank(dto.campaignId, 'campaign');
    this.assertUuidOrBlank(dto.audienceId, 'audience');
    let campaignId: string | null = null;
    if (dto.campaignId) {
      const { rows } = await this.db.query(`SELECT id FROM mkt_campaigns WHERE id = $1 AND team_id = $2 LIMIT 1`, [dto.campaignId, teamId]);
      if (!rows.length) throw new BadRequestException('Invalid campaign reference');
      campaignId = dto.campaignId;
    }
    const channel = dto.channel === 'SMS' ? 'SMS' : 'Email';
    const scheduledAt = this.parseTimestamp(dto.scheduledAt);
    const status = scheduledAt ? 'Scheduled' : ((dto.status && dto.status.trim()) || 'Draft');
    const { rows } = await this.db.query(
      `INSERT INTO mkt_messages
         (team_id, created_by, campaign_id, channel, name, subject, body, from_name, from_address, audience_id, audience_name, status, scheduled_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, COALESCE($13::timestamp, NULL)) RETURNING id`,
      [
        teamId, userId, campaignId, channel, dto.name || null, dto.subject || null, dto.body || null,
        dto.fromName || null, dto.fromAddress || null, dto.audienceId || null, dto.audienceName || null, status, scheduledAt,
      ],
    );
    await this.logActivity(teamId, `${channel} message created`, dto.name || dto.subject || null, 'message', rows[0].id, userId, null).catch(() => undefined);
    return this.findOneMessage(rows[0].id, userId, userTeamId, role);
  }

  async updateMessage(id: string, dto: any, userId: string, userTeamId: string | null, role: string): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Message not found');
    const existing = await this.db.query(`SELECT team_id, status FROM mkt_messages WHERE id = $1 AND team_id = ANY($2) LIMIT 1`, [id, accessible]);
    if (!existing.rows.length) throw new NotFoundException('Message not found');
    const teamId = existing.rows[0].team_id;
    // A sent message is immutable except for status changes we drive internally.
    if (existing.rows[0].status === 'Sent') throw new BadRequestException('A sent message cannot be edited');
    const colFor: Record<string, string> = {
      name: 'name', subject: 'subject', body: 'body', fromName: 'from_name', fromAddress: 'from_address',
      audienceName: 'audience_name', status: 'status',
    };
    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    for (const [key, col] of Object.entries(colFor)) {
      if ((dto as any)[key] !== undefined) { sets.push(`${col} = $${i++}`); vals.push((dto as any)[key]); }
    }
    if (dto.scheduledAt !== undefined) {
      const ts = this.parseTimestamp(dto.scheduledAt);
      sets.push(`scheduled_at = $${i++}`); vals.push(ts);
      if (ts && dto.status === undefined) { sets.push(`status = $${i++}`); vals.push('Scheduled'); }
    }
    if (!sets.length) return this.findOneMessage(id, userId, userTeamId, role);
    sets.push(`updated_at = NOW()`);
    vals.push(id, teamId);
    await this.db.query(`UPDATE mkt_messages SET ${sets.join(', ')} WHERE id = $${i++} AND team_id = $${i++}`, vals);
    return this.findOneMessage(id, userId, userTeamId, role);
  }

  async removeMessage(id: string, userId: string, userTeamId: string | null, role: string): Promise<{ success: boolean }> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Message not found');
    const res = await this.db.query(`DELETE FROM mkt_messages WHERE id = $1 AND team_id = ANY($2)`, [id, accessible]);
    if (!res.rowCount) throw new NotFoundException('Message not found');
    await this.db.query(`DELETE FROM mkt_message_recipients WHERE message_id = $1 AND team_id = ANY($2)`, [id, accessible]).catch(() => undefined);
    await this.db.query(`DELETE FROM mkt_message_events WHERE message_id = $1 AND team_id = ANY($2)`, [id, accessible]).catch(() => undefined);
    return { success: true };
  }

  private async assertMessageInTeam(messageId: string, accessible: string[]): Promise<{ teamId: string; channel: string; status: string }> {
    const { rows } = await this.db.query(`SELECT team_id, channel, status FROM mkt_messages WHERE id = $1 AND team_id = ANY($2) LIMIT 1`, [messageId, accessible]);
    if (!rows.length) throw new NotFoundException('Message not found');
    return { teamId: rows[0].team_id, channel: rows[0].channel, status: rows[0].status };
  }

  private async isSuppressed(teamId: string, channel: string, address: string): Promise<boolean> {
    if (!address) return false;
    const { rows } = await this.db.query(
      `SELECT 1 FROM mkt_suppression WHERE team_id = $1 AND channel = $2 AND lower(address) = lower($3) LIMIT 1`,
      [teamId, channel, address],
    );
    return rows.length > 0;
  }

  async listRecipients(messageId: string, userId: string, userTeamId: string | null, role: string): Promise<any[]> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Message not found');
    await this.assertMessageInTeam(messageId, accessible);
    const { rows } = await this.db.query(
      `SELECT id, address, name, status, sent_at AS "sentAt", delivered_at AS "deliveredAt", created_at AS "createdAt"
         FROM mkt_message_recipients WHERE message_id = $1 AND team_id = ANY($2)
        ORDER BY created_at DESC LIMIT 500`,
      [messageId, accessible],
    );
    return rows;
  }

  // Add recipients. Addresses on the suppression list are stored as 'Suppressed' and
  // will never be sent to — compliance is enforced at add time and again at send.
  async addRecipients(messageId: string, dto: any, userId: string, userTeamId: string | null, role: string): Promise<{ added: number; suppressed: number }> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new ForbiddenException('You do not have access to this account');
    const msg = await this.assertMessageInTeam(messageId, accessible);
    if (msg.status === 'Sent') throw new BadRequestException('Cannot add recipients to a sent message');
    const list: any[] = Array.isArray(dto.recipients) ? dto.recipients : [];
    if (!list.length) throw new BadRequestException('No recipients provided');
    if (list.length > 5000) throw new BadRequestException('Too many recipients in one request (max 5000)');
    let added = 0;
    let suppressed = 0;
    for (const r of list) {
      const address = (r && typeof r.address === 'string') ? r.address.trim() : '';
      if (!address) continue;
      if (r.contactId) this.assertUuidOrBlank(r.contactId, 'contact');
      if (r.leadId) this.assertUuidOrBlank(r.leadId, 'lead');
      const supp = await this.isSuppressed(msg.teamId, msg.channel, address);
      await this.db.query(
        `INSERT INTO mkt_message_recipients (team_id, message_id, contact_id, lead_id, address, name, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [msg.teamId, messageId, r.contactId || null, r.leadId || null, address, r.name || null, supp ? 'Suppressed' : 'Queued'],
      );
      if (supp) suppressed++; else added++;
    }
    return { added, suppressed };
  }

  // Send. Marks the message Sent and each queued recipient as attempted ('Sent').
  // Delivery / open / click are NOT fabricated here — they only ever come from real
  // recorded events. Suppressed addresses are never sent to.
  async sendMessage(messageId: string, userId: string, userTeamId: string | null, role: string): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Message not found');
    const msg = await this.assertMessageInTeam(messageId, accessible);
    if (msg.status === 'Sent') throw new BadRequestException('Message already sent');
    // Re-check suppression at send time (list may have grown since recipients were added).
    await this.db.query(
      `UPDATE mkt_message_recipients r SET status = 'Suppressed'
        WHERE r.message_id = $1 AND r.team_id = $2 AND r.status = 'Queued'
          AND EXISTS (SELECT 1 FROM mkt_suppression s
                       WHERE s.team_id = r.team_id AND s.channel = $3 AND lower(s.address) = lower(r.address))`,
      [messageId, msg.teamId, msg.channel],
    );
    const upd = await this.db.query(
      `UPDATE mkt_message_recipients SET status = 'Sent', sent_at = NOW()
        WHERE message_id = $1 AND team_id = $2 AND status = 'Queued'`,
      [messageId, msg.teamId],
    );
    await this.db.query(`UPDATE mkt_messages SET status = 'Sent', sent_at = NOW(), updated_at = NOW() WHERE id = $1 AND team_id = $2`, [messageId, msg.teamId]);
    await this.logActivity(msg.teamId, `${msg.channel} message sent`, null, 'message', messageId, userId, null).catch(() => undefined);
    return { success: true, sent: upd.rowCount || 0 };
  }

  // Record a real message event (as a provider webhook would). Idempotent via dedupKey.
  // Unsubscribe / bounce / complaint enforce suppression so the address is not mailed again.
  async recordMessageEvent(messageId: string, dto: any, userId: string, userTeamId: string | null, role: string): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Message not found');
    const msg = await this.assertMessageInTeam(messageId, accessible);
    const type = String(dto.eventType || '').toLowerCase().trim();
    if (!this.VALID_EVENTS.includes(type)) throw new BadRequestException('Invalid event type');
    let recipientId: string | null = null;
    let recipientAddress: string | null = null;
    if (dto.recipientId) {
      this.assertUuidOrBlank(dto.recipientId, 'recipient');
      const rc = await this.db.query(`SELECT id, address FROM mkt_message_recipients WHERE id = $1 AND message_id = $2 AND team_id = $3 LIMIT 1`, [dto.recipientId, messageId, msg.teamId]);
      if (!rc.rows.length) throw new BadRequestException('Invalid recipient reference');
      recipientId = rc.rows[0].id;
      recipientAddress = rc.rows[0].address;
    }
    const occurredAt = this.parseTimestamp(dto.occurredAt);
    const dedup = dto.dedupKey && String(dto.dedupKey).trim() ? String(dto.dedupKey).trim() : null;
    const ins = await this.db.query(
      `INSERT INTO mkt_message_events (team_id, message_id, recipient_id, event_type, url, dedup_key, occurred_at)
       VALUES ($1,$2,$3,$4,$5,$6, COALESCE($7::timestamp, NOW()))
       ON CONFLICT (team_id, dedup_key) WHERE dedup_key IS NOT NULL DO NOTHING
       RETURNING id`,
      [msg.teamId, messageId, recipientId, type, dto.url || null, dedup, occurredAt],
    );
    const duplicate = ins.rows.length === 0 && dedup !== null;
    // Reflect the event on the recipient + suppression (only when a new event landed).
    if (!duplicate && recipientId) {
      if (type === 'delivered') {
        await this.db.query(`UPDATE mkt_message_recipients SET status = 'Delivered', delivered_at = COALESCE(delivered_at, COALESCE($3::timestamp, NOW())) WHERE id = $1 AND team_id = $2`, [recipientId, msg.teamId, occurredAt]);
      } else if (type === 'bounce' || type === 'failed') {
        await this.db.query(`UPDATE mkt_message_recipients SET status = 'Bounced' WHERE id = $1 AND team_id = $2`, [recipientId, msg.teamId]);
      } else if (type === 'unsubscribe') {
        await this.db.query(`UPDATE mkt_message_recipients SET status = 'Unsubscribed' WHERE id = $1 AND team_id = $2`, [recipientId, msg.teamId]);
      }
    }
    if (!duplicate && recipientAddress && (type === 'unsubscribe' || type === 'bounce' || type === 'complaint' || type === 'spam' || type === 'failed')) {
      const reason = type === 'unsubscribe' ? 'unsubscribe' : (type === 'complaint' || type === 'spam' ? 'complaint' : 'bounce');
      await this.addToSuppression(msg.teamId, msg.channel, recipientAddress, reason, userId).catch(() => undefined);
    }
    return { success: true, duplicate };
  }

  // ─── Suppression (compliance) ────────────────────────────────────────────────

  private async addToSuppression(teamId: string, channel: string, address: string, reason: string, userId: string | null): Promise<void> {
    if (!address || !address.trim()) return;
    await this.db.query(
      `INSERT INTO mkt_suppression (team_id, channel, address, reason, created_by)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (team_id, channel, lower(address)) DO NOTHING`,
      [teamId, channel, address.trim(), reason, userId],
    );
  }

  async listSuppression(userId: string, userTeamId: string | null, role: string, params: { search?: string; channel?: string; page?: string; limit?: string }): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    await this.ensureSchema();
    let page = parseInt(String(params.page ?? '1'), 10);
    let limit = parseInt(String(params.limit ?? '50'), 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    if (page > 1_000_000) page = 1_000_000;
    if (!Number.isFinite(limit) || limit < 1) limit = 50;
    if (limit > 200) limit = 200;
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) return { data: [], total: 0, page, limit };
    const where: string[] = ['team_id = ANY($1)'];
    const vals: any[] = [accessible];
    let i = 2;
    if (params.channel && params.channel.trim()) { where.push(`channel = $${i++}`); vals.push(params.channel.trim()); }
    if (params.search && params.search.trim()) { where.push(`address ILIKE $${i++}`); vals.push(`%${params.search.trim()}%`); }
    const whereSql = where.join(' AND ');
    const countRes = await this.db.query(`SELECT COUNT(*)::int AS total FROM mkt_suppression WHERE ${whereSql}`, vals);
    const total = countRes.rows[0]?.total || 0;
    const dataRes = await this.db.query(
      `SELECT id, channel, address, reason, created_at AS "createdAt" FROM mkt_suppression WHERE ${whereSql}
        ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      [...vals, limit, (page - 1) * limit],
    );
    return { data: dataRes.rows, total, page, limit };
  }

  async addSuppression(dto: any, userId: string, userTeamId: string | null, role: string): Promise<{ success: boolean }> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new ForbiddenException('You do not have access to this account');
    const teamId = this.resolveTeamId(dto.teamId, userTeamId, accessible);
    const address = (dto.address && String(dto.address).trim()) || '';
    if (!address) throw new BadRequestException('Address is required');
    const channel = dto.channel === 'SMS' ? 'SMS' : 'Email';
    await this.addToSuppression(teamId, channel, address, (dto.reason && String(dto.reason).trim()) || 'manual', userId);
    return { success: true };
  }

  async removeSuppression(id: string, userId: string, userTeamId: string | null, role: string): Promise<{ success: boolean }> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Entry not found');
    const res = await this.db.query(`DELETE FROM mkt_suppression WHERE id = $1 AND team_id = ANY($2)`, [id, accessible]);
    if (!res.rowCount) throw new NotFoundException('Entry not found');
    return { success: true };
  }

  private normalizeRange(range?: string): string {
    const r = String(range || 'month').toLowerCase();
    return ['month', 'quarter', 'year', 'all'].includes(r) ? r : 'month';
  }

  private rangeBounds(range: string): { since: string | null } {
    switch (range) {
      case 'all': return { since: null };
      case 'quarter': return { since: this.monthsAgoIso(3) };
      case 'year': return { since: this.monthsAgoIso(12) };
      case 'month':
      default: return { since: this.startOfMonthIso() };
    }
  }

  private startOfMonthIso(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }

  private monthsAgoIso(months: number): string {
    const d = new Date();
    d.setMonth(d.getMonth() - months);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private parseTimestamp(value: any): string | null {
    if (value === undefined || value === null || value === '') return null;
    const s = String(value);
    // Accept full ISO timestamps and plain YYYY-MM-DD dates; reject anything else so
    // Postgres never receives a malformed literal (which would 500).
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      if (!this.isRealDate(s)) throw new BadRequestException('Invalid date');
      return s;
    }
    // Datetime form: validate the date portion too. new Date() silently ROLLS OVER an
    // impossible date (Feb 30 -> Mar 1) instead of failing, which would store a date
    // the caller never supplied — reject it to match the plain-date branch.
    const m = s.match(/^(\d{4}-\d{2}-\d{2})[T ]/);
    if (m && !this.isRealDate(m[1])) throw new BadRequestException('Invalid timestamp');
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) throw new BadRequestException('Invalid timestamp');
    return d.toISOString();
  }

  // Strict YYYY-MM-DD for DATE columns. @IsDateString() (no options) only runs the ISO
  // regex and accepts calendar-impossible dates like 2024-02-30, which Postgres then
  // rejects with a 500 on the raw DATE column — so validate here before insert.
  private parseDateOnly(value: any): string | null {
    if (value === undefined || value === null || value === '') return null;
    const s = String(value).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || !this.isRealDate(s)) {
      throw new BadRequestException('Invalid date');
    }
    return s;
  }

  private isRealDate(s: string): boolean {
    const [y, m, day] = s.split('-').map((n) => parseInt(n, 10));
    if (m < 1 || m > 12 || day < 1 || day > 31) return false;
    const dt = new Date(Date.UTC(y, m - 1, day));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === day;
  }

  private round1(n: number): number { return Math.round(n * 10) / 10; }
  private round2(n: number): number { return Math.round(n * 100) / 100; }

  private money(v: any): number { return Number(v) || 0; }

  // Overview KPIs + dashboard. Every figure is real and team-scoped; a KPI is 0 or
  // an explicit no-data state until its data exists — no fabricated numbers, no fake
  // external-platform metrics.
  //
  // KPI FORMULAS (documented):
  //   Active Campaigns   = COUNT(status = 'Active')
  //   Total Leads (month)= COUNT(distinct marketing leads created this month) [Leads slice]
  //   Email Open Rate    = unique opens / delivered * 100 [Email slice]
  //   Click Through Rate = unique clickers / delivered * 100 [Email slice]
  //   Conversions (month)= COUNT(conversion events this month) [Conversions slice]
  //   Cost Per Lead      = recorded spend (month) / leads (month); N/A if leads = 0
  //   ROI (month)        = (attributed revenue - spend) / spend * 100; N/A if no spend/revenue
  async getStats(userId: string, userTeamId: string | null, role: string): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    const zero = {
      activeCampaigns: { count: 0 },
      totalLeads: { count: 0, unique: 0 },
      emailOpenRate: { percent: null as number | null, delivered: 0, opens: 0 },
      clickThroughRate: { percent: null as number | null, delivered: 0, clicks: 0 },
      conversions: { count: 0 },
      costPerLead: { amount: null as number | null, spend: 0, leads: 0 },
      roi: { percent: null as number | null, revenue: 0, spend: 0 },
      leadsOverTime: [] as any[],
      leadsByChannel: [] as any[],
      topCampaigns: [] as any[],
      recentActivity: [] as any[],
      upcomingCampaigns: [] as any[],
    };
    if (!accessible.length) return zero;

    const [active, spendMonth, leadsMonth, convMonth, byChannel, overTime, topCamps, activity, upcoming, emailDelivered, emailOpens, emailClicks] = await Promise.all([
      this.db.query(
        `SELECT COUNT(*) FILTER (WHERE status = 'Active')::int AS active FROM mkt_campaigns WHERE team_id = ANY($1)`,
        [accessible],
      ),
      this.db.query(
        `SELECT COALESCE(SUM(amount),0) AS spend FROM mkt_campaign_costs
          WHERE team_id = ANY($1)
            AND cost_date >= date_trunc('month', CURRENT_DATE)
            AND cost_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'`,
        [accessible],
      ),
      // Total + unique leads this month. Unique = distinct email (leads without an
      // email each count once via their id) — a real de-dup, not an estimate.
      this.db.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(DISTINCT COALESCE(lower(email), id::text))::int AS unique
           FROM mkt_leads WHERE team_id = ANY($1)
            AND created_at >= date_trunc('month', CURRENT_DATE)
            AND created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'`,
        [accessible],
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS count, COALESCE(SUM(value),0) AS revenue
           FROM mkt_conversions WHERE team_id = ANY($1)
            AND occurred_at >= date_trunc('month', CURRENT_DATE)
            AND occurred_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'`,
        [accessible],
      ),
      // Leads by channel (source) this month — drives the donut with real counts.
      this.db.query(
        `SELECT COALESCE(NULLIF(source,''),'Unknown') AS label, COUNT(*)::int AS count
           FROM mkt_leads WHERE team_id = ANY($1)
            AND created_at >= date_trunc('month', CURRENT_DATE)
            AND created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
          GROUP BY 1 ORDER BY count DESC LIMIT 8`,
        [accessible],
      ),
      // Leads + conversions per day this month for the trend chart.
      this.db.query(
        `WITH days AS (
           SELECT generate_series(date_trunc('month', CURRENT_DATE),
                                  date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day',
                                  INTERVAL '1 day')::date AS d
         )
         SELECT to_char(days.d,'YYYY-MM-DD') AS date,
                COALESCE(l.c,0)::int AS leads,
                COALESCE(v.c,0)::int AS conversions
           FROM days
           LEFT JOIN (
             SELECT created_at::date AS d, COUNT(*) AS c FROM mkt_leads
              WHERE team_id = ANY($1) AND created_at >= date_trunc('month', CURRENT_DATE)
              GROUP BY 1) l ON l.d = days.d
           LEFT JOIN (
             SELECT occurred_at::date AS d, COUNT(*) AS c FROM mkt_conversions
              WHERE team_id = ANY($1) AND occurred_at >= date_trunc('month', CURRENT_DATE)
              GROUP BY 1) v ON v.d = days.d
          ORDER BY days.d ASC`,
        [accessible],
      ),
      // Top campaigns by attributed revenue, then leads, then spend — all real.
      this.db.query(
        `SELECT c.name,
                COALESCE((SELECT SUM(mc.amount) FROM mkt_campaign_costs mc
                          WHERE mc.campaign_id = c.id AND mc.team_id = c.team_id),0) AS spend,
                COALESCE((SELECT COUNT(*) FROM mkt_leads ml
                          WHERE ml.campaign_id = c.id AND ml.team_id = c.team_id),0)::int AS leads,
                COALESCE((SELECT COUNT(*) FROM mkt_conversions mcv
                          WHERE mcv.attributed_campaign_id = c.id AND mcv.team_id = c.team_id),0)::int AS conversions,
                COALESCE((SELECT SUM(mcv.value) FROM mkt_conversions mcv
                          WHERE mcv.attributed_campaign_id = c.id AND mcv.team_id = c.team_id),0) AS revenue
           FROM mkt_campaigns c WHERE c.team_id = ANY($1)
          ORDER BY revenue DESC, leads DESC, spend DESC, c.created_at DESC LIMIT 5`,
        [accessible],
      ),
      this.db.query(
        `SELECT action, subject, actor_name AS "actorName", created_at AS "createdAt"
           FROM mkt_activity WHERE team_id = ANY($1)
          ORDER BY created_at DESC LIMIT 6`,
        [accessible],
      ),
      this.db.query(
        `SELECT name, campaign_type AS "campaignType", start_date AS "startDate"
           FROM mkt_campaigns
          WHERE team_id = ANY($1) AND status = 'Scheduled'
            AND start_date IS NOT NULL AND start_date >= CURRENT_DATE
          ORDER BY start_date ASC LIMIT 6`,
        [accessible],
      ),
      // Email delivery/open/click this month (email channel only) — the real basis
      // for Open Rate and CTR. Denominator is delivered recipients; numerators are
      // DISTINCT recipients with a real open/click event. No inference.
      this.db.query(
        `SELECT COUNT(*)::int AS delivered FROM mkt_message_recipients r
           JOIN mkt_messages m ON m.id = r.message_id AND m.team_id = r.team_id
          WHERE r.team_id = ANY($1) AND m.channel = 'Email' AND r.delivered_at IS NOT NULL
            AND r.delivered_at >= date_trunc('month', CURRENT_DATE)
            AND r.delivered_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'`,
        [accessible],
      ),
      // Openers this month = DELIVERED (this month) email recipients who have an open
      // event. Counting delivered recipients guarantees opens <= delivered (rate <= 100%)
      // and matches the denominator's window exactly.
      this.db.query(
        `SELECT COUNT(*)::int AS opens FROM mkt_message_recipients r
           JOIN mkt_messages m ON m.id = r.message_id AND m.team_id = r.team_id
          WHERE r.team_id = ANY($1) AND m.channel = 'Email' AND r.delivered_at IS NOT NULL
            AND r.delivered_at >= date_trunc('month', CURRENT_DATE)
            AND r.delivered_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
            AND EXISTS (SELECT 1 FROM mkt_message_events e WHERE e.recipient_id = r.id AND e.team_id = r.team_id AND e.event_type = 'open')`,
        [accessible],
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS clicks FROM mkt_message_recipients r
           JOIN mkt_messages m ON m.id = r.message_id AND m.team_id = r.team_id
          WHERE r.team_id = ANY($1) AND m.channel = 'Email' AND r.delivered_at IS NOT NULL
            AND r.delivered_at >= date_trunc('month', CURRENT_DATE)
            AND r.delivered_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
            AND EXISTS (SELECT 1 FROM mkt_message_events e WHERE e.recipient_id = r.id AND e.team_id = r.team_id AND e.event_type = 'click')`,
        [accessible],
      ),
    ]);

    const spend = this.money(spendMonth.rows[0].spend);
    const leadCount = Number(leadsMonth.rows[0].total) || 0;
    const uniqueLeads = Number(leadsMonth.rows[0].unique) || 0;
    const convCount = Number(convMonth.rows[0].count) || 0;
    const revenue = this.money(convMonth.rows[0].revenue);
    const delivered = Number(emailDelivered.rows[0].delivered) || 0;
    const opens = Number(emailOpens.rows[0].opens) || 0;
    const clicks = Number(emailClicks.rows[0].clicks) || 0;
    return {
      ...zero,
      activeCampaigns: { count: Number(active.rows[0].active) || 0 },
      totalLeads: { count: leadCount, unique: uniqueLeads },
      conversions: { count: convCount },
      emailOpenRate: { percent: delivered > 0 ? this.round1((opens / delivered) * 100) : null, delivered, opens },
      clickThroughRate: { percent: delivered > 0 ? this.round1((clicks / delivered) * 100) : null, delivered, clicks },
      costPerLead: { amount: leadCount > 0 ? this.round2(spend / leadCount) : null, spend, leads: leadCount },
      roi: { percent: spend > 0 ? this.round1(((revenue - spend) / spend) * 100) : null, revenue, spend },
      leadsByChannel: byChannel.rows.map((r: any) => ({ label: r.label, count: Number(r.count) || 0 })),
      leadsOverTime: overTime.rows.map((r: any) => ({ date: r.date, leads: Number(r.leads) || 0, conversions: Number(r.conversions) || 0 })),
      topCampaigns: topCamps.rows.map((r: any) => ({
        name: r.name, spend: this.money(r.spend), leads: Number(r.leads) || 0,
        conversions: Number(r.conversions) || 0, revenue: this.money(r.revenue),
      })),
      recentActivity: activity.rows.map((a: any) => ({
        action: a.action,
        subject: a.subject,
        actorName: a.actorName,
        at: a.createdAt,
      })),
      upcomingCampaigns: upcoming.rows.map((u: any) => ({
        name: u.name, campaignType: u.campaignType, startDate: u.startDate,
      })),
    };
  }
}
