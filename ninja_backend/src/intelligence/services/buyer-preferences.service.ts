import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { BuyerPreferences, BuyerEventWithMetadata } from '../entities/buyer-preferences.entity';

@Injectable()
export class BuyerPreferencesService {
  private readonly logger = new Logger(BuyerPreferencesService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Extract buyer preferences from last 20 events
   * Weighted: saved searches > views > searches
   */
  async extractPreferences(buyerId: string): Promise<BuyerPreferences> {
    // Get last 20 events ordered by creation time
    const { rows } = await this.db.query(
      `SELECT id, buyer_id as "buyerId", event_type as "eventType", 
              property_id as "propertyId", zone_id as "zoneId", 
              metadata, created_at as "createdAt"
       FROM buyer_events
       WHERE buyer_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [buyerId],
    );

    const events: BuyerEventWithMetadata[] = rows.map((row) => ({
      ...row,
      metadata: row.metadata 
        ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata)
        : null,
    }));

    // Extract preferences with weighting
    const priceFilters: number[] = [];
    const bedroomFilters: number[] = [];
    const propertyTypes: { type: string; weight: number }[] = [];
    const zones: Set<string> = new Set();

    // Weight multipliers: saved > viewed > searched
    const weights: Record<string, number> = {
      saved_search: 3,
      listing_view: 2,
      revisit: 2,
      property_search: 1,
      filters_applied: 1,
    };

    for (const event of events) {
      const weight = weights[event.eventType] || 1;

      // Extract price range from metadata
      if (event.metadata?.filters?.price_min) {
        priceFilters.push(event.metadata.filters.price_min);
      }
      if (event.metadata?.filters?.price_max) {
        priceFilters.push(event.metadata.filters.price_max);
      }

      // Extract bedrooms from metadata
      if (event.metadata?.filters?.bedrooms) {
        const bedrooms = event.metadata.filters.bedrooms;
        if (typeof bedrooms === 'number') {
          bedroomFilters.push(bedrooms);
        } else if (bedrooms?.min) {
          bedroomFilters.push(bedrooms.min);
        } else if (bedrooms?.max) {
          bedroomFilters.push(bedrooms.max);
        }
      }

      // Extract property type (from metadata or property lookup)
      if (event.metadata?.property_type) {
        propertyTypes.push({ type: event.metadata.property_type, weight });
      } else if (event.propertyId) {
        // Look up property type if we have property_id
        const propResult = await this.db.query(
          `SELECT type FROM properties WHERE id = $1`,
          [event.propertyId],
        );
        if (propResult.rows.length > 0) {
          propertyTypes.push({ type: propResult.rows[0].type, weight });
        }
      }

      // Extract zones
      if (event.zoneId) {
        zones.add(event.zoneId);
      }
      if (event.metadata?.zone_id) {
        zones.add(event.metadata.zone_id);
      }
      if (event.metadata?.zones && Array.isArray(event.metadata.zones)) {
        event.metadata.zones.forEach((zoneId: string) => zones.add(zoneId));
      }
    }

    // Calculate price range (min/max from all filters)
    const priceRange = {
      min: priceFilters.length > 0 ? Math.min(...priceFilters) : null,
      max: priceFilters.length > 0 ? Math.max(...priceFilters) : null,
    };

    // Calculate bedrooms range
    const bedrooms = {
      min: bedroomFilters.length > 0 ? Math.min(...bedroomFilters) : null,
      max: bedroomFilters.length > 0 ? Math.max(...bedroomFilters) : null,
    };

    // Determine most common property type (weighted)
    const typeCounts: Record<string, number> = {};
    for (const pt of propertyTypes) {
      typeCounts[pt.type] = (typeCounts[pt.type] || 0) + pt.weight;
    }
    const mostCommonType = Object.keys(typeCounts).length > 0
      ? (Object.keys(typeCounts).reduce((a, b) =>
          typeCounts[a] > typeCounts[b] ? a : b,
        ) as 'sale' | 'rent')
      : null;

    return {
      buyerId,
      priceRange,
      bedrooms,
      propertyType: mostCommonType,
      zones: Array.from(zones),
      extractedAt: new Date(),
    };
  }

  /**
   * Get buyer preferences (cached or extracted)
   */
  async getPreferences(buyerId: string): Promise<BuyerPreferences> {
    return this.extractPreferences(buyerId);
  }
}
