import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateWhatsAppLeadDto } from '../dto/create-whatsapp-lead.dto';
import { PhoneNormalizer } from '../utils/phone-normalizer';
import { WhatsAppPhoneResolverService } from './whatsapp-phone-resolver.service';
import { BuyerLinkerService } from './buyer-linker.service';
import { LeadStatus } from '../entities/lead.entity';
import { EventLoggerService } from '../../analytics/events/event-logger.service';

@Injectable()
export class WhatsAppLeadService {
  private readonly logger = new Logger(WhatsAppLeadService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly whatsappPhoneResolver: WhatsAppPhoneResolverService,
    private readonly buyerLinker: BuyerLinkerService,
    private readonly eventLogger: EventLoggerService,
  ) {}

  /**
   * Create lead from WhatsApp gate and return WhatsApp URL
   */
  async createWhatsAppLead(
    dto: CreateWhatsAppLeadDto,
  ): Promise<{
    success: true;
    data: {
      leadId: string;
      whatsappUrl: string;
      assignedTo: 'agent' | 'owner' | 'team' | 'system';
    };
  }> {
    // Normalize phone number
    const normalizedPhone = PhoneNormalizer.normalize(dto.phone);
    if (!normalizedPhone || !PhoneNormalizer.isValidE164(normalizedPhone)) {
      throw new BadRequestException(
        'Invalid phone number format. Please use E.164 format (e.g., +593987654321)',
      );
    }

    // Verify property exists
    const property = await this.getProperty(dto.propertyId);
    if (!property) {
      throw new NotFoundException(`Property ${dto.propertyId} not found`);
    }

    // Resolve WhatsApp phone number
    const whatsappPhone = await this.whatsappPhoneResolver.resolveWhatsAppPhone(
      dto.propertyId,
    );
    if (!whatsappPhone) {
      throw new BadRequestException(
        'No WhatsApp phone number available for this property',
      );
    }

    // Resolve lead assignment
    const assignment = await this.resolveAssignment(dto.propertyId);

    // Link buyer if phone/email matches
    const buyerId = await this.buyerLinker.findOrCreateBuyer(
      normalizedPhone,
      dto.email || null,
    );

    // Check if lead already exists (by phone + property)
    const existingLead = await this.findExistingLead(
      normalizedPhone,
      dto.propertyId,
    );

    let leadId: string;
    let firstSource: string | null = null;

    if (existingLead) {
      // Update existing lead (but preserve first_source)
      leadId = existingLead.id;
      firstSource = existingLead.first_source;

      // Update source but keep first_source immutable
      await this.updateLead(leadId, {
        source: dto.source,
        assignedTo: assignment.assignedTo,
        buyerId,
      });
    } else {
      // Create new lead
      leadId = await this.createLead({
        ...dto,
        phone: normalizedPhone,
        assignedTo: assignment.assignedTo,
        teamId: assignment.teamId,
        createdBy: assignment.createdBy,
        buyerId,
        firstSource: dto.source, // Set first_source on creation
      });
    }

    // Generate WhatsApp URL
    const whatsappUrl = this.generateWhatsAppUrl(
      whatsappPhone,
      property.title,
      dto.propertyId,
    );

    // Log event if assigned
    if (assignment.createdBy) {
      await this.eventLogger.logLeadCreated(
        leadId,
        assignment.createdBy,
        assignment.teamId,
        {
          name: dto.name || 'Unknown',
          status: LeadStatus.NEW,
          source: dto.source,
        },
      );
    }

    return {
      success: true,
      data: {
        leadId,
        whatsappUrl,
        assignedTo: assignment.assignedToType,
      },
    };
  }

