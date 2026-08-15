import React from "react";
import { useAuth } from "../context/AuthContext";
import { usePlan } from "../context/PlanContext";
import FeatureLockScreen from "./FeatureLock";

const FEATURE_BYPASS_ROLES = new Set([
  "super_admin",
  "super-admin",
]);

export default function FeatureRoute({
  feature,
  title,
  description,
  children,
}) {
  const { user, loading: authLoading } = useAuth();
  const plan = usePlan();

  const role = String(user?.role || "")
    .trim()
    .toLowerCase();

  // Super Admin must never be blocked by plan/feature locks.
  const bypassFeatureLock = FEATURE_BYPASS_ROLES.has(role);

  if (authLoading) {
    return null;
  }

  if (bypassFeatureLock) {
    return children;
  }

  if (!plan?.hasFeature?.(feature)) {
    return (
      <FeatureLockScreen
        feature={feature}
        title={title}
        description={description}
      />
    );
  }

  return children;
}