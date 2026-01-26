import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { Property } from '../../properties/entities/property.entity';

@Injectable()
export class ComparableListingsService {
  private readonly logger = new Logger(ComparableListingsService.name);

  // Price tolerance: ±15%
  private readonly PRICE_TOLERANCE_PERCENT = 0.15;

  constructor(private readonly db: DatabaseService) {}

  /**
   * Get comparable listings for a property
   * Matching criteria:
   * - Same zone
   * - Exact property type match
   * - Exact bedrooms match
   * - Price within ±15%
   * - Exclude the listing itself
   * - Only published properties
   * - Exclude properties buyer has viewed
   */
  async getComparableListings(
    listingId: string,
    buyerId: string,
  ): Promise<Property[]> {
    // Get the target listing
    const targetListing = await this.getListing(listingId);
    if (!targetListing) {
      return []; // Return empty array if listing not found
    }

    // Validate buyer exists
    const buyerExists = await this.buyerExists(buyerId);
    if (!buyerExists) {
      // Buyer doesn't exist, return empty array
      return [];
    }

    // Check cache first
    const cached = await this.getCachedComps(listingId, buyerId);
    if (cached) {
      return cached;
    }

    // Calculate price range (±15%)
    const priceTolerance = targetListing.price
      ? targetListing.price * this.PRICE_TOLERANCE_PERCENT
      : null;
    const minPrice = targetListing.price
      ? targetListing.price - priceTolerance
      : null;
    const maxPrice = targetListing.price
      ? targetListing.price + priceTolerance
      : null;

    // Get properties buyer has viewed (to exclude)
    const viewedPropertyIds = await this.getViewedPropertyIds(buyerId);

    // Validate required fields for matching
    if (!targetListing.type) {
      return []; // Can't match without property type
    }
    if (targetListing.bedrooms === null || targetListing.bedrooms === undefined) {
      return []; // Can't match without bedrooms
    }
    if (!targetListing.zoneId) {
      return []; // Can't match without zone
    }

    // Build query
    let query = `
      SELECT 
        p.id, p.title, p.description, p.address, p.city, p.state, 
        p.zip_code as "zipCode", p.price, p.type, p.status,
        p.bedrooms, p.bathrooms, p.square_feet as "squareFeet", 
        p.lot_size as "lotSize", p.year_built as "yearBuilt",
        p.created_by as "createdBy", p.edited_by as "editedBy", 
        p.team_id as "teamId", p.zone_id as "zoneId",
        p.latitude, p.longitude,
        p.created_at as "createdAt", p.updated_at as "updatedAt", 
        p.published_at as "publishedAt"
      FROM properties p
      WHERE p.id != $1
      AND p.status = 'published'
      AND p.type = $2
      AND p.bedrooms = $3
      AND p.zone_id = $4
    `;

    const params: any[] = [
      listingId,
      targetListing.type,
      targetListing.bedrooms,
      targetListing.zoneId,
    ];

    // Add price filter if listing has price
    if (targetListing.price && minPrice && maxPrice) {
      query += ` AND p.price >= $${params.length + 1} AND p.price <= $${params.length + 2}`;
      params.push(minPrice, maxPrice);
    }

    // Exclude viewed properties
    if (viewedPropertyIds.length > 0) {
      // Use NOT IN instead of != ALL for better compatibility
      query += ` AND p.id NOT IN (${viewedPropertyIds.map((_, idx) => `$${params.length + 1 + idx}`).join(', ')})`;
      params.push(...viewedPropertyIds);
    }

    // Order by price similarity (closest first), then recency
    if (targetListing.price) {
      const priceParamIndex = params.length + 1;
      query += `
        ORDER BY 
          CASE 
            WHEN p.price IS NOT NULL 
            THEN ABS(p.price - $${priceParamIndex})
            ELSE 999999999
          END ASC,
          p.published_at DESC NULLS LAST
        LIMIT 10
      `;
      params.push(targetListing.price);
    } else {
      // No price on target listing, just order by recency
      query += `
        ORDER BY p.published_at DESC NULLS LAST
        LIMIT 10
      `;
    }

    const { rows } = await this.db.query(query, params);

    const comps = rows.map((row) => ({
      ...row,
      price: row.price ? parseFloat(row.price.toString()) : null,
      latitude: row.latitude ? parseFloat(row.latitude.toString()) : null,
      longitude: row.longitude ? parseFloat(row.longitude.toString()) : null,
    }));

    // Cache the results
    try {
      await this.cacheComps(listingId, buyerId, comps.map((c) => c.id));
    } catch (error) {
      // If caching fails (e.g., buyer deleted between check and cache), log but don't fail the request
      this.logger.warn(`Failed to cache comps for buyer ${buyerId}:`, error);
    }

    return comps;
  }