  /**
   * Get property details
   */
  private async getProperty(propertyId: string): Promise<any | null> {
    const { rows } = await this.db.query(
      `SELECT id, title, created_by, team_id, assigned_agent_id
       FROM properties
       WHERE id = $1`,
      [propertyId],
    );

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Resolve lead assignment using hierarchy
   */
  private async resolveAssignment(propertyId: string): Promise<{
    assignedTo: string | null;
    teamId: string | null;
    createdBy: string | null;
    assignedToType: 'agent' | 'owner' | 'team' | 'system';
  }> {
    const property = await this.getProperty(propertyId);
    if (!property) {
      return {
        assignedTo: null,
        teamId: null,
        createdBy: null,
        assignedToType: 'system',
      };
    }

    // 1. Try assigned agent
    if (property.assigned_agent_id) {
      return {
        assignedTo: property.assigned_agent_id,
        teamId: property.team_id,
        createdBy: property.assigned_agent_id,
        assignedToType: 'agent',
      };
    }

    // 2. Try property owner
    if (property.created_by) {
      return {
        assignedTo: property.created_by,
        teamId: property.team_id,
        createdBy: property.created_by,
        assignedToType: 'owner',
      };
    }

    // 3. Try team default agent (if team exists)
    if (property.team_id) {
      const teamAgent = await this.getTeamDefaultAgent(property.team_id);
      if (teamAgent) {
        return {
          assignedTo: teamAgent,
          teamId: property.team_id,
          createdBy: teamAgent,
          assignedToType: 'team',
        };
      }
    }

    // 4. Unassigned (system bucket)
    return {
      assignedTo: null,
      teamId: property.team_id,
      createdBy: null,
      assignedToType: 'system',
    };
  }

  /**
   * Get team default agent (first active agent in team)
   */
  private async getTeamDefaultAgent(teamId: string): Promise<string | null> {
    const { rows } = await this.db.query(
      `SELECT id FROM users
       WHERE team_id = $1
       AND is_active = true
       AND role IN ('agent', 'owner')
       ORDER BY created_at ASC
       LIMIT 1`,
      [teamId],
    );

    return rows.length > 0 ? rows[0].id : null;
  }

  /**
   * Find existing lead by phone + property
   */
  private async findExistingLead(
    phone: string,
    propertyId: string,
  ): Promise<{ id: string; first_source: string | null } | null> {
    const { rows } = await this.db.query(
      `SELECT id, first_source
       FROM leads
       WHERE phone = $1
       AND property_id = $2
       LIMIT 1`,
      [phone, propertyId],
    );

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Create new lead
   */
  private async createLead(data: {
    phone: string;
    propertyId: string;
    name?: string;
    email?: string;
    source: string;
    assignedTo: string | null;
    teamId: string | null;
    createdBy: string | null;
    buyerId: string | null;
    firstSource: string;
  }): Promise<string> {
    const { rows } = await this.db.query(
      `INSERT INTO leads (
        name, email, phone, status, assigned_to, property_id, buyer_id,
        created_by, team_id, source, first_source, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING id`,
      [
        data.name || null,
        data.email || null,
        data.phone,
        LeadStatus.NEW,
        data.assignedTo,
        data.propertyId,
        data.buyerId,
        data.createdBy,
        data.teamId,
        data.source,
        data.firstSource, // Set first_source on creation
      ],
    );

    return rows[0].id;
  }

  /**
   * Update existing lead (preserve first_source)
   */
  private async updateLead(
    leadId: string,
    updates: {
      source: string;
      assignedTo: string | null;
      buyerId: string | null;
    },
  ): Promise<void> {
    await this.db.query(
      `UPDATE leads
       SET source = $1,
           assigned_to = $2,
           buyer_id = COALESCE($3, buyer_id),
           updated_at = NOW()
       WHERE id = $4`,
      [updates.source, updates.assignedTo, updates.buyerId, leadId],
    );
  }

  /**
   * Generate WhatsApp URL with pre-filled message
   */
  private generateWhatsAppUrl(
    whatsappPhone: string,
    propertyTitle: string,
    propertyId: string,
  ): string {
    const cleanPhone = PhoneNormalizer.cleanForWhatsApp(whatsappPhone);
    const message = `Hi, I'm interested in the property: ${propertyTitle}. Ref: ${propertyId}`;
    const encodedMessage = encodeURIComponent(message);

    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }
}
