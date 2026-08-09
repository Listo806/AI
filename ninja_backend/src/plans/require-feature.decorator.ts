import { SetMetadata } from '@nestjs/common';
import { PlanFeatures } from './plan-config';

// Marks a route (or controller) as requiring a specific plan feature. The
// FeatureAccessGuard reads this and blocks the request with a 🔒 upgrade error
// when the caller's plan does not include the feature. Paid/legacy accounts are
// grandfathered to full access (see UsageService.featureAllowed).
export const REQUIRE_FEATURE_KEY = 'require_plan_feature';

export const RequireFeature = (feature: keyof PlanFeatures) =>
  SetMetadata(REQUIRE_FEATURE_KEY, feature);
