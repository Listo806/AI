import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { CreateContactDto } from "./dto/create-contact.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";

const OWNER_ROLE = "owner";

@Injectable()
export class ContactsService {
  constructor(private readonly db: DatabaseService) {}

  private baseSelectColumns = `
  
  c.id,
  c.team_id AS "teamId",
  c.created_by AS "createdBy",

  c.name,
  c.type,
  c.email,
  c.phone,

  c.lead_id AS "linkedLeadId",
  c.linked_lead_name AS "linkedLead",

  ll.status AS "linkedLeadStatus",
  ll.priority AS "linkedLeadPriority",

  c.interest,
  c.last_contact_at AS "lastContactAt",

  c.score,
  c.status,
  c.source,
  c.notes,
  c.tags,
  c.assigned_to AS "assignedTo",
  au.name AS "assignedAgentName",
  au.email AS "assignedAgentEmail",
  c.created_at AS "createdAt",
  c.updated_at AS "updatedAt"
`;

  private returningColumns = `
  id,
  team_id AS "teamId",
  created_by AS "createdBy",

  name,
  type,
  email,
  phone,

  lead_id AS "linkedLeadId",
  linked_lead_name AS "linkedLead",

  interest,
  last_contact_at AS "lastContactAt",

  score,
  status,
  source,
  notes,
  tags,
  assigned_to AS "assignedTo",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

  async findAll(
    userId: string,
    userTeamId: string | null,
    role: string,
    query: any,
  ) {
    const accessible = await this.getAccessibleTeamIds(
      userId,
      userTeamId,
      role,
    );

    if (!accessible.length) return [];

    const where: string[] = [];
    const values: any[] = [];

    values.push(accessible);

    where.push(`c.team_id = ANY($1)`);

    let param = 2;

    if (query.search) {
      where.push(`
      (
        LOWER(c.name) LIKE LOWER($${param})
        OR LOWER(c.email) LIKE LOWER($${param})
        OR LOWER(c.phone) LIKE LOWER($${param})
      )
    `);

      values.push(`%${query.search}%`);

      param++;
    }

    if (query.type) {
      where.push(`c.type = $${param}`);
      values.push(query.type);
      param++;
    }

    if (query.status) {
      where.push(`c.status = $${param}`);
      values.push(query.status);
      param++;
    }

    if (query.source) {
      where.push(`c.source = $${param}`);
      values.push(query.source);
      param++;
    }

    if (query.assignedTo) {
      where.push(`c.assigned_to = $${param}`);
      values.push(query.assignedTo);
      param++;
    }

    if (query.lastActivity) {
      const activityExpression = `COALESCE(c.last_contact_at, c.updated_at, c.created_at)`;

      if (query.lastActivity === "today") {
        where.push(`${activityExpression} >= CURRENT_DATE`);
      }

      if (query.lastActivity === "7d") {
        where.push(`${activityExpression} >= NOW() - INTERVAL '7 days'`);
      }

      if (query.lastActivity === "30d") {
        where.push(`${activityExpression} >= NOW() - INTERVAL '30 days'`);
      }
    }

    if (query.tag) {
      where.push(`$${param} = ANY(COALESCE(c.tags, ARRAY[]::text[]))`);
      values.push(query.tag);
      param++;
    }

    const page = Number(query.page || 1);
    const limit = Number(query.limit || 20);

    const offset = (page - 1) * limit;

    values.push(limit);
    values.push(offset);

    const limitParam = values.length - 1;
    const offsetParam = values.length;

    const sql = `
    SELECT
      ${this.baseSelectColumns}
    FROM contacts c
    LEFT JOIN users au ON au.id = c.assigned_to
    LEFT JOIN LATERAL (
      SELECT
        l.id,
        l.name,
        l.status,
        l.priority
      FROM leads l
      WHERE l.id = c.lead_id
        OR l.contact_id = c.id
      ORDER BY
        CASE WHEN l.id = c.lead_id THEN 0 ELSE 1 END,
        l.created_at DESC
      LIMIT 1
    ) ll ON TRUE
    WHERE ${where.join(" AND ")}
    ORDER BY c.created_at DESC
    LIMIT $${limitParam}
    OFFSET $${offsetParam}
  `;

    const { rows } = await this.db.query(sql, values);

    return rows.map((r) => ({
      ...r,
      avatar: r.name?.charAt(0)?.toUpperCase() || "?",
      lastContact: r.lastContactAt || "No contact yet",
    }));
  }

  async getStats(userId: string, userTeamId: string | null, role: string) {
    const accessible = await this.getAccessibleTeamIds(
      userId,
      userTeamId,
      role,
    );

    const emptySeries = Array.from({ length: 30 }, () => 0);

    if (!accessible.length) {
      return {
        totalContacts: 0,
        newContacts: 0,
        activeCustomers: 0,
        openOpportunities: 0,
        needsFollowUp: 0,
        aiEngagement: 0,

        totalContactsTrend: 0,
        newContactsTrend: 0,
        activeCustomersTrend: 0,
        openOpportunitiesTrend: 0,
        needsFollowUpTrend: 0,
        aiEngagementTrend: 0,

        series: {
          totalContacts: emptySeries,
          newContacts: emptySeries,
          activeCustomers: emptySeries,
          openOpportunities: emptySeries,
          needsFollowUp: emptySeries,
          aiEngagement: emptySeries,
        },

        // Legacy keys kept for existing consumers.
        activeBuyers: 0,
        activeSellers: 0,
        activeRenters: 0,
        activeDevelopers: 0,
      };
    }

    const percentChange = (current: number, previous: number) => {
      if (previous <= 0) {
        return current > 0 ? 100 : 0;
      }

      return Math.round(((current - previous) / previous) * 100);
    };

    const { rows: contactRows } = await this.db.query(
      `
      SELECT
        COUNT(*)::int AS "totalContacts",

