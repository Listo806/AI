import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { StringValue } from 'ms';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '../config/config.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signup(signupDto: SignupDto) {
    const { email, password, role } = signupDto;

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Validate role
    if (!Object.values(UserRole).includes(role as UserRole)) {
      throw new UnauthorizedException('Invalid role');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      role: role as UserRole,
      teamId: null,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        teamId: user.teamId,
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        teamId: user.teamId,
      },
      ...tokens,
    };
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
    const payload = { id: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getRequired('JWT_SECRET'),
      expiresIn: (this.configService.get('JWT_EXPIRES_IN') || '15m') as StringValue,
    });

    const refreshToken = this.jwtService.sign(
      { id: user.id },
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
}

