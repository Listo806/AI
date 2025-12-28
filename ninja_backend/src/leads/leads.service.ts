import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Lead, LeadStatus, CreateLeadDto, UpdateLeadDto } from './entities/lead.entity';

@Injectable()
export class LeadsService {
  constructor(private readonly db: DatabaseService) {}

  async create(createLeadDto: CreateLeadDto, userId: string, teamId: string | null): Promise<Lead> {
    const status = createLeadDto.status || LeadStatus.NEW;

    const { rows } = await this.db.query(
      `INSERT INTO leads (name, email, phone, status, assigned_to, created_by, team_id, notes, source, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING id, name, email, phone, status, assigned_to as "assignedTo", created_by as "createdBy", 
                 team_id as "teamId", notes, source, created_at as "createdAt", updated_at as "updatedAt"`,
      [
        createLeadDto.name,
        createLeadDto.email || null,
        createLeadDto.phone || null,
        status,
        createLeadDto.assignedTo || null,
        userId,
        teamId,
        createLeadDto.notes || null,
        createLeadDto.source || null,
      ],
    );

    return rows[0];
  }

  async findAll(userId: string, teamId: string | null): Promise<Lead[]> {
    let query: string;
    let params: any[];

    // If user has a team, show all team leads, otherwise only their own
    if (teamId) {
      query = `SELECT id, name, email, phone, status, assigned_to as "assignedTo", created_by as "createdBy", 
                      team_id as "teamId", notes, source, created_at as "createdAt", updated_at as "updatedAt"
               FROM leads
               WHERE team_id = $1
               ORDER BY created_at DESC`;
      params = [teamId];
    } else {
      query = `SELECT id, name, email, phone, status, assigned_to as "assignedTo", created_by as "createdBy", 
                      team_id as "teamId", notes, source, created_at as "createdAt", updated_at as "updatedAt"
               FROM leads
               WHERE created_by = $1
               ORDER BY created_at DESC`;
      params = [userId];
    }

    const { rows } = await this.db.query(query, params);
    return rows;
  }

  async findById(id: string): Promise<Lead | null> {
    const { rows } = await this.db.query(
      `SELECT id, name, email, phone, status, assigned_to as "assignedTo", created_by as "createdBy", 
              team_id as "teamId", notes, source, created_at as "createdAt", updated_at as "updatedAt"
       FROM leads WHERE id = $1`,
      [id],
    );
    return rows[0] || null;
  }

  async update(id: string, updateLeadDto: UpdateLeadDto, userId: string, teamId: string | null): Promise<Lead> {
    const lead = await this.findById(id);
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    // Check permissions: user must be creator or team member
    if (lead.createdBy !== userId && lead.teamId !== teamId) {
      throw new ForbiddenException('You do not have permission to update this lead');
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updateLeadDto.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(updateLeadDto.name);
    }
    if (updateLeadDto.email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(updateLeadDto.email);
    }
    if (updateLeadDto.phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(updateLeadDto.phone);
    }
    if (updateLeadDto.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(updateLeadDto.status);
    }
    if (updateLeadDto.assignedTo !== undefined) {
      updates.push(`assigned_to = $${paramCount++}`);
      values.push(updateLeadDto.assignedTo || null);
    }
    if (updateLeadDto.notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(updateLeadDto.notes);
    }
    if (updateLeadDto.source !== undefined) {
      updates.push(`source = $${paramCount++}`);
      values.push(updateLeadDto.source);
    }

    if (updates.length === 0) {
      return lead;
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await this.db.query(
      `UPDATE leads SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, name, email, phone, status, assigned_to as "assignedTo", created_by as "createdBy", 
                 team_id as "teamId", notes, source, created_at as "createdAt", updated_at as "updatedAt"`,
      values,
    );

    return rows[0];
  }

  async delete(id: string, userId: string, teamId: string | null): Promise<void> {
    const lead = await this.findById(id);
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    // Check permissions: user must be creator
    if (lead.createdBy !== userId) {
      throw new ForbiddenException('You do not have permission to delete this lead');
    }

    await this.db.query('DELETE FROM leads WHERE id = $1', [id]);
  }

  async findByStatus(status: LeadStatus, userId: string, teamId: string | null): Promise<Lead[]> {
    let query: string;
    let params: any[];

    if (teamId) {
      query = `SELECT id, name, email, phone, status, assigned_to as "assignedTo", created_by as "createdBy", 
                      team_id as "teamId", notes, source, created_at as "createdAt", updated_at as "updatedAt"
               FROM leads
               WHERE team_id = $1 AND status = $2
               ORDER BY created_at DESC`;
      params = [teamId, status];
    } else {
      query = `SELECT id, name, email, phone, status, assigned_to as "assignedTo", created_by as "createdBy", 
                      team_id as "teamId", notes, source, created_at as "createdAt", updated_at as "updatedAt"
               FROM leads
               WHERE created_by = $1 AND status = $2
               ORDER BY created_at DESC`;
      params = [userId, status];
    }

    const { rows } = await this.db.query(query, params);
    return rows;
  }
}