  /**
   * Check if buyer exists
   */
  private async buyerExists(buyerId: string): Promise<boolean> {
    const { rows } = await this.db.query(
      `SELECT 1 FROM buyers WHERE id = $1 LIMIT 1`,
      [buyerId],
    );
    return rows.length > 0;
  }

  /**
   * Get listing with zone_id
   */
  private async getListing(listingId: string): Promise<(Property & { zoneId: string | null }) | null> {
    const { rows } = await this.db.query(
      `SELECT id, title, description, address, city, state, zip_code as "zipCode", price, type, status,
              bedrooms, bathrooms, square_feet as "squareFeet", lot_size as "lotSize", year_built as "yearBuilt",
              created_by as "createdBy", edited_by as "editedBy", team_id as "teamId", zone_id as "zoneId",
              latitude, longitude,
              created_at as "createdAt", updated_at as "updatedAt", published_at as "publishedAt"
       FROM properties WHERE id = $1`,
      [listingId],
    );

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      ...row,
      price: row.price ? parseFloat(row.price.toString()) : null,
      latitude: row.latitude ? parseFloat(row.latitude.toString()) : null,
      longitude: row.longitude ? parseFloat(row.longitude.toString()) : null,
    };
  }

  /**
   * Get property IDs that buyer has viewed
   */
  private async getViewedPropertyIds(buyerId: string): Promise<string[]> {
    const { rows } = await this.db.query(
      `SELECT DISTINCT property_id as "propertyId"
       FROM buyer_property_views
       WHERE buyer_id = $1
       AND property_id IS NOT NULL`,
      [buyerId],
    );

    return rows.map((row) => row.propertyId);
  }

  /**
   * Get cached comps
   */
  private async getCachedComps(
    listingId: string,
    buyerId: string,
  ): Promise<Property[] | null> {
    const { rows } = await this.db.query(
      `SELECT comp_listing_ids as "compListingIds", expires_at as "expiresAt"
       FROM listing_comps_cache
       WHERE listing_id = $1
       AND buyer_id = $2
       AND expires_at > NOW()`,
      [listingId, buyerId],
    );

    if (rows.length === 0) {
      return null; // No cache or expired
    }

    const compIds = rows[0].compListingIds as string[];

    // Fetch the actual properties
    if (compIds.length === 0) {
      return [];
    }

    // Fetch properties and sort by cache order
    const { rows: propertyRows } = await this.db.query(
      `SELECT 
        id, title, description, address, city, state, 
        zip_code as "zipCode", price, type, status,
        bedrooms, bathrooms, square_feet as "squareFeet", 
        lot_size as "lotSize", year_built as "yearBuilt",
        created_by as "createdBy", edited_by as "editedBy", 
        team_id as "teamId", zone_id as "zoneId",
        latitude, longitude,
        created_at as "createdAt", updated_at as "updatedAt", 
        published_at as "publishedAt"
       FROM properties
       WHERE id = ANY($1::uuid[])
       AND status = 'published'`,
      [compIds],
    );

    // Sort by cache order (preserve original order)
    const propertyMap = new Map(propertyRows.map((p) => [p.id, p]));
    const sortedProperties = compIds
      .map((id) => propertyMap.get(id))
      .filter((p) => p !== undefined);

    return sortedProperties.map((row) => ({
      ...row,
      price: row.price ? parseFloat(row.price.toString()) : null,
      latitude: row.latitude ? parseFloat(row.latitude.toString()) : null,
      longitude: row.longitude ? parseFloat(row.longitude.toString()) : null,
    }));
  }

  /**
   * Cache comps for 24 hours
   */
  private async cacheComps(
    listingId: string,
    buyerId: string,
    compListingIds: string[],
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.db.query(
      `INSERT INTO listing_comps_cache 
       (listing_id, buyer_id, comp_listing_ids, calculated_at, expires_at, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), $4, NOW(), NOW())
       ON CONFLICT (listing_id, buyer_id)
       DO UPDATE SET
         comp_listing_ids = $3,
         calculated_at = NOW(),
         expires_at = $4,
         updated_at = NOW()`,
      [listingId, buyerId, compListingIds, expiresAt],
    );
  }

  /**
   * Invalidate cache for a listing (when price/status changes)
   */
  async invalidateCache(listingId: string): Promise<void> {
    await this.db.query(
      `DELETE FROM listing_comps_cache
       WHERE listing_id = $1`,
      [listingId],
    );
  }

  /**
   * Invalidate cache for a buyer (when preferences change)
   */
  async invalidateCacheForBuyer(buyerId: string): Promise<void> {
    await this.db.query(
      `DELETE FROM listing_comps_cache
       WHERE buyer_id = $1`,
      [buyerId],
    );
  }
}
