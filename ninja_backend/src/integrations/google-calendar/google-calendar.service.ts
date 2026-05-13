import {
  Injectable,
  BadRequestException,
} from "@nestjs/common";

import { google } from "googleapis";
import { DatabaseService } from "../../database/database.service";

@Injectable()
export class GoogleCalendarService {
  constructor(
    private readonly db: DatabaseService,
  ) {}

  private getOAuthClient() {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
  }

  async getAuthUrl(teamId: string) {
    const client = this.getOAuthClient();

    const url = client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/calendar",
      ],
      state: teamId,
    });

    return {
      url,
    };
  }

  async handleCallback(
    code: string,
    teamId: string,
  ) {
    const client = this.getOAuthClient();

    const { tokens } = await client.getToken(code);

    client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: client,
      version: "v2",
    });

    const userInfo = await oauth2.userinfo.get();

    await this.db.query(
      `
      INSERT INTO google_calendar_integrations (
        team_id,
        google_email,
        access_token,
        refresh_token,
        scope,
        token_expiry,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,NOW())
      ON CONFLICT (team_id)
      DO UPDATE SET
        google_email = EXCLUDED.google_email,
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        scope = EXCLUDED.scope,
        token_expiry = EXCLUDED.token_expiry,
        updated_at = NOW()
      `,
      [
        teamId,
        userInfo.data.email,
        tokens.access_token,
        tokens.refresh_token,
        tokens.scope,
        tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : null,
      ],
    );

    return {
      success: true,
    };
  }

  async getStatus(teamId: string) {
    const { rows } = await this.db.query(
      `
      SELECT *
      FROM google_calendar_integrations
      WHERE team_id = $1
      LIMIT 1
      `,
      [teamId],
    );

    if (!rows.length) {
      return {
        isConfigured: false,
      };
    }

    return {
      isConfigured: true,
      email: rows[0].google_email,
      connectedAt: rows[0].created_at,
    };
  }
}