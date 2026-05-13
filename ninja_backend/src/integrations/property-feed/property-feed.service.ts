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

      /*
       |--------------------------------------------------------------------------
       | TODO:
       | SAVE TO PROPERTIES TABLE
       |--------------------------------------------------------------------------
       */

      for (const property of properties) {
        console.log(
          "SYNC PROPERTY",
          property,
        );
      }

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
}