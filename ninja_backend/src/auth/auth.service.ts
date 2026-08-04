import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import type { StringValue } from 'ms';
import { UsersService } from '../users/users.service';
import { DatabaseService } from '../database/database.service';
import { UserRole } from '../users/entities/user.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '../config/config.service';
import { EventLoggerService } from '../analytics/events/event-logger.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly db: DatabaseService,
    private readonly eventLogger: EventLoggerService,
  ) {}

  async signup(signupDto: SignupDto) {
    const { password, role } = signupDto;
    // Normalize the email so it is stored consistently and can always be matched
    // at login (avoids capitalized/whitespace mismatches).
    const email = (signupDto.email || '').trim().toLowerCase();

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Validate role.
    if (!Object.values(UserRole).includes(role as UserRole)) {
      throw new UnauthorizedException('Invalid role');
    }
    // SECURITY: public self-signup may never assign a privileged role. These
    // roles unlock the admin or VA panels and must only be granted by an
    // existing admin through the role-guarded admin panel. Without this, anyone
    // could register with role:"admin" (or "developer"/"va") and self-escalate.
    const PRIVILEGED_ROLES: UserRole[] = [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.DEVELOPER,
      UserRole.VA,
      UserRole.VA_UPLOADER,
    ];
    if (PRIVILEGED_ROLES.includes(role as UserRole)) {
      throw new UnauthorizedException('This role cannot be assigned via signup');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      role: role as UserRole,
      teamId: null,
      preferredLanguage: signupDto.language || null,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? null,
        phone: user.phone ?? null,
        role: user.role,
        teamId: user.teamId,
        paymentStatus: user.paymentStatus ?? null,
        plan: user.plan ?? null,
        selectedPlan: user.selectedPlan ?? null,
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    try {
      const { email, password } = loginDto;

      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Account is inactive');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const tokens = await this.generateTokens(user);

      await this.eventLogger.logUserLoggedIn(user.id, user.teamId);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          phone: user.phone ?? null,
          role: user.role,
          teamId: user.teamId,
          paymentStatus: user.paymentStatus ?? null,
          plan: user.plan ?? null,
          selectedPlan: user.selectedPlan ?? null,
        },
        ...tokens,
      };
    } catch (err) {
      console.error('LOGIN ERROR:', err);
      throw err;
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const secret = this.configService.getRequired('JWT_REFRESH_SECRET');
      const payload = this.jwtService.verify(refreshToken, { secret });

      const user = await this.usersService.findById(payload.id);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid token');
      }

      return await this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private async generateTokens(user: any) {
    // Get user's token version and team token version
    // Fallback to default values if columns don't exist (for backward compatibility)
    let tokenVersion = 1;
    let teamTokenVersion = 0;

    try {
      const { rows: userRows } = await this.db.query(
        `SELECT u.token_version, COALESCE(t.token_version, 0) as team_token_version
         FROM users u
         LEFT JOIN teams t ON t.id = u.team_id
         WHERE u.id = $1`,
        [user.id],
      );

      if (userRows.length > 0) {
        tokenVersion = userRows[0]?.token_version ?? 1;
        teamTokenVersion = userRows[0]?.team_token_version ?? 0;
      }
    } catch (error: any) {
      // If columns don't exist yet (migration not run), use defaults
      if (error.code === '42703') { // undefined_column
        console.warn('token_version columns not found - using defaults. Run migration 004_production_readiness.sql');
        tokenVersion = 1;
        teamTokenVersion = 0;
      } else {
        throw error;
      }
    }

    const payload = { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      tokenVersion,
      teamTokenVersion,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getRequired('JWT_SECRET'),
      expiresIn: (this.configService.get('JWT_EXPIRES_IN') || '15m') as StringValue,
    });

    const refreshToken = this.jwtService.sign(
      { id: user.id, tokenVersion, teamTokenVersion },
      {
        secret: this.configService.getRequired('JWT_REFRESH_SECRET'),
        expiresIn: (this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d') as StringValue,
      },
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async validateUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.isActive) {
      return null;
    }
    return user;
  }

  async loginById(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    const tokens = await this.generateTokens(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? null,
        phone: user.phone ?? null,
        role: user.role,
        teamId: user.teamId,
        paymentStatus: user.paymentStatus ?? null,
        plan: user.plan ?? null,
        selectedPlan: user.selectedPlan ?? null,
      },
    };
  }

  // Start a password reset: store a hashed one-time token and email a link.
  // Always returns a generic response so we never reveal whether an email exists.
  async forgotPassword(email: string) {
    const normalized = (email || '').trim().toLowerCase();
    const genericResponse = {
      success: true,
      message:
        'If an account exists for that email, a password reset link has been sent.',
    };

    const user = await this.usersService.findByEmail(normalized);
    if (!user) return genericResponse;

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.db.query(
      `UPDATE users
       SET reset_token_hash = $1, reset_token_expires_at = $2, updated_at = NOW()
       WHERE id = $3`,
      [tokenHash, expiresAt, user.id],
    );

    const frontendUrl = (
      this.configService.get('FRONTEND_URL') || 'https://www.cortexaaicrm.com'
    )
      .split(',')[0]
      .trim();
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    await this.sendResetEmail(user.email, resetUrl);
    return genericResponse;
  }

  // Complete a reset: verify the token, set the new password, clear the token,
  // and bump token_version so any existing sessions are invalidated.
  async resetPassword(token: string, newPassword: string) {
    if (!token) throw new BadRequestException('Reset token is required');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { rows } = await this.db.query(
      `SELECT id FROM users
       WHERE reset_token_hash = $1 AND reset_token_expires_at > NOW()
       LIMIT 1`,
      [tokenHash],
    );
    if (!rows.length) {
      throw new BadRequestException(
        'This reset link is invalid or has expired. Please request a new one.',
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.db.query(
      `UPDATE users
       SET password = $1,
           reset_token_hash = NULL,
           reset_token_expires_at = NULL,
           token_version = COALESCE(token_version, 1) + 1,
           updated_at = NOW()
       WHERE id = $2`,
      [hashed, rows[0].id],
    );

    return {
      success: true,
      message: 'Your password has been reset. Please sign in.',
    };
  }

  // Change the password for an already-authenticated user. Verifies the current
  // password, sets the new one, and bumps token_version so any OTHER existing
  // sessions are invalidated. A fresh session is re-issued for the caller so the
  // current session stays valid.
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) throw new BadRequestException('Your current password is incorrect.');
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.db.query(
      `UPDATE users SET password = $1, token_version = COALESCE(token_version, 1) + 1, updated_at = NOW() WHERE id = $2`,
      [hashed, userId],
    );
    // Re-issue a fresh session (new token_version) so THIS session stays valid
    // while any other existing sessions are invalidated.
    const tokens = await this.generateTokens(user);
    return { success: true, message: 'Password updated successfully.', ...tokens };
  }

  // Send the reset email via the platform SMTP sender. Best-effort: a missing or
  // failing SMTP config must not change the generic forgot-password response,
  // but we log it so delivery problems are visible.
  private async sendResetEmail(to: string, resetUrl: string) {
    try {
      const host = this.configService.get('SMTP_HOST');
      const user = this.configService.get('SMTP_USER');
      const pass = this.configService.get('SMTP_PASS');
      const from = this.configService.get('EMAIL_FROM') || user;
      const port = Number(this.configService.get('SMTP_PORT')) || 587;

      if (!host || !user || !pass || !from) {
        this.logger.warn(
          'Password reset email not sent: SMTP is not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_FROM).',
        );
        return;
      }

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      const html = `
        <div style="font-family:Arial,sans-serif;font-size:15px;color:#111">
          <h2 style="margin:0 0 12px">Reset your CORTEXA password</h2>
          <p>We received a request to reset your password. Click the button below to set a new one. This link expires in 1 hour.</p>
          <p style="margin:20px 0">
            <a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Reset password</a>
          </p>
          <p style="color:#64748b;font-size:13px">If you did not request this, you can safely ignore this email.</p>
          <p style="color:#94a3b8;font-size:12px;word-break:break-all">${resetUrl}</p>
        </div>`;

      await transporter.sendMail({
        from,
        to,
        subject: 'Reset your CORTEXA password',
        text: `Reset your password using this link (expires in 1 hour): ${resetUrl}`,
        html,
      });
    } catch (err: any) {
      this.logger.error(`Failed to send password reset email: ${err?.message}`);
    }
  }
}