        COUNT(*) FILTER (
          WHERE created_at >= NOW() - INTERVAL '30 days'
        )::int AS "newContacts",

        COUNT(*) FILTER (
          WHERE created_at >= NOW() - INTERVAL '60 days'
            AND created_at < NOW() - INTERVAL '30 days'
        )::int AS "previousNewContacts",

        COUNT(*) FILTER (
          WHERE created_at < NOW() - INTERVAL '30 days'
        )::int AS "previousTotalContacts",

        COUNT(*) FILTER (
          WHERE status = 'Active'
        )::int AS "activeCustomers",

        COUNT(*) FILTER (
          WHERE status = 'Active'
            AND created_at < NOW() - INTERVAL '30 days'
        )::int AS "previousActiveCustomers",

        COALESCE(AVG(score), 0)::numeric(10,2) AS "aiEngagement",

        COALESCE(AVG(score) FILTER (
          WHERE created_at < NOW() - INTERVAL '30 days'
        ), 0)::numeric(10,2) AS "previousAiEngagement",

        COUNT(*) FILTER (WHERE type = 'Buyer')::int AS "activeBuyers",
        COUNT(*) FILTER (WHERE type = 'Seller')::int AS "activeSellers",
        COUNT(*) FILTER (WHERE type = 'Renter')::int AS "activeRenters",
        COUNT(*) FILTER (WHERE type = 'Developer')::int AS "activeDevelopers"
      FROM contacts
      WHERE team_id = ANY($1)
      `,
      [accessible],
    );

    const { rows: opportunityRows } = await this.db.query(
      `
      SELECT
        COUNT(*) FILTER (
          WHERE stage NOT IN ('won', 'lost')
        )::int AS "openOpportunities",

        COUNT(*) FILTER (
          WHERE stage NOT IN ('won', 'lost')
            AND created_at < NOW() - INTERVAL '30 days'
        )::int AS "previousOpenOpportunities"
      FROM deals
      WHERE team_id = ANY($1)
      `,
      [accessible],
    );

    const { rows: followUpRows } = await this.db.query(
      `
      SELECT
        COUNT(DISTINCT c.id)::int AS "needsFollowUp",

