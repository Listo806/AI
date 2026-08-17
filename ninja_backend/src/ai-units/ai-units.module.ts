import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PlansModule } from '../plans/plans.module';
import { AiUnitsController } from './ai-units.controller';
import { AiUnitsService } from './ai-units.service';

@Module({
  imports: [DatabaseModule, PlansModule],
  controllers: [AiUnitsController],
  providers: [AiUnitsService],
  exports: [AiUnitsService],
})
export class AiUnitsModule {}
