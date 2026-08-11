import React from "react";
import { usePlan } from "../context/PlanContext";
import { FeatureLockScreen } from "./FeatureLock";

// Route-level plan gate. Renders the feature for anyone who is allowed, and the
// upgrade lock screen for a Free account that lacks the feature. Fails OPEN: the
// plan hook returns "allowed" while loading or on error, so a hiccup never locks
// a real user out. Paid/legacy accounts are always allowed (grandfathered).
export default function FeatureRoute({ feature, title, description, children }) {
  const { loading, hasFeature } = usePlan();

  // Avoid flashing the real feature before the plan resolves.
  if (loading) return null;

  if (!hasFeature(feature)) {
    return <FeatureLockScreen feature={feature} title={title} description={description} />;
  }
  return children;
}
