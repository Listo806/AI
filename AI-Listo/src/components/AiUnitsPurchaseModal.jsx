import { useState, useEffect, useRef, useCallback } from "react";
import aiUnitsApi from "../api/aiUnitsApi";
import { initPaddle, openWorkspaceCheckout } from "../pages/checkout/paddleCheckout";
import { fetchPaddleConfig } from "../api/paddleApi";
import "./AiUnitsPurchaseModal.css";

const FALLBACK_PACKAGES = [
  { id: "boost", units: 500, price: 27 },
  { id: "plus", units: 1000, price: 47 },
  { id: "max", units: 2000, price: 77 },
];

/**
 * "Get More AI" purchase selector. Opened via the `cortexa:open-ai-units`
 * window event (dispatched from the sidebar Get More AI link, Free accounts
 * only). Choosing a package opens the existing Paddle checkout for that exact
 * one-time price; the webhook credits the units and the sidebar refreshes.
 */
export default function AiUnitsPurchaseModal() {
  const [open, setOpen] = useState(false);
  const [packages, setPackages] = useState(FALLBACK_PACKAGES);
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState(null);
  const paddleReady = useRef(false);

  useEffect(() => {
    const onOpen = () => {
      setMsg(null);
      setOpen(true);
    };
    window.addEventListener("cortexa:open-ai-units", onOpen);
    return () => window.removeEventListener("cortexa:open-ai-units", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    aiUnitsApi
      .getConfig()
      .then((c) => {
        if (c?.packages?.length) setPackages(c.packages);
      })
      .catch(() => {});
  }, [open]);

  const ensurePaddle = useCallback(async () => {
    if (paddleReady.current) return true;
    const cfg = await fetchPaddleConfig();
    if (!cfg?.clientToken) return false;
    await initPaddle(cfg, (ev) => {
      if (ev?.name === "checkout.completed") {
        setMsg("Payment received. Updating your balance…");
        // The webhook credits asynchronously; nudge the sidebar a few times.
        [2000, 6000, 12000].forEach((d) =>
          setTimeout(() => window.dispatchEvent(new Event("cortexa:ai-units-refresh")), d),
        );
        setTimeout(() => setOpen(false), 1600);
      }
    });
    paddleReady.current = true;
    return true;
  }, []);

  const buy = useCallback(
    async (packageId) => {
      setBusy(packageId);
      setMsg(null);
      try {
        const co = await aiUnitsApi.getCheckout(packageId);
        if (!co?.configured) {
          setMsg(co?.message || "Purchases are not available yet.");
          return;
        }
        const ok = await ensurePaddle();
        if (!ok) {
          setMsg("Checkout is not available right now. Please try again shortly.");
          return;
        }
        openWorkspaceCheckout({ priceId: co.priceId, customData: co.customData, email: co.email });
      } catch (e) {
        setMsg(e?.message || "Could not open checkout.");
      } finally {
        setBusy(null);
      }
    },
    [ensurePaddle],
  );

  if (!open) return null;

  return (
    <div className="aiu-modal-overlay" onClick={() => setOpen(false)}>
      <div className="aiu-modal" role="dialog" aria-label="Get More AI" onClick={(e) => e.stopPropagation()}>
        <div className="aiu-modal-head">
          <h3>Get More AI</h3>
          <button className="aiu-modal-close" onClick={() => setOpen(false)} aria-label="Close">
            ✕
          </button>
        </div>
        <p className="aiu-modal-sub">Keep working with Cortexa AI by adding more AI Units.</p>
        <div className="aiu-packs">
          {packages.map((p) => (
            <button
              key={p.id}
              className="aiu-pack"
              disabled={busy === p.id}
              onClick={() => buy(p.id)}
            >
              <span className="aiu-pack-units">{Number(p.units).toLocaleString()} AI Units</span>
              <span className="aiu-pack-price">${p.price}</span>
            </button>
          ))}
        </div>
        {msg && <div className="aiu-modal-msg">{msg}</div>}
      </div>
    </div>
  );
}
