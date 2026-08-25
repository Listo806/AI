import { useEffect, useRef, useState } from "react";
import { Check, Lock, RefreshCw } from "lucide-react";
import workspaceApi from "../api/workspaceApi";
import { fetchPaddleConfig } from "../api/paddleApi";
import { initPaddle, openWorkspaceCheckout } from "../pages/checkout/paddleCheckout";

// Billing surface for the paid Workspace add-ons. Each Workspace is its own
// $97/month Paddle subscription, unlocked per account by a workspace entitlement.
// Buying opens the Paddle checkout; the signature-verified webhook grants the
// entitlement server-side, so after checkout completes we refresh a few times to
// pick up the grant. Enforcement (locking the workspaces) is a separate step; this
// panel only manages purchasing/entitlement visibility.
export default function WorkspaceAddOns() {
  const [catalog, setCatalog] = useState(null);
  const [activeIds, setActiveIds] = useState([]);
  const [includedCredits, setIncludedCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const paddleReadyRef = useRef(false);
  const refreshTimers = useRef([]);

  const loadEntitlements = async () => {
    try {
      const res = await workspaceApi.getEntitlements();
      setActiveIds(res?.activeWorkspaceIds || []);
      setIncludedCredits(Number(res?.includedWorkspaceCredits) || 0);
    } catch {
      // keep last-good on transient error
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [cat, ent] = await Promise.all([
          workspaceApi.getCatalog(),
          workspaceApi.getEntitlements(),
        ]);
        if (!alive) return;
        setCatalog(cat);
        setActiveIds(ent?.activeWorkspaceIds || []);
        setIncludedCredits(Number(ent?.includedWorkspaceCredits) || 0);
      } catch (e) {
        if (alive) setError("Could not load workspace add-ons.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
      refreshTimers.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  // The webhook grants access a moment after Paddle confirms payment, so re-check
  // entitlements a few times after checkout completes rather than once.
  const scheduleRefresh = () => {
    refreshTimers.current.forEach((t) => clearTimeout(t));
    refreshTimers.current = [3000, 8000, 15000].map((ms) =>
      setTimeout(loadEntitlements, ms),
    );
  };

  const ensurePaddle = async () => {
    if (paddleReadyRef.current) return true;
    const cfg = await fetchPaddleConfig();
    if (!cfg?.clientToken) return false;
    await initPaddle(cfg, (ev) => {
      if (ev?.name === "checkout.completed") scheduleRefresh();
    });
    paddleReadyRef.current = true;
    return true;
  };

  const buy = async (workspace) => {
    setBusyId(workspace.id);
    setError("");
    try {
      const intent = await workspaceApi.purchase(workspace.id);
      // Comped by an included-workspace credit (e.g. the $257 promo): activated
      // server-side with no charge — just refresh, never open Paddle.
      if (intent?.comped || intent?.alreadyEntitled) {
        await loadEntitlements();
        return;
      }
      const ok = await ensurePaddle();
      if (!ok) {
        setError("Checkout is not available right now. Please try again shortly.");
        return;
      }
      openWorkspaceCheckout({
        priceId: intent.priceId,
        customData: intent.customData,
        email: intent.email,
      });
      scheduleRefresh();
    } catch (e) {
      setError(e?.message || "Could not start checkout.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="crm-section" style={{ marginBottom: 24 }}>
        <h2 style={ST.h2}>Workspace Add-Ons</h2>
        <p style={{ color: "#64748b", fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  const workspaces = catalog?.workspaces || [];
  const unavailable = catalog && catalog.available === false;

  return (
    <div className="crm-section" style={{ marginBottom: 24 }}>
      <div style={ST.head}>
        <div>
          <h2 style={ST.h2}>Workspace Add-Ons</h2>
          <p style={ST.sub}>
            Each workspace is its own ${catalog?.monthlyPrice || 97}/month add-on. Buy,
            cancel, or manage each one on its own without touching your base plan.
          </p>
        </div>
        <button style={ST.refresh} onClick={loadEntitlements} title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {error && <div style={ST.error}>{error}</div>}
      {unavailable && (
        <div style={ST.notice}>
          Workspace add-ons are being finalized and cannot be purchased yet.
        </div>
      )}
      {includedCredits > 0 && (
        <div style={ST.included}>
          🎁 Your plan includes{" "}
          <b>
            {includedCredits} free workspace{includedCredits > 1 ? "s" : ""}
          </b>{" "}
          — choose any one below to activate it at no extra cost. Additional
          workspaces are ${catalog?.monthlyPrice || 97}/month each.
        </div>
      )}

      <div style={ST.list}>
        {workspaces.map((w) => {
          const active = activeIds.includes(w.id);
          const canInclude = !active && includedCredits > 0;
          return (
            <div key={w.id} style={ST.card}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {active ? (
                  <span style={ST.iconActive}>
                    <Check size={16} />
                  </span>
                ) : (
                  <span style={ST.iconLocked}>
                    <Lock size={14} />
                  </span>
                )}
                <div>
                  <div style={ST.name}>{w.name}</div>
                  <div style={ST.state}>
                    {active ? "Active" : "Not active"}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={ST.price}>
                  {canInclude ? (
                    <>
                      <span style={ST.priceStrike}>
                        ${catalog?.monthlyPrice || 97}
                      </span>
                      <span style={ST.priceIncluded}>Included</span>
                    </>
                  ) : (
                    <>
                      <span style={ST.priceAmt}>${catalog?.monthlyPrice || 97}</span>
                      <span style={ST.pricePer}>/mo</span>
                    </>
                  )}
                </div>
                {active ? (
                  <span style={ST.activePill}>Active</span>
                ) : canInclude ? (
                  <button
                    style={{ ...ST.includeBtn, opacity: busyId === w.id ? 0.6 : 1 }}
                    disabled={busyId === w.id}
                    onClick={() => buy(w)}
                  >
                    {busyId === w.id ? "Activating…" : "Activate — included free"}
                  </button>
                ) : (
                  <button
                    style={{
                      ...ST.buyBtn,
                      opacity: unavailable || busyId === w.id ? 0.6 : 1,
                    }}
                    disabled={unavailable || busyId === w.id}
                    onClick={() => buy(w)}
                  >
                    {busyId === w.id ? "Opening…" : "Add workspace"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ST = {
  head: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  h2: { margin: 0, fontSize: 20, fontWeight: 600 },
  sub: { margin: "6px 0 0", color: "#64748b", fontSize: 13, maxWidth: 620 },
  refresh: {
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 8,
    padding: 8,
    cursor: "pointer",
    color: "#475569",
    display: "flex",
  },
  error: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 13,
    marginBottom: 12,
  },
  notice: {
    background: "#f8fafc",
    color: "#475569",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 13,
    marginBottom: 12,
  },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    background: "#fff",
    flexWrap: "wrap",
  },
  iconActive: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: "#dcfce7",
    color: "#16a34a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  iconLocked: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: "#f1f5f9",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 15, fontWeight: 600, color: "#0f172a" },
  state: { fontSize: 12, color: "#64748b" },
  price: { display: "flex", alignItems: "baseline", gap: 4, color: "#0f172a" },
  priceAmt: { fontSize: 16, fontWeight: 700 },
  pricePer: { fontSize: 12, color: "#64748b" },
  priceStrike: { fontSize: 13, color: "#94a3b8", textDecoration: "line-through" },
  priceIncluded: { fontSize: 13, fontWeight: 700, color: "#16a34a" },
  included: {
    background: "#f5f3ff",
    color: "#5b21b6",
    border: "1px solid #ddd6fe",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 1.5,
  },
  includeBtn: {
    border: "none",
    background: "#6d5cf0",
    color: "#fff",
    borderRadius: 8,
    padding: "9px 16px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  activePill: {
    fontSize: 12,
    fontWeight: 600,
    color: "#16a34a",
    background: "#dcfce7",
    borderRadius: 999,
    padding: "6px 12px",
  },
  buyBtn: {
    border: "none",
    background: "#0f172a",
    color: "#fff",
    borderRadius: 8,
    padding: "9px 16px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
};
