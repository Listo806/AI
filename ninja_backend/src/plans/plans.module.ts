import { Module } from '@nestjs/common';
import { PlanService } from './plan.service';
import { UsageService } from './usage.service';
import { PlansController } from './plans.controller';

// Central plan catalog + resolution service + Free-plan usage metering.
// DatabaseService is provided by the global DatabaseModule. PlanService and
// UsageService are exported so other modules (messaging, integrations, admin,
// and the permission guards) can inject them.
@Module({
  controllers: [PlansController],
  providers: [PlanService, UsageService],
  exports: [PlanService, UsageService],
})
export class PlansModule {}
