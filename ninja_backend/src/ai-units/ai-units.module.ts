import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PlansModule } from '../plans/plans.module';
import { PlatformMailModule } from '../platform-mail/platform-mail.module';
import { AiUnitsController } from './ai-units.controller';
import { AiUnitsService } from './ai-units.service';

@Module({
  imports: [DatabaseModule, PlansModule, PlatformMailModule],
  controllers: [AiUnitsController],
  providers: [AiUnitsService],
  exports: [AiUnitsService],
})
export class AiUnitsModule {}
