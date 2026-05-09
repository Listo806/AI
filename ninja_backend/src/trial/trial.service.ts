import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class TrialService {
  constructor(private readonly db: DatabaseService) {}

  async startTrial(dto: any) {
    try {
      console.log('DTO:', dto);

      const { email, password, name, phone, role } = dto;

      const { rows: existing } = await this.db.query(
        `SELECT id FROM users WHERE email = $1`,
        [email],
      );

      if (existing.length > 0) {
        throw new ConflictException('Email already exists');
      }

      const hashed = await bcrypt.hash(password, 10);

      /*
      |--------------------------------------------------------------------------
      | CREATE DEFAULT TEAM
      |--------------------------------------------------------------------------
      */

      const teamName =
        name
          ? `${name.split(' ')[0]}'s Team`
          : 'My Team';

      const { rows: teamRows } = await this.db.query(
        `
        INSERT INTO teams
        (
          name,
          created_at,
          updated_at
        )
        VALUES
        (
          $1,
          NOW(),
          NOW()
        )
        RETURNING id
        `,
        [teamName],
      );

      const teamId = teamRows[0].id;

      /*
      |--------------------------------------------------------------------------
      | CREATE USER
      |--------------------------------------------------------------------------
      */

      const { rows } = await this.db.query(
        `
        INSERT INTO users
        (
          email,
          password,
          name,
          phone,
          role,
          plan,
          is_active,
          payment_status,
          team_id,
          created_at,
          updated_at
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5,
          'TRIAL',
          true,
          'trial',
          $6,
          NOW(),
          NOW()
        )
        RETURNING id
        `,
        [
          email,
          hashed,
          name || null,
          phone || null,
          role || 'owner',
          teamId,
        ],
      );

      console.log('INSERTED USER:', rows);

      return {
        success: true,
        userId: rows[0].id,
        teamId,
      };
    } catch (err) {
      console.error('🔥 TRIAL ERROR:', err);
      throw err;
    }
  }
}