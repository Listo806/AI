import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WORKSPACE_KEY } from './requires-workspace.decorator';
import { WorkspaceEntitlementsService } from './workspace-entitlements.service';
import { isWorkspaceLocked, getWorkspace } from './workspace-registry';

// Enforces the paid Workspace add-on for a controller marked with
// @RequiresWorkspace(id). It is a NO-OP unless that workspace's lock is turned on
// (via WORKSPACE_LOCKED_IDS), so it changes nothing for existing customers until
// the client explicitly enables the lock. When enabled, the caller's team must
// hold an active entitlement for that workspace; platform support (super_admin) is
// always allowed.
@Injectable()
export class WorkspaceLockGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlements: WorkspaceEntitlementsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const workspaceId = this.reflector.getAllAndOverride<string>(WORKSPACE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!workspaceId) return true; // not a gated workspace route

    // Lock off -> open to everyone (current behavior).
    if (!isWorkspaceLocked(workspaceId)) return true;

    const req = context.switchToHttp().getRequest();
    const user = req?.user;
    const role = String(user?.role || '').toLowerCase();
    if (role === 'super_admin') return true; // platform support

    const teamId = user?.teamId || null;
    const has = teamId
      ? await this.entitlements.hasActiveEntitlement(teamId, workspaceId)
      : false;
    if (has) return true;

    const name = getWorkspace(workspaceId)?.name || 'This workspace';
    throw new ForbiddenException({
      message: `${name} requires the $97/month workspace add-on.`,
      code: 'workspace_addon_required',
      workspaceId,
    });
  }
}
