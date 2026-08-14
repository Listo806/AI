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
    id: 'financial-services',
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
