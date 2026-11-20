// Routes are existing CRM workspace routes, not external demo pages.
export const WORKSPACE_ROUTES = Object.freeze({
  'business-suite': '/dashboard/business-workspace',
  sales: '/dashboard/sales-workspace',
  'e-commerce': '/dashboard/e-commerce-workspace',
  'customer-service': '/dashboard/customer-service-workspace',
  team: '/dashboard/team',
  'real-estate': '/dashboard/real-estate-workspace',
  financial_services: '/dashboard/financial-services',
  insurance: '/dashboard/insurance-workspace',
  'aesthetic-wellness': '/dashboard/aesthetic-wellness',
  'clinic-medical': '/dashboard/clinic-medical',
});
export const selectedWorkspaceRoute = (user) => WORKSPACE_ROUTES[user?.selectedWorkspaceId] || null;
