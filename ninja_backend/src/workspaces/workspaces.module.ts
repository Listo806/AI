import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { WorkspacesController } from './workspaces.controller';
import { WorkspaceEntitlementsService } from './workspace-entitlements.service';
import { WorkspaceLockGuard } from './workspace-lock.guard';

// Owns Workspace instances/entitlements and access enforcement. Customer-facing
// Workspace selection is linked directly to the account's active CRM subscription;
// legacy Paddle-backed entitlement methods remain available for existing records
// and webhook compatibility.
@Module({
  imports: [DatabaseModule],
  controllers: [WorkspacesController],
  providers: [WorkspaceEntitlementsService, WorkspaceLockGuard],
  exports: [WorkspaceEntitlementsService, WorkspaceLockGuard],
})
export class WorkspacesModule {}
