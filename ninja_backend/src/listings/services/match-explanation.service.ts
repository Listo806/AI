import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { BuyerPreferencesService } from '../../intelligence/services/buyer-preferences.service';
import { MarketSignalsService } from '../../intelligence/services/market-signals.service';
import { Property } from '../../properties/entities/property.entity';

export interface MatchExplanation {
  whyFits: string[]; // Array of bullet points
  whyNow: string | null; // Single text string
  calculatedAt: Date;
  expiresAt: Date;
}

@Injectable()
export class MatchExplanationService {
  private readonly logger = new Logger(MatchExplanationService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly buyerPreferencesService: BuyerPreferencesService,
    private readonly marketSignalsService: MarketSignalsService,
  ) {}

  /**
   * Get match explanation for a listing and buyer
   * Returns cached explanation if available and not expired
   */
  async getMatchExplanation(
    listingId: string,
    buyerId: string,
  ): Promise<MatchExplanation> {
    // Validate buyer exists
    const buyerExists = await this.buyerExists(buyerId);
    if (!buyerExists) {
      // Buyer doesn't exist, return generic explanation
      return this.generateGenericExplanation();
    }

    // Check cache first
    const cached = await this.getCachedExplanation(listingId, buyerId);
    if (cached) {
      return cached;
    }

    // Get listing
    const listing = await this.getListing(listingId);
    if (!listing) {
      // Return generic explanation if listing not found
      return this.generateGenericExplanation();
    }

    // Get buyer preferences (if buyer exists)
    let preferences = null;
    try {
      preferences = await this.buyerPreferencesService.getPreferences(buyerId);
    } catch (error) {
      // Buyer not found or has no preferences, will use generic explanation
    }

    // Generate explanation
    const explanation = await this.generateExplanation(listing, preferences);

    // Cache the explanation
    try {
      await this.cacheExplanation(listingId, buyerId, explanation);
    } catch (error) {
      // If caching fails (e.g., buyer deleted between check and cache), log but don't fail the request
      this.logger.warn(`Failed to cache explanation for buyer ${buyerId}:`, error);
    }

    return explanation;
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
   * Generate explanation based on listing and buyer preferences
   */
  private async generateExplanation(
    listing: Property & { zoneId: string | null },
    preferences: any | null,
  ): Promise<MatchExplanation> {
    const whyFits: string[] = [];

    // If no preferences, return generic explanation
    if (!preferences) {
      return this.generateGenericExplanation();
    }

    // Check price match
    if (listing.price && preferences.priceRange) {
      const { min, max } = preferences.priceRange;
      if (min !== null && max !== null) {
        if (listing.price >= min && listing.price <= max) {
          whyFits.push('Within your preferred price range');
        }
      } else if (min !== null && listing.price >= min) {
        whyFits.push('Meets your minimum price requirement');
      } else if (max !== null && listing.price <= max) {
        whyFits.push('Within your maximum budget');
      }
    }

    // Check zone match
    if (listing.zoneId && preferences.zones && preferences.zones.length > 0) {
      if (preferences.zones.includes(listing.zoneId)) {
        whyFits.push('Located in your desired zone');
      }
    }

    // Check bedrooms match
    if (listing.bedrooms !== null && preferences.bedrooms) {
      const { min, max } = preferences.bedrooms;
      if (min !== null && max !== null) {
        if (listing.bedrooms >= min && listing.bedrooms <= max) {
          whyFits.push('Matches your bedroom requirements');
        }
      } else if (min !== null && listing.bedrooms >= min) {
        whyFits.push('Meets your minimum bedroom requirement');
      } else if (max !== null && listing.bedrooms <= max) {
        whyFits.push('Within your bedroom preference range');
      }
    }

    // Check property type match
    if (listing.type && preferences.propertyType) {
      if (listing.type === preferences.propertyType) {
        whyFits.push(`Matches your preference for ${listing.type === 'sale' ? 'purchase' : 'rental'} properties`);
      }
    }

    // Generate why_now (market context)
    const whyNowText = await this.generateWhyNow(listing.zoneId);

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    return {
      whyFits: whyFits.length > 0 ? whyFits : ['This property may interest you'],
      whyNow: whyNowText,
      calculatedAt: new Date(),
      expiresAt,
    };
  }

  /**
   * Generate generic explanation (when buyer not found or no preferences)
   */
  private generateGenericExplanation(): MatchExplanation {
    return {
      whyFits: ['This property is available for viewing'],
      whyNow: 'Contact us to learn more about this property and current market conditions.',
      calculatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Generate why_now market context
   */
  private async generateWhyNow(zoneId: string | null): Promise<string | null> {
    if (!zoneId) {
      return null;
    }

    try {
      const signals = await this.marketSignalsService.getMarketSignals(zoneId);

      const reasons: string[] = [];

      // Scarcity signal
      if (signals.inventoryChange.isScarcity) {
        reasons.push(
          `Only ${signals.activeListingsCount} active listings available in this zone`,
        );
      }

      // High activity
      if (signals.newListingsCount7d > 5) {
        reasons.push('Recent increase in new listings indicates active market');
      }

      // Inventory increase
      if (signals.inventoryChange.isIncrease) {
        reasons.push(
          `Inventory has increased by ${signals.inventoryChange.percentageChange.toFixed(1)}% recently`,
        );
      }

      if (reasons.length > 0) {
        return reasons.join('. ') + '.';
      }

      return 'Market conditions are stable in this area.';
    } catch (error) {
      this.logger.warn(`Failed to get market signals for zone ${zoneId}:`, error);
      return null;
    }
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
   * Get cached explanation
   */
  private async getCachedExplanation(
    listingId: string,
    buyerId: string,
  ): Promise<MatchExplanation | null> {
    const { rows } = await this.db.query(
      `SELECT why_fits as "whyFits", why_now as "whyNow", 
              calculated_at as "calculatedAt", expires_at as "expiresAt"
       FROM listing_match_explanations
       WHERE listing_id = $1
       AND buyer_id = $2
       AND expires_at > NOW()`,
      [listingId, buyerId],
    );

    if (rows.length === 0) {
      return null; // No cache or expired
    }

    const row = rows[0];
    return {
      whyFits: Array.isArray(row.whyFits) ? row.whyFits : JSON.parse(row.whyFits),
      whyNow: row.whyNow,
      calculatedAt: row.calculatedAt,
      expiresAt: row.expiresAt,
    };
  }

  /**
   * Cache explanation for 24 hours
   */
  private async cacheExplanation(
    listingId: string,
    buyerId: string,
    explanation: MatchExplanation,
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO listing_match_explanations 
       (listing_id, buyer_id, why_fits, why_now, calculated_at, expires_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (listing_id, buyer_id)
       DO UPDATE SET
         why_fits = $3,
         why_now = $4,
         calculated_at = $5,
         expires_at = $6,
         updated_at = NOW()`,
      [
        listingId,
        buyerId,
        JSON.stringify(explanation.whyFits),
        explanation.whyNow,
        explanation.calculatedAt,
        explanation.expiresAt,
      ],
    );
  }

  /**
   * Invalidate cache for a listing (when price/status changes)
   */
  async invalidateCache(listingId: string): Promise<void> {
    await this.db.query(
      `DELETE FROM listing_match_explanations
       WHERE listing_id = $1`,
      [listingId],
    );
  }

  /**
   * Invalidate cache for a buyer (when preferences change)
   */
  async invalidateCacheForBuyer(buyerId: string): Promise<void> {
    await this.db.query(
      `DELETE FROM listing_match_explanations
       WHERE buyer_id = $1`,
      [buyerId],
    );
  }
}
