import { Injectable } from "@nestjs/common";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import { Cron } from "@nestjs/schedule";
import { DatabaseService } from "../../database/database.service";

@Injectable()
export class PropertyFeedService {
  constructor(
    private readonly db: DatabaseService,
  ) {}

  /*
   |--------------------------------------------------------------------------
   | CREATE FEED
   |--------------------------------------------------------------------------
   */

  async createFeed(
    teamId: string,
    body: any,
  ) {
    const validation =
      await this.validateFeed(
        body.feedUrl,
        body.feedType,
      );

    const { rows } = await this.db.query(
      `
      INSERT INTO property_feed_integrations (
        team_id,
        provider_name,
        feed_url,
        feed_type,
        sync_frequency_minutes,
        total_properties,
        sync_enabled
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,true
      )

      RETURNING *
      `,
      [
        teamId,
        body.providerName,
        body.feedUrl,
        body.feedType,
        body.syncFrequencyMinutes || 60,
        validation.totalProperties,
      ],
    );

    return rows[0];
  }

  /*
   |--------------------------------------------------------------------------
   | GET FEEDS
   |--------------------------------------------------------------------------
   */

  async getFeeds(teamId: string) {
    const { rows } =
      await this.db.query(
        `
      SELECT
        id,
        provider_name as "providerName",
        feed_url as "feedUrl",
        feed_type as "feedType",
        sync_frequency_minutes as "syncFrequencyMinutes",
        sync_enabled as "syncEnabled",
        total_properties as "totalProperties",
        last_sync_at as "lastSyncAt",
        last_error as "lastError",
        created_at as "createdAt"
      FROM property_feed_integrations
      WHERE team_id = $1
      ORDER BY created_at DESC
      `,
        [teamId],
      );

    return rows;
  }

  /*
   |--------------------------------------------------------------------------
   | VALIDATE FEED
   |--------------------------------------------------------------------------
   */

  async validateFeed(
    feedUrl: string,
    feedType: string,
  ) {
    try {
      const response =
        await axios.get(feedUrl);

      let properties = [];

      /*
       * XML
       */

      if (feedType === "xml") {
        const parser =
          new XMLParser({
            ignoreAttributes: false,
          });

        const parsed =
          parser.parse(response.data);

        properties =
          parsed?.properties
            ?.property || [];
      }

      /*
       * JSON
       */

      if (feedType === "json") {
        properties =
          response.data
            ?.properties || [];
      }

      return {
        valid: true,
        totalProperties:
          properties.length,
      };
    } catch (err) {
      console.error(err);

      return {
        valid: false,
        totalProperties: 0,
      };
    }
  }

  /*
   |--------------------------------------------------------------------------
   | MANUAL SYNC
   |--------------------------------------------------------------------------
   */

  async syncFeed(
    teamId: string,
    feedId: string,
  ) {
    const { rows } =
      await this.db.query(
        `
      SELECT *
      FROM property_feed_integrations
      WHERE id = $1
      AND team_id = $2
      `,
        [feedId, teamId],
      );

    const feed = rows[0];

    if (!feed) {
      throw new Error(
        "Feed not found",
      );
    }

    return this.processFeed(feed);
  }

  /*
   |--------------------------------------------------------------------------
   | PROCESS FEED
   |--------------------------------------------------------------------------
   */

  async processFeed(feed: any) {
    try {
      const response =
        await axios.get(
          feed.feed_url,
        );

      let properties = [];

      /*
       * XML PARSER
       */

      if (
        feed.feed_type === "xml"
      ) {
        const parser =
          new XMLParser({
            ignoreAttributes: false,
          });

        const parsed =
          parser.parse(response.data);

        properties =
          parsed?.properties
            ?.property || [];
      }

      /*
       * JSON PARSER
       */

      if (
        feed.feed_type === "json"
      ) {
        properties =
          response.data
            ?.properties || [];
      }

      // Import the parsed listings into the CRM properties table.
      const result = await this.importProperties(feed, properties);

      await this.db.query(
        `
        UPDATE property_feed_integrations
        SET
          total_properties = $1,
          last_sync_at = NOW(),
          last_error = NULL
        WHERE id = $2
        `,
        [
          properties.length,
          feed.id,
        ],
      );

      return {
        success: true,
        synced: properties.length,
        imported: result.imported,
        updated: result.updated,
        skipped: result.skipped,
      };
    } catch (err) {
      console.error(err);

      await this.db.query(
        `
        UPDATE property_feed_integrations
        SET
          last_error = $1
        WHERE id = $2
        `,
        [
          err.message,
          feed.id,
        ],
      );

      return {
        success: false,
      };
    }
  }