        COUNT(DISTINCT c.id) FILTER (
          WHERE c.created_at < NOW() - INTERVAL '30 days'
        )::int AS "previousNeedsFollowUp"
      FROM contacts c
      JOIN leads l
        ON l.team_id = c.team_id
       AND (
         l.id = c.lead_id
         OR l.contact_id = c.id
       )
      WHERE c.team_id = ANY($1)
        AND l.status = 'follow-up'
      `,
      [accessible],
    );

    const { rows: seriesRows } = await this.db.query(
      `
      WITH days AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '29 days',
          CURRENT_DATE,
          INTERVAL '1 day'
        )::date AS day
      ),
      contact_daily AS (
        SELECT
          created_at::date AS day,
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'Active')::int AS active,
          COALESCE(AVG(score), 0)::numeric(10,2) AS ai
        FROM contacts
        WHERE team_id = ANY($1)
          AND created_at >= CURRENT_DATE - INTERVAL '29 days'
        GROUP BY created_at::date
      ),
      opportunity_daily AS (
        SELECT
          created_at::date AS day,
          COUNT(*) FILTER (
            WHERE stage NOT IN ('won', 'lost')
          )::int AS total
        FROM deals
        WHERE team_id = ANY($1)
          AND created_at >= CURRENT_DATE - INTERVAL '29 days'
        GROUP BY created_at::date
      ),
      follow_up_daily AS (
        SELECT
          c.created_at::date AS day,
          COUNT(DISTINCT c.id)::int AS total
        FROM contacts c
        JOIN leads l
          ON l.team_id = c.team_id
         AND (
           l.id = c.lead_id
           OR l.contact_id = c.id
         )
        WHERE c.team_id = ANY($1)
          AND l.status = 'follow-up'
          AND c.created_at >= CURRENT_DATE - INTERVAL '29 days'
        GROUP BY c.created_at::date
      )
      SELECT
        d.day,
        COALESCE(cd.total, 0)::int AS "newContacts",
        COALESCE(cd.active, 0)::int AS "activeCustomers",
        COALESCE(od.total, 0)::int AS "openOpportunities",
        COALESCE(fd.total, 0)::int AS "needsFollowUp",
        COALESCE(cd.ai, 0)::float AS "aiEngagement"
      FROM days d
      LEFT JOIN contact_daily cd ON cd.day = d.day
      LEFT JOIN opportunity_daily od ON od.day = d.day
      LEFT JOIN follow_up_daily fd ON fd.day = d.day
      ORDER BY d.day
      `,
      [accessible],
    );

    const contacts = contactRows[0] || {};
    const opportunities = opportunityRows[0] || {};
    const followUp = followUpRows[0] || {};

    const totalContacts = Number(contacts.totalContacts || 0);
    const newContacts = Number(contacts.newContacts || 0);
    const activeCustomers = Number(contacts.activeCustomers || 0);
    const openOpportunities = Number(opportunities.openOpportunities || 0);
    const needsFollowUp = Number(followUp.needsFollowUp || 0);
    const aiEngagement = Math.round(Number(contacts.aiEngagement || 0));

    const cumulativeTotalSeries: number[] = [];
    let runningTotal = Number(contacts.previousTotalContacts || 0);

    for (const row of seriesRows) {
      runningTotal += Number(row.newContacts || 0);
      cumulativeTotalSeries.push(runningTotal);
    }

    return {
      totalContacts,
      newContacts,
      activeCustomers,
      openOpportunities,
      needsFollowUp,
      aiEngagement,

      totalContactsTrend: percentChange(
        totalContacts,
        Number(contacts.previousTotalContacts || 0),
      ),
      newContactsTrend: percentChange(
        newContacts,
        Number(contacts.previousNewContacts || 0),
      ),
      activeCustomersTrend: percentChange(
        activeCustomers,
        Number(contacts.previousActiveCustomers || 0),
      ),
      openOpportunitiesTrend: percentChange(
        openOpportunities,
        Number(opportunities.previousOpenOpportunities || 0),
      ),
      needsFollowUpTrend: percentChange(
        needsFollowUp,
        Number(followUp.previousNeedsFollowUp || 0),
      ),
      aiEngagementTrend: percentChange(
        aiEngagement,
        Math.round(Number(contacts.previousAiEngagement || 0)),
      ),

      series: {
        totalContacts: cumulativeTotalSeries,
        newContacts: seriesRows.map((row) => Number(row.newContacts || 0)),
        activeCustomers: seriesRows.map((row) =>
          Number(row.activeCustomers || 0),
        ),
        openOpportunities: seriesRows.map((row) =>
          Number(row.openOpportunities || 0),
        ),
        needsFollowUp: seriesRows.map((row) =>
          Number(row.needsFollowUp || 0),
        ),
        aiEngagement: seriesRows.map((row) =>
          Math.round(Number(row.aiEngagement || 0)),
        ),
      },

      // Legacy keys kept for existing consumers.
      activeBuyers: Number(contacts.activeBuyers || 0),
      activeSellers: Number(contacts.activeSellers || 0),
      activeRenters: Number(contacts.activeRenters || 0),
      activeDevelopers: Number(contacts.activeDevelopers || 0),
    };
  }

  async getFilterOptions(
    userId: string,
    userTeamId: string | null,
    role: string,
  ) {
    const accessible = await this.getAccessibleTeamIds(
      userId,
      userTeamId,
      role,
    );

    if (!accessible.length) {
      return {
        statuses: [],
        sources: [],
        owners: [],
        types: [],
        tags: [],
      };
    }

    const { rows: sources } = await this.db.query(
      `
      SELECT DISTINCT source
      FROM contacts
      WHERE team_id = ANY($1)
        AND source IS NOT NULL
        AND BTRIM(source) <> ''
      ORDER BY source
      `,
      [accessible],
    );

    const { rows: owners } = await this.db.query(
      `
      SELECT DISTINCT
        u.id,
        COALESCE(NULLIF(BTRIM(u.name), ''), u.email) AS name
      FROM contacts c
      JOIN users u ON u.id = c.assigned_to
      WHERE c.team_id = ANY($1)
      ORDER BY name
      `,
      [accessible],
    );

    const { rows: types } = await this.db.query(
      `
      SELECT DISTINCT type
      FROM contacts
      WHERE team_id = ANY($1)
        AND type IS NOT NULL
        AND BTRIM(type) <> ''
      ORDER BY type
      `,
      [accessible],
    );

    const { rows: tagRows } = await this.db.query(
      `
      SELECT DISTINCT tag
      FROM contacts c
      CROSS JOIN LATERAL unnest(COALESCE(c.tags, ARRAY[]::text[])) AS tag
      WHERE c.team_id = ANY($1)
        AND BTRIM(tag) <> ''
      ORDER BY tag
      `,
      [accessible],
    );

    return {
      statuses: ["Cold", "Warm", "Hot", "Active", "Archived"],
      sources: sources.map((row) => row.source),
      owners,
      types: types.map((row) => row.type),
      tags: tagRows.map((row) => row.tag),
    };
  }


  private normalizeTags(value: unknown): string[] {
    const values = Array.isArray(value)
      ? value
      : typeof value === "string"
        ? value.split(/[|;,]/g)
        : [];

    return Array.from(
      new Set(
        values
          .map((tag) => String(tag || "").trim())
          .filter(Boolean)
          .map((tag) => tag.slice(0, 80)),
      ),
    ).slice(0, 30);
  }

  private normalizeImportKey(value: unknown): string {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[\s_\-./]+/g, "");
  }

  private valueFromImportRow(
    row: Record<string, any>,
    aliases: string[],
  ): any {
    const lookup = new Map<string, any>();

    for (const [key, value] of Object.entries(row || {})) {
      lookup.set(this.normalizeImportKey(key), value);
    }

    for (const alias of aliases) {
      const value = lookup.get(this.normalizeImportKey(alias));
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return value;
      }
    }

    return undefined;
  }

  private normalizeContactStatus(value: unknown): string {
    const allowed = ["Cold", "Warm", "Hot", "Active", "Archived"];
    const normalized = String(value || "").trim().toLowerCase();
    return (
      allowed.find((item) => item.toLowerCase() === normalized) || "Cold"
    );
  }

  private normalizeContactType(value: unknown): string | null {
    const allowed = ["Buyer", "Seller", "Investor", "Renter", "Developer"];
    const normalized = String(value || "").trim().toLowerCase();

    if (!normalized) return null;

    return (
      allowed.find((item) => item.toLowerCase() === normalized) || null
    );
  }

  async importBatch(
    body: {
      importId?: string;
      fileName?: string;
      rows: Record<string, any>[];
      duplicateStrategy?: "skip" | "update";
      isFirstBatch?: boolean;
      isLastBatch?: boolean;
    },
    userId: string,
    userTeamId: string | null,
    role: string,
  ) {
    const accessible = await this.getAccessibleTeamIds(
      userId,
      userTeamId,
      role,
    );

    if (!accessible.length) {
      throw new ForbiddenException("No accessible team found");
    }

    const teamId =
      userTeamId && accessible.includes(userTeamId)
        ? userTeamId
        : accessible[0];

    const rows = Array.isArray(body.rows) ? body.rows : [];

    if (!rows.length) {
      throw new BadRequestException("Import batch is empty");
    }

    if (rows.length > 250) {
      throw new BadRequestException("Import batch cannot exceed 250 rows");
    }

    const duplicateStrategy =
      body.duplicateStrategy === "update" ? "update" : "skip";

    let importId = body.importId || null;

    if (!importId || body.isFirstBatch) {
      const { rows: importRows } = await this.db.query(
        `
        INSERT INTO crm_imports_integrations (
          team_id,
          source_type,
          file_name,
          status,
          total_rows,
          processed_rows,
          imported_rows,
          failed_rows,
          duplicate_strategy,
          mapping,
          raw_rows,
          updated_at
        )
        VALUES ($1, 'contacts_csv', $2, 'processing', 0, 0, 0, 0, $3, $4, '[]'::jsonb, NOW())
        RETURNING id
        `,
        [
          teamId,
          body.fileName || "contacts.csv",
          duplicateStrategy,
          {
            supportedFields: [
              "name",
              "email",
              "phone",
              "type",
              "status",
              "source",
              "interest",
              "notes",
              "tags",
              "lastContactAt",
            ],
          },
        ],
      );

      importId = importRows[0]?.id;
    } else {
      const { rows: existingImport } = await this.db.query(
        `
        SELECT id
        FROM crm_imports_integrations
        WHERE id = $1
          AND team_id = $2
          AND source_type = 'contacts_csv'
        LIMIT 1
        `,
        [importId, teamId],
      );

      if (!existingImport.length) {
        throw new BadRequestException("Import session not found");
      }
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    const batchErrors: Array<{
      rowNumber: number;
      message: string;
    }> = [];

    for (let index = 0; index < rows.length; index++) {
      const raw = rows[index] || {};
      const rowNumber = Number(raw.__rowNumber || index + 2);

      try {
        const name = String(
          this.valueFromImportRow(raw, [
            "name",
            "full name",
            "fullname",
            "contact name",
          ]) || "",
        ).trim();

        const email = String(
          this.valueFromImportRow(raw, ["email", "email address"]) || "",
        ).trim();

        const phone = String(
          this.valueFromImportRow(raw, [
            "phone",
            "mobile",
            "phone number",
            "telephone",
          ]) || "",
        ).trim();

        if (!name) {
          throw new BadRequestException("Name is required");
        }

        const type = this.normalizeContactType(
          this.valueFromImportRow(raw, ["type", "contact type"]),
        );

        const status = this.normalizeContactStatus(
          this.valueFromImportRow(raw, ["status"]),
        );

        const sourceValue = this.valueFromImportRow(raw, [
          "source",
          "lead source",
        ]);

        const interestValue = this.valueFromImportRow(raw, [
          "interest",
          "interests",
        ]);

        const notesValue = this.valueFromImportRow(raw, [
          "notes",
          "note",
          "description",
        ]);

        const tags = this.normalizeTags(
          this.valueFromImportRow(raw, ["tags", "tag", "labels", "label"]),
        );

        const lastContactValue = this.valueFromImportRow(raw, [
          "last contact",
          "lastcontact",
          "last contact at",
          "lastcontactat",
        ]);

        const duplicateValues: any[] = [teamId];
        const duplicateParts: string[] = [];

        if (email) {
          duplicateValues.push(email.toLowerCase());
          duplicateParts.push(
            `LOWER(COALESCE(email, '')) = $${duplicateValues.length}`,
          );
        }

        if (phone) {
          duplicateValues.push(phone);
          duplicateParts.push(`phone = $${duplicateValues.length}`);
        }

        let existingContact: any = null;

        if (duplicateParts.length) {
          const { rows: duplicateRows } = await this.db.query(
            `
            SELECT id
            FROM contacts
            WHERE team_id = $1
              AND (${duplicateParts.join(" OR ")})
            ORDER BY created_at DESC
            LIMIT 1
            `,
            duplicateValues,
          );

          existingContact = duplicateRows[0] || null;
        }

        if (existingContact && duplicateStrategy === "skip") {
          skipped++;

          await this.db.query(
            `
            INSERT INTO crm_import_logs (
              import_id,
              row_number,
              status,
              message,
              raw_data
            )
            VALUES ($1, $2, 'skipped', 'Duplicate contact skipped', $3)
            `,
            [importId, rowNumber, raw],
          );

          continue;
        }

        if (existingContact && duplicateStrategy === "update") {
          await this.db.query(
            `
            UPDATE contacts
            SET
              name = $1,
              type = COALESCE($2, type),
              email = NULLIF($3, ''),
              phone = NULLIF($4, ''),
              status = $5,
              source = NULLIF($6, ''),
              interest = NULLIF($7, ''),
              notes = NULLIF($8, ''),
              tags = $9,
              last_contact_at = COALESCE($10::timestamptz, last_contact_at),
              updated_at = NOW()
            WHERE id = $11
              AND team_id = $12
            `,
            [
              name,
              type,
              email,
              phone,
              status,
              String(sourceValue || "").trim(),
              String(interestValue || "").trim(),
              String(notesValue || "").trim(),
              tags,
              lastContactValue
                ? String(lastContactValue).trim()
                : null,
              existingContact.id,
              teamId,
            ],
          );

          updated++;
        } else {
          await this.db.query(
            `
            INSERT INTO contacts (
              team_id,
              created_by,
              name,
              type,
              email,
              phone,
              interest,
              status,
              source,
              notes,
              tags,
              last_contact_at,
              updated_at
            )
            VALUES (
              $1,$2,$3,$4,NULLIF($5,''),NULLIF($6,''),NULLIF($7,''),
              $8,NULLIF($9,''),NULLIF($10,''),$11,$12::timestamptz,NOW()
            )
            `,
            [
              teamId,
              userId,
              name,
              type,
              email,
              phone,
              String(interestValue || "").trim(),
              status,
              String(sourceValue || "").trim(),
              String(notesValue || "").trim(),
              tags,
              lastContactValue
                ? String(lastContactValue).trim()
                : null,
            ],
          );

          imported++;
        }

        await this.db.query(
          `
          INSERT INTO crm_import_logs (
            import_id,
            row_number,
            status,
            message,
            raw_data
          )
          VALUES ($1, $2, 'success', $3, $4)
          `,
          [
            importId,
            rowNumber,
            existingContact ? "Contact updated" : "Contact imported",
            raw,
          ],
        );
      } catch (error: any) {
        failed++;

        const message =
          error?.message ||
          "Unable to import this contact row";

        batchErrors.push({
          rowNumber,
          message,
        });

        await this.db.query(
          `
          INSERT INTO crm_import_logs (
            import_id,
            row_number,
            status,
            message,
            raw_data
          )
          VALUES ($1, $2, 'failed', $3, $4)
          `,
          [importId, rowNumber, message, raw],
        );
      }
    }

    await this.db.query(
      `
      UPDATE crm_imports_integrations
      SET
        processed_rows = processed_rows + $1,
        total_rows = total_rows + $1,
        imported_rows = imported_rows + $2 + $3,
        failed_rows = failed_rows + $4,
        status = CASE WHEN $5 THEN 'completed' ELSE 'processing' END,
        updated_at = NOW()
      WHERE id = $6
        AND team_id = $7
      `,
      [
        rows.length,
        imported,
        updated,
        failed,
        Boolean(body.isLastBatch),
        importId,
        teamId,
      ],
    );

    return {
      success: true,
      importId,
      batch: {
        processed: rows.length,
        imported,
        updated,
        skipped,
        failed,
        errors: batchErrors.slice(0, 20),
      },
      completed: Boolean(body.isLastBatch),
    };
  }

  async getAiInsights(userId: string, userTeamId: string | null, role: string) {
    const accessible = await this.getAccessibleTeamIds(
      userId,
      userTeamId,
      role,
    );

    const { rows } = await this.db.query(
      `
    SELECT
      COUNT(*) FILTER (
        WHERE status = 'Hot'
      )::int AS "hotContacts",

      COUNT(*) FILTER (
        WHERE score >= 80
      )::int AS "followUpNeeded"

    FROM contacts
    WHERE team_id = ANY($1)
    `,
      [accessible],
    );

    return {
      summary: `CORTEXA detected ${rows[0].hotContacts} hot contacts needing follow-up today.`,
      hotContacts: rows[0].hotContacts,
      mostActiveChannel: "WhatsApp",
      topOpportunity: "Luxury buyers",
      followUpNeeded: rows[0].followUpNeeded,
    };
  }

  async runAiReview(userId: string, userTeamId: string | null, role: string) {
    const accessible = await this.getAccessibleTeamIds(
      userId,
      userTeamId,
      role,
    );

    await this.db.query(
      `
    UPDATE contacts
    SET
      score =
        CASE
          WHEN status = 'Hot' THEN 95
          WHEN status = 'Warm' THEN 75
          WHEN status = 'Active' THEN 55
          ELSE 25
        END,
      updated_at = NOW()
    WHERE team_id = ANY($1)
    `,
      [accessible],
    );

    return {
      success: true,
      message: "AI contact review completed",
    };
  }

  async getActivity(userId: string, userTeamId: string | null, role: string) {
    const accessible = await this.getAccessibleTeamIds(
      userId,
      userTeamId,
      role,
    );

    const { rows } = await this.db.query(
      `
    SELECT
      type,
      title,
      sub,
      created_at AS "createdAt"
    FROM contact_activities
    WHERE team_id = ANY($1)
    ORDER BY created_at DESC
    LIMIT 50
    `,
      [accessible],
    );

    return rows;
  }

  async messageContact(
    id: string,
    body: {
      channel: string;
      message: string;
    },
    userId: string,
    userTeamId: string | null,
    role: string,
  ) {
    const contact = await this.findOne(id, userId, userTeamId, role);

    // TODO:
    // Hook existing WhatsApp / messaging service here

    // await this.messagingService.send(...)

    await this.db.query(
      `
    INSERT INTO contact_activities (
      contact_id,
      user_id,
      team_id,
      type,
      title,
      sub
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [id, userId, contact.teamId, "message", "Message sent", body.message],
    );
    await this.createActivity(
      id,
      userId,
      contact.teamId,
      "message",
      `${body.channel || "Message"} message sent`,
      body.message || null,
    );

    return {
      success: true,
    };
  }

  private async getAccessibleTeamIds(
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<string[]> {
    if (role === OWNER_ROLE) {
      const { rows } = await this.db.query(
        `SELECT t.id FROM teams t
         WHERE t.owner_id = $1
            OR t.id = (SELECT team_id FROM users WHERE id = $1 AND team_id IS NOT NULL LIMIT 1)`,
        [userId],
      );
      return rows.map((r: { id: string }) => r.id);
    }
    if (userTeamId) return [userTeamId];
    return [];
  }

  private async ensureCanAccessTeam(
    teamId: string,
    accessibleIds: string[],
  ): Promise<void> {
    if (!accessibleIds.includes(teamId)) {
      throw new ForbiddenException("You do not have access to this team");
    }
  }

  private async validateLeadForContact(
    leadId: string,
    contactTeamId: string,
    userId: string,
  ): Promise<void> {
    const { rows } = await this.db.query(
      `SELECT id, team_id, created_by FROM leads WHERE id = $1`,
      [leadId],
    );
    if (rows.length === 0) {
      throw new BadRequestException("Lead not found");
    }
    const lead = rows[0];
    const sameTeam = lead.team_id && lead.team_id === contactTeamId;
    const createdByUser = lead.created_by === userId;
    if (!sameTeam && !createdByUser) {
      throw new BadRequestException(
        "Lead must belong to the same team as the contact or be created by you",
      );
    }
  }

  async findOne(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    const accessible = await this.getAccessibleTeamIds(
      userId,
      userTeamId,
      role,
    );
    if (accessible.length === 0) return []; // SAFE fallback instead of 403
    //throw new ForbiddenException('User must be part of a team to manage contacts');

    const placeholders = accessible.map((_, i) => `$${i + 2}`).join(", ");
    const { rows } = await this.db.query(
      `
  SELECT
    ${this.baseSelectColumns}
  FROM contacts c
  LEFT JOIN users au ON au.id = c.assigned_to
  LEFT JOIN LATERAL (
    SELECT
      l.id,
      l.name,
      l.status,
      l.priority
    FROM leads l
    WHERE l.id = c.lead_id
      OR l.contact_id = c.id
    ORDER BY
      CASE WHEN l.id = c.lead_id THEN 0 ELSE 1 END,
      l.created_at DESC
    LIMIT 1
  ) ll ON TRUE
  WHERE c.id = $1
    AND c.team_id IN (${placeholders})
  `,
      [id, ...accessible],
    );
    if (rows.length === 0) throw new NotFoundException("Contact not found");
    return {
      ...rows[0],
      avatar: rows[0].name?.charAt(0)?.toUpperCase() || "?",
      lastContact: rows[0].lastContactAt || "No contact yet",
    };
  }

  async create(
    dto: CreateContactDto,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    const accessible = await this.getAccessibleTeamIds(
      userId,
      userTeamId,
      role,
    );
    if (accessible.length === 0) {
      return []; // SAFE fallback instead of 403
      //throw new ForbiddenException('User must be part of a team to create contacts');
    }

    const teamId =
      dto.teamId && accessible.includes(dto.teamId)
        ? dto.teamId
        : userTeamId || accessible[0];
    await this.ensureCanAccessTeam(teamId, accessible);

    if (dto.leadId)
      await this.validateLeadForContact(dto.leadId, teamId, userId);

    const { rows } = await this.db.query(
      `
      INSERT INTO contacts (
        team_id,
        created_by,
        name,
        type,
        email,
        phone,
        lead_id,
        linked_lead_name,
        interest,
        score,
        status,
        source,
        notes,
        tags,
        last_contact_at,
        updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW()
      )
      RETURNING ${this.returningColumns}
      `,
      [
        teamId,
        userId,
        dto.name,
        dto.type || null,
        dto.email || null,
        dto.phone || null,
        dto.leadId || null,
        dto.linkedLeadName || null,
        dto.interest || null,
        dto.score || 0,
        dto.status || "Cold",
        dto.source || null,
        dto.notes || null,
        this.normalizeTags(dto.tags),
        dto.lastContactAt || null,
      ],
    );
    return rows[0];
  }

  async update(
    id: string,
    dto: UpdateContactDto,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<any> {
    const contact = await this.findOne(id, userId, userTeamId, role);
    const teamId = contact.teamId;

    if (dto.leadId !== undefined && dto.leadId != null) {
      await this.validateLeadForContact(dto.leadId, teamId, userId);
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    if (dto.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(dto.name.trim());
    }
    if (dto.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(dto.email?.trim() || null);
    }
    if (dto.phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(dto.phone?.trim() || null);
    }
    if (dto.leadId !== undefined) {
      updates.push(`lead_id = $${paramIndex++}`);
      values.push(dto.leadId);
    }
    if (dto.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(dto.notes?.trim() || null);
    }

    if (dto.type !== undefined) {
      updates.push(`type = $${paramIndex++}`);
      values.push(dto.type || null);
    }

    if (dto.interest !== undefined) {
      updates.push(`interest = $${paramIndex++}`);
      values.push(dto.interest?.trim() || null);
    }

    if (dto.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(dto.status || null);
      await this.createActivity(
        id,
        userId,
        teamId,
        "status_changed",
        `Status changed to ${dto.status}`,
        null,
      );
    }

    if (dto.score !== undefined) {
      updates.push(`score = $${paramIndex++}`);
      values.push(dto.score ?? 0);
    }

    if (dto.source !== undefined) {
      updates.push(`source = $${paramIndex++}`);
      values.push(dto.source?.trim() || null);
    }

    if (dto.tags !== undefined) {
      updates.push(`tags = $${paramIndex++}`);
      values.push(this.normalizeTags(dto.tags));
    }

    if (dto.linkedLeadName !== undefined) {
      updates.push(`linked_lead_name = $${paramIndex++}`);
      values.push(dto.linkedLeadName?.trim() || null);
    }

    if (dto.lastContactAt !== undefined) {
      updates.push(`last_contact_at = $${paramIndex++}`);
      values.push(dto.lastContactAt || null);
    }

    if (dto.assignedTo !== undefined) {
      updates.push(`assigned_to = $${paramIndex++}`);
      values.push(dto.assignedTo || null);
      await this.createActivity(
        id,
        userId,
        teamId,
        "assigned",
        dto.assignedTo ? "Agent assigned" : "Agent unassigned",
        null,
      );
    }
    if (updates.length === 0) return this.findOne(id, userId, userTeamId, role);
    updates.push(`updated_at = NOW()`);
    values.push(id, teamId);
    const idParam = values.length - 1;
    const teamParam = values.length;
    const { rows } = await this.db.query(
      `UPDATE contacts SET ${updates.join(", ")} WHERE id = $${idParam} AND team_id = $${teamParam}
       RETURNING ${this.returningColumns}`,
      values,
    );
    return rows[0];
  }

  async remove(
    id: string,
    userId: string,
    userTeamId: string | null,
    role: string,
  ): Promise<void> {
    const contact = await this.findOne(id, userId, userTeamId, role);
    await this.db.query("DELETE FROM contacts WHERE id = $1 AND team_id = $2", [
      id,
      contact.teamId,
    ]);
  }

  async createActivity(
    contactId: string,
    userId: string,
    teamId: string,
    type: string,
    title: string,
    sub?: string,
  ) {
    await this.db.query(
      `
    INSERT INTO contact_activities (
      contact_id,
      user_id,
      team_id,
      type,
      title,
      sub
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [contactId, userId, teamId, type, title, sub || null],
    );
  }

  async getActivities(contactId: string, user: any) {
    await this.findOne(contactId, user.id, user.teamId, user.role);

    const { rows } = await this.db.query(
      `
    SELECT
      ca.id,
      ca.contact_id AS "contactId",
      ca.user_id AS "userId",
      ca.team_id AS "teamId",
      ca.type,
      ca.title,
      ca.sub,
      ca.created_at AS "createdAt",
      u.email AS "userEmail"
    FROM contact_activities ca
    LEFT JOIN users u ON u.id = ca.user_id
    WHERE ca.contact_id = $1
    ORDER BY ca.created_at DESC
    `,
      [contactId],
    );

    return rows;
  }

  async addActivity(contactId: string, user: any, dto: any) {
    const contact = await this.findOne(
      contactId,
      user.id,
      user.teamId,
      user.role,
    );

    const { rows } = await this.db.query(
      `
    INSERT INTO contact_activities (
      contact_id,
      user_id,
      team_id,
      type,
      title,
      sub
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING
      id,
      contact_id AS "contactId",
      user_id AS "userId",
      team_id AS "teamId",
      type,
      title,
      sub,
      created_at AS "createdAt"
    `,
      [
        contactId,
        user.id,
        contact.teamId,
        dto.type || "note",
        dto.title || dto.description || "Activity",
        dto.sub || null,
      ],
    );

    return rows[0];
  }

  async getLinkedLead(contactId: string, user: any) {
    const contact = await this.findOne(
      contactId,
      user.id,
      user.teamId ?? user.team_id ?? null,
      user.role ?? "owner",
    );

    const { rows } = await this.db.query(
      `
    SELECT
      l.id,
      l.name,
      l.email,
      l.phone,
      l.status,
      l.priority,
      l.source,
      l.assigned_to AS "assignedTo",
      l.property_id AS "propertyId",
      l.contact_id AS "contactId",
      l.team_id AS "teamId",
      l.created_at AS "createdAt",
      l.updated_at AS "updatedAt"
    FROM leads l
    WHERE (
      l.id = $1
      OR l.contact_id = $2
    )
      AND l.team_id = $3
    ORDER BY
      CASE WHEN l.id = $1 THEN 0 ELSE 1 END,
      l.created_at DESC
    LIMIT 1
    `,
      [contact.linkedLeadId || null, contact.id, contact.teamId],
    );

    return {
      linked: rows.length > 0,
      lead: rows[0] || null,
    };
  }
}
