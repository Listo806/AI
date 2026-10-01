import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '../../config/config.service';
import { DatabaseService } from '../../database/database.service';
import { AuthService } from '../auth.service';
import { SecurityService } from '../security.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly db: DatabaseService,
    private readonly security: SecurityService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getRequired('JWT_SECRET'),
    });
  }

  private static readonly lastSeenWrites = new Map<string, number>();
  private static readonly LAST_SEEN_THROTTLE_MS = 10 * 60 * 1000;

  private touchLastSeen(userId: string): void {
    if (!userId) return;
    const now = Date.now();
    const prev = JwtStrategy.lastSeenWrites.get(userId) || 0;
    if (now - prev < JwtStrategy.LAST_SEEN_THROTTLE_MS) return;
    if (JwtStrategy.lastSeenWrites.size > 50000) {
      JwtStrategy.lastSeenWrites.clear();
    }
    JwtStrategy.lastSeenWrites.set(userId, now);
    this.db
      .query(`UPDATE users SET last_seen_at = NOW() WHERE id = $1`, [userId])
      .catch(() => {});
  }

  async validate(payload: any) {
    const user = await this.authService.validateUser(payload.id);
    if (!user) throw new UnauthorizedException();

    this.touchLastSeen(user.id);

    // Resolve the effective CRM team from the database instead of relying only
    // on users.team_id. Legacy owner accounts can legitimately have a null
    // users.team_id while still owning a team (teams.owner_id) or belonging to
    // one through team_members. Keeping this on the authenticated user makes
    // every downstream CRM module use the same tenant context.
    let resolvedTeamId = user.teamId || (user as any).team_id || null;
    if (!resolvedTeamId) {
      const teamResult = await this.db.query(
        `SELECT team_id
           FROM (
             SELECT tm.team_id, 1 AS priority
               FROM team_members tm
              WHERE tm.user_id = $1
                AND COALESCE(tm.status, 'active') = 'active'
             UNION ALL
             SELECT t.id AS team_id, 2 AS priority
               FROM teams t
              WHERE t.owner_id = $1
           ) candidates
          ORDER BY priority
          LIMIT 1`,
        [user.id],
      );
      resolvedTeamId = teamResult.rows[0]?.team_id || null;
    }

    const authenticatedUser = {
      ...user,
      teamId: resolvedTeamId,
      team_id: resolvedTeamId,
    };

    if (!(await this.security.sessionValid(user.id, payload.sid))) {
      throw new UnauthorizedException('Session has been signed out');
    }
    void this.security.touchSession(payload.sid);

    try {
      const { rows } = await this.db.query(
        `SELECT
            u.token_version,
            u.role as legacy_role,
            COALESCE(t.token_version, 0) as team_token_version,
            ia.internal_role,
            ia.status as internal_access_status,
            ia.permissions as internal_permissions
         FROM users u
         LEFT JOIN teams t ON t.id = $2
         LEFT JOIN internal_user_access ia ON ia.user_id = u.id
         WHERE u.id = $1`,
        [user.id, resolvedTeamId],
      );

      if (rows.length === 0) throw new UnauthorizedException();

      const row = rows[0];
      const currentTokenVersion = row.token_version ?? 1;
      const currentTeamTokenVersion = row.team_token_version ?? 0;

      if (
        payload.tokenVersion !== undefined &&
        payload.tokenVersion !== currentTokenVersion
      ) {
        throw new UnauthorizedException('Token invalidated due to account changes');
      }

      if (
        payload.teamTokenVersion !== undefined &&
        payload.teamTokenVersion !== currentTeamTokenVersion
      ) {
        throw new UnauthorizedException(
          'Token invalidated due to subscription/team changes',
        );
      }

      const internalActive = row.internal_access_status === 'active';
      const privilegedLegacyRole = ['super_admin', 'admin', 'developer'].includes(
        String(row.legacy_role || ''),
      );

      // Once the migration exists, legacy privileged roles are not enough by
      // themselves. A missing/inactive internal access row removes effective
      // administrative privilege without disabling the customer's base identity.
      const effectiveRole =
        privilegedLegacyRole && !internalActive ? 'user' : user.role;

      return {
        ...authenticatedUser,
        role: effectiveRole,
        internalRole: internalActive ? (row.internal_role ?? null) : null,
        internalAccessStatus: row.internal_access_status ?? null,
        sessionId: payload.sid || null,
        internalPermissions: Array.isArray(row.internal_permissions)
          ? row.internal_permissions
          : [],
      };
    } catch (error: any) {
      // Backward compatibility while migration is being deployed.
      if (error?.code === '42P01' || error?.code === '42703') {
        return authenticatedUser;
      }
      throw error;
    }
  }
}
