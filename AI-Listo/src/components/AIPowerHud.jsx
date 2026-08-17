import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAiUnits } from "../context/AiUnitsContext";
import aiUnitsApi from "../api/aiUnitsApi";
import { initPaddle, openWorkspaceCheckout } from "../pages/checkout/paddleCheckout";
import { fetchPaddleConfig } from "../api/paddleApi";
import { trackEvent } from "../utils/track";
import "./AIPowerHud.css";

const COLOR_CLASS = { green: "green", yellow: "yellow", red: "red", empty: "red" };
const LOW_SESSION_KEY = "cortexa_ai_low_shown";

function fmtReset(ymd) {
  if (!ymd) return "";
  try {
    const d = new Date(`${ymd}T00:00:00Z`);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
  } catch {
    return ymd;
  }
}

/**
 * Global translucent AI Power HUD. Mounted once at the dashboard shell so it
 * persists across every screen on desktop and mobile. Rendered only for
 * limited-AI (Free) accounts; unlimited paid plans never see it.
 */
export default function AIPowerHud() {
  const { balance, config, showHud, refresh } = useAiUnits();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [showPacks, setShowPacks] = useState(false);
  const [buying, setBuying] = useState(null);
  const [msg, setMsg] = useState(null);
  const [previewState, setPreviewState] = useState(null); // admin preview: null | full | warm | low | zero
  const paddleReady = useRef(false);
  const shownRef = useRef(false);
  const zeroRef = useRef(false);

  // Funnel: HUD displayed (once per mount) + zero-balance reached.
  useEffect(() => {
    if (!showHud || !balance) return;
    if (!shownRef.current) {
      shownRef.current = true;
      trackEvent("ai_units_hud_shown", {
        remaining: balance.totalRemaining,
        color: balance.color,
      });
    }
    if ((balance.totalRemaining ?? 0) <= 0 && !zeroRef.current) {
      zeroRef.current = true;
      trackEvent("ai_units_zero_reached", {});
    }
  }, [showHud, balance]);

  // Low-balance auto-expand — at most once per browser session.
  useEffect(() => {
    if (!balance || !showHud) return;
    const low = (balance.percentRemaining ?? 100) <= (balance.lowThreshold ?? 20);
    if (low && !sessionStorage.getItem(LOW_SESSION_KEY)) {
      setExpanded(true);
      trackEvent("ai_units_low_shown", { remaining: balance.totalRemaining });
      try {
        sessionStorage.setItem(LOW_SESSION_KEY, "1");
      } catch {
        /* ignore storage errors */
      }
    }
  }, [balance, showHud]);

  const ensurePaddle = useCallback(async () => {
    if (paddleReady.current) return;
    const cfg = await fetchPaddleConfig();
    await initPaddle(cfg, (ev) => {
      if (ev?.name === "checkout.completed") {
        setShowPacks(false);
        setMsg("Payment received. Updating your balance…");
        [3000, 8000, 15000].forEach((d) => setTimeout(refresh, d));
      }
    });
    paddleReady.current = true;
  }, [refresh]);

  const buy = useCallback(
    async (packageId) => {
      setBuying(packageId);
      setMsg(null);
      trackEvent("ai_units_pack_selected", { packageId });
      try {
        const co = await aiUnitsApi.getCheckout(packageId);
        if (!co?.configured) {
          setMsg(co?.message || "Purchases are not available yet.");
          return;
        }
        await ensurePaddle();
        openWorkspaceCheckout({ priceId: co.priceId, customData: co.customData, email: co.email });
        trackEvent("ai_units_checkout_opened", { packageId });
      } catch (e) {
        setMsg(e?.message || "Could not open checkout.");
      } finally {
        setBuying(null);
      }
    },
    [ensurePaddle],
  );

  if (!showHud || !balance) return null;

  const isPreview = !!balance.preview;
  let colorClass = COLOR_CLASS[balance.color] || "green";
  let remaining = balance.totalRemaining ?? 0;
  let pct = Math.max(0, Math.min(100, balance.percentRemaining ?? 0));
  let zero = remaining <= 0;

  // Admin preview cycler: override only the VISUALS so every state can be
  // inspected without spending real units. Does not touch the real balance.
  if (isPreview && previewState) {
    const allowance = balance.freeAllowance || 50;
    if (previewState === "full") { pct = 100; colorClass = "green"; remaining = allowance; zero = false; }
    else if (previewState === "warm") { pct = 40; colorClass = "yellow"; remaining = Math.round(allowance * 0.4); zero = false; }
    else if (previewState === "low") { pct = 12; colorClass = "red"; remaining = Math.max(1, Math.round(allowance * 0.12)); zero = false; }
    else if (previewState === "zero") { pct = 0; colorClass = "red"; remaining = 0; zero = true; }
  }
  const packages =
    config?.packages && config.packages.length
      ? config.packages
      : [
          { id: "boost", units: 500, price: 27 },
          { id: "plus", units: 1000, price: 47 },
          { id: "max", units: 2000, price: 77 },
        ];

  return (
    <div className={`aipwr-root aipwr-${colorClass}`}>
      {isPreview && (
        <div className="aipwr-preview-strip">
          <span className="aipwr-preview-tag">PREVIEW</span>
          {[
            ["live", "Live"],
            ["full", "Full"],
            ["warm", "Warm"],
            ["low", "Low"],
            ["zero", "Zero"],
          ].map(([st, label]) => (
            <button
              key={st}
              className={(st === "live" && !previewState) || previewState === st ? "on" : ""}
              onClick={() => setPreviewState(st === "live" ? null : st)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {!expanded && (
        <button
          className="aipwr-compact"
          onClick={() => {
            setExpanded(true);
            trackEvent("ai_units_hud_expanded", { source: "compact" });
          }}
          aria-label="AI Power — open"
        >
          <span className="aipwr-title">AI POWER</span>
          <div className="aipwr-remaining">
            <b>{remaining}</b> AI Units left
          </div>
          <div className="aipwr-bar">
            <span style={{ width: `${pct}%` }} />
          </div>
          <span
            className="aipwr-getmore"
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(true);
              setShowPacks(true);
              trackEvent("ai_units_get_more_clicked", { source: "compact" });
            }}
          >
            Get More AI →
          </span>
        </button>
      )}

      {expanded && (
        <div className="aipwr-panel" role="dialog" aria-label="AI Power">
          <div className="aipwr-panel-head">
            <span className="aipwr-title">AI POWER</span>
            <button
              className="aipwr-close"
              onClick={() => {
                setExpanded(false);
                setShowPacks(false);
                setMsg(null);
              }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {!showPacks && (
            <>
              {zero ? (
                <div className="aipwr-zero-title">Monthly AI limit reached</div>
              ) : (
                <div className="aipwr-remaining big">
                  <b>{remaining}</b> AI Units remaining
                </div>
              )}
              <div className="aipwr-bar">
                <span style={{ width: `${pct}%` }} />
              </div>
              {zero && (
                <div className="aipwr-note">
                  Your Cortexa CRM stays available. Add more AI Units to keep using AI now, or wait
                  for your monthly reset.
                </div>
              )}
              {balance.resetDate && <div className="aipwr-reset">Resets {fmtReset(balance.resetDate)}</div>}
              <div className="aipwr-actions">
                <button
                  className="aipwr-btn primary"
                  onClick={() => {
                    setShowPacks(true);
                    trackEvent("ai_units_get_more_clicked", { source: "panel" });
                  }}
                >
                  Get More AI
                </button>
                <button
                  className="aipwr-btn ghost"
                  onClick={() => {
                    trackEvent("ai_units_solo_viewed", { source: "panel" });
                    navigate("/pricing");
                  }}
                >
                  View Solo
                </button>
              </div>
            </>
          )}

          {showPacks && (
            <div className="aipwr-packs">
              <div className="aipwr-packs-title">Add more AI Units</div>
              {packages.map((p) => (
                <button
                  key={p.id}
                  className="aipwr-pack"
                  disabled={buying === p.id}
                  onClick={() => buy(p.id)}
                >
                  <span className="aipwr-pack-units">{Number(p.units).toLocaleString()} AI Units</span>
                  <span className="aipwr-pack-price">${p.price}</span>
                </button>
              ))}
              <button
                className="aipwr-btn ghost full"
                onClick={() => {
                  trackEvent("ai_units_solo_viewed", { source: "packs" });
                  navigate("/pricing");
                }}
              >
                Upgrade to Solo · ${config?.soloPrice || 197}/mo
              </button>
            </div>
          )}

          {msg && <div className="aipwr-msg">{msg}</div>}
        </div>
      )}
    </div>
  );
}
