import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PaymentGuard } from '../auth/guards/payment.guard';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

// Projects / Client Delivery Workspace module. Reuses the shared DatabaseService,
// the CRM PaymentGuard, and the WorkspaceLockGuard (from WorkspacesModule) to
// enforce the $97 add-on when its lock is on. It reads/writes the SAME shared
// tables used by the Team Workspace (projects, team_tasks, team_time_entries,
// stored_files, contacts, events) — no duplicate tenant/auth/task systems.
@Module({
  imports: [DatabaseModule, WorkspacesModule],
  controllers: [ProjectsController],
  providers: [PaymentGuard, ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
