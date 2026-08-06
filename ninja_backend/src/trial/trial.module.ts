import { Module } from '@nestjs/common';
import { TrialController } from './trial.controller';
import { TrialService } from './trial.service';
import { AuthModule } from '../auth/auth.module';
import { PlatformMailModule } from '../platform-mail/platform-mail.module';

@Module({
  imports: [AuthModule, PlatformMailModule],
  controllers: [TrialController],
  providers: [TrialService],
})
export class TrialModule {}
