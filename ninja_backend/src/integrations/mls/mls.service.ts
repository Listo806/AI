import { BadRequestException, Injectable } from "@nestjs/common";

import axios from "axios";
import { DatabaseService } from "../../database/database.service";

@Injectable()
export class MlsService {
  constructor(private readonly db: DatabaseService) {}

  async getConfig(teamId: string) {
    const { rows } = await this.db.query(
      `
        SELECT *
        FROM mls_integrations
        WHERE team_id = $1
        LIMIT 1
        `,
      [teamId],
    );

    return rows[0] || null;
  }

  async save(teamId: string, body: any) {
    if (!body.endpointUrl) {
      throw new BadRequestException("Endpoint URL required");
    }

    try {
      new URL(body.endpointUrl);
    } catch {
      throw new BadRequestException("Invalid endpoint URL");
    }

    await this.db.query(
      `
      INSERT INTO mls_integrations (
        team_id,
        provider_name,
        country,
        integration_type,
        endpoint_url,
        username,
        password,
        api_key,
        sync_enabled,
        sync_frequency_minutes,
        compatibility_mode
      )
      VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,$10,$11
      )
      ON CONFLICT (team_id)
      DO UPDATE SET
        provider_name = EXCLUDED.provider_name,
        country = EXCLUDED.country,
        integration_type = EXCLUDED.integration_type,
        endpoint_url = EXCLUDED.endpoint_url,
        username = EXCLUDED.username,
        password = EXCLUDED.password,
        api_key = EXCLUDED.api_key,
        sync_enabled = EXCLUDED.sync_enabled,
        sync_frequency_minutes =
          EXCLUDED.sync_frequency_minutes,
        compatibility_mode =
          EXCLUDED.compatibility_mode
      `,
      [
        teamId,
        body.providerName,
        body.country,
        body.integrationType,
        body.endpointUrl,
        body.username,
        body.password,
        body.apiKey,
        body.syncEnabled,
        body.syncFrequencyMinutes,
        body.compatibilityMode,
      ],
    );

    return {
      success: true,
    };
  }

