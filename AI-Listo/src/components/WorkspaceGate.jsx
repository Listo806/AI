import { useEffect, useRef, useState } from "react";
import { Lock, ShieldCheck, RefreshCw } from "lucide-react";
import workspaceApi from "../api/workspaceApi";
import WorkspaceSkeleton from "./WorkspaceSkeleton";
import { fetchPaddleConfig } from "../api/paddleApi";
import { initPaddle, openWorkspaceCheckout } from "../pages/checkout/paddleCheckout";

// Access gate for a paid Workspace. It fails OPEN: if the workspace's lock is off
// (the default), the account is entitled, or the access check errors, the
// workspace renders normally. It shows the purchase screen ONLY when the server
// says the workspace is locked and this account is not entitled — so no existing
// customer is ever blocked until the client turns a lock on.

let accessCache = null; // { at, promise }
const ACCESS_TTL = 30000;

function loadAccessMap(force = false) {
  const now = Date.now();
  if (!force && accessCache && now - accessCache.at < ACCESS_TTL) {
    return accessCache.promise;
  }
  const promise = workspaceApi
    .getAccess()
    .then((res) => {
      const map = {};
      (res?.workspaces || []).forEach((w) => {
        map[w.id] = w;
      });
      return map;
    })
    .catch(() => null); // fail open: no info -> treat as accessible
  accessCache = { at: now, promise };
  return promise;
}

export default function WorkspaceGate({ workspaceId, children }) {
  const [loading, setLoading] = useState(true);
  const [ws, setWs] = useState(null);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState("");
  const paddleReady = useRef(false);
  const timers = useRef([]);

  const refresh = (force) => {
    return loadAccessMap(force).then((map) => {
      // map === null -> access check failed; fail open by leaving ws null.
      setWs(map ? map[workspaceId] || null : null);
      setLoading(false);
    });
  };

  useEffect(() => {
    setLoading(true);
    refresh(false);
    return () => timers.current.forEach((t) => clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  if (loading) {
    return <WorkspaceSkeleton />;
  }

  // Fail open: unknown workspace, no access info, or accessible -> render it.
  if (!ws || ws.accessible) return children;

  const scheduleRefresh = () => {
    [3000, 8000, 15000].forEach((ms) => {
      const t = setTimeout(() => refresh(true), ms);
      timers.current.push(t);
    });
  };

  const buy = async () => {
    setBuying(true);
    setError("");
    try {
      const intent = await workspaceApi.purchase(workspaceId);
      if (intent?.alreadyEntitled) {
        await refresh(true);
        return;
      }
      // Included with the plan (e.g. the $257 Business promo's one free
      // workspace): comped server-side with no charge — refresh, never open Paddle.
      if (intent?.comped) {
        await refresh(true);
        return;
      }
      const cfg = await fetchPaddleConfig();
      if (!cfg?.clientToken) {
        setError("Checkout is not available right now. Please try again shortly.");
        return;
      }
      if (!paddleReady.current) {
        await initPaddle(cfg, (ev) => {
          if (ev?.name === "checkout.completed") scheduleRefresh();
        });
        paddleReady.current = true;
      }
      openWorkspaceCheckout({
        priceId: intent.priceId,
        customData: intent.customData,
        email: intent.email,
      });
      scheduleRefresh();
    } catch (e) {
      // Non-admins can't purchase (billing action); surface a helpful message.
      const msg = e?.message || "Could not start checkout.";
      setError(
        /admin/i.test(msg)
          ? "Only an account admin can add this workspace. Please ask your admin."
          : msg,
      );
    } finally {
      setBuying(false);
    }
  };

  return (
    <div style={ST.wrap}>
      <div style={ST.card}>
        <div style={ST.iconWrap}>
          <Lock size={26} />
        </div>
        <h2 style={ST.title}>{ws.name} is a paid workspace</h2>
        <p style={ST.sub}>
          Unlock {ws.name} for your whole account with the workspace add-on. It is
          billed separately and does not change your base plan.
        </p>
        <div style={ST.price}>
          <span style={ST.priceAmt}>$97</span>
          <span style={ST.pricePer}>/month</span>
        </div>
        {error && <div style={ST.error}>{error}</div>}
        <button style={{ ...ST.btn, opacity: buying ? 0.6 : 1 }} disabled={buying} onClick={buy}>
          {buying ? "Opening…" : `Add ${ws.name}`}
        </button>
        <div style={ST.foot}>
          <ShieldCheck size={14} /> Secure checkout, cancel anytime
        </div>
      </div>
    </div>
  );
}

const ST = {
  loader: { display: "flex", alignItems: "center", gap: 8, padding: 40, color: "#64748b", fontSize: 14, justifyContent: "center" },
  wrap: { display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "48px 20px" },
  card: { maxWidth: 440, width: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "32px 28px", textAlign: "center", boxShadow: "0 10px 30px rgba(15,23,42,0.06)" },
  iconWrap: { width: 56, height: 56, borderRadius: 14, background: "#f1f5f9", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" },
  title: { fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" },
  sub: { fontSize: 14, color: "#64748b", margin: "0 0 18px", lineHeight: 1.5 },
  price: { display: "flex", alignItems: "baseline", justifyContent: "center", gap: 3, marginBottom: 18 },
  priceAmt: { fontSize: 30, fontWeight: 800, color: "#0f172a" },
  pricePer: { fontSize: 14, color: "#64748b" },
  error: { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 8, padding: "9px 12px", fontSize: 13, marginBottom: 12 },
  btn: { width: "100%", border: "none", background: "#0f172a", color: "#fff", borderRadius: 10, padding: "12px 18px", fontSize: 15, fontWeight: 600, cursor: "pointer" },
  foot: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14, fontSize: 12, color: "#94a3b8" },
};
