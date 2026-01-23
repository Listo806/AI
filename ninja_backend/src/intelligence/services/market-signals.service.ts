import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface MarketSignals {
  zoneId: string;
  zoneName: string;
  newListingsCount7d: number;
  newListingsCount30d: number;
  soldCount7d: number;
  soldCount30d: number;
  closedCount7d: number;
  closedCount30d: number;
  activeListingsCount: number;
  inventoryChange: {
    isScarcity: boolean; // < 15 active listings
    isIncrease: boolean; // > 25% increase vs previous 30-day baseline
    percentageChange: number;
  };
  calculatedAt: Date;
}

@Injectable()
export class MarketSignalsService {
  private readonly logger = new Logger(MarketSignalsService.name);

  // Thresholds
  private readonly SCARCITY_THRESHOLD = 15; // < 15 active listings
  private readonly INCREASE_THRESHOLD = 0.25; // > 25% increase

  constructor(private readonly db: DatabaseService) {}

  /**
   * Get market signals for a zone
   */
  async getMarketSignals(zoneId: string): Promise<MarketSignals> {
    // Verify zone exists
    const { rows: zoneRows } = await this.db.query(
      `SELECT id, name FROM zones WHERE id = $1`,
      [zoneId],
    );

    if (zoneRows.length === 0) {
      throw new NotFoundException(`Zone with ID ${zoneId} not found`);
    }

    const zoneName = zoneRows[0].name;

    // Get new listings (published in last 7/30 days)
    const { rows: newListings } = await this.db.query(
      `SELECT 
        COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '7 days') as "newListings7d",
        COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '30 days') as "newListings30d"
       FROM properties
       WHERE zone_id = $1 AND status = 'published'`,
      [zoneId],
    );

    // Get sold/rented counts (status changed to sold/rented in last 7/30 days)
    // Note: We track when status changes, so we need to check updated_at for status changes
    // For now, we'll count properties with status 'sold' or 'rented' that were updated recently
    const { rows: soldCounts } = await this.db.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'sold' AND updated_at >= NOW() - INTERVAL '7 days') as "sold7d",
        COUNT(*) FILTER (WHERE status = 'sold' AND updated_at >= NOW() - INTERVAL '30 days') as "sold30d",
        COUNT(*) FILTER (WHERE status = 'rented' AND updated_at >= NOW() - INTERVAL '7 days') as "rented7d",
        COUNT(*) FILTER (WHERE status = 'rented' AND updated_at >= NOW() - INTERVAL '30 days') as "rented30d"
       FROM properties
       WHERE zone_id = $1`,
      [zoneId],
    );

    // Get active listings count
    const { rows: activeListings } = await this.db.query(
      `SELECT COUNT(*) as count
       FROM properties
       WHERE zone_id = $1 AND status = 'published'`,
      [zoneId],
    );

    const activeListingsCount = parseInt(activeListings[0].count, 10);

    // Calculate inventory change
    // Get baseline: active listings count 30 days ago
    const { rows: baselineRows } = await this.db.query(
      `SELECT COUNT(*) as count
       FROM properties
       WHERE zone_id = $1 
       AND status = 'published'
       AND published_at < NOW() - INTERVAL '30 days'`,
      [zoneId],
    );

    const baselineCount = parseInt(baselineRows[0]?.count || '0', 10);
    const percentageChange = baselineCount > 0 
      ? ((activeListingsCount - baselineCount) / baselineCount) * 100 
      : 0;

    const isScarcity = activeListingsCount < this.SCARCITY_THRESHOLD;
    const isIncrease = percentageChange > (this.INCREASE_THRESHOLD * 100);

    return {
      zoneId,
      zoneName,
      newListingsCount7d: parseInt(newListings[0].newListings7d, 10),
      newListingsCount30d: parseInt(newListings[0].newListings30d, 10),
      soldCount7d: parseInt(soldCounts[0].sold7d, 10),
      soldCount30d: parseInt(soldCounts[0].sold30d, 10),
      closedCount7d: parseInt(soldCounts[0].rented7d, 10),
      closedCount30d: parseInt(soldCounts[0].rented30d, 10),
      activeListingsCount,
      inventoryChange: {
        isScarcity,
        isIncrease,
        percentageChange: Math.round(percentageChange * 100) / 100, // Round to 2 decimals
      },
      calculatedAt: new Date(),
    };
  }

  /**
   * Get market signals for multiple zones
   */
  async getMarketSignalsForZones(zoneIds: string[]): Promise<MarketSignals[]> {
    const signals = await Promise.all(
      zoneIds.map((zoneId) => this.getMarketSignals(zoneId)),
    );
    return signals;
  }
}
