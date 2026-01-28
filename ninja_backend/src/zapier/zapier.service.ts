import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { LeadsService } from '../leads/leads.service';
import { LeadStatus } from '../leads/entities/lead.entity';

const LEAD_STATUS_VALUES = Object.values(LeadStatus) as string[];

@Injectable()
export class ZapierService {
  constructor(
    private readonly db: DatabaseService,
    private readonly leadsService: LeadsService,
  ) {}

  /**
   * Authenticate Zapier request by API key. Returns teamId and validity.
   */
  async authenticate(apiKey: string): Promise<{ teamId: string; isValid: boolean }> {
    const { rows } = await this.db.query(
      `SELECT team_id FROM zapier_integrations
       WHERE api_key = $1 AND is_active = true`,
      [apiKey],
    );

    if (rows.length === 0) {
      return { teamId: '', isValid: false };
    }

    const teamId = rows[0].team_id;
    await this.db.query(
      `UPDATE zapier_integrations SET last_used_at = NOW(), updated_at = NOW() WHERE team_id = $1`,
      [teamId],
    );

    return { teamId, isValid: true };
  }

  /**
   * Trigger: new_lead_created
   * - If leadId provided: return that lead's payload (must belong to team).
   * - If since provided: return leads created after since for the team (polling).
   */
  async triggerNewLeadCreated(teamId: string, leadId?: string, since?: string): Promise<object> {
    if (leadId) {
      const lead = await this.leadsService.findById(leadId);
      if (!lead) {
        throw new NotFoundException(`Lead ${leadId} not found`);
      }
      if (lead.teamId !== teamId) {
        throw new NotFoundException(`Lead ${leadId} not found`);
      }
      return {
        event: 'new_lead_created',
        timestamp: new Date().toISOString(),
        data: this.toTriggerLeadPayload(lead),
      };
    }

    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { rows } = await this.db.query(
      `SELECT l.id, l.name, l.email, l.phone, l.status, l.source, l.notes, l.created_at, l.team_id,
              l.property_id, l.assigned_to, l.buyer_id
       FROM leads l
       WHERE l.team_id = $1 AND l.created_at > $2
       ORDER BY l.created_at DESC
       LIMIT 100`,
      [teamId, sinceDate],
    );

    const data = rows.map((r) => this.toTriggerLeadPayloadRaw(r));
    return {
      event: 'new_lead_created',
      timestamp: new Date().toISOString(),
      data,
    };
  }

  /**
   * Trigger: lead_status_updated
   * - If leadId provided: return that lead's payload (must belong to team).
   * - If since provided: return leads updated after since (approximation; we use updated_at).
   */
  async triggerLeadStatusUpdated(
    teamId: string,
    leadId?: string,
    since?: string,
  ): Promise<object> {
    if (leadId) {
      const lead = await this.leadsService.findById(leadId);
      if (!lead) {
        throw new NotFoundException(`Lead ${leadId} not found`);
      }
      if (lead.teamId !== teamId) {
        throw new NotFoundException(`Lead ${leadId} not found`);
      }
      return {
        event: 'lead_status_updated',
        timestamp: new Date().toISOString(),
        data: this.toTriggerLeadPayload(lead),
      };
    }

    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { rows } = await this.db.query(
      `SELECT id, name, email, phone, status, source, notes, created_at, updated_at,
              team_id, property_id, assigned_to, buyer_id
       FROM leads
       WHERE team_id = $1 AND updated_at > $2
       ORDER BY updated_at DESC
       LIMIT 100`,
      [teamId, sinceDate],
    );

    const data = rows.map((r) => this.toTriggerLeadPayloadRaw(r));
    return {
      event: 'lead_status_updated',
      timestamp: new Date().toISOString(),
      data,
    };
  }

  /**
   * Action: create_lead — same schema as POST /api/leads
   */
  async actionCreateLead(
    payload: {
      name: string;
      email?: string;
      phone?: string;
      status?: string;
      property_id?: string;
      notes?: string;
      source?: string;
      assigned_to?: string;
    },
    teamId: string,
    createdByUserId: string,
  ): Promise<object> {
    if (!payload?.name || typeof payload.name !== 'string') {
      throw new BadRequestException('name is required');
    }

    const status = payload.status && LEAD_STATUS_VALUES.includes(payload.status)
      ? payload.status
      : LeadStatus.NEW;

    const dto = {
      name: payload.name.trim(),
      email: payload.email || undefined,
      phone: payload.phone || undefined,
      status: status as LeadStatus,
      propertyId: payload.property_id || undefined,
      notes: payload.notes || undefined,
      source: payload.source || undefined,
      assignedTo: payload.assigned_to || undefined,
    };

    const lead = await this.leadsService.create(dto, createdByUserId, teamId);
    return {
      success: true,
      data: this.toTriggerLeadPayload(lead),
    };
  }

