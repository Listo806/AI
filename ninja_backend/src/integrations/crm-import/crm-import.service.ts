import { Injectable } from "@nestjs/common";

import { DatabaseService } from "../../database/database.service";

import * as csvParser from "csv-parser";

import { Readable } from "stream";

@Injectable()
export class CrmImportService {
  constructor(
    private readonly db: DatabaseService,
  ) {}

  async createImport({
    teamId,
    sourceType,
    fileName,
  }) {
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

  async parseCsv(file: Express.Multer.File) {
    return new Promise((resolve, reject) => {
      const results = [];

      const stream = Readable.from(
        file.buffer,
      );

      stream
        .pipe(csvParser())
        .on("data", (data) =>
          results.push(data),
        )
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

  async saveMapping(
    importId: string,
    mapping: any,
    duplicateStrategy: string,
  ) {
    await this.db.query(
      `
      UPDATE crm_imports_integrations
      SET
        mapping = $1,
        duplicate_strategy = $2,
        updated_at = NOW()
      WHERE id = $3
      `,
      [
        JSON.stringify(mapping),
        duplicateStrategy,
        importId,
      ],
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

    await this.db.query(
      `
      UPDATE crm_imports_integrations
      SET status = 'processing'
      WHERE id = $1
      `,
      [importId],
    );

    // TODO:
    // actual CRM import logic

    await this.db.query(
      `
      UPDATE crm_imports_integrations
      SET
        status = 'completed',
        processed_rows = total_rows,
        imported_rows = total_rows
      WHERE id = $1
      `,
      [importId],
    );

    return {
      success: true,
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
}