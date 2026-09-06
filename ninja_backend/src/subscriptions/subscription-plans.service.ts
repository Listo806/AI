import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SubscriptionPlan } from './entities/subscription.entity';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class SubscriptionPlansService {
  private schemaReady = false;

  constructor(private readonly db: DatabaseService) {}

  private async ensureSchema(): Promise<void> {
    if (this.schemaReady) return;

    await this.db.query(`
      ALTER TABLE subscription_plans
        ADD COLUMN IF NOT EXISTS activation_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS annual_price NUMERIC(12,2),
        ADD COLUMN IF NOT EXISTS ai_conversation_limit INTEGER,
        ADD COLUMN IF NOT EXISTS whatsapp_connections INTEGER,
        ADD COLUMN IF NOT EXISTS leads_contacts_limit INTEGER,
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ
    `);

    this.schemaReady = true;
  }

  private selectColumns(): string {
    return `
      id,
      name,
      description,
      price,
      activation_fee as "activationFee",
      annual_price as "annualPrice",
      seat_limit as "seatLimit",
      paddle_price_id as "paddlePriceId",
      is_active as "isActive",
      listing_limit as "listingLimit",
      leads_contacts_limit as "leadsContactsLimit",
      ai_conversation_limit as "aiConversationLimit",
      whatsapp_connections as "whatsappConnections",
      crm_access as "crmAccess",
      ai_features as "aiFeatures",
      analytics_level as "analyticsLevel",
      priority_exposure as "priorityExposure",
      ai_automation as "aiAutomation",
      plan_category as "planCategory",
      created_at as "createdAt",
      updated_at as "updatedAt"
    `;
  }

  async create(createPlanDto: CreatePlanDto): Promise<SubscriptionPlan> {
    await this.ensureSchema();

    const { rows } = await this.db.query(
      `INSERT INTO subscription_plans (
         name, description, activation_fee, price, annual_price,
         seat_limit, paddle_price_id, listing_limit, leads_contacts_limit,
         ai_conversation_limit, whatsapp_connections,
         crm_access, ai_features, analytics_level,
         priority_exposure, ai_automation, plan_category, is_active,
         created_at, updated_at
       ) VALUES (
         $1, $2, $3, $4, $5,
         $6, $7, $8, $9,
         $10, $11,
         $12, $13, $14,
         $15, $16, $17, $18,
         NOW(), NOW()
       )
       RETURNING ${this.selectColumns()}`,
      [
        createPlanDto.name,
        createPlanDto.description ?? null,
        createPlanDto.activationFee ?? 0,
        createPlanDto.price,
        createPlanDto.annualPrice ?? null,
        createPlanDto.seatLimit,
        createPlanDto.paddlePriceId ?? null,
        createPlanDto.listingLimit ?? null,
        createPlanDto.leadsContactsLimit ?? null,
        createPlanDto.aiConversationLimit ?? null,
        createPlanDto.whatsappConnections ?? null,
        createPlanDto.crmAccess ?? false,
        createPlanDto.aiFeatures ?? false,
        createPlanDto.analyticsLevel ?? 'none',
        createPlanDto.priorityExposure ?? false,
        createPlanDto.aiAutomation ?? false,
        createPlanDto.planCategory ?? 'marketplace',
        createPlanDto.isActive !== false,
      ],
    );

    return rows[0];
  }

  async findAll(activeOnly: boolean = false): Promise<SubscriptionPlan[]> {
    await this.ensureSchema();

    let query = `SELECT ${this.selectColumns()} FROM subscription_plans WHERE deleted_at IS NULL`;
    if (activeOnly) query += ` AND is_active = true`;
    query += ` ORDER BY price ASC, created_at ASC`;

    const { rows } = await this.db.query(query);
    return rows;
  }

  async findById(id: string): Promise<SubscriptionPlan | null> {
    await this.ensureSchema();

    const { rows } = await this.db.query(
      `SELECT ${this.selectColumns()}
         FROM subscription_plans
        WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );

    return rows[0] || null;
  }

  async findByPaddlePriceId(paddlePriceId: string): Promise<SubscriptionPlan | null> {
    await this.ensureSchema();

    const { rows } = await this.db.query(
      `SELECT ${this.selectColumns()}
         FROM subscription_plans
        WHERE paddle_price_id = $1
          AND deleted_at IS NULL`,
      [paddlePriceId],
    );

    return rows[0] || null;
  }

  async update(id: string, updatePlanDto: UpdatePlanDto): Promise<SubscriptionPlan> {
    await this.ensureSchema();

    const plan = await this.findById(id);
    if (!plan) throw new NotFoundException('Subscription plan not found');

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    const add = (column: string, value: any) => {
      updates.push(`${column} = $${paramCount++}`);
      values.push(value);
    };

    if (updatePlanDto.name !== undefined) add('name', updatePlanDto.name);
    if (updatePlanDto.description !== undefined) add('description', updatePlanDto.description);
    if (updatePlanDto.activationFee !== undefined) add('activation_fee', updatePlanDto.activationFee);
    if (updatePlanDto.price !== undefined) add('price', updatePlanDto.price);
    if (updatePlanDto.annualPrice !== undefined) add('annual_price', updatePlanDto.annualPrice);

    if (updatePlanDto.seatLimit !== undefined) {
      if (updatePlanDto.seatLimit < 1) {
        throw new BadRequestException('Seat limit must be at least 1');
      }
      add('seat_limit', updatePlanDto.seatLimit);
    }

    if (updatePlanDto.paddlePriceId !== undefined) add('paddle_price_id', updatePlanDto.paddlePriceId);
    if (updatePlanDto.isActive !== undefined) add('is_active', updatePlanDto.isActive);
    if (updatePlanDto.listingLimit !== undefined) add('listing_limit', updatePlanDto.listingLimit);
    if (updatePlanDto.leadsContactsLimit !== undefined) add('leads_contacts_limit', updatePlanDto.leadsContactsLimit);
    if (updatePlanDto.aiConversationLimit !== undefined) add('ai_conversation_limit', updatePlanDto.aiConversationLimit);
    if (updatePlanDto.whatsappConnections !== undefined) add('whatsapp_connections', updatePlanDto.whatsappConnections);
    if (updatePlanDto.crmAccess !== undefined) add('crm_access', updatePlanDto.crmAccess);
    if (updatePlanDto.aiFeatures !== undefined) add('ai_features', updatePlanDto.aiFeatures);
    if (updatePlanDto.analyticsLevel !== undefined) add('analytics_level', updatePlanDto.analyticsLevel);
    if (updatePlanDto.priorityExposure !== undefined) add('priority_exposure', updatePlanDto.priorityExposure);
    if (updatePlanDto.aiAutomation !== undefined) add('ai_automation', updatePlanDto.aiAutomation);
    if (updatePlanDto.planCategory !== undefined) add('plan_category', updatePlanDto.planCategory);

    if (!updates.length) return plan;

    updates.push('updated_at = NOW()');
    values.push(id);

    const { rows } = await this.db.query(
      `UPDATE subscription_plans
          SET ${updates.join(', ')}
        WHERE id = $${paramCount}
          AND deleted_at IS NULL
        RETURNING ${this.selectColumns()}`,
      values,
    );

    return rows[0];
  }

  /**
   * Admin "Delete" is intentionally a soft-delete.
   * subscription_plans is referenced by subscriptions and workspace history, so a
   * physical DELETE can violate FK constraints or destroy billing history. A
   * deleted plan disappears from Admin/Plan Management and can no longer be
   * selected, while existing customer/subscription history remains intact.
   */
  async delete(id: string): Promise<void> {
    await this.ensureSchema();

    const plan = await this.findById(id);
    if (!plan) throw new NotFoundException('Subscription plan not found');

    await this.db.query(
      `UPDATE subscription_plans
          SET is_active = false,
              deleted_at = NOW(),
              updated_at = NOW()
        WHERE id = $1`,
      [id],
    );
  }
}