  /*
   |--------------------------------------------------------------------------
   | AUTO CRON SYNC
   |--------------------------------------------------------------------------
   */

  @Cron("*/5 * * * *")
  async autoSyncFeeds() {
    try {
      const { rows } =
        await this.db.query(
          `
        SELECT *
        FROM property_feed_integrations
        WHERE sync_enabled = true
        `,
        );

      for (const feed of rows) {
        try {
          const shouldSync =
            await this.shouldSync(
              feed,
            );

          if (!shouldSync) {
            continue;
          }

          await this.processFeed(
            feed,
          );
        } catch (err) {
          console.error(err);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  /*
   |--------------------------------------------------------------------------
   | SHOULD SYNC
   |--------------------------------------------------------------------------
   */

  async shouldSync(feed: any) {
    if (!feed.last_sync_at) {
      return true;
    }

    const lastSync =
      new Date(
        feed.last_sync_at,
      ).getTime();

    const now = Date.now();

    const diffMinutes =
      (now - lastSync) /
      1000 /
      60;

    return (
      diffMinutes >=
      feed.sync_frequency_minutes
    );
  }

  /*
   |--------------------------------------------------------------------------
   | TOGGLE SYNC
   |--------------------------------------------------------------------------
   */

  async toggleSync(
    teamId: string,
    feedId: string,
    enabled: boolean,
  ) {
    await this.db.query(
      `
      UPDATE property_feed_integrations
      SET
        sync_enabled = $1,
        updated_at = NOW()
      WHERE id = $2
      AND team_id = $3
      `,
      [
        enabled,
        feedId,
        teamId,
      ],
    );

    return {
      success: true,
    };
  }

  /*
   |--------------------------------------------------------------------------
   | DELETE FEED
   |--------------------------------------------------------------------------
   */

  async deleteFeed(
    teamId: string,
    feedId: string,
  ) {
    await this.db.query(
      `
      DELETE FROM property_feed_integrations
      WHERE id = $1
      AND team_id = $2
      `,
      [feedId, teamId],
    );

    return {
      success: true,
    };
  }

  /*
   |--------------------------------------------------------------------------
   | IMPORT PROPERTIES  (feed listings -> CRM properties table)
   |--------------------------------------------------------------------------
   */

  // Team-scoped, de-duplicated import. Repeated syncs update existing listings
  // (matched by the feed's external id via property_feed_items) instead of
  // creating duplicates. Listings without a stable id or a title are skipped
  // rather than guessed into bad rows, and per-listing errors are isolated so
  // one bad row never aborts the whole sync. New rows are created as 'draft' so
  // unreviewed external data is not published automatically.
  private async importProperties(feed: any, properties: any[]) {
    let imported = 0;
    let updated = 0;
    let skipped = 0;

    // properties.created_by is NOT NULL; own imported rows with a team member.
    const { rows: userRows } = await this.db.query(
      `
      SELECT id
      FROM users
      WHERE team_id = $1
      ORDER BY created_at ASC
      LIMIT 1
      `,
      [feed.team_id],
    );
    const createdBy = userRows[0]?.id;
    if (!createdBy) {
      return { imported, updated, skipped: properties.length };
    }

    for (const raw of properties) {
      try {
        const externalRef = this.pickExternalRef(raw);
        if (!externalRef) {
          skipped++;
          continue;
        }

        const mapped = this.mapProperty(raw);
        if (!mapped.title) {
          skipped++;
          continue;
        }

        const { rows: existing } = await this.db.query(
          `
          SELECT property_id
          FROM property_feed_items
          WHERE feed_id = $1 AND external_ref = $2
          LIMIT 1
          `,
          [feed.id, externalRef],
        );

        if (existing.length > 0) {
          await this.db.query(
            `
            UPDATE properties
            SET
              title = $1, description = $2, address = $3, city = $4, state = $5,
              zip_code = $6, price = $7, type = $8, bedrooms = $9,
              bathrooms = $10, square_feet = $11, year_built = $12,
              updated_at = NOW()
            WHERE id = $13
            `,
            [
              mapped.title, mapped.description, mapped.address, mapped.city,
              mapped.state, mapped.zip, mapped.price, mapped.type,
              mapped.bedrooms, mapped.bathrooms, mapped.squareFeet,
              mapped.yearBuilt, existing[0].property_id,
            ],
          );
          updated++;
        } else {
          const { rows: inserted } = await this.db.query(
            `
            INSERT INTO properties (
              team_id, created_by, title, description, address, city, state,
              zip_code, price, type, status, bedrooms, bathrooms, square_feet,
              year_built
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'draft',$11,$12,$13,$14)
            RETURNING id
            `,
            [
              feed.team_id, createdBy, mapped.title, mapped.description,
              mapped.address, mapped.city, mapped.state, mapped.zip,
              mapped.price, mapped.type, mapped.bedrooms, mapped.bathrooms,
              mapped.squareFeet, mapped.yearBuilt,
            ],
          );
          await this.db.query(
            `
            INSERT INTO property_feed_items (
              feed_id, team_id, external_ref, property_id
            )
            VALUES ($1,$2,$3,$4)
            `,
            [feed.id, feed.team_id, externalRef, inserted[0].id],
          );
          imported++;
        }
      } catch (err) {
        console.error("PROPERTY IMPORT ERROR", err?.message);
        skipped++;
      }
    }

    return { imported, updated, skipped };
  }

  // Pick a stable external id for dedup from common feed field names.
  private pickExternalRef(raw: any): string | null {
    const candidates = [
      raw?.id, raw?.ID, raw?.["@_id"], raw?.reference, raw?.ref,
      raw?.listingId, raw?.listing_id, raw?.mlsId, raw?.mls_id,
      raw?.mlsNumber, raw?.externalId, raw?.external_id,
    ];
    for (const c of candidates) {
      if (c !== undefined && c !== null && String(c).trim() !== "") {
        return String(c).trim();
      }
    }
    return null;
  }

  // Map a feed listing onto the CRM properties columns, loosely matching common
  // feed field names. Returns nulls for anything it cannot find.
  private mapProperty(raw: any) {
    const str = (v: any) =>
      v === undefined || v === null ? null : String(v).trim() || null;
    const num = (v: any) => {
      if (v === undefined || v === null || v === "") return null;
      const n = Number(String(v).replace(/[^0-9.]/g, ""));
      return Number.isFinite(n) ? n : null;
    };
    const int = (v: any) => {
      const n = num(v);
      return n === null ? null : Math.round(n);
    };

    const typeRaw = String(
      raw?.type || raw?.transactionType || raw?.category || "",
    ).toLowerCase();
    const type =
      typeRaw.includes("rent") || typeRaw.includes("lease") ? "rent" : "sale";

    return {
      title:
        str(raw?.title) || str(raw?.name) || str(raw?.headline) ||
        str(raw?.address) || str(raw?.streetAddress),
      description:
        str(raw?.description) || str(raw?.remarks) || str(raw?.summary),
      address:
        str(raw?.address) || str(raw?.streetAddress) || str(raw?.street),
      city: str(raw?.city) || str(raw?.town),
      state: str(raw?.state) || str(raw?.province) || str(raw?.region),
      zip:
        str(raw?.zip) || str(raw?.zip_code) || str(raw?.zipCode) ||
        str(raw?.postalCode),
      price: num(raw?.price) ?? num(raw?.listPrice) ?? num(raw?.amount),
      type,
      bedrooms: int(raw?.bedrooms) ?? int(raw?.beds) ?? int(raw?.bedroomCount),
      bathrooms:
        num(raw?.bathrooms) ?? num(raw?.baths) ?? num(raw?.bathroomCount),
      squareFeet:
        int(raw?.squareFeet) ?? int(raw?.square_feet) ?? int(raw?.sqft) ??
        int(raw?.area),
      yearBuilt: int(raw?.yearBuilt) ?? int(raw?.year_built) ?? int(raw?.year),
    };
  }
}