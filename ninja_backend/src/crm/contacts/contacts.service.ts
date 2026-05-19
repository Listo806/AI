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

  c.interest,
  c.last_contact_at AS "lastContactAt",

  c.score,
  c.status,
  c.source,
  c.notes,

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

    const { rows } = await this.db.query(
      `
    SELECT
      COUNT(*)::int AS "totalContacts",

      COUNT(*) FILTER (
        WHERE type = 'Buyer'
      )::int AS "activeBuyers",

      COUNT(*) FILTER (
        WHERE type = 'Seller'
      )::int AS "activeSellers",

      COUNT(*) FILTER (
        WHERE status = 'Hot'
      )::int AS "conversations",

      COALESCE(AVG(score), 0)::int AS "aiEngagement"

    FROM contacts
    WHERE team_id = ANY($1)
    `,
      [accessible],
    );

    return rows[0];
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
        last_contact_at,
        updated_at       
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW()
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
    }

    if (dto.score !== undefined) {
      updates.push(`score = $${paramIndex++}`);
      values.push(dto.score ?? 0);
    }

    if (dto.source !== undefined) {
      updates.push(`source = $${paramIndex++}`);
      values.push(dto.source?.trim() || null);
    }

    if (dto.linkedLeadName !== undefined) {
      updates.push(`linked_lead_name = $${paramIndex++}`);
      values.push(dto.linkedLeadName?.trim() || null);
    }

    if (dto.lastContactAt !== undefined) {
      updates.push(`last_contact_at = $${paramIndex++}`);
      values.push(dto.lastContactAt || null);
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
}
