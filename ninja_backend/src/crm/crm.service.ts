import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { LeadStatus } from '../leads/entities/lead.entity';
import { LeadAIService } from '../leads/lead-ai.service';
import { PropertyStatus } from '../properties/entities/property.entity';

@Injectable()
export class CrmService {
  constructor(
    private readonly db: DatabaseService,
    private readonly leadAI: LeadAIService,
  ) {}

  /**
   * Get dashboard summary (single lightweight endpoint)
   * Returns aggregated stats for leads, properties, and system status
   */
  async getDashboardSummary(
    userId: string,
    teamId: string | null,
    role: string,
  ) {
    // Build team/user filter
    const teamFilter = teamId ? 'AND l.team_id = $1' : 'AND l.created_by = $1';
    const params = teamId ? [teamId] : [userId];

    // Single query for all lead aggregations
    // New leads: last 7 days (configurable - can be changed to 24 hours if needed)
    const leadsQuery = `
      SELECT 
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE l.created_at >= NOW() - INTERVAL '7 days')::int as new,
        COUNT(*) FILTER (WHERE l.status = 'qualified')::int as qualified
      FROM leads l
      WHERE 1=1 ${teamFilter}
    `;

    // Single query for all property aggregations
    const propertiesQuery = `
      SELECT 
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE p.status = 'published')::int as published
      FROM properties p
      WHERE 1=1 ${teamId ? 'AND p.team_id = $1' : 'AND p.created_by = $1'}
    `;

    // Execute both queries in parallel
    const [leadsResult, propertiesResult] = await Promise.all([
      this.db.query(leadsQuery, params),
      this.db.query(propertiesQuery, params),
    ]);

    const leads = leadsResult.rows[0] || { total: 0, new: 0, qualified: 0 };
    const properties = propertiesResult.rows[0] || { total: 0, published: 0 };

    return {
      leads: {
        total: leads.total || 0,
        new: leads.new || 0,
        qualified: leads.qualified || 0,
      },
      properties: {
        total: properties.total || 0,
        published: properties.published || 0,
      },
      system: {
        ai_status: 'active',
        last_sync: new Date().toISOString(),
      },
    };
  }

  /**
   * Get recent leads with AI score logic
   * AI rule: ai_score >= 0.7 → qualified, ai_score < 0.7 → new
   */
  async getRecentLeads(
    userId: string,
    teamId: string | null,
    limit: number = 10,
  ) {
    const teamFilter = teamId ? 'AND l.team_id = $2' : 'AND l.created_by = $2';
    const params = [limit, teamId || userId];

    // Note: ai_score column doesn't exist yet in the schema (placeholder for future AI integration)
    // property_id now exists in the schema (added in migration 009)
    const query = `
      SELECT 
        l.id,
        l.name,
        l.email,
        l.phone,
        l.status,
        l.assigned_to as "assignedTo",
        l.property_id as "propertyId",
        l.created_at as "createdAt",
        l.notes,
        l.source,
        -- AI score (placeholder: 0.0 for new leads, 0.8+ for qualified)
        CASE 
          WHEN l.status = 'qualified' THEN 0.85
          WHEN l.status = 'contacted' THEN 0.65
          WHEN l.status = 'converted' THEN 0.95
          ELSE 0.5
        END as ai_score,
        -- Determine intent from property type if property_id exists, otherwise from source/notes
        CASE 
          WHEN l.property_id IS NOT NULL AND p.type = 'sale' THEN 'buy'
          WHEN l.property_id IS NOT NULL AND p.type = 'rent' THEN 'rent'
          WHEN l.source ILIKE '%buy%' OR l.notes ILIKE '%buy%' THEN 'buy'
          WHEN l.source ILIKE '%rent%' OR l.notes ILIKE '%rent%' THEN 'rent'
          ELSE NULL
        END as intent,
        -- Location from property if property_id exists, otherwise from source/notes
        COALESCE(
          CONCAT(p.city, ', ', p.state),
          l.source,
          NULL
        ) as location
      FROM leads l
      LEFT JOIN properties p ON l.property_id = p.id
      WHERE 1=1 ${teamFilter}
        AND l.property_id IS NOT NULL
      ORDER BY l.created_at DESC
      LIMIT $1
    `;

    const result = await this.db.query(query, params);
    const leads = result.rows || [];

    // Process leads with AI score logic
    // AI rule: ai_score >= 0.7 → qualified, ai_score < 0.7 → new
    // Note: Status in DB is the source of truth, ai_score is informational
    const processedLeads = leads.map((lead) => {
      const aiScore = parseFloat(lead.ai_score) || 0;
      return {
        id: lead.id,
        name: lead.name || 'Unnamed Lead',
        intent: lead.intent || null,
        location: lead.location || null,
        property_id: lead.propertyId || null,
        ai_score: aiScore,
        status: lead.status,
        created_at: lead.createdAt,
      };
    });

    if (processedLeads.length === 0) {
      return {
        data: [],
        message: 'No leads yet. AI matching is active.',
        meta: { total: 0 },
      };
    }

    return {
      data: processedLeads,
      meta: { total: processedLeads.length },
    };
  }

