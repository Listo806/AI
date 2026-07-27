import {
  Controller,
  Get,
  Query,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";

import { DatabaseService } from "../../database/database.service";

/**
 * Read-only external API, authenticated by an API key (x-api-key header) via
 * ApiAccessMiddleware, which sets req.apiTeamId. This is the surface the API
 * Access integration is meant to expose. Existing dashboard routes are NOT
 * affected — they keep using JwtAuthGuard.
 */
@Controller("external")
export class ExternalApiController {
  constructor(private readonly db: DatabaseService) {}

  private getTeamId(req: Request): string {
    const teamId = (req as any).apiTeamId;
    if (!teamId) {
      throw new UnauthorizedException("Invalid API key");
    }
    return teamId;
  }

  private clampLimit(limit?: string): number {
    const n = parseInt(limit || "100", 10);
    if (!Number.isFinite(n)) return 100;
    return Math.min(Math.max(n, 1), 500);
  }

  @Get("leads")
  async leads(@Req() req: Request, @Query("limit") limit?: string) {
    const teamId = this.getTeamId(req);
    const { rows } = await this.db.query(
      `
      SELECT id, name, email, phone, status, source, created_at
      FROM leads
      WHERE team_id = $1
      ORDER BY created_at DESC
      LIMIT $2
      `,
      [teamId, this.clampLimit(limit)],
    );
    return { data: rows };
  }

  @Get("properties")
  async properties(@Req() req: Request, @Query("limit") limit?: string) {
    const teamId = this.getTeamId(req);
    const { rows } = await this.db.query(
      `
      SELECT id, title, description, address, city, state, zip_code,
             price, type, status, bedrooms, bathrooms, square_feet, created_at
      FROM properties
      WHERE team_id = $1
      ORDER BY created_at DESC
      LIMIT $2
      `,
      [teamId, this.clampLimit(limit)],
    );
    return { data: rows };
  }
}
