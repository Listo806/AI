import { useCallback, useEffect, useRef, useState } from "react";
import { setupApi } from "./setupApi";

export function useSetup() {
  const [data, setData] = useState(null);
  const [state, setState] = useState("");
  const timer = useRef(null);
  const dataRef = useRef(null);

  const applyData = useCallback((next) => {
    dataRef.current = next;
    setData(next);
    return next;
  }, []);

  const load = useCallback(async () => {
    const next = await setupApi.get();
    return applyData(next);
  }, [applyData]);

  useEffect(() => {
    load().catch((e) => setState(e?.message || "Unable to load setup"));
    return () => clearTimeout(timer.current);
  }, [load]);

  const save = useCallback((patch, immediate = false) => {
    setData((current) => {
      if (!current) return current;
      const optimistic = {
        ...current,
        selected_objective:
          patch.selectedObjective ?? current.selected_objective,
        config: { ...(current.config || {}), ...patch },
      };
      dataRef.current = optimistic;
      return optimistic;
    });

    clearTimeout(timer.current);

    const go = async () => {
      try {
        setState("Saving…");
        // IMPORTANT: use workspace_id returned by GET, not a possibly stale
        // localStorage value. This is what fixes PATCH /setup 403 in this flow.
        const workspaceId =
          dataRef.current?.workspace_id &&
          dataRef.current.workspace_id !== "default"
            ? dataRef.current.workspace_id
            : "";

        const next = await setupApi.save(patch, workspaceId);
        applyData(next);
        setState("All changes saved");
      } catch (e) {
        setState(e?.message || "Unable to save — Try again");
      }
    };

    if (immediate) return go();
    timer.current = setTimeout(go, 500);
  }, [applyData]);

  return { data, state, save, load };
}
