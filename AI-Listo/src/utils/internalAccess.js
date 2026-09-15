/**
 * Cortexa INTERNAL staff (platform administrators and developers), as reported
 * by the backend: an active internal_user_access role, or a privileged
 * customer-side role. Internal accounts are exempt from every customer billing
 * check: activation fee, trial, subscription state and checkout redirects.
 */
export function isInternalAccount(user) {
  if (!user) return false;
  if (user.isInternal === true || user.internalRole) return true;
  return ["super_admin", "admin", "developer"].includes(
    String(user.role || "").toLowerCase(),
  );
}
