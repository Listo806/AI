import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import csvParser from "csv-parser";
import { Readable } from "stream";

@Injectable()
export class CsvLeadsService {
  constructor(
    private readonly db: DatabaseService,
  ) {}

  async createImport(
    teamId: string,
    fileName: string,
  ) {
    const { rows } = await this.db.query(
      `
      INSERT INTO csv_lead_imports_integrations (
        team_id,
        file_name
      )
      VALUES ($1,$2)

      RETURNING *
      `,
      [teamId, fileName],
    );

    return rows[0];
  }

  async parseCsv(
    file: Express.Multer.File,
  ): Promise<any[]> {
    return new Promise<any[]>(
      (resolve, reject) => {
        const results: any[] = [];

        const stream = Readable.from(
          file.buffer,
        );

        stream
          .pipe(csvParser())
          .on("data", (data) =>
            results.push(data),
          )
          .on("end", () =>
            resolve(results),
          )
          .on("error", reject);
      },
    );
  }

  validateRow(row: any) {
    const errors = [];

    if (!row.email && !row.phone) {
      errors.push(
        "Email or phone required",
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async saveMapping(
    importId: string,
    mapping: any,
  ) {
    await this.db.query(
      `
      UPDATE csv_lead_imports_integrations
      SET
        mapping = $1,
        updated_at = NOW()
      WHERE id = $2
      `,
      [
        JSON.stringify(mapping),
        importId,
      ],
    );

    return {
      success: true,
    };
  }

  async startImport(
    importId: string,
    rows: any[],
    mapping: any,
    teamId: string,
  ) {
    let imported = 0;
    let duplicates = 0;
    let invalid = 0;

    for (const row of rows) {
      const mapped = {};

      Object.keys(mapping).forEach(
        (csvColumn) => {
          mapped[mapping[csvColumn]] =
            row[csvColumn];
        },
      );

      const validation =
        this.validateRow(mapped);

      if (!validation.valid) {
        invalid++;
        continue;
      }

      const { rows: existing } =
        await this.db.query(
          `
          SELECT id
          FROM contacts
          WHERE team_id = $1
          AND (
            email = $2
            OR phone = $3
          )
          LIMIT 1
          `,
          [
            teamId,
            mapped["email"] || null,
            mapped["phone"] || null,
          ],
        );

      if (existing.length > 0) {
        duplicates++;
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
          mapped["full_name"] || null,
          mapped["email"] || null,
          mapped["phone"] || null,
          mapped["company"] || null,
        ],
      );

      imported++;
    }

    await this.db.query(
      `
      UPDATE csv_lead_imports_integrations
      SET
        status = 'completed',
        imported_rows = $1,
        duplicate_rows = $2,
        invalid_rows = $3
      WHERE id = $4
      `,
      [
        imported,
        duplicates,
        invalid,
        importId,
      ],
    );

    return {
      success: true,
      imported,
      duplicates,
      invalid,
    };
  }
}