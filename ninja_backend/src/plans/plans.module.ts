import { Module } from '@nestjs/common';
import { PlanService } from './plan.service';
import { UsageService } from './usage.service';
import { FeatureAccessGuard } from './feature-access.guard';
import { PlanOverridesService } from './plan-overrides.service';
import { PlansController } from './plans.controller';

// Central plan catalog + resolution service + Free-plan usage metering +
// feature-access enforcement. DatabaseService is provided by the global
// DatabaseModule. PlanService, UsageService, and FeatureAccessGuard are exported
// so other modules (messaging, integrations, admin, and feature-gated
// controllers) can inject them.
@Module({
  controllers: [PlansController],
  providers: [PlanService, UsageService, FeatureAccessGuard, PlanOverridesService],
  exports: [PlanService, UsageService, FeatureAccessGuard, PlanOverridesService],
})
export class PlansModule {}
