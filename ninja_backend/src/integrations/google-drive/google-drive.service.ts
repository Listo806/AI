import { Injectable } from "@nestjs/common";

import { google } from "googleapis";
import * as fs from "fs";
import { DatabaseService } from "../../database/database.service";

@Injectable()
export class GoogleDriveService {
  constructor(private readonly db: DatabaseService) {}

  private getOAuthClient() {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_DRIVE_REDIRECT_URI,
    );
  }

  async getAuthUrl(teamId: string) {
    const oauth2Client = this.getOAuthClient();

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
      state: teamId,
    });

    return {
      url,
    };
  }

  async handleCallback(code: string, teamId: string) {
    const oauth2Client = this.getOAuthClient();

    const { tokens } = await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    const userInfo = await oauth2.userinfo.get();

    const drive = google.drive({
      version: "v3",
      auth: oauth2Client,
    });

    await this.db.query(
      `
  INSERT INTO google_drive_integrations (
    team_id,
    google_email,
    access_token,
    refresh_token,
    token_expiry,
    is_active,
    sync_enabled,
    updated_at
  )
  VALUES (
    $1,$2,$3,$4,$5,true,true,NOW()
  )
  ON CONFLICT (team_id)
  DO UPDATE SET
    google_email = EXCLUDED.google_email,
    access_token = EXCLUDED.access_token,
    refresh_token = EXCLUDED.refresh_token,
    token_expiry = EXCLUDED.token_expiry,
    is_active = true,
    updated_at = NOW()
  `,
      [
        teamId,
        userInfo.data.email,
        tokens.access_token,
        tokens.refresh_token,
        tokens.expiry_date ? new Date(tokens.expiry_date) : null,
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
      FROM google_drive_integrations
      WHERE team_id = $1
      LIMIT 1
      `,
      [teamId],
    );

    if (rows.length === 0) {
      return {
        isConfigured: false,
      };
    }

    return {
      isConfigured: true,
      integration: {
        google_email: rows[0].google_email,
        root_folder_id: rows[0].root_folder_id,
        is_active: rows[0].is_active,
      },
    };
  }

  async disconnect(teamId: string) {
    await this.db.query(
      `
      DELETE FROM google_drive_integrations
      WHERE team_id = $1
      `,
      [teamId],
    );

    return {
      success: true,
    };
  }

  private async createFolder(drive: any, name: string, parentId?: string) {
    const folder = await drive.files.create({
      requestBody: {
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: parentId ? [parentId] : undefined,
      },
      fields: "id,name",
    });

    return folder.data;
  }

  async getDriveClient(teamId: string) {
    const { rows } = await this.db.query(
      `
    SELECT *
    FROM google_drive_integrations
    WHERE team_id = $1
    LIMIT 1
    `,
      [teamId],
    );

    if (rows.length === 0) {
      throw new Error("Google Drive not connected");
    }

    const integration = rows[0];

    const oauth2Client = this.getOAuthClient();

    oauth2Client.setCredentials({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
    });

    const drive = google.drive({
      version: "v3",
      auth: oauth2Client,
    });

    return {
      drive,
      integration,
    };
  }

  async createPropertyFolders(teamId: string, propertyName: string) {
    const { drive, integration } = await this.getDriveClient(teamId);

    const propertyFolder = await this.createFolder(
      drive,
      propertyName,
      integration.properties_folder_id,
    );

    const imagesFolder = await this.createFolder(
      drive,
      "Images",
      propertyFolder.id,
    );

    const contractsFolder = await this.createFolder(
      drive,
      "Contracts",
      propertyFolder.id,
    );

    const documentsFolder = await this.createFolder(
      drive,
      "Documents",
      propertyFolder.id,
    );

    return {
      propertyFolderId: propertyFolder.id,
      imagesFolderId: imagesFolder.id,
      contractsFolderId: contractsFolder.id,
      documentsFolderId: documentsFolder.id,
    };
  }

  async uploadFile(
    teamId: string,
    folderId: string,
    file: Express.Multer.File,
  ) {
    const { drive } = await this.getDriveClient(teamId);

    const uploaded = await drive.files.create({
      requestBody: {
        name: file.originalname,
        parents: [folderId],
      },

      media: {
        mimeType: file.mimetype,
        body: fs.createReadStream(file.path),
      },

      fields: "id,name,webViewLink,webContentLink",
    });

    return {
      id: uploaded.data.id,
      name: uploaded.data.name,
      viewUrl: uploaded.data.webViewLink,
      downloadUrl: uploaded.data.webContentLink,
    };
  }

  async listFolders(teamId: string) {
    const integration = await this.getIntegration(teamId);

    if (!integration) {
      throw new Error("Google Drive not connected");
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      process.env.GOOGLE_DRIVE_REDIRECT_URI,
    );

    oauth2Client.setCredentials({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
    });

    const drive = google.drive({
      version: "v3",
      auth: oauth2Client,
    });

    const res = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: "files(id,name)",
      pageSize: 100,
    });

    return res.data.files || [];
  }

  async saveSelectedFolder(
    teamId: string,
    folderId: string,
    folderName: string,
  ) {
    await this.db.query(
      `
    UPDATE google_drive_integrations
    SET
      root_folder_id = $1,
      root_folder_name = $2,
      updated_at = NOW()
    WHERE team_id = $3
  `,
      [folderId, folderName, teamId],
    );

    return {
      success: true,
    };
  }

  async toggleSync(teamId: string, enabled: boolean) {
    await this.db.query(
      `
    UPDATE google_drive_integrations
    SET
      sync_enabled = $1,
      updated_at = NOW()
    WHERE team_id = $2
  `,
      [enabled, teamId],
    );

    return {
      success: true,
    };
  }

  async getIntegration(teamId: string) {
    const { rows } = await this.db.query(
      `
    SELECT *
    FROM google_drive_integrations
    WHERE team_id = $1
    LIMIT 1
    `,
      [teamId],
    );

    return rows[0] || null;
  }
}
