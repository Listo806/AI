import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { WorkspacesController } from './workspaces.controller';
import { WorkspaceEntitlementsService } from './workspace-entitlements.service';
import { WorkspaceLockGuard } from './workspace-lock.guard';

// Paid Workspace add-ons. Owns the workspace_entitlements table and the
// grant/revoke engine. Exports the entitlements service so the Paddle webhook
// (PaymentsModule) can grant/revoke, and exports the WorkspaceLockGuard so a
// workspace's own module (e.g. Insurance) can enforce the add-on. Depends only on
// the shared DatabaseService, so there is no cycle with PaymentsModule.
@Module({
  imports: [DatabaseModule],
  controllers: [WorkspacesController],
  providers: [WorkspaceEntitlementsService, WorkspaceLockGuard],
  exports: [WorkspaceEntitlementsService, WorkspaceLockGuard],
})
export class WorkspacesModule {}
