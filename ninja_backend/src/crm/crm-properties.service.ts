import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export type CrmPropertyStatus = 'available' | 'reserved' | 'sold';

const API_TO_DB_STATUS: Record<CrmPropertyStatus, string> = {
  available: 'published',
  reserved: 'reserved',
  sold: 'sold',
};

export interface CrmPropertyFeedItem {
  id: string;
  title: string;
  price: number | null;
  status: string;
  cover_image_url: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  area_m2: number | null;
  whatsapp_number: string | null;
  assigned_agent_id: string | null;
  project_id: string | null;
  updated_at: Date;
}

@Injectable()
export class CrmPropertiesService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * CRM property feed. Scoped by teamId (from current user). Optional filters: project_id, agent_id.
   * Cover image derived from property_media (is_primary or first image).
   */
  async feed(params: {
    teamId: string | null;
    userId: string;
    projectId?: string;
    agentId?: string;
  }): Promise<CrmPropertyFeedItem[]> {
    const conditions: string[] = [];
    const queryParams: unknown[] = [];
    let paramIndex = 1;

    if (params.teamId) {
      conditions.push(`p.team_id = $${paramIndex++}`);
      queryParams.push(params.teamId);
    } else {
      conditions.push(`p.created_by = $${paramIndex++}`);
      queryParams.push(params.userId);
    }

    if (params.projectId) {
      conditions.push(`p.project_id = $${paramIndex++}`);
      queryParams.push(params.projectId);
    }

    if (params.agentId) {
      conditions.push(`p.assigned_agent_id = $${paramIndex++}`);
      queryParams.push(params.agentId);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        p.id,
        p.title,
        p.price,
        p.status,
        p.bedrooms,
        p.bathrooms,
        p.square_feet,
        p.whatsapp_number,
        p.assigned_agent_id,
        p.project_id,
        p.updated_at,
        (
          SELECT pm.url
          FROM property_media pm
          WHERE pm.property_id = p.id
          ORDER BY pm.is_primary DESC NULLS LAST, pm.display_order ASC
          LIMIT 1
        ) AS cover_image_url
      FROM properties p
      ${whereClause}
      ORDER BY p.updated_at DESC
    `;

    const { rows } = await this.db.query(query, queryParams);

    return rows.map((r: any) => ({
      id: r.id,
      title: r.title || '',
      price: r.price != null ? Number(r.price) : null,
      status: r.status,
      cover_image_url: r.cover_image_url || null,
      bedrooms: r.bedrooms != null ? r.bedrooms : null,
      bathrooms: r.bathrooms != null ? Number(r.bathrooms) : null,
      square_feet: r.square_feet != null ? r.square_feet : null,
      area_m2: r.square_feet != null ? Math.round(r.square_feet * 0.092903) : null,
      whatsapp_number: r.whatsapp_number || null,
      assigned_agent_id: r.assigned_agent_id || null,
      project_id: r.project_id || null,
      updated_at: r.updated_at,
    }));
  }

  /**
   * Assign agent to a property. Verifies property exists and user has access (team or owner).
   */
  async assignAgent(
    propertyId: string,
    agentId: string,
    userId: string,
    teamId: string | null,
  ): Promise<{ ok: boolean }> {
    const property = await this.getPropertyForUpdate(propertyId, userId, teamId);
    if (!property) throw new NotFoundException('Property not found');

    await this.db.query(
      `UPDATE properties SET assigned_agent_id = $1, updated_at = NOW() WHERE id = $2`,
      [agentId, propertyId],
    );
    return { ok: true };
  }

  /**
   * Update CRM status. API: available | reserved | sold. Sets reserved_at / sold_at accordingly.
   */
  async updateStatus(
    propertyId: string,
    status: CrmPropertyStatus,
    userId: string,
    teamId: string | null,
  ): Promise<{ ok: boolean }> {
    const property = await this.getPropertyForUpdate(propertyId, userId, teamId);
    if (!property) throw new NotFoundException('Property not found');

    const dbStatus = API_TO_DB_STATUS[status];
    if (!dbStatus) throw new ForbiddenException('Invalid status');

    const now = new Date();
    if (status === 'reserved') {
      await this.db.query(
        `UPDATE properties SET status = $1, reserved_at = $2, updated_at = $2 WHERE id = $3`,
        [dbStatus, now, propertyId],
      );
    } else if (status === 'sold') {
      await this.db.query(
        `UPDATE properties SET status = $1, sold_at = $2, updated_at = $2 WHERE id = $3`,
        [dbStatus, now, propertyId],
      );
    } else {
      await this.db.query(
        `UPDATE properties SET status = $1, updated_at = $2 WHERE id = $3`,
        [dbStatus, now, propertyId],
      );
    }
    return { ok: true };
  }

  private async getPropertyForUpdate(
    propertyId: string,
    userId: string,
    teamId: string | null,
  ): Promise<{ id: string } | null> {
    const teamFilter = teamId ? 'AND team_id = $2' : 'AND created_by = $2';
    const params = teamId ? [propertyId, teamId] : [propertyId, userId];
    const { rows } = await this.db.query(
      `SELECT id FROM properties WHERE id = $1 ${teamFilter}`,
      params,
    );
    return rows[0] || null;
  }
}
