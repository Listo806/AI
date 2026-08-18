// Catalog of paid Workspaces. Each Workspace is a $97/month add-on, purchased as
// its own separate Paddle subscription and unlocked per account via a
// workspace_entitlements row. This registry is the single source of truth for:
//   - which workspace ids are valid to purchase / grant (webhook + checkout guard)
//   - the feature key each workspace maps to (used by enforcement, Slice 2)
//   - the frontend route each workspace lives at
//
// `featureKey` intentionally lines up with the frontend FEATURE_TO_ADDON map and
// the plan feature flags so enforcement can be switched on one workspace at a time
// without touching this file.

export interface WorkspaceDef {
  id: string;
  name: string;
  featureKey: string;
  route: string;
}

export const WORKSPACE_CATALOG: WorkspaceDef[] = [
  {
    id: 'sales',
    name: 'Sales Workspace',
    featureKey: 'salesWorkspace',
    route: '/dashboard/sales-workspace',
  },
  {
    id: 'insurance',
    name: 'Insurance Workspace',
    featureKey: 'insuranceWorkspace',
    route: '/dashboard/insurance-workspace',
  },
  {
    // Client-required workspace id uses an underscore. The route keeps its
    // existing hyphenated path.
    id: 'financial_services',
    name: 'Financial Services Workspace',
    featureKey: 'financialWorkspace',
    route: '/dashboard/financial-services',
  },
  {
    id: 'customer-service',
    name: 'Customer Service Workspace',
    featureKey: 'customerServiceWorkspace',
    route: '/dashboard/customer-service-workspace',
  },
  {
    id: 'marketing',
    name: 'Marketing Workspace',
    featureKey: 'marketingWorkspace',
    route: '/dashboard/marketing-workspace',
  },
  {
    id: 'projects',
    name: 'Projects Workspace',
    featureKey: 'projectsWorkspace',
    route: '/dashboard/projects-workspace',
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce Workspace',
    featureKey: 'ecommerceWorkspace',
    route: '/dashboard/e-commerce-workspace',
  },
  {
    id: 'real-estate',
    name: 'Real Estate Workspace',
    featureKey: 'realEstateWorkspace',
    route: '/dashboard/properties',
  },
  {
    id: 'team',
    name: 'Team Workspace',
    featureKey: 'teamWorkspace',
    route: '/dashboard/team',
  },
  {
    id: 'lead-generator',
    name: 'Lead Generator Workspace',
    featureKey: 'leadGenerator',
    route: '/dashboard/generator',
  },
];

const BY_ID: Record<string, WorkspaceDef> = WORKSPACE_CATALOG.reduce(
  (acc, w) => {
    acc[w.id] = w;
    return acc;
  },
  {} as Record<string, WorkspaceDef>,
);

/** Normalize an incoming workspace id (trim + lowercase) for lookups. */
export function normalizeWorkspaceId(raw: unknown): string {
  return String(raw ?? '').trim().toLowerCase();
}

export function getWorkspace(id: unknown): WorkspaceDef | null {
  return BY_ID[normalizeWorkspaceId(id)] || null;
}

export function isValidWorkspaceId(id: unknown): boolean {
  return !!BY_ID[normalizeWorkspaceId(id)];
}

// GLOBAL WORKSPACE ENTITLEMENT RULE:
// Every paid Workspace is its OWN $97/month add-on, separate from the base CRM
// plan. Workspaces are NOT included in Free / Solo / Business / Scale. So every
// workspace is LOCKED by default for every account, and access is granted ONLY by
// a verified workspace entitlement (or platform support / super_admin).
//
// Escape hatch: WORKSPACE_UNLOCKED_IDS (comma-separated ids) can force-unlock a
// specific workspace for everyone if ever needed operationally. Empty by default,
// so the default is "all paid workspaces locked".
export function getUnlockedWorkspaceIds(): string[] {
  const raw = process.env.WORKSPACE_UNLOCKED_IDS || '';
  return raw
    .split(',')
    .map((s) => normalizeWorkspaceId(s))
    .filter((id) => !!BY_ID[id]);
}

// The set of workspaces enforced behind the add-on right now = every catalog
// workspace that has not been explicitly unlocked via the escape hatch.
export function getLockedWorkspaceIds(): string[] {
  const unlocked = new Set(getUnlockedWorkspaceIds());
  return WORKSPACE_CATALOG.map((w) => w.id).filter((id) => !unlocked.has(id));
}

export function isWorkspaceLocked(id: unknown): boolean {
  const wid = normalizeWorkspaceId(id);
  if (!BY_ID[wid]) return false; // unknown id -> not a gated workspace route
  return !getUnlockedWorkspaceIds().includes(wid); // locked unless explicitly unlocked
}
