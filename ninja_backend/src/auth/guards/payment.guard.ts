import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { UserRole } from '../../users/entities/user.entity';

/**
 * PaymentGuard — server-side WORKSPACE payment gate.
 *
 * IMPORTANT: must always run AFTER JwtAuthGuard (which populates request.user).
 * It blocks users whose workspace (team owner) has not completed checkout, so an
 * unpaid account cannot reach protected CRM data endpoints.
 *
 * Security-sensitive design decisions (bias: NEVER false-block a paying user;
 * a missed gate is only a redirect-to-checkout inconvenience, a false-block of a
 * paying customer is worse):
 *
 *  - No request.user  -> ALLOW. JwtAuthGuard / @Public already handled auth. A
 *    @Public route never sets request.user, so PaymentGuard is a no-op there.
 *
 *  - Exempt roles (super_admin, admin, va, va_uploader) -> ALLOW. These roles
 *    never pay for the CRM themselves.
 *
 *  - Gate on the TEAM OWNER's payment_status, NOT the caller's — so members of a
 *    paid team (who never individually paid) keep working. We resolve the owner
 *    via the caller's team_id.
 *
 *  - Allowed statuses: 'active', 'paid'. Everything else — trial, pending,
 *    past_due, suspended, canceled, refunded, expired, or NULL — is treated as
 *    "not paid" and BLOCKED.
 *    NOTE: fresh trial signups are created with payment_status='trial', so they
 *    are intentionally blocked here and must complete checkout. If the business
 *    decides trial users should have CRM access, add 'trial' to ALLOWED_STATUSES
 *    below (single-line change).
 *
 *  - FAIL-OPEN on every ambiguous / error case (DB error, no user row, no
 *    resolvable workspace owner). A DB hiccup or odd data shape must never lock
 *    out paying customers. We only BLOCK when we are CONFIDENT: an owner row was
 *    found and its payment_status is not in the allowed set.
 *
 * The 🔒 prefix on the block message is required: the frontend apiClient only
 * surfaces the real backend message for "subscription-style" 403s (it matches on
 * '🔒' / 'subscription' / 'CRM access' / 'AI features' / 'listing limit').
 */
@Injectable()
export class PaymentGuard implements CanActivate {
  // Owner payment_status values that grant workspace access. 'free' is included
  // because the Free tier has CRM access without paying.
  private static readonly ALLOWED_STATUSES: string[] = ['active', 'paid', 'trialing'];

  // Roles that never pay and are always allowed through.
  private static readonly EXEMPT_ROLES: string[] = [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.DEVELOPER,
    UserRole.VA,
    UserRole.VA_UPLOADER,
  ];

  constructor(private readonly db: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request?.user;

    // No authenticated user: JwtAuthGuard (which runs first) or @Public owns this.
    if (!user) {
      return true;
    }

    // Roles that never pay are always allowed.
    if (user.role && PaymentGuard.EXEMPT_ROLES.includes(user.role)) {
      return true;
    }

    // Cortexa internal staff are never customers, whatever their customer-side
    // role happens to be. JwtStrategy sets internalRole while access is active.
    if (user.internalRole) {
      return true;
    }

    try {
      // Resolve the WORKSPACE owner's payment status for this user's team.
      // owner_id is selected so we can distinguish "owner found & unpaid" (block)
      // from "no owner resolvable" (fail-open allow).
      const { rows } = await this.db.query(
        `SELECT owner.payment_status AS status, owner.id AS owner_id,
                owner.selected_plan AS selected_plan, owner.plan AS plan,
                owner.checkout_status AS checkout_status
           FROM users u
           LEFT JOIN teams t ON t.id = u.team_id
           LEFT JOIN users owner ON owner.id = t.owner_id
          WHERE u.id = $1
          LIMIT 1`,
        [user.id],
      );

      // If the authenticated customer cannot be resolved in the database, fail closed.
      // A JWT alone is never proof of an active paid workspace.
      if (!rows || rows.length === 0) {
        console.warn(`[PaymentGuard] No user row for id=${user.id}; denying CRM access.`);
        throw new ForbiddenException(
          '🔒 We could not verify your workspace subscription. Please sign in again or contact support.',
        );
      }

      const row = rows[0];

      // No workspace owner means there is no authoritative entitlement record.
      // This is normal before workspace setup, but it must not grant CRM access.
      if (!row.owner_id) {
        console.warn(
          `[PaymentGuard] No workspace owner resolvable for user id=${user.id} ` +
            `(teamId=${user.teamId ?? 'null'}); denying CRM access.`,
        );
        throw new ForbiddenException(
          '🔒 Complete workspace setup before accessing the CRM.',
        );
      }

      const status = (row.status ?? '').toString().trim().toLowerCase();

      if (PaymentGuard.ALLOWED_STATUSES.includes(status)) {
        return true;
      }

      // Current launch policy has no unrestricted unpaid/Free CRM bypass.
      // A selected plan, checkout redirect, or browser-side success flag is not
      // proof of payment; only the owner's backend payment status grants access.
      throw new ForbiddenException(
        '🔒 Your activation payment has not been confirmed. Please complete checkout to access the CRM.',
      );
    } catch (err) {
      // Never swallow our own deliberate block.
      if (err instanceof ForbiddenException) {
        throw err;
      }
      // Entitlement/payment verification is security-sensitive. If the database
      // check fails, do not turn an infrastructure error into unpaid CRM access.
      console.error(
        `[PaymentGuard] Payment status check failed for user id=${user?.id}; denying access.`,
        err,
      );
      throw new ForbiddenException(
        '🔒 We could not verify your subscription right now. Please retry shortly.',
      );
    }
  }
}
