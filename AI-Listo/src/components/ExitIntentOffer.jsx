import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { X, Check, ArrowRight } from "lucide-react";
import { trackEvent } from "../utils/track";
import {
  EXIT_OFFER,
  OFFER_SETUP_FEE,
  REGULAR_SETUP_FEE,
  offerIsAvailable,
  setSetupOffer,
  clearSetupOffer,
} from "../utils/offer";
import "./ExitIntentOffer.css";

// Approved exit-intent popup copy in the three site languages, matching how the
// checkout/trial funnel pages keep an inline dictionary.
const T = {
  en: {
    wait: "WAIT!",
    dontLeave: "DON'T LEAVE YET.",
    sub: "You're one step away from activating your",
    product: "AI Revenue Operating System.",
    boxLead: "Start making revenue today for just",
    fee: "ACTIVATION FEE",
    boxFoot: "and get on board to your",
    freeTrial: "FREE TRIAL.",
    features: [
      "AI Revenue Operating System",
      "AI Sales Agent Included",
      "CRM & Pipeline Management",
      "Automation & Instant Response",
      "Everything You Need to Grow",
    ],
    cta: "START MY FREE TRIAL NOW",
    close: "Close",
  },
  es: {
    wait: "¡ESPERA!",
    dontLeave: "NO TE VAYAS AÚN.",
    sub: "Estás a un paso de activar tu",
    product: "Sistema Operativo de Ingresos con IA.",
    boxLead: "Empieza a generar ingresos hoy por solo",
    fee: "TARIFA DE ACTIVACIÓN",
    boxFoot: "y comienza tu",
    freeTrial: "PRUEBA GRATIS.",
    features: [
      "Sistema Operativo de Ingresos con IA",
      "Agente de Ventas IA Incluido",
      "Gestión de CRM y Pipeline",
      "Automatización y Respuesta Instantánea",
      "Todo lo que Necesitas para Crecer",
    ],
    cta: "COMENZAR MI PRUEBA GRATIS AHORA",
    close: "Cerrar",
  },
  pt: {
    wait: "ESPERE!",
    dontLeave: "NÃO SAIA AINDA.",
    sub: "Você está a um passo de ativar seu",
    product: "Sistema Operacional de Receita com IA.",
    boxLead: "Comece a gerar receita hoje por apenas",
    fee: "TAXA DE ATIVAÇÃO",
    boxFoot: "e comece seu",
    freeTrial: "TESTE GRÁTIS.",
    features: [
      "Sistema Operacional de Receita com IA",
      "Agente de Vendas IA Incluído",
      "Gestão de CRM e Pipeline",
      "Automação e Resposta Instantânea",
      "Tudo que Você Precisa para Crescer",
    ],
    cta: "COMEÇAR MEU TESTE GRÁTIS AGORA",
    close: "Fechar",
  },
};

// Allowed pages (locale-stripped): the locale homes, the editorial pages, and the
// free-trial registration page. Matched by shape so it stays correct across the
// editorial URL variants on main and their localized paths.
function isAllowedPage(local) {
  return local === "" || local === "trial" || local.startsWith("editorial/");
}

// Split a pathname into its locale prefix and the locale-independent remainder.
function localeInfo(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  let prefix = "";
  if (["es", "pt", "pt-br", "de", "fr", "it"].includes(parts[0])) {
    prefix = `/${parts[0]}`;
    parts.shift();
  }
  return { prefix, local: parts.join("/") };
}

// Shown at most once per page per PAGE LOAD, tracked in memory. It still never
// nags twice on the same page within one view (including SPA navigation, since
// this Set lives for the tab's JS lifetime), but a full page reload starts fresh
// and re-arms it. That makes the offer show again on each fresh visit and makes
// it trivial to re-test by simply refreshing — no new window required.
// (Previously sessionStorage, which persisted across reloads in the same tab.)
const shownThisLoad = new Set();
function shownThisSession(local) {
  return shownThisLoad.has(local);
}
function markShownThisSession(local) {
  shownThisLoad.add(local);
}
function clearShownThisSession() {
  shownThisLoad.clear();
}

