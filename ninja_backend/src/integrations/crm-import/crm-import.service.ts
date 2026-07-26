import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import csvParser from "csv-parser";
import { Readable } from "stream";

@Injectable()
export class CrmImportService {
  constructor(private readonly db: DatabaseService) {}

  async createImport({ teamId, sourceType, fileName }) {
    const { rows } = await this.db.query(
      `
      INSERT INTO crm_imports_integrations (
        team_id,
        source_type,
        file_name
      )
      VALUES ($1,$2,$3)

      RETURNING *
      `,
      [teamId, sourceType, fileName],
    );

    return rows[0];
  }

  async parseCsv(file: Express.Multer.File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results = [];

      const stream = Readable.from(file.buffer);

      stream
        .pipe(csvParser())
        .on("data", (data) => results.push(data))
        .on("end", () => resolve(results))
        .on("error", reject);
    });
  }

  async analyzeImport(importId: string) {
    const { rows } = await this.db.query(
      `
      SELECT *
      FROM crm_imports_integrations
      WHERE id = $1
      `,
      [importId],
    );

    return rows[0];
  }

  async saveMapping(importId: string, mapping: any, duplicateStrategy: string) {
    await this.db.query(
      `
      UPDATE crm_imports_integrations
      SET
        mapping = $1,
        duplicate_strategy = $2,
        updated_at = NOW()
      WHERE id = $3
      `,
      [JSON.stringify(mapping), duplicateStrategy, importId],
    );

    return {
      success: true,
    };
  }

  async getProgress(importId: string) {
    const { rows } = await this.db.query(
      `
      SELECT
        id,
        status,
        total_rows as "totalRows",
        processed_rows as "processedRows",
        imported_rows as "importedRows",
        failed_rows as "failedRows"
      FROM crm_imports_integrations
      WHERE id = $1
      `,
      [importId],
    );

    return rows[0];
  }

  async startImport(importId: string) {
    const { rows } = await this.db.query(
      `
      SELECT *
      FROM crm_imports_integrations
      WHERE id = $1
      `,
      [importId],
    );

    const importJob = rows[0];

    if (!importJob) {
      return { success: false, error: "Import not found" };
    }

    await this.db.query(
      `
      UPDATE crm_imports_integrations
      SET status = 'processing', updated_at = NOW()
      WHERE id = $1
      `,
      [importId],
    );

    const teamId = importJob.team_id;

    const mapping =
      typeof importJob.mapping === "string"
        ? JSON.parse(importJob.mapping)
        : importJob.mapping || {};

    const strategy = importJob.duplicate_strategy || "skip";

    const sourceRows =
      typeof importJob.raw_rows === "string"
        ? JSON.parse(importJob.raw_rows)
        : importJob.raw_rows || [];

    let imported = 0;
    let failed = 0;
    let processed = 0;

    for (const row of sourceRows) {
      processed++;

      // Map CSV columns to CRM fields via the saved mapping.
      const mapped: any = {};
      Object.keys(mapping).forEach((csvColumn) => {
        const field = mapping[csvColumn];
        if (field) {
          mapped[field] = row[csvColumn];
        }
      });

      // A contact needs at least an email or a phone.
      if (!mapped.email && !mapped.phone) {
        failed++;
        continue;
      }

      const { rows: existing } = await this.db.query(
        `
        SELECT id
        FROM contacts
        WHERE team_id = $1
        AND (email = $2 OR phone = $3)
        LIMIT 1
        `,
        [teamId, mapped.email || null, mapped.phone || null],
      );

      if (existing.length > 0) {
        const contactId = existing[0].id;

        if (strategy === "overwrite") {
          await this.db.query(
            `
            UPDATE contacts
            SET full_name = $1, email = $2, phone = $3, company = $4
            WHERE id = $5
            `,
            [
              mapped.full_name || null,
              mapped.email || null,
              mapped.phone || null,
              mapped.company || null,
              contactId,
            ],
          );
          imported++;
        } else if (strategy === "merge") {
          // Fill only the fields that are currently empty.
          await this.db.query(
            `
            UPDATE contacts
            SET
              full_name = COALESCE(full_name, $1),
              email = COALESCE(email, $2),
              phone = COALESCE(phone, $3),
              company = COALESCE(company, $4)
            WHERE id = $5
            `,
            [
              mapped.full_name || null,
              mapped.email || null,
              mapped.phone || null,
              mapped.company || null,
              contactId,
            ],
          );
          imported++;
        }
        // strategy === "skip" (default): leave the existing contact untouched.
        continue;
      }

      await this.db.query(
        `
        INSERT INTO contacts (
          team_id,
          full_name,
          email,
          phone,
          company,
          created_at
        )
        VALUES ($1,$2,$3,$4,$5,NOW())
        `,
        [
          teamId,
          mapped.full_name || null,
          mapped.email || null,
          mapped.phone || null,
          mapped.company || null,
        ],
      );

      imported++;
    }

    await this.db.query(
      `
      UPDATE crm_imports_integrations
      SET
        status = 'completed',
        processed_rows = $1,
        imported_rows = $2,
        failed_rows = $3,
        updated_at = NOW()
      WHERE id = $4
      `,
      [processed, imported, failed, importId],
    );

    return {
      success: true,
      imported,
      failed,
      processed,
    };
  }

  async getLogs(importId: string) {
    const { rows } = await this.db.query(
      `
      SELECT *
      FROM crm_import_logs
      WHERE import_id = $1
      ORDER BY created_at DESC
      `,
      [importId],
    );

    return rows;
  }

  async saveParsedRows(importId: string, rows: any[]) {
    await this.db.query(
      `
    UPDATE crm_imports_integrations
    SET
      total_rows = $1,
      raw_rows = $2,
      updated_at = NOW()
    WHERE id = $3
    `,
      [rows.length, JSON.stringify(rows), importId],
    );
  }
}
