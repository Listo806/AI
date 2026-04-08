import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class VacationRentalsService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Search vacation listings with hard enforcement.
   * ALWAYS filters listing_type = 'vacation' regardless of any client input.
   * Supports availability filtering via checkIn/checkOut overlap exclusion.
   */
  async search(filters?: {
    city?: string;
    checkIn?: string;
    checkOut?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    // ── HARD ENFORCEMENT: Only vacation listings, always ─────────
    conditions.push(`p.listing_type = 'vacation'`);
    conditions.push(`p.status = 'published'`);

    // ── Optional filters ─────────────────────────────────────────
    if (filters?.city?.trim()) {
      conditions.push(`LOWER(TRIM(p.city)) = LOWER(TRIM($${paramCount++}))`);
      params.push(filters.city.trim());
    }

    if (filters?.search?.trim()) {
      const searchTerm = `%${filters.search.trim()}%`;
      conditions.push(`(
        p.title ILIKE $${paramCount} OR
        p.address ILIKE $${paramCount} OR
        p.city ILIKE $${paramCount} OR
        p.description ILIKE $${paramCount}
      )`);
      params.push(searchTerm);
      paramCount++;
    }

    // ── Availability: exclude listings with overlapping bookings ──
    if (filters?.checkIn && filters?.checkOut) {
      const checkIn = new Date(filters.checkIn);
      const checkOut = new Date(filters.checkOut);

      if (checkOut <= checkIn) {
        throw new BadRequestException('checkOut must be after checkIn');
      }

      conditions.push(`NOT EXISTS (
        SELECT 1 FROM vacation_bookings vb
        WHERE vb.property_id = p.id
          AND vb.booking_start < $${paramCount + 1}
          AND vb.booking_end > $${paramCount}
      )`);
      params.push(filters.checkIn, filters.checkOut);
      paramCount += 2;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count
    const { rows: countRows } = await this.db.query(
      `SELECT COUNT(*)::int AS c FROM properties p ${whereClause}`,
      params,
    );
    const total = countRows[0]?.c ?? 0;

    // Paginate
    const limit = Math.min(Math.max(1, filters?.limit ?? DEFAULT_LIMIT), MAX_LIMIT);
    const offset = Math.max(0, filters?.offset ?? 0);

    const { rows } = await this.db.query(
      `SELECT p.id, p.title, p.description, p.address, p.city, p.state,
              p.zip_code AS "zipCode", p.price, p.type, p.status,
              p.listing_type AS "listingType",
              p.bedrooms, p.bathrooms, p.square_feet AS "squareFeet",
              p.lot_size AS "lotSize", p.year_built AS "yearBuilt",
              p.thumbnail_url AS "thumbnailUrl", p.latitude, p.longitude,
              p.property_type AS "propertyType",
              p.created_at AS "createdAt", p.updated_at AS "updatedAt",
              p.published_at AS "publishedAt"
       FROM properties p
       ${whereClause}
       ORDER BY p.published_at DESC, p.created_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      [...params, limit, offset],
    );

    return { items: rows, total, limit, offset };
  }

  // ── Bookings ────────────────────────────────────────────────────

  async createBooking(dto: {
    property_id: string;
    booking_start: string;
    booking_end: string;
    guest_name?: string;
    guest_email?: string;
    notes?: string;
  }) {
    // Verify property exists and is a vacation listing
    const { rows: propRows } = await this.db.query(
      `SELECT id, listing_type FROM properties WHERE id = $1`,
      [dto.property_id],
    );

    if (!propRows.length) {
      throw new NotFoundException('Property not found');
    }
    if (propRows[0].listing_type !== 'vacation') {
      throw new BadRequestException('Bookings can only be created for vacation listings');
    }

    const bookingStart = new Date(dto.booking_start);
    const bookingEnd = new Date(dto.booking_end);

    if (bookingEnd <= bookingStart) {
      throw new BadRequestException('booking_end must be after booking_start');
    }

    // Check for overlapping bookings
    const { rows: overlaps } = await this.db.query(
      `SELECT id FROM vacation_bookings
       WHERE property_id = $1
         AND booking_start < $3
         AND booking_end > $2`,
      [dto.property_id, dto.booking_start, dto.booking_end],
    );

    if (overlaps.length > 0) {
      throw new BadRequestException('Dates overlap with an existing booking');
    }

    const { rows } = await this.db.query(
      `INSERT INTO vacation_bookings (property_id, booking_start, booking_end, guest_name, guest_email, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, property_id AS "propertyId", booking_start AS "bookingStart",
                 booking_end AS "bookingEnd", guest_name AS "guestName",
                 guest_email AS "guestEmail", notes, created_at AS "createdAt"`,
      [dto.property_id, dto.booking_start, dto.booking_end, dto.guest_name || null, dto.guest_email || null, dto.notes || null],
    );

    return rows[0];
  }

  async getBookings(propertyId: string) {
    const { rows } = await this.db.query(
      `SELECT id, property_id AS "propertyId", booking_start AS "bookingStart",
              booking_end AS "bookingEnd", guest_name AS "guestName",
              guest_email AS "guestEmail", notes, created_at AS "createdAt"
       FROM vacation_bookings
       WHERE property_id = $1
       ORDER BY booking_start ASC`,
      [propertyId],
    );
    return rows;
  }

  async deleteBooking(bookingId: string) {
    const { rows } = await this.db.query(
      `DELETE FROM vacation_bookings WHERE id = $1 RETURNING id`,
      [bookingId],
    );
    if (!rows.length) throw new NotFoundException('Booking not found');
    return { deleted: true };
  }
}
