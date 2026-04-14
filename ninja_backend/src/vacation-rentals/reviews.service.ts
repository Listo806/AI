import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly db: DatabaseService) {}

  async listForProperty(propertyId: string) {
    const { rows } = await this.db.query(
      `SELECT id, property_id AS "propertyId", reviewer_id AS "reviewerId",
              reviewer_name AS "reviewerName", rating::float AS rating,
              comment, created_at AS "createdAt"
       FROM property_reviews
       WHERE property_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [propertyId],
    );

    const { rows: aggRows } = await this.db.query(
      `SELECT COALESCE(AVG(rating), 0)::float AS "ratingAvg",
              COALESCE(COUNT(*), 0)::int AS "ratingCount"
       FROM property_reviews WHERE property_id = $1`,
      [propertyId],
    );

    return {
      reviews: rows,
      ratingAvg: aggRows[0]?.ratingAvg ?? 0,
      ratingCount: aggRows[0]?.ratingCount ?? 0,
    };
  }

  async create(dto: {
    property_id: string;
    rating: number;
    comment?: string;
    reviewer_id?: string | null;
    reviewer_name?: string | null;
  }) {
    if (!dto.rating || dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('rating must be between 1 and 5');
    }

    // Verify property exists and is a vacation listing
    const { rows: propRows } = await this.db.query(
      `SELECT id, listing_type FROM properties WHERE id = $1`,
      [dto.property_id],
    );
    if (!propRows.length) throw new NotFoundException('Property not found');
    if (propRows[0].listing_type !== 'vacation') {
      throw new BadRequestException('Reviews are only supported for vacation listings');
    }

    const { rows } = await this.db.query(
      `INSERT INTO property_reviews (property_id, reviewer_id, reviewer_name, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, property_id AS "propertyId", reviewer_id AS "reviewerId",
                 reviewer_name AS "reviewerName", rating::float AS rating,
                 comment, created_at AS "createdAt"`,
      [
        dto.property_id,
        dto.reviewer_id || null,
        dto.reviewer_name || null,
        dto.rating,
        dto.comment || null,
      ],
    );

    return rows[0];
  }
}