  /**
   * Get recent properties with engagement metrics
   */
  async getRecentProperties(
    userId: string,
    teamId: string | null,
    limit: number = 10,
  ) {
    const teamFilter = teamId ? 'AND p.team_id = $2' : 'AND p.created_by = $2';
    const params = [limit, teamId || userId];

    const query = `
      SELECT 
        p.id,
        p.title,
        p.status,
        p.created_at as "createdAt",
        p.published_at as "publishedAt",
        CONCAT(
          COALESCE(p.city, ''),
          CASE WHEN p.city IS NOT NULL AND p.state IS NOT NULL THEN ', ' ELSE '' END,
          COALESCE(p.state, '')
        ) as location,
        -- Views count (placeholder: will use analytics_events when available)
        -- For now, return 0 as views are not tracked yet
        0 as views,
        -- Leads generated count (using property_id column from leads table)
        COALESCE((
          SELECT COUNT(*)::int 
          FROM leads l 
          WHERE l.property_id = p.id
        ), 0) as leads_generated
      FROM properties p
      WHERE 1=1 ${teamFilter}
      ORDER BY p.created_at DESC
      LIMIT $1
    `;

    const result = await this.db.query(query, params);
    const properties = result.rows || [];

    const processedProperties = properties.map((prop) => ({
      id: prop.id,
      title: prop.title || 'Untitled Property',
      location: prop.location || null,
      status: prop.status,
      views: prop.views || 0,
      leads_generated: prop.leads_generated || 0,
      created_at: prop.createdAt,
    }));

    if (processedProperties.length === 0) {
      return {
        data: [],
        message: 'Upload your first property to start receiving AI-matched leads.',
        meta: { total: 0 },
      };
    }

    return {
      data: processedProperties,
      meta: { total: processedProperties.length },
    };
  }

  /**
   * Get all owner properties (for owner dashboard)
   * Role scoped: owners only see their own properties
   */
  async getOwnerProperties(userId: string, teamId: string | null) {
    // For owners, always filter by created_by (no team sharing)
    const query = `
      SELECT 
        p.id,
        p.title,
        p.status,
        p.created_at as "createdAt",
        p.published_at as "publishedAt",
        CONCAT(
          COALESCE(p.city, ''),
          CASE WHEN p.city IS NOT NULL AND p.state IS NOT NULL THEN ', ' ELSE '' END,
          COALESCE(p.state, '')
        ) as location
      FROM properties p
      WHERE p.created_by = $1
      ORDER BY p.created_at DESC
    `;

    const result = await this.db.query(query, [userId]);
    const properties = result.rows || [];

    return {
      data: properties.map((prop) => ({
        id: prop.id,
        title: prop.title || 'Untitled Property',
        status: prop.status,
        location: prop.location || null,
        created_at: prop.createdAt,
        published_at: prop.publishedAt || null,
      })),
      meta: { total: properties.length },
    };
  }

