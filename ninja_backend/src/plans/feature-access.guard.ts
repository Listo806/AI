import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlanFeatures } from './plan-config';
import { REQUIRE_FEATURE_KEY } from './require-feature.decorator';
import { UsageService } from './usage.service';

// Human labels for the 🔒 upgrade message. Only features that are actually gated
// behind a route need an entry; anything missing falls back to a generic label.
const FEATURE_LABELS: Partial<Record<keyof PlanFeatures, string>> = {
  emailSmsMarketing: 'Email & SMS marketing',
  calendar: 'Calendar',
  reports: 'Reports',
  advancedAnalytics: 'Advanced analytics',
  teamWorkspace: 'Team workspace',
  advancedAutomations: 'Advanced automations',
  workflowsSequences: 'Workflows & sequences',
  customFields: 'Custom fields',
  advancedPermissions: 'Advanced permissions',
  whiteLabel: 'White label',
  customObjects: 'Custom objects',
  aiBooking: 'AI appointment booking',
  aiAppointmentSetter: 'AI appointment setter',
  advancedAiAgent: 'Advanced AI agent',
  leadGenerator: 'Lead Generator',
  premiumIntegrations: 'Premium integrations',
};

// Blocks a route decorated with @RequireFeature(...) when the caller's plan does
// not include that feature. Paid/legacy accounts pass (grandfathered). Fails
// OPEN: any resolution error in UsageService resolves to "allowed" so a bug can
// never lock a real user out of a feature they should have.
@Injectable()
export class FeatureAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usage: UsageService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.getAllAndOverride<keyof PlanFeatures>(
      REQUIRE_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!feature) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const teamId = user?.teamId || user?.team_id || null;

    const allowed = await this.usage.featureAllowed(teamId, feature);
    if (!allowed) {
      const label = FEATURE_LABELS[feature] || 'This feature';
      throw new ForbiddenException(
        `🔒 ${label} is not included in the Free plan. Upgrade to unlock it.`,
      );
    }
    return true;
  }
}
