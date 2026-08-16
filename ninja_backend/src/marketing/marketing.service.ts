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

  // Spend is the SUM of recorded costs — NEVER the budget. leads/conversions are 0
  // in this slice and become real when the Leads/Conversions slice lands.
  private readonly campaignSelect = `
    c.id, c.team_id AS "teamId", c.campaign_number AS "campaignNumber",
    c.name, c.campaign_type AS "campaignType", c.channel,
    c.audience_id AS "audienceId", c.audience_name AS "audienceName",
    c.status, c.budget, c.owner_name AS "ownerName",
    c.goals, c.tags, c.notes, c.tracking,
    c.start_date AS "startDate", c.end_date AS "endDate",
    COALESCE((SELECT SUM(mc.amount) FROM mkt_campaign_costs mc
               WHERE mc.campaign_id = c.id AND mc.team_id = c.team_id), 0) AS spend,
    0::int AS leads, 0::int AS conversions,
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
        dto.tracking || null, dto.startDate || null, dto.endDate || null,
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
      [teamId, userId, campaignId, dto.amount ?? null, dto.costDate || null, (dto.source && dto.source.trim()) || 'Manual', dto.description || null],
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

    const [active, spendMonth, topCamps, activity, upcoming] = await Promise.all([
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
      // Top campaigns by recorded spend (a real metric available now; re-ranks by
      // leads/conversions once those records exist).
      this.db.query(
        `SELECT c.name,
                COALESCE((SELECT SUM(mc.amount) FROM mkt_campaign_costs mc
                          WHERE mc.campaign_id = c.id AND mc.team_id = c.team_id),0) AS spend
           FROM mkt_campaigns c WHERE c.team_id = ANY($1)
          ORDER BY spend DESC, c.created_at DESC LIMIT 5`,
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
    ]);

    const spend = this.money(spendMonth.rows[0].spend);
    return {
      ...zero,
      activeCampaigns: { count: Number(active.rows[0].active) || 0 },
      // Leads/conversions/email land with their slices; kept honest-empty here.
      costPerLead: { amount: null, spend, leads: 0 },
      roi: { percent: null, revenue: 0, spend },
      topCampaigns: topCamps.rows.map((r: any) => ({ name: r.name, spend: this.money(r.spend), leads: 0, conversions: 0 })),
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