// Clicking the popup CTA suppresses it for the rest of the browser SESSION only
// (sessionStorage), not forever. This stops re-showing it while the visitor is in
// the funnel (e.g. on /trial) but lets it re-engage them on a later visit if they
// did not buy. The persistent $7 pricing flag (cortexa_setup_offer in
// localStorage) is separate and still carries the offer into checkout.
const CLAIMED_KEY = "cortexa_exit_claimed";
function claimedThisSession() {
  try {
    return sessionStorage.getItem(CLAIMED_KEY) === "1";
  } catch (_e) {
    return false;
  }
}
function markClaimedThisSession() {
  try {
    sessionStorage.setItem(CLAIMED_KEY, "1");
  } catch (_e) {
    /* private mode — just won't remember */
  }
}
function clearClaimedThisSession() {
  try {
    sessionStorage.removeItem(CLAIMED_KEY);
  } catch (_e) {
    /* no-op */
  }
}

// On touch devices, reveal the offer after this long on an allowed page if no
// exit gesture has fired first. Phones give no reliable exit signal (no cursor;
// the back button / app-switch happen after the page is already gone), so this
// timed reveal guarantees mobile visitors actually see the offer. Kept short so
// it fires before a typical mobile bounce (and is easy to verify). Configurable
// via VITE_EXIT_OFFER_MOBILE_DELAY_MS; defaults to 12s.
const MOBILE_FALLBACK_MS =
  Number(import.meta.env.VITE_EXIT_OFFER_MOBILE_DELAY_MS) || 12000;

