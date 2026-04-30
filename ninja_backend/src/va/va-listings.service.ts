import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PropertyStatus, PropertyOrigin } from '../properties/entities/property.entity';
import { CreatePropertyDto } from '../properties/dto/create-property.dto';
import { UpdatePropertyDto } from '../properties/dto/update-property.dto';

/**
 * VA listings: VA_UPLOADER creates listings that always default to PENDING_REVIEW.
 */
@Injectable()
export class VaListingsService {
  constructor(private readonly db: DatabaseService) {}

  async findMine(userId: string): Promise<any[]> {
    const { rows } = await this.db.query(
      `SELECT id, title, description, address, city, state, zip_code as "zipCode", price, type, status, origin,
              bedrooms, bathrooms, square_feet as "squareFeet", lot_size as "lotSize", year_built as "yearBuilt",
              created_by as "createdBy", team_id as "teamId", reviewed_by as "reviewedBy", reviewed_at as "reviewedAt",
              rejection_reason as "rejectionReason", created_at as "createdAt", updated_at as "updatedAt", published_at as "publishedAt"
       FROM properties
       WHERE created_by = $1 AND origin = 'va'
       ORDER BY created_at DESC`,
      [userId],
    );
    return rows;
  }

  async create(dto: CreatePropertyDto, userId: string, teamId: string | null): Promise<any> {
    const status = PropertyStatus.PENDING_REVIEW;
    const origin = PropertyOrigin.VA;

    const { rows } = await this.db.query(
      `INSERT INTO properties (
        title, description, address, city, state, zip_code, price, type, status, origin,
        bedrooms, bathrooms, square_feet, lot_size, year_built, created_by, team_id,
        latitude, longitude, created_at, updated_at, published_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW(), NULL)
      RETURNING id, title, description, address, city, state, zip_code as "zipCode", price, type, status, origin,
                bedrooms, bathrooms, square_feet as "squareFeet", lot_size as "lotSize", year_built as "yearBuilt",
                created_by as "createdBy", team_id as "teamId", latitude, longitude,
                created_at as "createdAt", updated_at as "updatedAt", published_at as "publishedAt"`,
      [
        dto.title,
        dto.description || null,
        dto.address || null,
        dto.city || null,
        dto.state || null,
        dto.zipCode || null,
        dto.price || null,
        dto.type,
        status,
        origin,
        dto.bedrooms || null,
        dto.bathrooms || null,
        dto.squareFeet || null,
        dto.lotSize || null,
        dto.yearBuilt || null,
        userId,
        teamId,
        dto.latitude || null,
        dto.longitude || null,
      ],
    );

    return rows[0];
  }

  async update(id: string, dto: UpdatePropertyDto, userId: string): Promise<any> {
    const { rows: existing } = await this.db.query(
      `SELECT id, created_by as "createdBy", status FROM properties WHERE id = $1`,
      [id],
    );
    if (!existing.length) throw new NotFoundException('Listing not found');
    if (String(existing[0].createdBy) !== String(userId)) throw new ForbiddenException('You can only edit your own listings');
    if (existing[0].status !== PropertyStatus.PENDING_REVIEW) {
      throw new ForbiddenException('Only pending listings can be edited');
    }

    const updates: string[] = [];
    const values: any[] = [];
    let i = 1;
    const fieldMap: Record<string, string> = {
      title: 'title', description: 'description', address: 'address', city: 'city', state: 'state',
      zipCode: 'zip_code', price: 'price', type: 'type', bedrooms: 'bedrooms', bathrooms: 'bathrooms',
      squareFeet: 'square_feet', lotSize: 'lot_size', yearBuilt: 'year_built',
    };
    for (const [key, col] of Object.entries(fieldMap)) {
      const val = (dto as any)[key];
      if (val !== undefined) {
        updates.push(`${col} = $${i++}`);
        values.push(val);
      }
    }
    if (updates.length === 0) {
      const { rows: refreshed } = await this.db.query(
        `SELECT id, title, description, address, city, state, zip_code as "zipCode", price, type, status, origin,
                bedrooms, bathrooms, square_feet as "squareFeet", lot_size as "lotSize", year_built as "yearBuilt",
                created_by as "createdBy", team_id as "teamId", created_at as "createdAt", updated_at as "updatedAt", published_at as "publishedAt"
         FROM properties WHERE id = $1`,
        [id],
      );
      return refreshed[0];
    }
    updates.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await this.db.query(
      `UPDATE properties SET ${updates.join(', ')} WHERE id = $${i} RETURNING id, title, description, address, city, state, zip_code as "zipCode", price, type, status, origin,
                bedrooms, bathrooms, square_feet as "squareFeet", lot_size as "lotSize", year_built as "yearBuilt",
                created_by as "createdBy", team_id as "teamId", created_at as "createdAt", updated_at as "updatedAt", published_at as "publishedAt"`,
      values,
    );
    return rows[0];
  }
}