  // Pull listings from the customer's OWN MLS/IDX feed via the RESO Web API
  // (OData) using their stored endpoint + credentials, and upsert them into the
  // CRM properties table, deduped via mls_listing_items. Team-scoped, listings
  // land as 'draft'. Follows the RESO Data Dictionary; validate field coverage
  // against a live feed. Legacy RETS is not handled here (RESO Web API only).
  // Fails gracefully by recording last_error instead of throwing.
  async sync(teamId: string) {
    const config = await this.getConfig(teamId);

    if (!config) {
      throw new BadRequestException("MLS is not connected");
    }
    if (!config.endpoint_url) {
      throw new BadRequestException("MLS endpoint URL is required");
    }

    const mode = String(
      config.integration_type || config.compatibility_mode || "reso",
    ).toLowerCase();
    if (mode.includes("rets")) {
      await this.recordError(
        teamId,
        "Legacy RETS is not supported yet. Please use a RESO Web API endpoint.",
      );
      return {
        success: false,
        error: "Legacy RETS not supported; use a RESO Web API endpoint.",
      };
    }

    // properties.created_by is NOT NULL; own imported listings with a team member.
    const { rows: userRows } = await this.db.query(
      `SELECT id FROM users WHERE team_id = $1 ORDER BY created_at ASC LIMIT 1`,
      [teamId],
    );
    const createdBy = userRows[0]?.id;
    if (!createdBy) {
      await this.recordError(
        teamId,
        "No team member found to own imported listings.",
      );
      return { success: false, error: "No team member to own listings." };
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    try {
      const headers: any = { Accept: "application/json" };
      let auth: any = undefined;
      if (config.api_key) {
        headers.Authorization = `Bearer ${config.api_key}`;
      } else if (config.username) {
        auth = { username: config.username, password: config.password || "" };
      }

      const base = String(config.endpoint_url).replace(/\/+$/, "");
      const url = /\/Property$/i.test(base) ? base : `${base}/Property`;

      const response = await axios.get(url, {
        headers,
        auth,
        params: { $top: 100 },
      });

      const listings = response?.data?.value || [];

      for (const raw of listings) {
        try {
          const externalRef = String(
            raw.ListingKey || raw.ListingId || raw.ListingKeyNumeric || "",
          ).trim();
          if (!externalRef) {
            skipped++;
            continue;
          }

          const mapped = this.mapResoProperty(raw);
          if (!mapped.title) {
            skipped++;
            continue;
          }

          const { rows: existing } = await this.db.query(
            `SELECT property_id FROM mls_listing_items WHERE team_id = $1 AND external_ref = $2 LIMIT 1`,
            [teamId, externalRef],
          );

          if (existing.length > 0) {
            await this.db.query(
              `
              UPDATE properties
              SET title=$1, description=$2, address=$3, city=$4, state=$5,
                  zip_code=$6, price=$7, type=$8, bedrooms=$9, bathrooms=$10,
                  square_feet=$11, year_built=$12
              WHERE id=$13
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
            const { rows: ins } = await this.db.query(
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
                teamId, createdBy, mapped.title, mapped.description,
                mapped.address, mapped.city, mapped.state, mapped.zip,
                mapped.price, mapped.type, mapped.bedrooms, mapped.bathrooms,
                mapped.squareFeet, mapped.yearBuilt,
              ],
            );
            await this.db.query(
              `INSERT INTO mls_listing_items (team_id, external_ref, property_id) VALUES ($1,$2,$3)`,
              [teamId, externalRef, ins[0].id],
            );
            imported++;
          }
        } catch {
          skipped++;
        }
      }

      await this.db.query(
        `UPDATE mls_integrations SET last_synced_at = NOW(), last_error = NULL, updated_at = NOW() WHERE team_id = $1`,
        [teamId],
      );

      return { success: true, imported, updated, skipped };
    } catch (err: any) {
      const message = String(
        err?.response?.data?.message || err?.message || err,
      ).slice(0, 500);
      await this.recordError(teamId, message);
      return { success: false, error: message };
    }
  }

  private async recordError(teamId: string, message: string) {
    await this.db.query(
      `UPDATE mls_integrations SET last_error = $1, updated_at = NOW() WHERE team_id = $2`,
      [String(message).slice(0, 500), teamId],
    );
  }

  // Map a RESO Data Dictionary Property record onto the CRM properties columns.
  private mapResoProperty(raw: any) {
    const str = (v: any) =>
      v === undefined || v === null ? null : String(v).trim() || null;
    const num = (v: any) => {
      if (v === undefined || v === null || v === "") return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const int = (v: any) => {
      const n = num(v);
      return n === null ? null : Math.round(n);
    };

    const address =
      str(raw.UnparsedAddress) ||
      [str(raw.StreetNumber), str(raw.StreetName), str(raw.StreetSuffix)]
        .filter(Boolean)
        .join(" ") ||
      null;

    const typeRaw = String(
      raw.PropertyType || raw.PropertySubType || "",
    ).toLowerCase();
    const type =
      typeRaw.includes("lease") || typeRaw.includes("rent") ? "rent" : "sale";

    return {
      title: address || str(raw.ListingId) || str(raw.ListingKey),
      description: str(raw.PublicRemarks) || str(raw.Remarks),
      address,
      city: str(raw.City),
      state: str(raw.StateOrProvince),
      zip: str(raw.PostalCode),
      price: num(raw.ListPrice) ?? num(raw.ClosePrice),
      type,
      bedrooms: int(raw.BedroomsTotal) ?? int(raw.BedsTotal),
      bathrooms:
        num(raw.BathroomsTotalInteger) ??
        num(raw.BathroomsTotalDecimal) ??
        num(raw.BathroomsFull),
      squareFeet: int(raw.LivingArea) ?? int(raw.AboveGradeFinishedArea),
      yearBuilt: int(raw.YearBuilt),
    };
  }

  async getAll(teamId: string) {
    const { rows } = await this.db.query(
      `
      SELECT *
      FROM mls_integrations
      WHERE team_id = $1
      ORDER BY created_at DESC
      `,
      [teamId],
    );

    return rows;
  }
}