  /**
   * Action: update_lead — status, priority, notes, assigned_agent (assigned_to)
   */
  async actionUpdateLead(
    leadId: string,
    payload: {
      status?: string;
      priority?: string;
      notes?: string;
      assigned_to?: string;
      assigned_agent?: string;
    },
    teamId: string,
    _userId: string,
  ): Promise<object> {
    const lead = await this.leadsService.findById(leadId);
    if (!lead) {
      throw new NotFoundException(`Lead ${leadId} not found`);
    }
    if (lead.teamId !== teamId) {
      throw new NotFoundException(`Lead ${leadId} not found`);
    }

    const updates: string[] = [];
    const values: any[] = [];
    let n = 1;

    const status = payload.status ?? undefined;
    if (status && LEAD_STATUS_VALUES.includes(status)) {
      updates.push(`status = $${n++}`);
      values.push(status);
    }

    const assigned = payload.assigned_to ?? payload.assigned_agent;
    if (assigned !== undefined) {
      updates.push(`assigned_to = $${n++}`);
      values.push(assigned || null);
    }

    if (payload.notes !== undefined) {
      updates.push(`notes = $${n++}`);
      values.push(payload.notes);
    }

    const priority = payload.priority ?? undefined;
    if (priority && ['low', 'medium', 'high', 'urgent'].includes(priority)) {
      const hasPriority = await this.leadTableHasPriority();
      if (hasPriority) {
        updates.push(`priority = $${n++}`);
        values.push(priority);
      }
    }

    if (updates.length === 0) {
      return { success: true, data: this.toTriggerLeadPayload(lead) };
    }

    updates.push('updated_at = NOW()');
    values.push(leadId);

    const { rows } = await this.db.query(
      `UPDATE leads SET ${updates.join(', ')} WHERE id = $${n}
       RETURNING id, name, email, phone, status, assigned_to as "assignedTo", property_id as "propertyId",
                 team_id as "teamId", notes, source, created_at as "createdAt", updated_at as "updatedAt"`,
      values,
    );

    return { success: true, data: this.toTriggerLeadPayload(rows[0]) };
  }

  /**
   * Action: create_task_followup — insert into lead_tasks
   */
  async actionCreateTask(
    payload: {
      lead_id: string;
      title: string;
      description?: string;
      due_date?: string;
      assigned_to?: string;
    },
    teamId: string,
    createdByUserId: string,
  ): Promise<object> {
    if (!payload?.lead_id) {
      throw new BadRequestException('lead_id is required');
    }

    const lead = await this.leadsService.findById(payload.lead_id);
    if (!lead) {
      throw new NotFoundException(`Lead ${payload.lead_id} not found`);
    }
    if (lead.teamId !== teamId) {
      throw new NotFoundException(`Lead ${payload.lead_id} not found`);
    }

    const title = (payload.title && String(payload.title).trim()) || 'Follow-up';
    const dueDate = payload.due_date ? new Date(payload.due_date) : null;
    const assignedTo = payload.assigned_to || null;

    const { rows } = await this.db.query(
      `INSERT INTO lead_tasks (lead_id, title, description, due_date, assigned_to, created_by, team_id, status, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
       RETURNING id, lead_id, title, description, due_date, assigned_to, status, created_at`,
      [
        payload.lead_id,
        title,
        payload.description || null,
        dueDate,
        assignedTo,
        createdByUserId,
        teamId,
      ],
    );

    const task = rows[0];
    return {
      success: true,
      data: {
        id: task.id,
        lead_id: task.lead_id,
        title: task.title,
        description: task.description,
        due_date: task.due_date,
        assigned_to: task.assigned_to,
        status: task.status,
        created_at: task.created_at,
      },
    };
  }

  private toTriggerLeadPayload(lead: any): object {
    return {
      lead_id: lead.id,
      name: lead.name,
      email: lead.email ?? null,
      phone: lead.phone ?? null,
      status: lead.status,
      source: lead.source ?? null,
      notes: lead.notes ?? null,
      property_id: lead.propertyId ?? lead.property_id ?? null,
      assigned_to: lead.assignedTo ?? lead.assigned_to ?? null,
      created_at: lead.createdAt ?? lead.created_at,
      updated_at: lead.updatedAt ?? lead.updated_at,
    };
  }

  private toTriggerLeadPayloadRaw(row: any): object {
    return {
      lead_id: row.id,
      name: row.name,
      email: row.email ?? null,
      phone: row.phone ?? null,
      status: row.status,
      source: row.source ?? null,
      notes: row.notes ?? null,
      property_id: row.property_id ?? null,
      assigned_to: row.assigned_to ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at ?? row.created_at,
    };
  }

  private async leadTableHasPriority(): Promise<boolean> {
    const { rows } = await this.db.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'leads' AND column_name = 'priority'`,
    );
    return rows.length > 0;
  }
}
