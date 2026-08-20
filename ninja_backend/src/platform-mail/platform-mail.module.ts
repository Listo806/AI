import { Module } from '@nestjs/common';
import { PlatformMailerService } from './platform-mailer.service';
import { SignupLifecycleService } from './signup-lifecycle.service';
import { SignupsAdminService } from './signups-admin.service';
import { CustomersAdminService } from './customers-admin.service';
import { PlatformMailController } from './platform-mail.controller';
import { EmailTrackController } from './email-track.controller';
import { EmailUnsubscribeController } from './email-unsubscribe.controller';
import { SignupsAdminController } from './signups-admin.controller';
import { CustomersAdminController } from './customers-admin.controller';
import { SendgridEventsController } from './sendgrid-events.controller';
import { OnboardingTestController } from './onboarding-test.controller';
import { PlansModule } from '../plans/plans.module';

// Platform lifecycle email + the admin Sign-ups / Customers sections. The new
// master Customers hub (CustomersAdmin*) consolidates sign-ups + customers +
// plan/billing. DatabaseService and ConfigService come from their @Global
// modules; PlansModule provides the plan catalog + usage metering.
@Module({
  imports: [PlansModule],
  controllers: [
    PlatformMailController,
    EmailTrackController,
    EmailUnsubscribeController,
    SignupsAdminController,
    CustomersAdminController,
    SendgridEventsController,
    OnboardingTestController,
  ],
  providers: [
    PlatformMailerService,
    SignupLifecycleService,
    SignupsAdminService,
    CustomersAdminService,
  ],
  exports: [PlatformMailerService],
})
export class PlatformMailModule {}
