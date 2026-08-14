import { SetMetadata } from '@nestjs/common';

// Marks a controller/route as belonging to a paid Workspace. The
// WorkspaceLockGuard reads this to decide whether the caller needs an active
// entitlement (only when that workspace's lock is turned on).
export const WORKSPACE_KEY = 'requiresWorkspace';
export const RequiresWorkspace = (workspaceId: string) =>
  SetMetadata(WORKSPACE_KEY, workspaceId);
