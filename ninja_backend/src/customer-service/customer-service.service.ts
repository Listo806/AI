import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const OWNER_ROLE = 'owner';

// Customer Service Workspace backend. Reuses the Cortexa tenant model: the account
// boundary is the TEAM, so every row carries team_id and every query is scoped to
// the teams the caller can access. Customers reuse CRM contacts; agents reuse team
// users — neither is duplicated. This workspace is industry-neutral: no
// vertical-specific fields, terminology or assumptions.
@Injectable()
export class CustomerServiceService {
  constructor(private readonly db: DatabaseService) {}

  private static readonly UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Reject a malformed id with 400 before Postgres raises a 22P02 (invalid uuid)
  // that would otherwise surface as a 500.
  private assertUuidOrBlank(value: string | undefined | null, label: string): void {
    if (value && !CustomerServiceService.UUID_RE.test(String(value))) {
      throw new BadRequestException(`Invalid ${label} reference`);
    }
  }

  private schemaReady = false;

  private async ensureSchema(): Promise<void> {
    if (this.schemaReady) return;
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS cs_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        created_by UUID,
        ticket_number TEXT,
        subject TEXT,
        description TEXT,
        contact_id UUID,
        customer_name TEXT,
        channel TEXT,
        category TEXT,
        priority TEXT NOT NULL DEFAULT 'Medium',
        status TEXT NOT NULL DEFAULT 'Open',
        sla_status TEXT,
        assigned_to UUID,
        assigned_agent_name TEXT,
        tags TEXT[],
        first_response_at TIMESTAMP,
        resolved_at TIMESTAMP,
        closed_at TIMESTAMP,
        due_at TIMESTAMP,
        last_activity_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    for (const idx of [
      `CREATE INDEX IF NOT EXISTS idx_cs_tickets_team ON cs_tickets(team_id)`,
      `CREATE INDEX IF NOT EXISTS idx_cs_tickets_status ON cs_tickets(status)`,
      `CREATE INDEX IF NOT EXISTS idx_cs_tickets_priority ON cs_tickets(priority)`,
      `CREATE INDEX IF NOT EXISTS idx_cs_tickets_channel ON cs_tickets(channel)`,
      `CREATE INDEX IF NOT EXISTS idx_cs_tickets_sla ON cs_tickets(sla_status)`,
      `CREATE INDEX IF NOT EXISTS idx_cs_tickets_contact ON cs_tickets(contact_id)`,
      `CREATE INDEX IF NOT EXISTS idx_cs_tickets_agent ON cs_tickets(assigned_to)`,
      `CREATE INDEX IF NOT EXISTS idx_cs_tickets_resolved ON cs_tickets(resolved_at)`,
      `CREATE INDEX IF NOT EXISTS idx_cs_tickets_created ON cs_tickets(created_at)`,
    ]) {
      await this.db.query(idx);
    }
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

  private async assertContactInTeam(contactId: string, teamId: string): Promise<void> {
    const { rows } = await this.db.query(
      `SELECT id FROM contacts WHERE id = $1 AND team_id = $2 LIMIT 1`,
      [contactId, teamId],
    );
    if (!rows.length) {
      throw new BadRequestException('Selected customer is not in this account');
    }
  }

  // The assigned agent must be a user belonging to the ticket's team.
  private async assertAgentInTeam(agentId: string, teamId: string): Promise<string | null> {
    const { rows } = await this.db.query(
      `SELECT name FROM users WHERE id = $1 AND team_id = $2 LIMIT 1`,
      [agentId, teamId],
    );
    if (!rows.length) {
      throw new BadRequestException('Selected agent is not in this account');
    }
    return rows[0].name || null;
  }

  /** Search CRM contacts (customer picker), scoped to the caller's team. */
  async searchContacts(
    userId: string,
    userTeamId: string | null,
    role: string,
    search?: string,
  ): Promise<any[]> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) return [];
    const teamId = this.resolveTeamId(undefined, userTeamId, accessible);
    const term = (search || '').trim();
    const params: any[] = [teamId];
    let where = 'team_id = $1';
    if (term) {
      params.push(`%${term}%`);
      where += ` AND (name ILIKE $2 OR email ILIKE $2 OR phone ILIKE $2)`;
    }
    const { rows } = await this.db.query(
      `SELECT id, name, email, phone FROM contacts
        WHERE ${where} ORDER BY name ASC NULLS LAST LIMIT 20`,
      params,
    );
    return rows;
  }

  /** Search team users (agent picker), scoped to the caller's team. */
  async searchAgents(
    userId: string,
    userTeamId: string | null,
    role: string,
    search?: string,
  ): Promise<any[]> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) return [];
    const teamId = this.resolveTeamId(undefined, userTeamId, accessible);
    const term = (search || '').trim();
    const params: any[] = [teamId];
    // users has is_active (not deleted_at); IS NOT FALSE keeps NULL/true as active.
    let where = 'team_id = $1 AND is_active IS NOT FALSE';
    if (term) {
      params.push(`%${term}%`);
      where += ` AND (name ILIKE $2 OR email ILIKE $2)`;
    }
    const { rows } = await this.db.query(
      `SELECT id, name, email FROM users
        WHERE ${where} ORDER BY name ASC NULLS LAST LIMIT 20`,
      params,
    );
    return rows;
  }

  private async generateTicketNumber(teamId: string): Promise<string> {
    const year = new Date().getFullYear();
    const { rows } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM cs_tickets
        WHERE team_id = $1 AND ticket_number LIKE $2`,
      [teamId, `TKT-${year}-%`],
    );
    const seq = (Number(rows[0]?.n) || 0) + 1;
    return `TKT-${year}-${String(seq).padStart(4, '0')}`;
  }

  private readonly ticketSelect = `
    t.id,
    t.team_id AS "teamId",
    t.ticket_number AS "ticketNumber",
    t.subject,
    t.description,
    t.contact_id AS "contactId",
    COALESCE(NULLIF(TRIM(t.customer_name), ''), ct.name) AS "customerName",
    ct.email AS "customerEmail",
    t.channel,
    t.category,
    t.priority,
    t.status,
    t.sla_status AS "slaStatus",
    t.assigned_to AS "assignedTo",
    COALESCE(NULLIF(TRIM(t.assigned_agent_name), ''), u.name) AS "assignedAgentName",
    t.tags,
    t.first_response_at AS "firstResponseAt",
    t.resolved_at AS "resolvedAt",
    t.closed_at AS "closedAt",
    t.due_at AS "dueAt",
    t.last_activity_at AS "lastActivityAt",
    t.created_at AS "createdAt",
    t.updated_at AS "updatedAt"
  `;
  private readonly ticketJoins = `
    LEFT JOIN contacts ct ON ct.id = t.contact_id AND ct.team_id = t.team_id
    LEFT JOIN users u ON u.id = t.assigned_to AND u.team_id = t.team_id
  `;

  async findAllTickets(
    userId: string,
    userTeamId: string | null,
    role: string,
    params: {
      search?: string;
      status?: string;
      priority?: string;
      channel?: string;
      category?: string;
      assignedTo?: string;
      slaStatus?: string;
      page?: string;
      limit?: string;
    },
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    await this.ensureSchema();
    let page = parseInt(String(params.page ?? '1'), 10);
    let limit = parseInt(String(params.limit ?? '20'), 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    // Upper-bound page too, so a huge value can't overflow the SQL OFFSET (bigint)
    // into a 22003 -> 500; it just returns an empty page.
    if (page > 1_000_000) page = 1_000_000;
    if (!Number.isFinite(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) return { data: [], total: 0, page, limit };

    this.assertUuidOrBlank(params.assignedTo, 'agent');
    const where: string[] = ['t.team_id = ANY($1)'];
    const vals: any[] = [accessible];
    let i = 2;
    if (params.status && params.status.trim()) {
      where.push(`t.status = $${i++}`);
      vals.push(params.status.trim());
    }
    if (params.priority && params.priority.trim()) {
      where.push(`t.priority = $${i++}`);
      vals.push(params.priority.trim());
    }
    if (params.channel && params.channel.trim()) {
      where.push(`t.channel = $${i++}`);
      vals.push(params.channel.trim());
    }
    if (params.category && params.category.trim()) {
      where.push(`t.category = $${i++}`);
      vals.push(params.category.trim());
    }
    if (params.assignedTo && params.assignedTo.trim()) {
      where.push(`t.assigned_to = $${i++}`);
      vals.push(params.assignedTo.trim());
    }
    if (params.slaStatus && params.slaStatus.trim()) {
      where.push(`t.sla_status = $${i++}`);
      vals.push(params.slaStatus.trim());
    }
    if (params.search && params.search.trim()) {
      where.push(
        `(t.ticket_number ILIKE $${i} OR t.subject ILIKE $${i} OR t.customer_name ILIKE $${i} OR ct.name ILIKE $${i} OR ct.email ILIKE $${i})`,
      );
      vals.push(`%${params.search.trim()}%`);
      i++;
    }
    const whereSql = where.join(' AND ');
    const countRes = await this.db.query(
      `SELECT COUNT(*)::int AS total FROM cs_tickets t ${this.ticketJoins} WHERE ${whereSql}`,
      vals,
    );
    const total = countRes.rows[0]?.total || 0;
    const dataRes = await this.db.query(
      `SELECT ${this.ticketSelect} FROM cs_tickets t ${this.ticketJoins}
        WHERE ${whereSql} ORDER BY t.last_activity_at DESC NULLS LAST, t.created_at DESC
        LIMIT $${i++} OFFSET $${i++}`,
      [...vals, limit, (page - 1) * limit],
    );
    return { data: dataRes.rows, total, page, limit };
  }

  async findOneTicket(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Ticket not found');
    const { rows } = await this.db.query(
      `SELECT ${this.ticketSelect} FROM cs_tickets t ${this.ticketJoins}
        WHERE t.id = $1 AND t.team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!rows.length) throw new NotFoundException('Ticket not found');
    return rows[0];
  }

  async createTicket(
    dto: any,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) {
      throw new ForbiddenException('You do not have access to this account');
    }
    const teamId = this.resolveTeamId(dto.teamId, userTeamId, accessible);
    if (dto.contactId) await this.assertContactInTeam(dto.contactId, teamId);
    let agentName = dto.assignedAgentName || null;
    if (dto.assignedTo) {
      const resolvedName = await this.assertAgentInTeam(dto.assignedTo, teamId);
      agentName = agentName || resolvedName;
    }
    const ticketNumber =
      (dto.ticketNumber && dto.ticketNumber.trim()) ||
      (await this.generateTicketNumber(teamId));
    const status = (dto.status && dto.status.trim()) || 'Open';
    // resolved_at / closed_at are stamped when the ticket is created already in
    // that terminal state, so the resolution KPI reflects reality from the start.
    const resolvedAt = status === 'Resolved' || status === 'Closed' ? 'NOW()' : 'NULL';
    const closedAt = status === 'Closed' ? 'NOW()' : 'NULL';
    const { rows } = await this.db.query(
      `INSERT INTO cs_tickets
         (team_id, created_by, ticket_number, subject, description, contact_id,
          customer_name, channel, category, priority, status, sla_status,
          assigned_to, assigned_agent_name, tags, due_at, first_response_at,
          resolved_at, closed_at, last_activity_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,
               ${resolvedAt}, ${closedAt}, NOW())
       RETURNING id`,
      [
        teamId,
        userId,
        ticketNumber,
        dto.subject || null,
        dto.description || null,
        dto.contactId || null,
        dto.customerName || null,
        dto.channel || null,
        dto.category || null,
        (dto.priority && dto.priority.trim()) || 'Medium',
        status,
        dto.slaStatus || null,
        dto.assignedTo || null,
        agentName,
        Array.isArray(dto.tags) ? dto.tags : null,
        dto.dueAt || null,
        dto.firstResponseAt || null,
      ],
    );
    return this.findOneTicket(rows[0].id, userId, userTeamId, role);
  }

  async updateTicket(
    id: string,
    dto: any,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Ticket not found');
    const existing = await this.db.query(
      `SELECT team_id, status, resolved_at, closed_at FROM cs_tickets
        WHERE id = $1 AND team_id = ANY($2) LIMIT 1`,
      [id, accessible],
    );
    if (!existing.rows.length) throw new NotFoundException('Ticket not found');
    const teamId = existing.rows[0].team_id;
    if (dto.contactId) await this.assertContactInTeam(dto.contactId, teamId);
    if (dto.assignedTo) {
      const resolvedName = await this.assertAgentInTeam(dto.assignedTo, teamId);
      if (dto.assignedAgentName === undefined) dto.assignedAgentName = resolvedName;
    }

    const colFor: Record<string, string> = {
      ticketNumber: 'ticket_number',
      subject: 'subject',
      description: 'description',
      contactId: 'contact_id',
      customerName: 'customer_name',
      channel: 'channel',
      category: 'category',
      priority: 'priority',
      status: 'status',
      slaStatus: 'sla_status',
      assignedTo: 'assigned_to',
      assignedAgentName: 'assigned_agent_name',
      tags: 'tags',
      firstResponseAt: 'first_response_at',
      resolvedAt: 'resolved_at',
      closedAt: 'closed_at',
      dueAt: 'due_at',
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
    // Auto-stamp resolved_at / closed_at when a status transition first reaches
    // that state and the caller did not set the timestamp explicitly.
    if (dto.status !== undefined && dto.resolvedAt === undefined) {
      const nowResolvedOrClosed = dto.status === 'Resolved' || dto.status === 'Closed';
      if (nowResolvedOrClosed && !existing.rows[0].resolved_at) {
        sets.push(`resolved_at = NOW()`);
      }
    }
    if (dto.status !== undefined && dto.closedAt === undefined) {
      if (dto.status === 'Closed' && !existing.rows[0].closed_at) {
        sets.push(`closed_at = NOW()`);
      }
      // Reopening clears the closed stamp so lifecycle stays truthful.
      if (dto.status !== 'Closed' && existing.rows[0].closed_at) {
        sets.push(`closed_at = NULL`);
      }
    }
    if (!sets.length) return this.findOneTicket(id, userId, userTeamId, role);
    sets.push(`updated_at = NOW()`);
    sets.push(`last_activity_at = NOW()`);
    vals.push(id, teamId);
    await this.db.query(
      `UPDATE cs_tickets SET ${sets.join(', ')} WHERE id = $${i++} AND team_id = $${i++}`,
      vals,
    );
    return this.findOneTicket(id, userId, userTeamId, role);
  }

  async removeTicket(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<{ success: boolean }> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    if (!accessible.length) throw new NotFoundException('Ticket not found');
    const res = await this.db.query(
      `DELETE FROM cs_tickets WHERE id = $1 AND team_id = ANY($2)`,
      [id, accessible],
    );
    if (!res.rowCount) throw new NotFoundException('Ticket not found');
    return { success: true };
  }

  private fmtDuration(seconds: number | null): string | null {
    if (seconds == null || !isFinite(seconds) || seconds < 0) return null;
    const s = Math.round(seconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h >= 24) {
      const d = Math.floor(h / 24);
      return `${d}d ${h % 24}h`;
    }
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return `${s}s`;
  }

  // Overview KPIs + dashboard charts. Every figure is computed from real ticket
  // records and is 0 / empty until data exists — no fabricated numbers.
  //
  // KPI FORMULAS (documented, all team-scoped):
  //   Open Tickets            = COUNT(status NOT IN ('Resolved','Closed'))
  //   Resolved This Month     = COUNT(resolved_at within the current calendar month)
  //   Avg Response Time       = AVG(first_response_at - created_at) over tickets that
  //                             have a first response (seconds), formatted h/m
  //   Avg Resolution Time     = AVG(resolved_at - created_at) over resolved tickets
  //   Customer Satisfaction   = AVG(rating)/max from survey responses; null until the
  //                             Surveys slice records responses (never fabricated)
  //   SLA Compliance          = (tickets subject to SLA that are NOT breached)
  //                             / (tickets subject to an SLA) * 100; null if none
  async getStats(
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    await this.ensureSchema();
    const accessible = await this.getAccessibleTeamIds(userId, userTeamId, role);
    const zero = {
      totalTickets: 0,
      openTickets: { count: 0 },
      resolvedThisMonth: { count: 0 },
      avgResponseTime: { seconds: null as number | null, label: null as string | null },
      avgResolutionTime: { seconds: null as number | null, label: null as string | null },
      customerSatisfaction: { average: null as number | null, max: 5, count: 0 },
      slaCompliance: { percent: null as number | null, subject: 0, met: 0 },
      ticketsByStatus: [] as any[],
      ticketsByChannel: [] as any[],
      slaPerformance: { onTrack: 0, atRisk: 0, breached: 0, completed: 0 },
      recentActivity: [] as any[],
      topAgents: [] as any[],
    };
    if (!accessible.length) return zero;
    const num = (v: any) => Number(v) || 0;

    const [
      counts,
      byStatus,
      byChannel,
      slaAgg,
      activity,
      agents,
    ] = await Promise.all([
      this.db.query(
        `SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status NOT IN ('Resolved','Closed'))::int AS open,
            COUNT(*) FILTER (
              WHERE resolved_at IS NOT NULL
                AND resolved_at >= date_trunc('month', CURRENT_DATE)
                AND resolved_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
            )::int AS resolved_month,
            AVG(EXTRACT(EPOCH FROM (first_response_at - created_at)))
              FILTER (WHERE first_response_at IS NOT NULL) AS avg_response,
            AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)))
              FILTER (WHERE resolved_at IS NOT NULL) AS avg_resolution,
            COUNT(*) FILTER (WHERE sla_status IS NOT NULL AND sla_status <> '')::int AS sla_subject,
            COUNT(*) FILTER (WHERE sla_status IS NOT NULL AND sla_status <> '' AND sla_status <> 'Breached')::int AS sla_met
           FROM cs_tickets WHERE team_id = ANY($1)`,
        [accessible],
      ),
      this.db.query(
        `SELECT COALESCE(NULLIF(TRIM(status), ''), 'Unknown') AS label, COUNT(*)::int AS count
           FROM cs_tickets WHERE team_id = ANY($1) GROUP BY 1 ORDER BY count DESC`,
        [accessible],
      ),
      this.db.query(
        `SELECT COALESCE(NULLIF(TRIM(channel), ''), 'Unspecified') AS label, COUNT(*)::int AS count
           FROM cs_tickets WHERE team_id = ANY($1) GROUP BY 1 ORDER BY count DESC`,
        [accessible],
      ),
      this.db.query(
        `SELECT
            COUNT(*) FILTER (WHERE sla_status = 'On Track')::int AS on_track,
            COUNT(*) FILTER (WHERE sla_status = 'At Risk')::int AS at_risk,
            COUNT(*) FILTER (WHERE sla_status = 'Breached')::int AS breached,
            COUNT(*) FILTER (WHERE sla_status = 'Completed')::int AS completed
           FROM cs_tickets WHERE team_id = ANY($1)`,
        [accessible],
      ),
      this.db.query(
        `SELECT ticket_number AS "ticketNumber", subject, status, customer_name AS "customerName", updated_at
           FROM cs_tickets WHERE team_id = ANY($1)
          ORDER BY updated_at DESC LIMIT 6`,
        [accessible],
      ),
      // Top agents by resolved-ticket volume (a defensible real metric). Response
      // time is included where available; CSAT joins in with the Surveys slice.
      this.db.query(
        `SELECT COALESCE(NULLIF(TRIM(assigned_agent_name), ''), 'Unassigned') AS name,
                COUNT(*) FILTER (WHERE status IN ('Resolved','Closed'))::int AS resolved,
                AVG(EXTRACT(EPOCH FROM (first_response_at - created_at)))
                  FILTER (WHERE first_response_at IS NOT NULL) AS avg_response
           FROM cs_tickets
          WHERE team_id = ANY($1) AND assigned_to IS NOT NULL
          GROUP BY 1
          ORDER BY resolved DESC, name ASC
          LIMIT 5`,
        [accessible],
      ),
    ]);

    const c = counts.rows[0];
    const avgResponse = c.avg_response != null ? Number(c.avg_response) : null;
    const avgResolution = c.avg_resolution != null ? Number(c.avg_resolution) : null;
    const slaSubject = num(c.sla_subject);
    const slaMet = num(c.sla_met);

    return {
      totalTickets: num(c.total),
      openTickets: { count: num(c.open) },
      resolvedThisMonth: { count: num(c.resolved_month) },
      avgResponseTime: { seconds: avgResponse, label: this.fmtDuration(avgResponse) },
      avgResolutionTime: { seconds: avgResolution, label: this.fmtDuration(avgResolution) },
      customerSatisfaction: { average: null, max: 5, count: 0 },
      slaCompliance: {
        percent: slaSubject > 0 ? Math.round((slaMet / slaSubject) * 1000) / 10 : null,
        subject: slaSubject,
        met: slaMet,
      },
      ticketsByStatus: byStatus.rows.map((r: any) => ({ label: r.label, count: num(r.count) })),
      ticketsByChannel: byChannel.rows.map((r: any) => ({ label: r.label, count: num(r.count) })),
      slaPerformance: {
        onTrack: num(slaAgg.rows[0].on_track),
        atRisk: num(slaAgg.rows[0].at_risk),
        breached: num(slaAgg.rows[0].breached),
        completed: num(slaAgg.rows[0].completed),
      },
      recentActivity: activity.rows.map((a: any) => ({
        ticketNumber: a.ticketNumber,
        title: `${a.ticketNumber || 'Ticket'} ${a.status || ''}`.trim(),
        subtitle: [a.subject, a.customerName].filter(Boolean).join(' · '),
        at: a.updated_at,
      })),
      topAgents: agents.rows.map((a: any) => ({
        name: a.name,
        resolved: num(a.resolved),
        avgResponseLabel: this.fmtDuration(a.avg_response != null ? Number(a.avg_response) : null),
      })),
    };
  }
}