// An exit-intent popup offering the $7 activation fee. Desktop fires when the
// cursor leaves the top of the viewport. Touch devices fire on a quick scroll
// back up after scrolling down, and — since that gesture is unreliable — also on
// a one-time timed reveal (MOBILE_FALLBACK_MS). Testing helpers: append
// ?exitoffer=test to any allowed URL to force it open now, or ?exitoffer=reset to
// clear the per-session gate so it can trigger again.
export default function ExitIntentOffer() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const cardRef = useRef(null);
  // Live diagnostics, surfaced only with ?exitoffer=debug (no effect otherwise).
  const dbgRef = useRef({
    ready: false,
    isTouch: null,
    mobileMs: null,
    listeners: false,
    lastEvent: "-",
    triggers: 0,
  });
  const [, dbgTick] = useState(0);

  const lang =
    (typeof localStorage !== "undefined" &&
      localStorage.getItem("cortexa_lang")) ||
    "en";
  const tr = T[lang] || T.en;

  const { prefix, local } = localeInfo(location.pathname);
  const mode = new URLSearchParams(location.search).get("exitoffer");
  const debug = mode === "debug";

  // ?exitoffer=reset — clear the per-session gate + any claimed offer so the
  // popup can be tested repeatedly.
  useEffect(() => {
    if (mode === "reset") {
      clearShownThisSession();
      clearClaimedThisSession();
      clearSetupOffer();
      try {
        localStorage.removeItem("cortexa_exit_offer_seen_at");
      } catch (_e) {
        /* no-op */
      }
    }
  }, [mode]);

  // ?exitoffer=test — force it open immediately for QA (bypasses detection).
  useEffect(() => {
    if (mode === "test" && offerIsAvailable()) {
      setOpen(true);
      trackEvent("exit_popup_view", { path: location.pathname, test: true });
    }
  }, [mode, location.pathname]);

  // Eligibility broken out so the debug panel can show which condition blocks it.
  const eligible = {
    notTestMode: mode !== "test",
    offerAvailable: offerIsAvailable(),
    allowedPage: isAllowedPage(local),
    notClaimed: !claimedThisSession(),
    notShownYet: !shownThisSession(local),
  };
  const armed =
    eligible.notTestMode &&
    eligible.offerAvailable &&
    eligible.allowedPage &&
    eligible.notClaimed &&
    eligible.notShownYet;

  const trigger = useCallback(() => {
    if (shownThisSession(local)) {
      dbgRef.current.lastEvent = "blocked: already shown this load";
      return;
    }
    markShownThisSession(local);
    dbgRef.current.triggers += 1;
    dbgRef.current.lastEvent = "OPENED";
    setOpen(true);
    trackEvent("exit_popup_view", { path: location.pathname });
  }, [local, location.pathname]);

  const close = useCallback((reason) => {
    setOpen(false);
    trackEvent("exit_offer_dismiss", { reason: reason || "close" });
  }, []);

  const claim = useCallback(() => {
    setSetupOffer(EXIT_OFFER);
    markClaimedThisSession();
    trackEvent("exit_popup_click", { cta: "start_trial" });
    setOpen(false);
    if (local === "trial") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate(`${prefix}/trial?offer=${EXIT_OFFER}`);
    }
  }, [navigate, prefix, local]);

  // Detection. Re-arms whenever the page (armed) changes, so it can trigger on
  // the home, each editorial, and the trial page. Armed a couple seconds after
  // load so it never fires on a fast bounce.
  useEffect(() => {
    if (!armed) return undefined;
    let ready = false;
    dbgRef.current.lastEvent = "armed: waiting 2.5s";
    const armTimer = setTimeout(() => {
      ready = true;
      dbgRef.current.ready = true;
      dbgRef.current.lastEvent = "ready (listening)";
    }, 2500);

    // Desktop exit-intent: the cursor leaves through the top of the window
    // (toward the tabs / address bar / back button). Two complementary signals
    // for reliability: a `mouseout` with no relatedTarget near the top edge, and
    // a `mouseleave` on the document element, which fires once when the pointer
    // actually leaves the page. A small threshold (<= 8px) instead of exactly 0
    // catches a fast upward flick, whose last recorded Y is often a few pixels
    // shy of the edge — the most common reason a real exit gesture "did nothing".
    const leftViaTop = (e) => !e.relatedTarget && e.clientY <= 8;
    const onMouseOut = (e) => {
      if (ready && leftViaTop(e)) {
        dbgRef.current.lastEvent = "mouseout → top edge";
        trigger();
      }
    };
    const onMouseLeave = (e) => {
      if (ready && leftViaTop(e)) {
        dbgRef.current.lastEvent = "mouseleave → top edge";
        trigger();
      }
    };

    // Touch exit-intent: a quick scroll back up toward the top after scrolling
    // down (reaching for the address bar / back gesture).
    let lastY = window.scrollY;
    let downMax = 0;
    const onScroll = () => {
      if (!ready) return;
      const y = window.scrollY;
      if (y > lastY) downMax = Math.max(downMax, y);
      if (downMax > 400 && y < 140 && lastY - y > 12) trigger();
      lastY = y;
    };

    // Touch fallback: guarantee the offer is seen on phones/tablets with a
    // one-time timed reveal, since the scroll gesture above misses most exits
    // (back button, app switch). trigger() is itself once-per-session guarded.
    const isTouch =
      (typeof window !== "undefined" &&
        ((window.matchMedia &&
          window.matchMedia("(pointer: coarse)").matches) ||
          "ontouchstart" in window)) ||
      (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0);
    let mobileTimer;
    dbgRef.current.isTouch = isTouch;
    if (isTouch) {
      dbgRef.current.mobileMs = MOBILE_FALLBACK_MS;
      mobileTimer = setTimeout(() => {
        dbgRef.current.lastEvent = "mobile timer fired";
        trigger();
      }, MOBILE_FALLBACK_MS);
    }

    document.addEventListener("mouseout", onMouseOut);
    document.documentElement.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    dbgRef.current.listeners = true;
    return () => {
      dbgRef.current.listeners = false;
      clearTimeout(armTimer);
      if (mobileTimer) clearTimeout(mobileTimer);
      document.removeEventListener("mouseout", onMouseOut);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, [armed, trigger]);

  // Escape to close + move focus into the dialog when it opens.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") close("escape");
    };
    document.addEventListener("keydown", onKey);
    const id = window.setTimeout(() => cardRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(id);
    };
  }, [open, close]);

  // ?exitoffer=debug — keep the live status panel fresh and log eligibility once.
  useEffect(() => {
    if (!debug) return undefined;
    // eslint-disable-next-line no-console
    console.log("[exit-offer] eligibility", {
      path: location.pathname,
      local,
      armed,
      ...eligible,
    });
    const id = setInterval(() => dbgTick((t) => t + 1), 500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debug, armed, location.pathname]);

  const debugPanel = debug ? (
    <div
      role="status"
      style={{
        position: "fixed",
        bottom: 8,
        left: 8,
        zIndex: 2147483647,
        background: "rgba(15,23,42,0.94)",
        color: "#e2e8f0",
        font: "12px/1.5 ui-monospace, monospace",
        padding: "10px 12px",
        borderRadius: 8,
        maxWidth: 320,
        pointerEvents: "none",
        whiteSpace: "pre-wrap",
        border: "1px solid #334155",
      }}
    >
      {[
        "▛ exit-offer debug",
        "script loaded: yes",
        `path: ${location.pathname || "/"}  local:"${local}"`,
        `offerAvailable: ${eligible.offerAvailable}`,
        `allowedPage: ${eligible.allowedPage}`,
        `notClaimedThisSession: ${eligible.notClaimed}`,
        `notShownYet: ${eligible.notShownYet}`,
        `ELIGIBLE: ${armed ? "YES ✓" : "NO ✗"}`,
        `listeners attached: ${dbgRef.current.listeners}`,
        `ready (after 2.5s): ${dbgRef.current.ready}`,
        `touch device: ${dbgRef.current.isTouch}${
          dbgRef.current.mobileMs ? `  timer ${dbgRef.current.mobileMs}ms` : ""
        }`,
        `times opened: ${dbgRef.current.triggers}`,
        `last event: ${dbgRef.current.lastEvent}`,
        `popup open now: ${open}`,
      ].join("\n")}
    </div>
  ) : null;

  if (!open) return debugPanel;

  return (
    <>
      {debugPanel}
      <div
        className="exit-offer-backdrop"
        onClick={() => close("backdrop")}
        role="presentation"
      >
      <div
        className="exit-offer-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-offer-title"
        tabIndex={-1}
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="exit-offer-close"
          aria-label={tr.close}
          onClick={() => close("x")}
        >
          <X size={20} />
        </button>

        <h2 id="exit-offer-title" className="exit-offer-head">
          <span className="exit-offer-wait">{tr.wait}</span>
          <span className="exit-offer-dont">{tr.dontLeave}</span>
        </h2>
        <span className="exit-offer-rule" aria-hidden="true" />

        <p className="exit-offer-sub">
          {tr.sub} <span className="exit-offer-accent">{tr.product}</span>
        </p>

        <div className="exit-offer-box">
          <p className="exit-offer-box-lead">{tr.boxLead}</p>
          <div className="exit-offer-price">
            <span className="exit-offer-old">${REGULAR_SETUP_FEE}</span>
            <ArrowRight className="exit-offer-arrow" size={26} />
            <span className="exit-offer-new">${OFFER_SETUP_FEE}</span>
            <span className="exit-offer-fee">{tr.fee}</span>
          </div>
          <p className="exit-offer-box-foot">
            {tr.boxFoot}{" "}
            <span className="exit-offer-accent">{tr.freeTrial}</span>
          </p>
        </div>

        <ul className="exit-offer-features">
          {tr.features.map((f) => (
            <li key={f}>
              <span className="exit-offer-check">
                <Check size={14} strokeWidth={3} />
              </span>
              <span className="exit-offer-feature-label">{f}</span>
            </li>
          ))}
        </ul>

        <button type="button" className="exit-offer-cta" onClick={claim}>
          <ArrowRight size={20} /> {tr.cta}
        </button>
      </div>
      </div>
    </>
  );
}
