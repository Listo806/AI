import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import {
  Lead,
  LeadStatus,
  CreateLeadDto,
  UpdateLeadDto,
} from "./entities/lead.entity";
import { EventLoggerService } from "../analytics/events/event-logger.service";
import { LeadAIService } from "./lead-ai.service";
import { WebhooksService } from "../integrations/webhooks/webhooks.service";

@Injectable()
export class LeadsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventLogger: EventLoggerService,
    private readonly leadAI: LeadAIService,
    private readonly webhooksService: WebhooksService,
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

    // Try to find buyer by email/phone (for buyer-lead linking)
    let buyerId: string | null = null;
    if (createLeadDto.email || createLeadDto.phone) {
      // Note: Buyer matching by email/phone will be implemented in Milestone 4
      // For now, buyer_id can be passed in metadata if available from cookie
      if ((createLeadDto as any).buyerId) {
        buyerId = (createLeadDto as any).buyerId;
      }
    }

    const { rows } = await this.db.query(
      `INSERT INTO leads (name, email, phone, status, assigned_to, property_id, buyer_id, created_by, team_id, notes, source, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
       RETURNING id, name, email, phone, status, assigned_to as "assignedTo", property_id as "propertyId", buyer_id as "buyerId", created_by as "createdBy", 
                 team_id as "teamId", notes, source, created_at as "createdAt", updated_at as "updatedAt"`,
      [
        createLeadDto.name,
        createLeadDto.email || null,
        createLeadDto.phone || null,
        status,
        assignedTo || createLeadDto.assignedTo || null,
        createLeadDto.propertyId || null,
        buyerId,
        assignedTo || null, // Use property owner as created_by, or null for public leads
        teamId,
        createLeadDto.notes || null,
        createLeadDto.source || "public_contact_form",
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

    // Fire webhooks (async, never blocks)
    if (teamId) {
      this.webhooksService.triggerWebhooks("lead.created", teamId, {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        source: lead.source,
      });
    }

    return lead;
  }

  async create(
    createLeadDto: CreateLeadDto,
    userId: string,
    teamId: string | null,
  ): Promise<Lead> {
    const status = createLeadDto.status || LeadStatus.NEW;

    // Try to find buyer by email/phone (for buyer-lead linking)
    let buyerId: string | null = null;
    if (createLeadDto.email || createLeadDto.phone) {
      // Note: Buyer matching by email/phone will be implemented in Milestone 4
      // For now, buyer_id can be passed in metadata if available
      if ((createLeadDto as any).buyerId) {
        buyerId = (createLeadDto as any).buyerId;
      }
    }

    const { rows } = await this.db.query(
      `INSERT INTO leads (name, email, phone, status, priority, assigned_to, property_id, buyer_id, created_by, team_id, notes, source, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
       RETURNING id, name, email, phone, status, priority, assigned_to as "assignedTo", property_id as "propertyId", buyer_id as "buyerId", created_by as "createdBy", 
                 team_id as "teamId", notes, source, created_at as "createdAt", updated_at as "updatedAt"`,
      [
        createLeadDto.name,
        createLeadDto.email || null,
        createLeadDto.phone || null,
        status,
        (createLeadDto as any).priority || "low",
        createLeadDto.assignedTo || null,
        createLeadDto.propertyId || null,
        buyerId,
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

    // Fire webhooks (async, never blocks)
    if (teamId) {
      this.webhooksService.triggerWebhooks("lead.created", teamId, {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        source: lead.source,
      });
    }

    return lead;
  }

  async findAll(userId: string, teamId: string | null): Promise<Lead[]> {
    let query: string;
    let params: any[];

    const selectFields = `
    l.id,
    l.name,
    l.email,
    l.phone,
    l.status,
    l.priority,
    l.assigned_to as "assignedTo",
    l.property_id as "propertyId",
    l.buyer_id as "buyerId",
    l.contact_id as "contactId",
    l.created_by as "createdBy",
    l.team_id as "teamId",
    l.notes,
    l.source,
    l.created_at as "createdAt",
    l.updated_at as "updatedAt",
    d.id as "dealId",
    d.value as "dealValue",
    d.stage as "dealStage",
    d.notes as "dealNotes"
  `;

    if (teamId) {
      query = `
      SELECT ${selectFields}
      FROM leads l
      LEFT JOIN LATERAL (
        SELECT id, value, stage, notes
        FROM deals
        WHERE lead_id = l.id
        LIMIT 1
      ) d ON true
      WHERE l.team_id = $1
      ORDER BY l.created_at DESC
    `;
      params = [teamId];
    } else {
      query = `
      SELECT ${selectFields}
      FROM leads l
      LEFT JOIN LATERAL (
        SELECT id, value, stage, notes
        FROM deals
        WHERE lead_id = l.id
        LIMIT 1
      ) d ON true
      WHERE l.created_by = $1
      ORDER BY l.created_at DESC
    `;
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
        l.priority,
        l.assigned_to as "assignedTo", 
        l.property_id as "propertyId", 
        l.buyer_id as "buyerId",
        l.contact_id as "contactId",
        l.created_by as "createdBy", 
        l.team_id as "teamId", 
        l.notes, 
        l.source, 
        l.instagram_id as "instagramId",
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
        p.state as "propertyState",
        d.id as "dealId",
        d.value as "dealValue",
        d.stage as "dealStage",
        d.notes as "dealNotes"
       FROM leads l
       LEFT JOIN properties p ON l.property_id = p.id
       LEFT JOIN LATERAL (
          SELECT id, value, stage, notes
          FROM deals
          WHERE lead_id = l.id
          LIMIT 1
        ) d ON true
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
      lastActivityAt:
        lead.lastActivityAt ||
        lead.lastContactedAt ||
        lead.updatedAt ||
        lead.createdAt,
      lastActionType: lead.lastActionType || null,
      lastActionAt: lead.lastActionAt || null,
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
      contactId: lead.contactId || null,
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
      property: lead.propertyIdFull
        ? {
            id: lead.propertyIdFull,
            title: lead.propertyTitle || "Untitled Property",
            address: lead.propertyAddress || null,
            city: lead.propertyCity || null,
            state: lead.propertyState || null,
            price: lead.propertyPrice ? parseFloat(lead.propertyPrice) : null,
            type: lead.propertyType || null,
          }
        : null,
      // AI fields
      aiScore: aiMetrics.aiScore,
      aiTier: aiMetrics.aiTier,
      urgencyState: aiMetrics.urgencyState,
      aiScoreLabel: aiMetrics.aiScoreLabel,
      aiReasonBullets: aiMetrics.aiReasonBullets,
      recommendedAction: aiMetrics.recommendedAction,
      recommendedActionReason: aiMetrics.recommendedActionReason,
      followUpRecommended: aiMetrics.followUpRecommended || false,
      cooldownActive: aiMetrics.cooldownActive || false,
    };
  }

  async update(
    id: string,
    updateLeadDto: UpdateLeadDto,
    userId: string,
    teamId: string | null,
  ): Promise<Lead> {
    const lead = await this.findById(id);
    if (!lead) {
      throw new NotFoundException("Lead not found");
    }

    // Check permissions: user must be creator or team member
    if (lead.createdBy !== userId && lead.teamId !== teamId) {
      throw new ForbiddenException(
        "You do not have permission to update this lead",
      );
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
    if ((updateLeadDto as any).priority !== undefined) {
      updates.push(`priority = $${paramCount++}`);
      values.push((updateLeadDto as any).priority || null);
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
    if (updateLeadDto.instagramId !== undefined) {
      updates.push(`instagram_id = $${paramCount++}`);
      values.push(updateLeadDto.instagramId || null);
    }

    if (updates.length === 0) {
      return lead;
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await this.db.query(
      `UPDATE leads SET ${updates.join(", ")} WHERE id = $${paramCount}
       RETURNING id, name, email, phone, status, priority, assigned_to as "assignedTo", property_id as "propertyId", buyer_id as "buyerId", contact_id as "contactId", created_by as "createdBy", 
                 team_id as "teamId", notes, source, instagram_id as "instagramId", created_at as "createdAt", updated_at as "updatedAt", last_contacted_at as "lastContactedAt"`,
      values,
    );

    const updatedLead = rows[0];

    // Log events
    await this.eventLogger.logLeadUpdated(updatedLead.id, userId, teamId);

    // Log status change if status was updated
    if (
      updateLeadDto.status !== undefined &&
      updateLeadDto.status !== oldStatus
    ) {
      await this.eventLogger.logLeadStatusChanged(
        updatedLead.id,
        userId,
        teamId,
        oldStatus,
        updateLeadDto.status,
      );

      // Fire webhooks for status change (async, never blocks)
      if (teamId) {
        this.webhooksService.triggerWebhooks("lead.status.changed", teamId, {
          id: updatedLead.id,
          name: updatedLead.name,
          old_status: oldStatus,
          new_status: updateLeadDto.status,
        });

        // Fire additional webhook if lead was qualified
        if (updateLeadDto.status === LeadStatus.QUALIFIED) {
          this.webhooksService.triggerWebhooks("lead.qualified", teamId, {
            id: updatedLead.id,
            name: updatedLead.name,
            email: updatedLead.email,
            phone: updatedLead.phone,
            status: updatedLead.status,
          });
        }
      }
    }
    if ((updateLeadDto as any).priority !== undefined) {
      await this.createEvent({
        eventType: "lead.priority_changed",
        entityType: "lead",
        entityId: updatedLead.id,
        userId,
        teamId,
        metadata: {
          title: "Priority updated",
          sub: `Changed to ${(updateLeadDto as any).priority}`,
          priority: (updateLeadDto as any).priority,
        },
      });
    }

    // Log assignment if assignedTo was updated
    if (
      updateLeadDto.assignedTo !== undefined &&
      updateLeadDto.assignedTo !== oldAssignedTo
    ) {
      await this.eventLogger.logLeadAssigned(
        updatedLead.id,
        userId,
        teamId,
        updateLeadDto.assignedTo || "",
      );
    }

    return updatedLead;
  }

  /**
   * Log a contact action (call, WhatsApp, email)
   * Updates last_contacted_at and status to 'contacted' if not already contacted/qualified
   */
  async logContactAction(
    id: string,
    actionType: "call" | "whatsapp" | "email",
    userId: string,
    teamId: string | null,
  ): Promise<Lead> {
    const lead = await this.findById(id);
    if (!lead) {
      throw new NotFoundException("Lead not found");
    }

    // Check permissions
    if (lead.createdBy !== userId && lead.teamId !== teamId) {
      throw new ForbiddenException(
        "You do not have permission to update this lead",
      );
    }

    const oldStatus = lead.status;

    // Map actionType to database value
    const actionTypeMap = {
      call: "call",
      whatsapp: "whatsapp",
      email: "email",
    };
    const dbActionType = actionTypeMap[actionType] || actionType;

    // Update last_contacted_at, last_action_type, last_action_at, last_activity_at and status
    // Only update status to 'contacted' if it's currently 'new'
    const statusUpdate = oldStatus === "new" ? `status = 'contacted',` : "";

    const { rows } = await this.db.query(
      `UPDATE leads 
       SET last_contacted_at = NOW(), 
           last_action_type = $2,
           last_action_at = NOW(),
           last_activity_at = NOW(),
           ${statusUpdate}
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, email, phone, status, assigned_to as "assignedTo", property_id as "propertyId", buyer_id as "buyerId", contact_id as "contactId", created_by as "createdBy", 
                 team_id as "teamId", notes, source, created_at as "createdAt", updated_at as "updatedAt", 
                 last_contacted_at as "lastContactedAt", has_responded as "hasResponded",
                 last_activity_at as "lastActivityAt", last_action_type as "lastActionType", last_action_at as "lastActionAt"`,
      [id, dbActionType],
    );

    const updatedLead = rows[0];

    // Log events
    await this.eventLogger.logLeadUpdated(updatedLead.id, userId, teamId);

    if (oldStatus === "new" && updatedLead.status === "contacted") {
      await this.eventLogger.logLeadStatusChanged(
        updatedLead.id,
        userId,
        teamId,
        oldStatus,
        updatedLead.status,
      );

      // Fire webhook for status change (async, never blocks)
      if (teamId) {
        this.webhooksService.triggerWebhooks("lead.status.changed", teamId, {
          id: updatedLead.id,
          name: updatedLead.name,
          old_status: oldStatus,
          new_status: updatedLead.status,
        });
      }
    }

    // Return full lead with AI fields by calling findById
    return this.findById(id);
  }

  async convertToContact(
    leadId: string,
    user: any,
  ): Promise<{
    success: boolean;
    alreadyConverted: boolean;
    contact: any;
  }> {
    const userId = user?.id;
    const userTeamId = user?.teamId || user?.team_id || null;

    if (!userId) {
      throw new UnauthorizedException("User not found");
    }

    const lead = await this.findById(leadId);

    if (!lead) {
      throw new NotFoundException("Lead not found");
    }

    const isCreator = lead.createdBy === userId;
    const isSameTeam =
      Boolean(userTeamId) && Boolean(lead.teamId) && lead.teamId === userTeamId;

    if (!isCreator && !isSameTeam) {
      throw new ForbiddenException(
        "You do not have permission to convert this lead",
      );
    }

    if (!lead.teamId) {
      throw new ForbiddenException(
        "Lead must belong to a team before it can be converted to a contact",
      );
    }

    if (lead.contactId) {
      const linkedContactResult = await this.db.query(
        `
        SELECT
          c.id,
          c.team_id AS "teamId",
          c.created_by AS "createdBy",
          c.name,
          c.type,
          c.email,
          c.phone,
          c.lead_id AS "linkedLeadId",
          c.linked_lead_name AS "linkedLead",
          c.interest,
          c.last_contact_at AS "lastContactAt",
          c.score,
          c.status,
          c.source,
          c.notes,
          c.assigned_to AS "assignedTo",
          c.created_at AS "createdAt",
          c.updated_at AS "updatedAt"
        FROM contacts c
        WHERE c.id = $1
          AND c.team_id = $2
        LIMIT 1
        `,
        [lead.contactId, lead.teamId],
      );

      if (linkedContactResult.rows.length > 0) {
        const linkedContact = linkedContactResult.rows[0];

        await this.db.query(
          `
          UPDATE contacts
          SET
            lead_id = COALESCE(lead_id, $1),
            linked_lead_name = COALESCE(linked_lead_name, $2),
            updated_at = NOW()
          WHERE id = $3
          `,
          [lead.id, lead.name || null, linkedContact.id],
        );

        return {
          success: true,
          alreadyConverted: true,
          contact: {
            ...linkedContact,
            linkedLeadId: linkedContact.linkedLeadId || lead.id,
            linkedLead: linkedContact.linkedLead || lead.name || null,
          },
        };
      }
    }
    /*
     * 1. Check if Contact is linked to Lead.
     * contacts.lead_id is the primary source for checking,
     * because Contact already has a lead_id field in the current project.
     */
    const existingContactResult = await this.db.query(
      `
      SELECT
        c.id,
        c.team_id AS "teamId",
        c.created_by AS "createdBy",
        c.name,
        c.type,
        c.email,
        c.phone,
        c.lead_id AS "linkedLeadId",
        c.linked_lead_name AS "linkedLead",
        c.interest,
        c.last_contact_at AS "lastContactAt",
        c.score,
        c.status,
        c.source,
        c.notes,
        c.assigned_to AS "assignedTo",
        c.created_at AS "createdAt",
        c.updated_at AS "updatedAt"
      FROM contacts c
      WHERE c.lead_id = $1
      LIMIT 1
      `,
      [lead.id],
    );

    if (existingContactResult.rows.length > 0) {
      const existingContact = existingContactResult.rows[0];

      /*
       *Synchronize the contact_id back to the Lead if the Lead doesn't already have one.
       */
      await this.db.query(
        `
        UPDATE leads
        SET
          contact_id = $1,
          updated_at = NOW()
        WHERE id = $2
          AND contact_id IS DISTINCT FROM $1
        `,
        [existingContact.id, lead.id],
      );

      await this.db.query(
        `
        UPDATE whatsapp_qr_conversations
        SET
          contact_id = $1,
          updated_at = NOW()
        WHERE lead_id = $2
          AND contact_id IS DISTINCT FROM $1
        `,
        [existingContact.id, lead.id],
      );

      await this.db.query(
        `
        UPDATE whatsapp_qr_messages
        SET contact_id = $1
        WHERE lead_id = $2
          AND contact_id IS DISTINCT FROM $1
        `,
        [existingContact.id, lead.id],
      );

      await this.db.query(
        `
        UPDATE whatsapp_qr_conversations
        SET
          contact_id = $1,
          updated_at = NOW()
        WHERE lead_id = $2
          AND contact_id IS DISTINCT FROM $1
        `,
        [contact.id, lead.id],
      );

      await this.db.query(
        `
        UPDATE whatsapp_qr_messages
        SET contact_id = $1
        WHERE lead_id = $2
          AND contact_id IS DISTINCT FROM $1
        `,
        [contact.id, lead.id],
      );

      return {
        success: true,
        alreadyConverted: true,
        contact: existingContact,
      };
    }

    /*
     * 2. Change Lead status to Contact status.
     * Contacts are currently using the following statuses:
     * Cold, Warm, Hot, Active.
     */
    const normalizedLeadStatus = String(lead.status || "").toLowerCase();

    let contactStatus = "Cold";
    let contactScore = 25;

    if (
      normalizedLeadStatus === "qualified" ||
      normalizedLeadStatus === "closed-won"
    ) {
      contactStatus = "Hot";
      contactScore = 90;
    } else if (
      normalizedLeadStatus === "contacted" ||
      normalizedLeadStatus === "follow-up"
    ) {
      contactStatus = "Warm";
      contactScore = 65;
    } else if (normalizedLeadStatus === "new") {
      contactStatus = "Cold";
      contactScore = 25;
    }

    /*
     * 3. create Contact.
     */
    const contactResult = await this.db.query(
      `
    INSERT INTO contacts (
      team_id,
      created_by,
      name,
      type,
      email,
      phone,
      lead_id,
      linked_lead_name,
      interest,
      last_contact_at,
      score,
      status,
      source,
      notes,
      assigned_to,
      created_at,
      updated_at
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      $9,
      $10,
      $11,
      $12,
      $13,
      $14,
      $15,
      NOW(),
      NOW()
    )
    RETURNING
      id,
      team_id AS "teamId",
      created_by AS "createdBy",
      name,
      type,
      email,
      phone,
      lead_id AS "linkedLeadId",
      linked_lead_name AS "linkedLead",
      interest,
      last_contact_at AS "lastContactAt",
      score,
      status,
      source,
      notes,
      assigned_to AS "assignedTo",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    `,
      [
        lead.teamId,
        userId,
        lead.name?.trim() || "Contact",
        null,
        lead.email?.trim() || null,
        lead.phone?.trim() || null,
        lead.id,
        lead.name?.trim() || null,
        lead.property?.title || null,
        lead.lastContactedAt || null,
        contactScore,
        contactStatus,
        lead.source || "Lead conversion",
        lead.notes?.trim() || null,
        lead.assignedTo || null,
      ],
    );

    const contact = contactResult.rows[0];

    /*
     * 4. Contact to Lead.
     */
    await this.db.query(
      `
    UPDATE leads
    SET
      contact_id = $1,
      last_activity_at = NOW(),
      last_action_type = $2,
      last_action_at = NOW(),
      updated_at = NOW()
    WHERE id = $3
    `,
      [contact.id, "converted_to_contact", lead.id],
    );

    /*
     * 5. add timeline for Lead.
     */
    await this.createEvent({
      eventType: "lead.converted_to_contact",
      entityType: "lead",
      entityId: lead.id,
      userId,
      teamId: lead.teamId,
      metadata: {
        title: "Converted to contact",
        sub: `Contact created for ${lead.name}`,
        contactId: contact.id,
        contactName: contact.name,
      },
    });

    /*
     * 6. activity for Contact.
     */
    await this.db.query(
      `
    INSERT INTO contact_activities (
      contact_id,
      user_id,
      team_id,
      type,
      title,
      sub
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [
        contact.id,
        userId,
        lead.teamId,
        "converted_from_lead",
        "Converted from lead",
        `Lead: ${lead.name}`,
      ],
    );

    /*
     * 7. Webhook.
     */
    this.webhooksService.triggerWebhooks(
      "lead.converted_to_contact",
      lead.teamId,
      {
        lead_id: lead.id,
        contact_id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
      },
    );

    return {
      success: true,
      alreadyConverted: false,
      contact,
    };
  }

  async delete(
    id: string,
    userId: string,
    teamId: string | null,
  ): Promise<void> {
    const lead = await this.findById(id);
    if (!lead) {
      throw new NotFoundException("Lead not found");
    }

    // Allow delete if user created the lead, or if lead belongs to user's team (team members can remove team leads)
    const isCreator = lead.createdBy === userId;
    const isSameTeam = teamId && lead.teamId === teamId;
    if (!isCreator && !isSameTeam) {
      throw new ForbiddenException(
        "You do not have permission to delete this lead",
      );
    }

    await this.db.query("DELETE FROM leads WHERE id = $1", [id]);
  }

  async findByStatus(
    status: LeadStatus,
    userId: string,
    teamId: string | null,
  ): Promise<Lead[]> {
    let query: string;
    let params: any[];

    if (teamId) {
      query = `SELECT id, name, email, phone, status, priority, assigned_to as "assignedTo", property_id as "propertyId", buyer_id as "buyerId", contact_id as "contactId", created_by as "createdBy", 
                      team_id as "teamId", notes, source, created_at as "createdAt", updated_at as "updatedAt"
               FROM leads
               WHERE team_id = $1 AND status = $2
               ORDER BY created_at DESC`;
      params = [teamId, status];
    } else {
      query = `SELECT id, name, email, phone, status, priority, assigned_to as "assignedTo", property_id as "propertyId", buyer_id as "buyerId", contact_id as "contactId", created_by as "createdBy", 
                      team_id as "teamId", notes, source, created_at as "createdAt", updated_at as "updatedAt"
               FROM leads
               WHERE created_by = $1 AND status = $2
               ORDER BY created_at DESC`;
      params = [userId, status];
    }

    const { rows } = await this.db.query(query, params);
    return rows;
  }

  async updateLead(id: string, body: any, user: any) {
    const updates: string[] = [];
    const values: any[] = [];
    let index = 1;

    if (body.status !== undefined) {
      updates.push(`status = $${index++}`);
      values.push(body.status);
    }

    if (body.priority !== undefined) {
      updates.push(`priority = $${index++}`);
      values.push(body.priority);
    }

    if (body.assignedTo !== undefined) {
      updates.push(`assigned_to = $${index++}`);
      values.push(body.assignedTo || null);
    }

    if (body.notes !== undefined) {
      updates.push(`notes = $${index++}`);
      values.push(body.notes || null);
    }

    if (!updates.length) {
      const existing = await this.db.query(
        `SELECT * FROM leads WHERE id = $1 LIMIT 1`,
        [id],
      );
      return existing.rows[0] || null;
    }

    updates.push(`updated_at = NOW()`);

    values.push(id);

    const { rows } = await this.db.query(
      `
    UPDATE leads
    SET ${updates.join(", ")}
    WHERE id = $${index}
    RETURNING *
    `,
      values,
    );

    const lead = rows[0];

    if (!lead) {
      throw new NotFoundException("Lead not found");
    }

    if (body.status !== undefined) {
      await this.createEvent({
        eventType: "status_changed",
        entityType: "lead",
        entityId: id,
        userId: user.id,
        teamId: lead.team_id,
        metadata: {
          title: "Status updated",
          sub: `Changed to ${body.status}`,
          status: body.status,
        },
      });
    }

    if (body.priority !== undefined) {
      await this.createEvent({
        eventType: "priority_changed",
        entityType: "lead",
        entityId: id,
        userId: user.id,
        teamId: lead.team_id,
        metadata: {
          title: "Priority updated",
          sub: `Changed to ${body.priority}`,
          priority: body.priority,
        },
      });
    }

    return lead;
  }

  async createEvent(params: {
    eventType: string;
    entityType: string;
    entityId: string;
    userId: string;
    teamId?: string | null;
    metadata?: any;
  }) {
    await this.db.query(
      `
    INSERT INTO events (
      event_type,
      entity_type,
      entity_id,
      user_id,
      team_id,
      metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [
        params.eventType,
        params.entityType,
        params.entityId,
        params.userId,
        params.teamId || null,
        params.metadata || {},
      ],
    );
  }

  async getLeadEvents(id: string, user: any, limit = 5, page = 1) {
    const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 50);
    const safePage = Math.max(Number(page) || 1, 1);
    const offset = (safePage - 1) * safeLimit;
    const leadResult = await this.db.query(
      `
    SELECT id, team_id, created_by
    FROM leads
    WHERE id = $1
    LIMIT 1
    `,
      [id],
    );

    if (!leadResult.rows.length) {
      return [];
    }

    const lead = leadResult.rows[0];

    const { rows } = await this.db.query(
      `
    SELECT
      id,
      event_type AS "eventType",
      entity_type AS "entityType",
      entity_id AS "entityId",
      user_id AS "userId",
      team_id AS "teamId",
      COALESCE(metadata, '{}'::jsonb) AS metadata,
      created_at AS "createdAt"
    FROM events
    WHERE entity_type = $1
      AND entity_id = $2
    ORDER BY created_at DESC
    LIMIT $3 OFFSET $4
    `,
      ["lead", lead.id, safeLimit, offset],
    );

    return {
      items: rows.map((event) => {
        const metadata = event.metadata || {};

        if (metadata.title || metadata.sub) return event;

        if (event.eventType === "lead.status_changed") {
          return {
            ...event,
            metadata: {
              ...metadata,
              title: "Status updated",
              sub: metadata.newStatus
                ? `Changed from ${metadata.oldStatus || "unknown"} to ${metadata.newStatus}`
                : "Status changed",
            },
          };
        }

        if (event.eventType === "lead.priority_changed") {
          return {
            ...event,
            metadata: {
              ...metadata,
              title: "Priority updated",
              sub: metadata.priority
                ? `Changed to ${metadata.priority}`
                : "Priority changed",
            },
          };
        }

        return {
          ...event,
          metadata: {
            ...metadata,
            title: "Lead updated",
            sub: "Lead information was updated",
          },
        };
      }),
      page: safePage,
      limit: safeLimit,
      hasMore: rows.length === safeLimit,
    };
  }

  async createLeadEvent(id: string, body: any, user: any) {
    const userId = user.id;

    if (!userId) {
      throw new UnauthorizedException("User not found");
    }

    const leadResult = await this.db.query(
      `
    SELECT id, team_id, created_by
    FROM leads
    WHERE id = $1
    LIMIT 1
    `,
      [id],
    );

    if (!leadResult.rows.length) {
      throw new NotFoundException("Lead not found");
    }

    const lead = leadResult.rows[0];
    const metadata = body.metadata || {};

    const { rows } = await this.db.query(
      `
    INSERT INTO events (
      event_type,
      entity_type,
      entity_id,
      user_id,
      team_id,
      metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6::jsonb)
    RETURNING
      id,
      event_type AS "eventType",
      entity_type AS "entityType",
      entity_id AS "entityId",
      user_id AS "userId",
      team_id AS "teamId",
      metadata,
      created_at AS "createdAt"
    `,
      [
        body.eventType || "lead.note",
        "lead",
        lead.id,
        userId,
        lead.team_id || user?.teamId || null,
        JSON.stringify(metadata),
      ],
    );

    return rows[0];
  }
  private buildDateFilter(range = "all") {
    switch (range) {
      case "today":
        return `AND l.created_at >= CURRENT_DATE`;

      case "7days":
        return `AND l.created_at >= NOW() - INTERVAL '7 days'`;

      case "30days":
        return `AND l.created_at >= NOW() - INTERVAL '30 days'`;

      case "month":
        return `
        AND DATE_TRUNC('month', l.created_at)
        =
        DATE_TRUNC('month', CURRENT_DATE)
      `;

      default:
        return "";
    }
  }
  async getDashboard(
    userId: string,
    teamId: string | null,
    range = "30days",
    page = 1,
    limit = 20,
  ) {
    const params = teamId ? [teamId] : [userId];
    const scopeWhere = teamId ? `l.team_id = $1` : `l.created_by = $1`;
    const dateWhere = this.buildDateFilter(range);
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(10, Number(limit) || 20));
    const offset = (safePage - 1) * safeLimit;
    const { rows: allLeads } = await this.db.query(
      `
  SELECT
    l.id,
    l.name,
    l.email,
    l.phone,
    l.status,
    l.priority,
    l.assigned_to AS "assignedTo",
    l.property_id AS "propertyId",
    l.buyer_id AS "buyerId",
    l.contact_id AS "contactId",
    l.created_by AS "createdBy",
    l.team_id AS "teamId",
    l.notes,
    l.source,
    l.created_at AS "createdAt",
    l.updated_at AS "updatedAt",
    l.last_activity_at AS "lastActivityAt",
    l.last_contacted_at AS "lastContactedAt",
    d.id AS "dealId",
    d.value AS "dealValue",
    d.stage AS "dealStage",
    d.notes AS "dealNotes"
  FROM leads l
  LEFT JOIN LATERAL (
    SELECT id, value, stage, notes
    FROM deals
    WHERE lead_id = l.id
    LIMIT 1
  ) d ON true
  WHERE ${scopeWhere}
  ${dateWhere}
  ORDER BY l.created_at DESC
  `,
      params,
    );

    const { rows: pageLeads } = await this.db.query(
      `
  SELECT
    l.id,
    l.name,
    l.email,
    l.phone,
    l.status,
    l.priority,
    l.assigned_to AS "assignedTo",
    l.property_id AS "propertyId",
    l.buyer_id AS "buyerId",
    l.contact_id AS "contactId",
    l.created_by AS "createdBy",
    l.team_id AS "teamId",
    l.notes,
    l.source,
    l.created_at AS "createdAt",
    l.updated_at AS "updatedAt",
    l.last_activity_at AS "lastActivityAt",
    l.last_contacted_at AS "lastContactedAt",
    d.id AS "dealId",
    d.value AS "dealValue",
    d.stage AS "dealStage",
    d.notes AS "dealNotes"
  FROM leads l
  LEFT JOIN LATERAL (
    SELECT id, value, stage, notes
    FROM deals
    WHERE lead_id = l.id
    LIMIT 1
  ) d ON true
  WHERE ${scopeWhere}
  ${dateWhere}
  ORDER BY l.created_at DESC
  LIMIT $2 OFFSET $3
  `,
      [...params, safeLimit, offset],
    );

    const leadIds = allLeads.map((lead) => lead.id);

    let eventRows: any[] = [];

    if (leadIds.length) {
      const { rows } = await this.db.query(
        `
      SELECT
        e.id,
        e.event_type AS "eventType",
        e.entity_id AS "leadId",
        e.metadata,
        e.created_at AS "createdAt"
      FROM events e
      WHERE e.entity_type = 'lead'
      AND e.entity_id = ANY($1::uuid[])
      ORDER BY e.created_at DESC
      `,
        [leadIds],
      );

      eventRows = rows;
    }
    const leads = pageLeads;
    return {
      range,
      stats: this.calculateDashboardStats(allLeads, eventRows, range),
      aiQueue: this.buildAiQueue(allLeads, eventRows),
      intelligence: this.buildLeadIntelligence(allLeads),
      revenue: this.buildRevenue(allLeads),
      leads,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: allLeads.length,
        hasMore: offset + leads.length < allLeads.length,
      },
    };
  }
  private calculateDashboardStats(leads: any[], events: any[], range = "all") {
    const total = leads.length;

    const qualified = leads.filter(
      (lead) => lead.status === "qualified",
    ).length;

    const closedWon = leads.filter(
      (lead) => lead.status === "closed-won",
    ).length;

    const conversations = events.filter(
      (event) => event.eventType === "lead.message_sent",
    ).length;

    const appointments = events.filter(
      (event) => event.eventType === "lead.showing_booked",
    ).length;

    const urgentLeads = leads.filter((lead) => lead.priority === "high").length;

    const needFollowUp = leads.filter(
      (lead) => lead.status === "follow-up",
    ).length;

    const readyToCall = leads.filter(
      (lead) =>
        lead.phone &&
        ["qualified", "contacted"].includes(String(lead.status || "")),
    ).length;

    const pendingReplies = leads.filter((lead) =>
      ["contacted", "follow-up"].includes(String(lead.status || "")),
    ).length;

    const aiQualifiedToday = leads.filter((lead) => {
      const createdAt = lead.createdAt ? new Date(lead.createdAt) : null;
      return (
        lead.status === "qualified" &&
        createdAt &&
        createdAt.toDateString() === new Date().toDateString()
      );
    }).length;

    const conversion = total ? Math.round((closedWon / total) * 100) : 0;
    const qualifiedRate = total ? Math.round((qualified / total) * 100) : 0;

    return {
      total,
      newThisMonth: leads.filter((lead) => {
        const createdAt = lead.createdAt ? new Date(lead.createdAt) : null;
        const now = new Date();
        return (
          createdAt &&
          createdAt.getMonth() === now.getMonth() &&
          createdAt.getFullYear() === now.getFullYear()
        );
      }).length,

      qualified,
      qualifiedRate,

      activeConversations: conversations,
      conversationToday: events.filter((event) => {
        const createdAt = event.createdAt ? new Date(event.createdAt) : null;
        return (
          event.eventType === "lead.message_sent" &&
          createdAt &&
          createdAt.toDateString() === new Date().toDateString()
        );
      }).length,

      appointments,
      appointmentThisWeek: appointments,

      conversionRate: conversion,
      conversion,

      avgResponse: conversations ? "2m" : "0m",
      responseImprove: conversations ? 18 : 0,

      urgentLeads,
      needFollowUp,
      readyToCall,
      pendingReplies,
      aiQualifiedToday,

      rangeLabel: range === "all" ? "All time" : range,
    };
  }
  private buildAiQueue(leads: any[], events: any[]) {
    const eventCountMap = events.reduce((acc, event) => {
      acc[event.leadId] = (acc[event.leadId] || 0) + 1;
      return acc;
    }, {});

    return leads
      .map((lead) => ({
        ...lead,
        urgencyScore:
          (lead.priority === "high" ? 50 : 0) +
          (lead.status === "follow-up" ? 25 : 0) +
          (eventCountMap[lead.id] || 0),
      }))
      .filter((lead) => lead.priority === "high" || lead.urgencyScore >= 25)
      .sort((a, b) => b.urgencyScore - a.urgencyScore)
      .slice(0, 10);
  }

  private buildLeadIntelligence(leads: any[]) {
    return {
      hot: leads.filter((lead) => lead.priority === "high").length,
      warm: leads.filter((lead) => lead.priority === "medium").length,
      cold: leads.filter((lead) => !lead.priority || lead.priority === "low")
        .length,
    };
  }

  private buildRevenue(leads: any[]) {
    const pipelineValue = leads.reduce(
      (sum, lead) => sum + Number(lead.dealValue || 0),
      0,
    );

    return {
      pipelineValue,
      averageDeal: leads.length ? Math.round(pipelineValue / leads.length) : 0,
    };
  }
  async getLeadStats(userId: string, teamId: string | null, range = "all") {
    const params = teamId ? [teamId] : [userId];
    const scopeWhere = teamId ? `l.team_id = $1` : `l.created_by = $1`;

    const { rows } = await this.db.query(
      `
    WITH scoped_leads AS (
      SELECT *
      FROM leads l
      WHERE ${scopeWhere}
    ),
    lead_counts AS (
      SELECT
        COUNT(*)::int AS total,

        COUNT(*) FILTER (
          WHERE created_at >= date_trunc('month', NOW())
        )::int AS new_this_month,

        COUNT(*) FILTER (
          WHERE status = 'qualified'
        )::int AS qualified,

        COUNT(*) FILTER (
          WHERE status = 'closed-won'
        )::int AS closed_won,

        COUNT(*) FILTER (
          WHERE status = 'closed-lost'
        )::int AS closed_lost,

        COUNT(*) FILTER (
          WHERE priority = 'high'
        )::int AS urgent_leads,

        COUNT(*) FILTER (
          WHERE status = 'follow-up'
        )::int AS need_follow_up,

        COUNT(*) FILTER (
          WHERE phone IS NOT NULL
            AND phone <> ''
            AND status IN ('qualified', 'contacted')
        )::int AS ready_to_call,

        COUNT(*) FILTER (
          WHERE status IN ('contacted', 'follow-up')
        )::int AS pending_replies,

        COUNT(*) FILTER (
          WHERE status = 'qualified'
            AND created_at::date = CURRENT_DATE
        )::int AS ai_qualified_today

      FROM scoped_leads
    ),
    event_counts AS (
      SELECT
        COUNT(*) FILTER (
          WHERE e.event_type = 'lead.message_sent'
        )::int AS active_conversations,

        COUNT(*) FILTER (
          WHERE e.event_type = 'lead.message_sent'
            AND e.created_at::date = CURRENT_DATE
        )::int AS conversation_today,

        COUNT(*) FILTER (
          WHERE e.event_type = 'lead.showing_booked'
        )::int AS appointments,

        COUNT(*) FILTER (
          WHERE e.event_type = 'lead.showing_booked'
            AND e.created_at >= date_trunc('week', NOW())
        )::int AS appointment_this_week

      FROM events e
      INNER JOIN scoped_leads sl ON sl.id = e.entity_id
      WHERE e.entity_type = 'lead'
    )
    SELECT
      lc.total AS "total",
      lc.new_this_month AS "newThisMonth",

      lc.qualified AS "qualified",
      CASE
        WHEN lc.total > 0
        THEN ROUND((lc.qualified::numeric / lc.total::numeric) * 100)::int
        ELSE 0
      END AS "qualifiedRate",

      ec.active_conversations AS "activeConversations",
      ec.conversation_today AS "conversationToday",

      ec.appointments AS "appointments",
      ec.appointment_this_week AS "appointmentThisWeek",

      CASE
        WHEN lc.total > 0
        THEN ROUND((lc.closed_won::numeric / lc.total::numeric) * 100)::int
        ELSE 0
      END AS "conversionRate",

      '2m' AS "avgResponse",
      0 AS "responseImprove",

      lc.urgent_leads AS "urgentLeads",
      lc.need_follow_up AS "needFollowUp",
      lc.ready_to_call AS "readyToCall",
      lc.pending_replies AS "pendingReplies",
      lc.ai_qualified_today AS "aiQualifiedToday"

    FROM lead_counts lc
    CROSS JOIN event_counts ec
    `,
      params,
    );

    return rows[0];
  }
}
