import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { LeadStatus } from '../leads/entities/lead.entity';
import { PropertyStatus } from '../properties/entities/property.entity';

@Injectable()
export class CrmService {
  constructor(private readonly db: DatabaseService) {}

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
    const leadsQuery = `
      SELECT 
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE l.status = 'new' AND l.created_at >= NOW() - INTERVAL '24 hours')::int as new,
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

    // Note: ai_score and property_id columns don't exist yet in the schema
    // These are placeholders for future AI integration
    // For now, we'll derive intent from source/notes and use status for qualification
    const query = `
      SELECT 
        l.id,
        l.name,
        l.email,
        l.phone,
        l.status,
        l.assigned_to as "assignedTo",
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
        -- Determine intent from source or notes (placeholder logic)
        CASE 
          WHEN l.source ILIKE '%buy%' OR l.notes ILIKE '%buy%' THEN 'buy'
          WHEN l.source ILIKE '%rent%' OR l.notes ILIKE '%rent%' THEN 'rent'
          ELSE NULL
        END as intent,
        -- Location from source or notes (placeholder)
        CASE 
          WHEN l.source IS NOT NULL THEN l.source
          ELSE NULL
        END as location
      FROM leads l
      WHERE 1=1 ${teamFilter}
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
        property_id: null, // Will be added when property_id column is added
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
        -- Leads generated count
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
}
