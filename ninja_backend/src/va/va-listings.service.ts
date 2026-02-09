import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PropertyStatus, PropertyOrigin } from '../properties/entities/property.entity';
import { CreatePropertyDto } from '../properties/dto/create-property.dto';

/**
 * VA listings: VA_UPLOADER creates listings that always default to PENDING_REVIEW.
 */
@Injectable()
export class VaListingsService {
  constructor(private readonly db: DatabaseService) {}

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
}
