import { Module } from '@nestjs/common';
import { PlanService } from './plan.service';
import { PlansController } from './plans.controller';

// Central plan catalog + resolution service. DatabaseService is provided by the
// global DatabaseModule. PlanService is exported so later phases (permission
// guards, usage metering, checkout, admin) can inject it.
@Module({
  controllers: [PlansController],
  providers: [PlanService],
  exports: [PlanService],
})
export class PlansModule {}
