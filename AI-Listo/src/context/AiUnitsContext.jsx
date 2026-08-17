import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import aiUnitsApi from "../api/aiUnitsApi";

// Single frontend source of truth for the AI Units balance. Mounted once at the
// dashboard shell so the sidebar meter and the global HUD share one value, and
// so any AI action can trigger a refresh via the `cortexa:ai-units-refresh`
// window event. Refreshes on focus and on a light interval for cross-device sync.
const AiUnitsContext = createContext(null);

const EMPTY = {
  balance: null,
  config: null,
  loading: true,
  refresh: () => {},
  showHud: false,
  unlimited: false,
};

export function AiUnitsProvider({ children }) {
  const [balance, setBalance] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const b = await aiUnitsApi.getBalance();
      if (mounted.current && b) setBalance(b);
    } catch {
      /* keep the last known balance on transient errors */
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      try {
        const [b, c] = await Promise.all([
          aiUnitsApi.getBalance().catch(() => null),
          aiUnitsApi.getConfig().catch(() => null),
        ]);
        if (!mounted.current) return;
        if (b) setBalance(b);
        if (c) setConfig(c);
      } finally {
        if (mounted.current) setLoading(false);
      }
    })();

    const onFocus = () => refresh();
    const onRefresh = () => refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener("cortexa:ai-units-refresh", onRefresh);
    const iv = setInterval(refresh, 45000);

    return () => {
      mounted.current = false;
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("cortexa:ai-units-refresh", onRefresh);
      clearInterval(iv);
    };
  }, [refresh]);

  const value = {
    balance,
    config,
    loading,
    refresh,
    showHud: !!balance?.showHud,
    unlimited: !!balance?.unlimited,
  };

  return <AiUnitsContext.Provider value={value}>{children}</AiUnitsContext.Provider>;
}

export function useAiUnits() {
  return useContext(AiUnitsContext) || EMPTY;
}
