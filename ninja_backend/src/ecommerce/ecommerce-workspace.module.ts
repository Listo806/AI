import { Module } from '@nestjs/common';
import { EcommerceWorkspaceController } from './ecommerce-workspace.controller';
import { EcommerceWorkspaceService } from './ecommerce-workspace.service';
import { PlatformMailModule } from '../platform-mail/platform-mail.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [PlatformMailModule, WorkspacesModule],
  controllers: [EcommerceWorkspaceController],
  providers: [EcommerceWorkspaceService],
  exports: [EcommerceWorkspaceService],
})
export class EcommerceWorkspaceModule {}