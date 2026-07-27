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

  // ── Calendar sync engine ──────────────────────────────────────────
  // The methods below turn the stored OAuth tokens into real Google Calendar
  // actions. They are the foundation the Calendar module / AI Appointment
  // Booking builds on: create/update/delete/list events on the team's
  // connected calendar. Refreshed access tokens are persisted so the
  // connection does not silently expire.

  private async getCalendarClient(teamId: string) {
    const { rows } = await this.db.query(
      `
      SELECT access_token, refresh_token
      FROM google_calendar_integrations
      WHERE team_id = $1
      LIMIT 1
      `,
      [teamId],
    );

    if (!rows.length || !rows[0].access_token) {
      throw new BadRequestException("Google Calendar is not connected");
    }

    const client = this.getOAuthClient();
    client.setCredentials({
      access_token: rows[0].access_token,
      refresh_token: rows[0].refresh_token,
    });

    // Persist refreshed tokens so the connection stays alive across expiries.
    client.on("tokens", (tokens) => {
      this.persistRefreshedTokens(teamId, tokens).catch(() => undefined);
    });

    return google.calendar({ version: "v3", auth: client });
  }

  private async persistRefreshedTokens(teamId: string, tokens: any) {
    if (!tokens?.access_token) {
      return;
    }
    await this.db.query(
      `
      UPDATE google_calendar_integrations
      SET
        access_token = $1,
        token_expiry = $2,
        refresh_token = COALESCE($3, refresh_token),
        updated_at = NOW()
      WHERE team_id = $4
      `,
      [
        tokens.access_token,
        tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        tokens.refresh_token || null,
        teamId,
      ],
    );
  }

  async createEvent(
    teamId: string,
    event: {
      summary: string;
      description?: string;
      location?: string;
      startIso: string;
      endIso: string;
      timezone?: string;
      attendees?: string[];
    },
  ) {
    const calendar = await this.getCalendarClient(teamId);

    const res = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: { dateTime: event.startIso, timeZone: event.timezone },
        end: { dateTime: event.endIso, timeZone: event.timezone },
        attendees: (event.attendees || []).map((email) => ({ email })),
      },
    });

    return { id: res.data.id, htmlLink: res.data.htmlLink };
  }

  async updateEvent(
    teamId: string,
    eventId: string,
    event: {
      summary?: string;
      description?: string;
      location?: string;
      startIso?: string;
      endIso?: string;
      timezone?: string;
    },
  ) {
    const calendar = await this.getCalendarClient(teamId);

    const requestBody: any = {
      summary: event.summary,
      description: event.description,
      location: event.location,
    };
    if (event.startIso) {
      requestBody.start = { dateTime: event.startIso, timeZone: event.timezone };
    }
    if (event.endIso) {
      requestBody.end = { dateTime: event.endIso, timeZone: event.timezone };
    }

    const res = await calendar.events.patch({
      calendarId: "primary",
      eventId,
      requestBody,
    });

    return { id: res.data.id, htmlLink: res.data.htmlLink };
  }

  async deleteEvent(teamId: string, eventId: string) {
    const calendar = await this.getCalendarClient(teamId);
    await calendar.events.delete({ calendarId: "primary", eventId });
    return { success: true };
  }

  async listEvents(
    teamId: string,
    range: { timeMin?: string; timeMax?: string } = {},
  ) {
    const calendar = await this.getCalendarClient(teamId);

    const res = await calendar.events.list({
      calendarId: "primary",
      timeMin: range.timeMin,
      timeMax: range.timeMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
    });

    return res.data.items || [];
  }
}