  /**
   * Get all owner leads (for owner dashboard)
   * Role scoped: owners only see their own leads
   * Includes associated property information
   */
  async getOwnerLeads(userId: string, teamId: string | null) {
    const query = `
      SELECT 
        l.id,
        l.name,
        l.email,
        l.phone,
        l.status,
        l.property_id as "propertyId",
        l.source,
        l.notes,
        l.created_at as "createdAt",
        l.updated_at as "updatedAt",
        l.last_contacted_at as "lastContactedAt",
        -- Associated property details
        p.title as "propertyTitle",
        p.price as "propertyPrice",
        p.type as "propertyType",
        p.address as "propertyAddress",
        p.city as "propertyCity",
        p.state as "propertyState"
      FROM leads l
      LEFT JOIN properties p ON l.property_id = p.id
      WHERE l.created_by = $1
        AND l.property_id IS NOT NULL
      ORDER BY l.created_at DESC
    `;

    const result = await this.db.query(query, [userId]);
    const leads = result.rows || [];

    // Calculate AI metrics for each lead
    const leadsWithAI = leads.map((lead) => {
      const context = {
        status: lead.status as LeadStatus,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
        lastContactedAt: lead.lastContactedAt || null, // Use actual lastContactedAt, not updatedAt
        propertyPrice: lead.propertyPrice ? parseFloat(lead.propertyPrice) : null,
        propertyType: lead.propertyType || null,
        phone: lead.phone || null,
        email: lead.email || null,
        source: lead.source || null,
        engagementCount: null, // TODO: Add engagement tracking in future
      };

      const aiMetrics = this.leadAI.calculateLeadAI(context);

      return {
        id: lead.id,
        name: lead.name || 'Unnamed Lead',
        email: lead.email || null,
        phone: lead.phone || null,
        contactInfo: lead.email || lead.phone || 'No contact',
        property: lead.propertyId ? {
          id: lead.propertyId,
          title: lead.propertyTitle || 'Untitled Property',
          address: lead.propertyAddress || null,
          city: lead.propertyCity || null,
          state: lead.propertyState || null,
          price: lead.propertyPrice ? parseFloat(lead.propertyPrice) : null,
          type: lead.propertyType || null,
        } : null,
        source: lead.source || null,
        notes: lead.notes || null,
        status: lead.status,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
        lastContactedAt: lead.lastContactedAt || null,
        // AI fields
        aiScore: aiMetrics.aiScore,
        aiTier: aiMetrics.aiTier,
        aiScoreLabel: aiMetrics.aiScoreLabel,
        aiReasonBullets: aiMetrics.aiReasonBullets,
        recommendedAction: aiMetrics.recommendedAction,
        recommendedActionReason: aiMetrics.recommendedActionReason,
      };
    });

    // Sort leads by: aiTier desc (HOT first) > aiScore desc > createdAt desc
    leadsWithAI.sort((a, b) => {
      // Tier first (HOT > WARM > COLD)
      const tierOrder = { HOT: 1, WARM: 2, COLD: 3 };
      const tierDiff = (tierOrder[a.aiTier] || 4) - (tierOrder[b.aiTier] || 4);
      if (tierDiff !== 0) return tierDiff;

      // Then AI score (descending)
      const scoreDiff = b.aiScore - a.aiScore;
      if (scoreDiff !== 0) return scoreDiff;

      // Then recency (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Separate hot leads for frontend
    const hotLeads = leadsWithAI.filter(l => l.aiTier === 'HOT');
    const otherLeads = leadsWithAI.filter(l => l.aiTier !== 'HOT');

    return {
      data: leadsWithAI, // Full sorted list
      hotLeads: hotLeads,
      meta: { 
        total: leadsWithAI.length,
        hot: hotLeads.length,
        warm: leadsWithAI.filter(l => l.aiTier === 'WARM').length,
        cold: leadsWithAI.filter(l => l.aiTier === 'COLD').length,
      },
    };
  }
}
