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

// Enforces the paid Workspace add-on for a controller/route marked with
// @RequiresWorkspace(id). Every paid Workspace is LOCKED by default (see
// isWorkspaceLocked), so the caller's team MUST hold an active entitlement for that
// workspace to pass. Workspaces are never included in the base CRM plan. Platform
// support (super_admin) is always allowed. The WORKSPACE_UNLOCKED_IDS escape hatch
// can force-open a specific workspace operationally if ever required.
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

    // Resolve the team owner-aware: owners often have users.team_id = NULL and own
    // the team via teams.owner_id, so never key on user.teamId alone.
    const teamId = await this.entitlements.resolveTeamId(user);
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
