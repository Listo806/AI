import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PropertyStatus } from '../properties/entities/property.entity';

@Injectable()
export class AdminListingsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(filters?: {
    status?: string;
    origin?: string;
    createdBy?: string;
  }): Promise<any[]> {
    const conditions: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (filters?.status) {
      conditions.push(`p.status = $${i++}`);
      params.push(filters.status);
    }
    if (filters?.origin) {
      conditions.push(`p.origin = $${i++}`);
      params.push(filters.origin);
    }
    if (filters?.createdBy) {
      conditions.push(`p.created_by = $${i++}`);
      params.push(filters.createdBy);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await this.db.query(
      `SELECT p.id, p.title, p.description, p.address, p.city, p.state, p.zip_code as "zipCode", p.price, p.type, p.status, p.origin,
              p.bedrooms, p.bathrooms, p.square_feet as "squareFeet", p.lot_size as "lotSize", p.year_built as "yearBuilt",
              p.created_by as "createdBy", p.team_id as "teamId",
              p.reviewed_by as "reviewedBy", p.reviewed_at as "reviewedAt", p.rejection_reason as "rejectionReason",
              p.created_at as "createdAt", p.updated_at as "updatedAt", p.published_at as "publishedAt",
              u.email as "uploaderEmail"
       FROM properties p
       LEFT JOIN users u ON u.id = p.created_by
       ${where}
       ORDER BY p.created_at DESC`,
      params,
    );
    return rows;
  }

  async findById(id: string): Promise<any | null> {
    const { rows } = await this.db.query(
      `SELECT p.id, p.title, p.description, p.address, p.city, p.state, p.zip_code as "zipCode", p.price, p.type, p.status, p.origin,
              p.bedrooms, p.bathrooms, p.square_feet as "squareFeet", p.lot_size as "lotSize", p.year_built as "yearBuilt",
              p.created_by as "createdBy", p.team_id as "teamId",
              p.reviewed_by as "reviewedBy", p.reviewed_at as "reviewedAt", p.rejection_reason as "rejectionReason",
              p.created_at as "createdAt", p.updated_at as "updatedAt", p.published_at as "publishedAt",
              u.email as "uploaderEmail"
       FROM properties p
       LEFT JOIN users u ON u.id = p.created_by
       WHERE p.id = $1`,
      [id],
    );
    return rows[0] || null;
  }

  async updateStatus(
    id: string,
    status: PropertyStatus,
    adminId: string,
    rejectionReason?: string,
  ): Promise<any> {
    const prop = await this.findById(id);
    if (!prop) throw new NotFoundException('Listing not found');

    let reviewedAt = prop.reviewedAt;
    if (status === PropertyStatus.APPROVED || status === PropertyStatus.REJECTED || status === PropertyStatus.PUBLISHED) {
      reviewedAt = new Date();
    }

    const { rows } = await this.db.query(
      `UPDATE properties SET
        status = $1::varchar,
        reviewed_by = $2,
        reviewed_at = $3,
        rejection_reason = $4::text,
        published_at = CASE WHEN $1::varchar = 'published' THEN COALESCE(published_at, NOW()) ELSE published_at END,
        updated_at = NOW()
       WHERE id = $5
       RETURNING id, title, status, origin, reviewed_by as "reviewedBy", reviewed_at as "reviewedAt", rejection_reason as "rejectionReason", published_at as "publishedAt"`,
      [
        status,
        adminId,
        reviewedAt,
        status === PropertyStatus.REJECTED ? rejectionReason || null : null,
        id,
      ],
    );

    return rows[0];
  }
}
