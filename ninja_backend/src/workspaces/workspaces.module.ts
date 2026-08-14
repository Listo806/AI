import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { WorkspacesController } from './workspaces.controller';
import { WorkspaceEntitlementsService } from './workspace-entitlements.service';

// Paid Workspace add-ons. Owns the workspace_entitlements table and the
// grant/revoke engine. Exports the entitlements service so the Paddle webhook
// (PaymentsModule) can grant/revoke, and enforcement (Slice 2) can read. Depends
// only on the shared DatabaseService, so there is no cycle with PaymentsModule.
@Module({
  imports: [DatabaseModule],
  controllers: [WorkspacesController],
  providers: [WorkspaceEntitlementsService],
  exports: [WorkspaceEntitlementsService],
})
export class WorkspacesModule {}
