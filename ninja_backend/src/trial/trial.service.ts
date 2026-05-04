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

      console.log('EXISTING:', existing);

      if (existing.length > 0) {
        throw new ConflictException('Email already exists');
      }

      const hashed = await bcrypt.hash(password, 10);

      const { rows } = await this.db.query(
        `INSERT INTO users 
          (email, password, name, phone, role, plan, is_active, payment_status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 'trial', true, 'trial', NOW(), NOW())
        RETURNING id`,
        [
          email,
          hashed,
          name || null,
          phone || null,
          role || 'agent',
        ],
      );

      console.log('INSERTED:', rows);

      return {
        success: true,
        userId: rows[0].id,
      };
    } catch (err) {
      console.error('🔥 TRIAL ERROR:', err);
      throw err;
    }
  }
}