import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class WhatsAppPhoneResolverService {
  private readonly logger = new Logger(WhatsAppPhoneResolverService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Resolve WhatsApp phone number using hierarchy:
   * 1. Assigned agent phone (if exists)
   * 2. Property owner phone (created_by)
   * 3. Team / account WhatsApp number
   * 4. Global fallback WhatsApp number (env config)
   *
   * @param propertyId - Property ID
   * @returns WhatsApp phone number in E.164 format or null
   */
  async resolveWhatsAppPhone(propertyId: string): Promise<string | null> {
    // Get property with owner and assigned agent info
    const propertyResult = await this.db.query(
      `SELECT 
        p.assigned_agent_id,
        p.created_by,
        p.team_id,
        u_agent.phone as agent_phone,
        u_owner.phone as owner_phone,
        t.whatsapp_phone as team_whatsapp_phone
       FROM properties p
       LEFT JOIN users u_agent ON p.assigned_agent_id = u_agent.id
       LEFT JOIN users u_owner ON p.created_by = u_owner.id
       LEFT JOIN teams t ON p.team_id = t.id
       WHERE p.id = $1`,
      [propertyId],
    );

    if (propertyResult.rows.length === 0) {
      this.logger.warn(`Property ${propertyId} not found`);
      return this.getGlobalFallback();
    }

    const property = propertyResult.rows[0];

    // 1. Try assigned agent phone
    if (property.assigned_agent_id && property.agent_phone) {
      this.logger.debug(`Using assigned agent phone for property ${propertyId}`);
      return property.agent_phone;
    }

    // 2. Try property owner phone
    if (property.created_by && property.owner_phone) {
      this.logger.debug(`Using property owner phone for property ${propertyId}`);
      return property.owner_phone;
    }

    // 3. Try team WhatsApp number
    if (property.team_id && property.team_whatsapp_phone) {
      this.logger.debug(`Using team WhatsApp phone for property ${propertyId}`);
      return property.team_whatsapp_phone;
    }

    // 4. Fallback to global WhatsApp number
    this.logger.debug(`Using global fallback WhatsApp phone for property ${propertyId}`);
    return this.getGlobalFallback();
  }

  /**
   * Get global fallback WhatsApp number from environment
   * @returns WhatsApp phone number or null
   */
  private getGlobalFallback(): string | null {
    const globalPhone = this.configService.get('WHATSAPP_PHONE_NUMBER');
    if (globalPhone) {
      return globalPhone;
    }

    this.logger.warn('No WhatsApp phone number found in any source');
    return null;
  }
}
