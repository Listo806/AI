import { Module } from '@nestjs/common';
import { EcommerceWorkspaceController } from './ecommerce-workspace.controller';
import { EcommerceWorkspaceService } from './ecommerce-workspace.service';
import { PlatformMailModule } from '../platform-mail/platform-mail.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { PaymentsModule } from '../payments/payments.module';
import { EcommerceBillingService } from './ecommerce-billing.service';

@Module({
  imports: [PlatformMailModule, WorkspacesModule, PaymentsModule],
  controllers: [EcommerceWorkspaceController],
  providers: [EcommerceWorkspaceService, EcommerceBillingService],
  exports: [EcommerceWorkspaceService],
})
export class EcommerceWorkspaceModule {}