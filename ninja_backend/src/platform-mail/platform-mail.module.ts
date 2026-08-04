import { Module } from '@nestjs/common';
import { PlatformMailerService } from './platform-mailer.service';
import { SignupLifecycleService } from './signup-lifecycle.service';
import { PlatformMailController } from './platform-mail.controller';

// Platform lifecycle email: transactional welcome-on-payment + abandoned-signup
// sweep, localized (en/es/pt), with an admin delivery log. DatabaseService and
// ConfigService come from their @Global modules; ScheduleModule is registered in
// AppModule. Exports the mailer so PaymentsModule can send the welcome email.
@Module({
  controllers: [PlatformMailController],
  providers: [PlatformMailerService, SignupLifecycleService],
  exports: [PlatformMailerService],
})
export class PlatformMailModule {}
