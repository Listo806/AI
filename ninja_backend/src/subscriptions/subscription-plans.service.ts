import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SubscriptionPlan } from './entities/subscription.entity';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class SubscriptionPlansService {
  constructor(private readonly db: DatabaseService) {}

  async create(createPlanDto: CreatePlanDto): Promise<SubscriptionPlan> {
    const { rows } = await this.db.query(
      `INSERT INTO subscription_plans (name, description, price, seat_limit, paddle_price_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, name, description, price, seat_limit as "seatLimit", paddle_price_id as "paddlePriceId", 
                 is_active as "isActive", listing_limit as "listingLimit", crm_access as "crmAccess",
                 ai_features as "aiFeatures", analytics_level as "analyticsLevel",
                 priority_exposure as "priorityExposure", ai_automation as "aiAutomation",
                 plan_category as "planCategory",
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [
        createPlanDto.name,
        createPlanDto.description || null,
        createPlanDto.price,
        createPlanDto.seatLimit,
        createPlanDto.paddlePriceId || null,
      ],
    );

    return rows[0];
  }

  async findAll(activeOnly: boolean = false): Promise<SubscriptionPlan[]> {
    let query = `SELECT id, name, description, price, seat_limit as "seatLimit", paddle_price_id as "paddlePriceId", 
                        is_active as "isActive", listing_limit as "listingLimit", crm_access as "crmAccess",
                        ai_features as "aiFeatures", analytics_level as "analyticsLevel",
                        priority_exposure as "priorityExposure", ai_automation as "aiAutomation",
                        plan_category as "planCategory",
                        created_at as "createdAt", updated_at as "updatedAt"
                 FROM subscription_plans`;
    
    const params: any[] = [];
    if (activeOnly) {
      query += ` WHERE is_active = true`;
    }
    
    query += ` ORDER BY price ASC`;

    const { rows } = await this.db.query(query, params);
    return rows;
  }

  async findById(id: string): Promise<SubscriptionPlan | null> {
    const { rows } = await this.db.query(
      `SELECT id, name, description, price, seat_limit as "seatLimit", paddle_price_id as "paddlePriceId", 
              is_active as "isActive", listing_limit as "listingLimit", crm_access as "crmAccess",
              ai_features as "aiFeatures", analytics_level as "analyticsLevel",
              priority_exposure as "priorityExposure", ai_automation as "aiAutomation",
              plan_category as "planCategory",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM subscription_plans WHERE id = $1`,
      [id],
    );
    return rows[0] || null;
  }

  async findByPaddlePriceId(paddlePriceId: string): Promise<SubscriptionPlan | null> {
    const { rows } = await this.db.query(
      `SELECT id, name, description, price, seat_limit as "seatLimit", paddle_price_id as "paddlePriceId", 
              is_active as "isActive", listing_limit as "listingLimit", crm_access as "crmAccess",
              ai_features as "aiFeatures", analytics_level as "analyticsLevel",
              priority_exposure as "priorityExposure", ai_automation as "aiAutomation",
              plan_category as "planCategory",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM subscription_plans WHERE paddle_price_id = $1`,
      [paddlePriceId],
    );
    return rows[0] || null;
  }

  async update(id: string, updatePlanDto: UpdatePlanDto): Promise<SubscriptionPlan> {
    const plan = await this.findById(id);
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updatePlanDto.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(updatePlanDto.name);
    }
    if (updatePlanDto.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(updatePlanDto.description);
    }
    if (updatePlanDto.price !== undefined) {
      updates.push(`price = $${paramCount++}`);
      values.push(updatePlanDto.price);
    }
    if (updatePlanDto.seatLimit !== undefined) {
      if (updatePlanDto.seatLimit < 1) {
        throw new BadRequestException('Seat limit must be at least 1');
      }
      updates.push(`seat_limit = $${paramCount++}`);
      values.push(updatePlanDto.seatLimit);
    }
    if (updatePlanDto.paddlePriceId !== undefined) {
      updates.push(`paddle_price_id = $${paramCount++}`);
      values.push(updatePlanDto.paddlePriceId);
    }
    if (updatePlanDto.isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(updatePlanDto.isActive);
    }

    if (updates.length === 0) {
      return plan;
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await this.db.query(
      `UPDATE subscription_plans SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, name, description, price, seat_limit as "seatLimit", paddle_price_id as "paddlePriceId", 
                 is_active as "isActive", listing_limit as "listingLimit", crm_access as "crmAccess",
                 ai_features as "aiFeatures", analytics_level as "analyticsLevel",
                 priority_exposure as "priorityExposure", ai_automation as "aiAutomation",
                 plan_category as "planCategory",
                 created_at as "createdAt", updated_at as "updatedAt"`,
      values,
    );

    return rows[0];
  }

  async delete(id: string): Promise<void> {
    const plan = await this.findById(id);
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    await this.db.query('DELETE FROM subscription_plans WHERE id = $1', [id]);
  }
}

