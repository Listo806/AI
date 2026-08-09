import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getPlanUsage } from "../api/platformApi";
import { useAuth } from "./AuthContext";

// Shares the current account's plan, limits, usage, and effective feature access
// across the dashboard from a single /plans/usage fetch. The backend is the sole
// source of truth (it applies the same grandfathering rule), so the client lock
// UI can never disagree with what the API actually enforces.
const PlanContext = createContext(null);

export function PlanProvider({ children }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await getPlanUsage();
      setData(res || null);
    } catch {
      // Fail OPEN: if we cannot resolve the plan, treat as full access so a
      // network/API hiccup never wrongly locks a user out of a feature.
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    refresh();
  }, [user, refresh]);

  // Only lock when we positively know the account is Free AND the feature is off
  // for Free. Unknown / still loading / any paid account => allowed (fail open).
  const hasFeature = useCallback(
    (key) => {
      if (!data || !data.isFree) return true;
      const f = data.features || {};
      return key in f ? !!f[key] : true;
    },
    [data],
  );

  const value = {
    loading,
    plan: data?.plan || null,
    planLabel: data?.planLabel || null,
    isFree: !!data?.isFree,
    features: data?.features || null,
    limits: data?.limits || null,
    usage: data?.usage || null,
    hasFeature,
    refresh,
  };

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

// Safe default when no provider is mounted: permissive (fail open) so consumers
// never crash or wrongly lock outside the dashboard tree.
const PERMISSIVE = {
  loading: false,
  plan: null,
  planLabel: null,
  isFree: false,
  features: null,
  limits: null,
  usage: null,
  hasFeature: () => true,
  refresh: () => {},
};

export function usePlan() {
  return useContext(PlanContext) || PERMISSIVE;
}
