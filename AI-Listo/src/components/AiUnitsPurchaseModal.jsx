import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Box, X, ChevronRight, Lock } from "lucide-react";
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
 * "Get More AI Units" purchase selector. Opened via the `cortexa:open-ai-units`
 * window event (from the sidebar Get More AI link — Free accounts only).
 * Choosing a package opens the existing Paddle checkout for that exact one-time
 * price; the webhook credits the units and the sidebar refreshes.
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
    <div className="aiu-ov" onClick={() => setOpen(false)}>
      <div className="aiu-modal" role="dialog" aria-label="Get More AI Units" onClick={(e) => e.stopPropagation()}>
        <button className="aiu-x" onClick={() => setOpen(false)} aria-label="Close">
          <X size={22} />
        </button>

        <div className="aiu-head">
          <div className="aiu-badge">
            <Sparkles size={24} />
          </div>
          <div>
            <h3>Get More AI Units</h3>
            <p>Add more AI units to keep your agent performing at full power.</p>
          </div>
        </div>

        <div className="aiu-divider" />

        <div className="aiu-packs">
          {packages.map((p) => (
            <button
              key={p.id}
              className="aiu-pack"
              disabled={busy === p.id}
              onClick={() => buy(p.id)}
            >
              <span className="aiu-pack-ico">
                <Box size={22} />
              </span>
              <span className="aiu-pack-units">{Number(p.units).toLocaleString()} Units</span>
              <span className="aiu-pack-right">
                <span className="aiu-pack-price">${p.price}</span>
                <ChevronRight size={22} className="aiu-pack-chev" />
              </span>
            </button>
          ))}
        </div>

        {msg && <div className="aiu-msg">{msg}</div>}

        <div className="aiu-foot">
          <Lock size={13} /> Secure checkout powered by <b>Paddle</b>
        </div>
      </div>
    </div>
  );
}
