import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

@Module({
  imports: [DatabaseModule, WorkspacesModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
