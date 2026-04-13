import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const PROPERTY_TYPE_VALUES = ['house', 'apartment', 'land', 'commercial', 'villa', 'office'] as const;

type VacationSearchRow = {
  id: string;
  title: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  price: number | string | null;
  type: string;
  status: string;
  listingType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  lotSize: number | null;
  yearBuilt: number | null;
  thumbnailUrl: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  propertyType: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
};

@Injectable()
export class VacationRentalsService {
  constructor(private readonly db: DatabaseService) {}

  /** Primary image fallback: first image by display_order when thumbnail_url is empty. */
  private async attachThumbnailUrlList(rows: VacationSearchRow[]): Promise<VacationSearchRow[]> {
    const idsNeedingFallback = rows.filter((p) => p.thumbnailUrl == null || p.thumbnailUrl === '').map((p) => p.id);
    let fallbackMap: Record<string, string> = {};
    if (idsNeedingFallback.length > 0) {
      const { rows: mediaRows } = await this.db.query(
        `SELECT DISTINCT ON (property_id) property_id as "propertyId", url
         FROM property_media
         WHERE property_id = ANY($1::uuid[]) AND type = 'image'
         ORDER BY property_id, is_primary DESC, display_order ASC`,
        [idsNeedingFallback],
      );
      fallbackMap = mediaRows.reduce((acc: Record<string, string>, r: { propertyId: string; url: string }) => {
        acc[r.propertyId] = r.url;
        return acc;
      }, {});
    }
    return rows.map((p) => ({
      ...p,
      thumbnailUrl: (p.thumbnailUrl != null && p.thumbnailUrl !== '' ? p.thumbnailUrl : fallbackMap[p.id]) || null,
    }));
  }

  private shortDescription(text: string | null, max = 140): string | null {
    if (!text) return null;
    const t = text.replace(/\s+/g, ' ').trim();
    if (!t) return null;
    return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
  }

  private mapVacationApiRow(row: VacationSearchRow, hadDateAvailabilityFilter: boolean) {
    const priceNum = row.price != null && row.price !== '' ? Number(row.price) : null;
    const lat = row.latitude != null ? parseFloat(String(row.latitude)) : null;
    const lng = row.longitude != null ? parseFloat(String(row.longitude)) : null;
    return {
      id: row.id,
      title: row.title,
      primaryImage: row.thumbnailUrl,
      city: row.city,
      neighborhood: null as string | null,
      state: row.state,
      address: row.address,
      zipCode: row.zipCode,
      pricePerNight: priceNum,
      listingType: 'vacation' as const,
      availabilityStatus: hadDateAvailabilityFilter ? ('available' as const) : ('unknown' as const),
      latitude: lat,
      longitude: lng,
      shortDescription: this.shortDescription(row.description),
      description: row.description,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      squareFeet: row.squareFeet,
      propertyType: row.propertyType,
      publishedAt: row.publishedAt,
      createdAt: row.createdAt,
      thumbnailUrl: row.thumbnailUrl,
      price: priceNum,
    };
  }

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
    /** Inclusive minimum nightly price */
    minPrice?: number;
    /** Inclusive maximum nightly price */
    maxPrice?: number;
    /** Minimum bedroom count (listings must have bedrooms >= this) */
    bedroomsMin?: number;
    /** Minimum bathrooms (listings must have bathrooms >= this) */
    bathroomsMin?: number;
    /** Exact property kind (house, apartment, …) */
    propertyType?: string;
    /** Server-side ordering (listing_type=vacation still hard-enforced) */
    sort?: 'recommended' | 'price_asc' | 'price_desc';
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

    if (filters?.propertyType?.trim()) {
      const pt = filters.propertyType.trim().toLowerCase();
      if (PROPERTY_TYPE_VALUES.includes(pt as (typeof PROPERTY_TYPE_VALUES)[number])) {
        conditions.push(`LOWER(TRIM(p.property_type)) = $${paramCount++}`);
        params.push(pt);
      }
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

    if (filters?.minPrice != null && Number.isFinite(filters.minPrice) && filters.minPrice >= 0) {
      conditions.push(`p.price IS NOT NULL AND p.price >= $${paramCount++}`);
      params.push(filters.minPrice);
    }
    if (filters?.maxPrice != null && Number.isFinite(filters.maxPrice) && filters.maxPrice >= 0) {
      conditions.push(`p.price IS NOT NULL AND p.price <= $${paramCount++}`);
      params.push(filters.maxPrice);
    }
    if (
      filters?.bedroomsMin != null &&
      Number.isFinite(filters.bedroomsMin) &&
      Number.isInteger(filters.bedroomsMin) &&
      filters.bedroomsMin >= 1
    ) {
      conditions.push(`p.bedrooms IS NOT NULL AND p.bedrooms >= $${paramCount++}`);
      params.push(filters.bedroomsMin);
    }
    if (
      filters?.bathroomsMin != null &&
      Number.isFinite(filters.bathroomsMin) &&
      filters.bathroomsMin > 0
    ) {
      conditions.push(`p.bathrooms IS NOT NULL AND p.bathrooms >= $${paramCount++}`);
      params.push(filters.bathroomsMin);
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

    const sort = filters?.sort ?? 'recommended';
    let orderBy = `ORDER BY p.published_at DESC NULLS LAST, p.created_at DESC`;
    if (sort === 'price_asc') {
      orderBy = `ORDER BY p.price ASC NULLS LAST, p.published_at DESC NULLS LAST, p.created_at DESC`;
    } else if (sort === 'price_desc') {
      orderBy = `ORDER BY p.price DESC NULLS LAST, p.published_at DESC NULLS LAST, p.created_at DESC`;
    }

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
       ${orderBy}
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      [...params, limit, offset],
    );

    const hadDateAvailabilityFilter = Boolean(filters?.checkIn && filters?.checkOut);
    const withThumbs = await this.attachThumbnailUrlList(rows as VacationSearchRow[]);
    const items = withThumbs.map((r) => this.mapVacationApiRow(r, hadDateAvailabilityFilter));

    return { items, total, limit, offset };
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
