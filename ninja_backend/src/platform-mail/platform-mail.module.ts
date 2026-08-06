import { Module } from '@nestjs/common';
import { PlatformMailerService } from './platform-mailer.service';
import { SignupLifecycleService } from './signup-lifecycle.service';
import { SignupsAdminService } from './signups-admin.service';
import { PlatformMailController } from './platform-mail.controller';
import { EmailTrackController } from './email-track.controller';
import { SignupsAdminController } from './signups-admin.controller';

// Platform lifecycle email: transactional welcome-on-payment + the 3-step
// abandoned-signup sequence, localized (en/es/pt), with open/click tracking, an
// admin delivery log, and the admin Sign-ups / Customers sections. DatabaseService
// and ConfigService come from their @Global modules; ScheduleModule is registered
// in AppModule. Exports the mailer so PaymentsModule can send the welcome email.
@Module({
  controllers: [
    PlatformMailController,
    EmailTrackController,
    SignupsAdminController,
  ],
  providers: [
    PlatformMailerService,
    SignupLifecycleService,
    SignupsAdminService,
  ],
  exports: [PlatformMailerService],
})
export class PlatformMailModule {}
