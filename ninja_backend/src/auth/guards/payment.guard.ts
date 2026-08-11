import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { UserRole } from '../../users/entities/user.entity';
import { getPlan, resolveEffectivePlan } from '../../plans/plan-config';

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
  private static readonly ALLOWED_STATUSES: string[] = ['active', 'paid', 'free'];

  // Roles that never pay and are always allowed through.
  private static readonly EXEMPT_ROLES: string[] = [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
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

      // No row for this user at all — anomalous (JWT said they exist). Fail-open.
      if (!rows || rows.length === 0) {
        console.warn(
          `[PaymentGuard] No user row for id=${user.id}; allowing (fail-open).`,
        );
        return true;
      }

      const row = rows[0];

      // Could not resolve a workspace owner (user has no team, or team has no
      // owner_id). Not confident enough to block a possibly-legitimate account.
      if (!row.owner_id) {
        console.warn(
          `[PaymentGuard] No workspace owner resolvable for user id=${user.id} ` +
            `(teamId=${user.teamId ?? 'null'}); allowing (fail-open).`,
        );
        return true;
      }

      const status = (row.status ?? '').toString().trim().toLowerCase();

      if (PaymentGuard.ALLOWED_STATUSES.includes(status)) {
        return true;
      }

      // Not an obviously-allowed status. Resolve the effective plan with the SAME
      // rule the entitlement layer uses (resolveEffectivePlan): selected_plan is
      // intent only, a paid tier is grandfathered from the `plan` column unless it
      // has terminated, and everything else is Free. Free and every paid tier
      // include CRM access, so allow whenever the effective plan grants CRM. This
      // keeps an unpaid plan-selector on Free access (premium still locked by the
      // feature layer), never falsely blocks a legacy/grandfathered paid account,
      // and drops a canceled account back to Free rather than locking it out —
      // exactly matching UsageService.resolveTeamPlan so the two never disagree.
      const eff = resolveEffectivePlan({
        selected_plan: row.selected_plan,
        plan: row.plan,
        payment_status: row.status,
        checkout_status: row.checkout_status,
      });
      if (getPlan(eff.planId).features.crm) {
        return true;
      }

      // Defense-in-depth: the effective plan does not grant CRM access. Not
      // reachable with the current plan catalog (Free and all paid tiers include
      // CRM), but kept so a future no-CRM plan blocks correctly.
      throw new ForbiddenException(
        '🔒 Your subscription is not active. Please complete checkout to access the CRM.',
      );
    } catch (err) {
      // Never swallow our own deliberate block.
      if (err instanceof ForbiddenException) {
        throw err;
      }
      // Any DB/unexpected error: fail-open so an outage can't lock everyone out.
      console.error(
        `[PaymentGuard] Payment status check failed for user id=${user?.id}; ` +
          `allowing (fail-open).`,
        err,
      );
      return true;
    }
  }
}
