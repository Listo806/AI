import { useCallback, useEffect, useRef, useState } from "react";
import { setupApi } from "./setupApi";

const NESTED_GROUPS = new Set([
  "website","phone","whatsapp","marketing","consent",
  "conversion","routing","handoff",
]);

const mergePatchIntoSetup = (current, patch) => {
  if (!current) return current;
  const nextConfig = { ...(current.config || {}) };

  for (const [key, value] of Object.entries(patch || {})) {
    if (key === "selectedObjective") continue;
    if (
      NESTED_GROUPS.has(key) &&
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      nextConfig[key] = {
        ...(nextConfig[key] || {}),
        ...value,
      };
    } else {
      nextConfig[key] = value;
    }
  }

  return {
    ...current,
    selected_objective:
      patch?.selectedObjective ?? current.selected_objective,
    config: nextConfig,
  };
};

export function useSetup() {
  const [data, setData] = useState(null);
  const [state, setState] = useState("");
  const timer = useRef(null);
  const dataRef = useRef(null);
  const pendingRef = useRef({});
  const saveChainRef = useRef(Promise.resolve());

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

  const mergePending = useCallback((base, patch) => {
    const next = { ...(base || {}) };
    for (const [key, value] of Object.entries(patch || {})) {
      if (
        NESTED_GROUPS.has(key) &&
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        next[key] = { ...(next[key] || {}), ...value };
      } else {
        next[key] = value;
      }
    }
    return next;
  }, []);

  const flush = useCallback(() => {
    const payload = pendingRef.current;
    pendingRef.current = {};
    if (!Object.keys(payload).length) return saveChainRef.current;

    saveChainRef.current = saveChainRef.current.then(async () => {
      try {
        setState("Saving…");

        const workspaceId =
          dataRef.current?.workspace_id &&
          dataRef.current.workspace_id !== "default"
            ? dataRef.current.workspace_id
            : "";

        const next = await setupApi.save(payload, workspaceId);

        // Preserve any optimistic changes queued while this request was in flight.
        const stillPending = pendingRef.current;
        const reconciled = Object.keys(stillPending).length
          ? mergePatchIntoSetup(next, stillPending)
          : next;

        applyData(reconciled);
        setState("All changes saved");
        return reconciled;
      } catch (e) {
        // Put the payload back so the next interaction can retry it.
        pendingRef.current = mergePending(payload, pendingRef.current);
        setState(e?.message || "Unable to save — Try again");
        throw e;
      }
    }).catch(() => {});

    return saveChainRef.current;
  }, [applyData, mergePending]);

  const save = useCallback((patch, immediate = false) => {
    pendingRef.current = mergePending(pendingRef.current, patch);

    setData((current) => {
      const optimistic = mergePatchIntoSetup(current, patch);
      dataRef.current = optimistic;
      return optimistic;
    });

    clearTimeout(timer.current);
    if (immediate) return flush();

    timer.current = setTimeout(() => {
      flush();
    }, 500);
  }, [flush, mergePending]);

  return { data, state, save, load };
}
