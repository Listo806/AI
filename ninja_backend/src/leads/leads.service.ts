import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Lead, LeadStatus, CreateLeadDto, UpdateLeadDto } from './entities/lead.entity';
import { EventLoggerService } from '../analytics/events/event-logger.service';
import { LeadAIService } from './lead-ai.service';

@Injectable()
export class LeadsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventLogger: EventLoggerService,
    private readonly leadAI: LeadAIService,
  ) {}

  async createPublic(createLeadDto: CreateLeadDto): Promise<Lead> {
    const status = createLeadDto.status || LeadStatus.NEW;

    // For public leads, we need to find the property owner to assign the lead
    let assignedTo: string | null = null;
    let teamId: string | null = null;

    if (createLeadDto.propertyId) {
      // Get property owner
      const propertyResult = await this.db.query(
        `SELECT created_by as "createdBy", team_id as "teamId" FROM properties WHERE id = $1`,
        [createLeadDto.propertyId],
      );
      
      if (propertyResult.rows.length > 0) {
        assignedTo = propertyResult.rows[0].createdBy;
        teamId = propertyResult.rows[0].teamId;
      }
    }

    const { rows } = await this.db.query(
      `INSERT INTO leads (name, email, phone, status, assigned_to, property_id, created_by, team_id, notes, source, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       RETURNING id, name, email, phone, status, assigned_to as "assignedTo", property_id as "propertyId", created_by as "createdBy", 
                 team_id as "teamId", notes, source, created_at as "createdAt", updated_at as "updatedAt"`,
      [
        createLeadDto.name,
        createLeadDto.email || null,
        createLeadDto.phone || null,
        status,
        assignedTo || createLeadDto.assignedTo || null,
        createLeadDto.propertyId || null,
        assignedTo || null, // Use property owner as created_by, or null for public leads
        teamId,
        createLeadDto.notes || null,
        createLeadDto.source || 'public_contact_form',
      ],
    );

    const lead = rows[0];

    // Log event (without user context for public leads)
    if (assignedTo) {
      await this.eventLogger.logLeadCreated(lead.id, assignedTo, teamId, {
        name: lead.name,
        status: lead.status,
        source: lead.source,
      });
    }

    return lead;
  }

  async create(createLeadDto: CreateLeadDto, userId: string, teamId: string | null): Promise<Lead> {
    const status = createLeadDto.status || LeadStatus.NEW;

    const { rows } = await this.db.query(
      `INSERT INTO leads (name, email, phone, status, assigned_to, property_id, created_by, team_id, notes, source, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       RETURNING id, name, email, phone, status, assigned_to as "assignedTo", property_id as "propertyId", created_by as "createdBy", 
                 team_id as "teamId", notes, source, created_at as "createdAt", updated_at as "updatedAt"`,
      [
        createLeadDto.name,
        createLeadDto.email || null,
        createLeadDto.phone || null,
        status,
        createLeadDto.assignedTo || null,
        createLeadDto.propertyId || null,
        userId,
        teamId,
        createLeadDto.notes || null,
        createLeadDto.source || null,
      ],
    );

    const lead = rows[0];

    // Log event
    await this.eventLogger.logLeadCreated(lead.id, userId, teamId, {
      name: lead.name,
      status: lead.status,
      source: lead.source,
    });

    return lead;
  }

  async findAll(userId: string, teamId: string | null): Promise<Lead[]> {
    let query: string;
    let params: any[];

    // If user has a team, show all team leads, otherwise only their own
    if (teamId) {
      query = `SELECT id, name, email, phone, status, assigned_to as "assignedTo", property_id as "propertyId", created_by as "createdBy", 
                      team_id as "teamId", notes, source, created_at as "createdAt", updated_at as "updatedAt"
               FROM leads
               WHERE team_id = $1
               ORDER BY created_at DESC`;
      params = [teamId];
    } else {
      query = `SELECT id, name, email, phone, status, assigned_to as "assignedTo", property_id as "propertyId", created_by as "createdBy", 
                      team_id as "teamId", notes, source, created_at as "createdAt", updated_at as "updatedAt"
               FROM leads
               WHERE created_by = $1
               ORDER BY created_at DESC`;
      params = [userId];
    }

    const { rows } = await this.db.query(query, params);
    return rows;
  }

  async findById(id: string): Promise<any> {
    const { rows } = await this.db.query(
      `SELECT 
        l.id, 
        l.name, 
        l.email, 
        l.phone, 
        l.status, 
        l.assigned_to as "assignedTo", 
        l.property_id as "propertyId", 
        l.created_by as "createdBy", 
        l.team_id as "teamId", 
        l.notes, 
        l.source, 
        l.created_at as "createdAt", 
        l.updated_at as "updatedAt",
        l.last_contacted_at as "lastContactedAt",
        l.has_responded as "hasResponded",
        l.last_activity_at as "lastActivityAt",
        l.last_action_type as "lastActionType",
        l.last_action_at as "lastActionAt",
        -- Property details for AI calculation and display
        p.id as "propertyIdFull",
        p.title as "propertyTitle",
        p.price as "propertyPrice",
        p.type as "propertyType",
        p.address as "propertyAddress",
        p.city as "propertyCity",
        p.state as "propertyState"
       FROM leads l
       LEFT JOIN properties p ON l.property_id = p.id
       WHERE l.id = $1`,
      [id],
    );
    
    if (rows.length === 0) {
      return null;
    }

    const lead = rows[0];
    
    // Calculate AI metrics
    const context = {
      status: lead.status as LeadStatus,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      lastContactedAt: lead.lastContactedAt || null,
      lastActivityAt: lead.lastActivityAt || lead.lastContactedAt || lead.updatedAt || lead.createdAt,
      propertyPrice: lead.propertyPrice ? parseFloat(lead.propertyPrice) : null,
      propertyType: lead.propertyType || null,
      phone: lead.phone || null,
      email: lead.email || null,
      source: lead.source || null,
      engagementCount: null, // TODO: Add engagement tracking
    };

    const aiMetrics = this.leadAI.calculateLeadAI(context);

    return {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      assignedTo: lead.assignedTo,
      propertyId: lead.propertyId,
      createdBy: lead.createdBy,
      teamId: lead.teamId,
      notes: lead.notes,
      source: lead.source,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      lastContactedAt: lead.lastContactedAt || null,
      hasResponded: lead.hasResponded || false,
      lastActivityAt: lead.lastActivityAt || null,
      lastActionType: lead.lastActionType || null,
      lastActionAt: lead.lastActionAt || null,
      property: lead.propertyIdFull ? {
        id: lead.propertyIdFull,
        title: lead.propertyTitle || 'Untitled Property',
        address: lead.propertyAddress || null,
        city: lead.propertyCity || null,
        state: lead.propertyState || null,
        price: lead.propertyPrice ? parseFloat(lead.propertyPrice) : null,
        type: lead.propertyType || null,
      } : null,
      // AI fields
      aiScore: aiMetrics.aiScore,
      aiTier: aiMetrics.aiTier,
      urgencyState: aiMetrics.urgencyState,
      aiScoreLabel: aiMetrics.aiScoreLabel,
      aiReasonBullets: aiMetrics.aiReasonBullets,
      recommendedAction: aiMetrics.recommendedAction,
      recommendedActionReason: aiMetrics.recommendedActionReason,
      followUpRecommended: aiMetrics.followUpRecommended || false,
    };
  }

  async update(id: string, updateLeadDto: UpdateLeadDto, userId: string, teamId: string | null): Promise<Lead> {
    const lead = await this.findById(id);
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    // Check permissions: user must be creator or team member
    if (lead.createdBy !== userId && lead.teamId !== teamId) {
      throw new ForbiddenException('You do not have permission to update this lead');
    }

    const oldStatus = lead.status;
    const oldAssignedTo = lead.assignedTo;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updateLeadDto.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(updateLeadDto.name);
    }
    if (updateLeadDto.email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(updateLeadDto.email);
    }
    if (updateLeadDto.phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(updateLeadDto.phone);
    }
    if (updateLeadDto.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(updateLeadDto.status);
    }
    if (updateLeadDto.assignedTo !== undefined) {
      updates.push(`assigned_to = $${paramCount++}`);
      values.push(updateLeadDto.assignedTo || null);
    }
    if (updateLeadDto.propertyId !== undefined) {
      updates.push(`property_id = $${paramCount++}`);
      values.push(updateLeadDto.propertyId || null);
    }
    if (updateLeadDto.notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(updateLeadDto.notes);
    }
    if (updateLeadDto.source !== undefined) {
      updates.push(`source = $${paramCount++}`);
      values.push(updateLeadDto.source);
    }

    if (updates.length === 0) {
      return lead;
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await this.db.query(
      `UPDATE leads SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, name, email, phone, status, assigned_to as "assignedTo", property_id as "propertyId", created_by as "createdBy", 
                 team_id as "teamId", notes, source, created_at as "createdAt", updated_at as "updatedAt", last_contacted_at as "lastContactedAt"`,
      values,
    );

    const updatedLead = rows[0];

    // Log events
    await this.eventLogger.logLeadUpdated(updatedLead.id, userId, teamId);

    // Log status change if status was updated
    if (updateLeadDto.status !== undefined && updateLeadDto.status !== oldStatus) {
      await this.eventLogger.logLeadStatusChanged(updatedLead.id, userId, teamId, oldStatus, updateLeadDto.status);
    }

    // Log assignment if assignedTo was updated
    if (updateLeadDto.assignedTo !== undefined && updateLeadDto.assignedTo !== oldAssignedTo) {
      await this.eventLogger.logLeadAssigned(updatedLead.id, userId, teamId, updateLeadDto.assignedTo || '');
    }

    return updatedLead;
  }

  /**
   * Log a contact action (call, WhatsApp, email)
   * Updates last_contacted_at and status to 'contacted' if not already contacted/qualified
   */
  async logContactAction(
    id: string,
    actionType: 'call' | 'whatsapp' | 'email',
    userId: string,
    teamId: string | null,
  ): Promise<Lead> {
    const lead = await this.findById(id);
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    // Check permissions
    if (lead.createdBy !== userId && lead.teamId !== teamId) {
      throw new ForbiddenException('You do not have permission to update this lead');
    }

    const oldStatus = lead.status;
    
    // Map actionType to database value
    const actionTypeMap = {
      'call': 'call',
      'whatsapp': 'whatsapp',
      'email': 'email',
    };
    const dbActionType = actionTypeMap[actionType] || actionType;
    
    // Update last_contacted_at, last_action_type, last_action_at, last_activity_at and status
    // Only update status to 'contacted' if it's currently 'new'
    const statusUpdate = oldStatus === 'new' ? `status = 'contacted',` : '';
    
    const { rows } = await this.db.query(
      `UPDATE leads 
       SET last_contacted_at = NOW(), 
           last_action_type = $2,
           last_action_at = NOW(),
           last_activity_at = NOW(),
           ${statusUpdate}
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, email, phone, status, assigned_to as "assignedTo", property_id as "propertyId", created_by as "createdBy", 
                 team_id as "teamId", notes, source, created_at as "createdAt", updated_at as "updatedAt", 
                 last_contacted_at as "lastContactedAt", has_responded as "hasResponded",
                 last_activity_at as "lastActivityAt", last_action_type as "lastActionType", last_action_at as "lastActionAt"`,
      [id, dbActionType],
    );

    const updatedLead = rows[0];

    // Log events
    await this.eventLogger.logLeadUpdated(updatedLead.id, userId, teamId);
    
    if (oldStatus === 'new' && updatedLead.status === 'contacted') {
      await this.eventLogger.logLeadStatusChanged(updatedLead.id, userId, teamId, oldStatus, updatedLead.status);
    }

    // Return full lead with AI fields by calling findById
    return this.findById(id);
  }

  async delete(id: string, userId: string, teamId: string | null): Promise<void> {
    const lead = await this.findById(id);
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    // Check permissions: user must be creator
    if (lead.createdBy !== userId) {
      throw new ForbiddenException('You do not have permission to delete this lead');
    }

    await this.db.query('DELETE FROM leads WHERE id = $1', [id]);
  }

  async findByStatus(status: LeadStatus, userId: string, teamId: string | null): Promise<Lead[]> {
    let query: string;
    let params: any[];

    if (teamId) {
      query = `SELECT id, name, email, phone, status, assigned_to as "assignedTo", property_id as "propertyId", created_by as "createdBy", 
                      team_id as "teamId", notes, source, created_at as "createdAt", updated_at as "updatedAt"
               FROM leads
               WHERE team_id = $1 AND status = $2
               ORDER BY created_at DESC`;
      params = [teamId, status];
    } else {
      query = `SELECT id, name, email, phone, status, assigned_to as "assignedTo", property_id as "propertyId", created_by as "createdBy", 
                      team_id as "teamId", notes, source, created_at as "createdAt", updated_at as "updatedAt"
               FROM leads
               WHERE created_by = $1 AND status = $2
               ORDER BY created_at DESC`;
      params = [userId, status];
    }

    const { rows } = await this.db.query(query, params);
    return rows;
  }
}

