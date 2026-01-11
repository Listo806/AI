import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '../../config/config.service';
import { DatabaseService } from '../../database/database.service';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly db: DatabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getRequired('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.authService.validateUser(payload.id);
    if (!user) {
      throw new UnauthorizedException();
    }

    // Token version validation: check if token version matches current user/team version
    // This invalidates tokens when role/subscription changes occur
    // Skip validation if columns don't exist (backward compatibility)
    try {
      const { rows } = await this.db.query(
        `SELECT u.token_version, COALESCE(t.token_version, 0) as team_token_version
         FROM users u
         LEFT JOIN teams t ON t.id = u.team_id
         WHERE u.id = $1`,
        [user.id],
      );

      if (rows.length === 0) {
        throw new UnauthorizedException();
      }

      const currentTokenVersion = rows[0].token_version ?? 1;
      const currentTeamTokenVersion = rows[0].team_token_version ?? 0;

      // Only validate if token has version info (tokens generated before migration won't have it)
      // If token doesn't have version, allow it (backward compatibility)
      if (payload.tokenVersion !== undefined) {
        if (payload.tokenVersion !== currentTokenVersion) {
          throw new UnauthorizedException('Token invalidated due to account changes');
        }
      }

      if (payload.teamTokenVersion !== undefined) {
        if (payload.teamTokenVersion !== currentTeamTokenVersion) {
          throw new UnauthorizedException('Token invalidated due to subscription/team changes');
        }
      }
      
      // If token doesn't have version info, it's from before migration - allow it
      return user;
    } catch (error: any) {
      // If columns don't exist yet (migration not run), skip version validation
      if (error.code === '42703') { // undefined_column
        // Skip token version validation - columns not migrated yet
        return user;
      }
      // Re-throw other errors (including UnauthorizedException)
      throw error;
    }

    return user;
  }
}

