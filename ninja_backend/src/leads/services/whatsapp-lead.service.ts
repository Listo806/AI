import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import { DatabaseService } from '../../database/database.service';
import { CreateWhatsAppLeadDto, WhatsAppLeadSource } from '../dto/create-whatsapp-lead.dto';
import { PhoneNormalizer } from '../utils/phone-normalizer';
import { WhatsAppPhoneResolverService } from './whatsapp-phone-resolver.service';
import { BuyerLinkerService } from './buyer-linker.service';
import { LeadStatus } from '../entities/lead.entity';
import { EventLoggerService } from '../../analytics/events/event-logger.service';

const PROPERTY_SOURCES: string[] = [
  WhatsAppLeadSource.PROPERTY_WHATSAPP_SEARCH,
  WhatsAppLeadSource.PROPERTY_WHATSAPP_DETAIL,
];

@Injectable()
export class WhatsAppLeadService {
  private readonly logger = new Logger(WhatsAppLeadService.name);

  constructor(
    private readonly config: ConfigService,
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

    // Property flow: use platform number so inbound goes to our webhook.
    // Legacy flow: use property's agent/owner phone for direct contact.
    const isPropertyFlow = PROPERTY_SOURCES.includes(dto.source);
    let whatsappPhone: string | null;
    if (isPropertyFlow) {
      const from = this.config.get('TWILIO_WHATSAPP_FROM') || '';
      whatsappPhone = from.replace(/^whatsapp:/i, '').trim() || null;
      if (!whatsappPhone || !whatsappPhone.startsWith('+')) {
        throw new BadRequestException('Platform WhatsApp not configured (TWILIO_WHATSAPP_FROM)');
      }
    } else {
      whatsappPhone = await this.whatsappPhoneResolver.resolveWhatsAppPhone(dto.propertyId);
      if (!whatsappPhone) {
        throw new BadRequestException('No WhatsApp phone number available for this property');
      }
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

    const propertyTitle = dto.propertyTitle || property.title;
    const sellerType = dto.sellerType || null;
    const leadMetadata = isPropertyFlow && (propertyTitle || sellerType)
      ? { property_title: propertyTitle, seller_type: sellerType }
      : null;

    if (existingLead) {
      // Update existing lead (but preserve first_source)
      leadId = existingLead.id;
      firstSource = existingLead.first_source;

      // Update source but keep first_source immutable
      await this.updateLead(leadId, {
        source: dto.source,
        assignedTo: assignment.assignedTo,
        buyerId,
        leadMetadata,
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
        leadMetadata,
      });
    }

    // Generate WhatsApp URL (property flow: prefilled tag for debugging)
    const whatsappUrl = isPropertyFlow
      ? this.generatePropertyFlowWhatsAppUrl(whatsappPhone, dto.propertyId)
      : this.generateWhatsAppUrl(whatsappPhone, property.title, dto.propertyId);

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
    leadMetadata?: Record<string, unknown> | null;
  }): Promise<string> {
    const { rows } = await this.db.query(
      `INSERT INTO leads (
        name, email, phone, status, assigned_to, property_id, buyer_id,
        created_by, team_id, source, first_source, lead_metadata, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
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
        data.firstSource,
        data.leadMetadata ? JSON.stringify(data.leadMetadata) : null,
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
      leadMetadata?: Record<string, unknown> | null;
    },
  ): Promise<void> {
    if (updates.leadMetadata !== undefined) {
      await this.db.query(
        `UPDATE leads SET source = $1, assigned_to = $2, buyer_id = COALESCE($3, buyer_id), lead_metadata = $4, updated_at = NOW() WHERE id = $5`,
        [updates.source, updates.assignedTo, updates.buyerId, updates.leadMetadata ? JSON.stringify(updates.leadMetadata) : null, leadId],
      );
    } else {
      await this.db.query(
        `UPDATE leads SET source = $1, assigned_to = $2, buyer_id = COALESCE($3, buyer_id), updated_at = NOW() WHERE id = $4`,
        [updates.source, updates.assignedTo, updates.buyerId, leadId],
      );
    }
  }

  /**
   * Generate WhatsApp URL with pre-filled message (legacy / direct agent contact)
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

  /**
   * Property flow: wa.me URL with prefilled tag for debugging (messages come to platform webhook)
   */
  private generatePropertyFlowWhatsAppUrl(whatsappPhone: string, propertyId: string): string {
    const cleanPhone = PhoneNormalizer.cleanForWhatsApp(whatsappPhone);
    const message = `Hola 👋 [flow:property] [pid:${propertyId}]`;
    const encodedMessage = encodeURIComponent(message);

    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }
}
