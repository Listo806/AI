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
  setupOfferActive,
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

// Shown at most once per page per BROWSER SESSION (sessionStorage). This lets it
// appear on the home, each editorial, and the trial page, and appear again on a
// fresh visit / new tab — while never nagging on the same page in one session.
const SHOWN_PREFIX = "cortexa_exit_shown:";
function shownThisSession(local) {
  try {
    return sessionStorage.getItem(SHOWN_PREFIX + local) === "1";
  } catch (_e) {
    return false;
  }
}
function markShownThisSession(local) {
  try {
    sessionStorage.setItem(SHOWN_PREFIX + local, "1");
  } catch (_e) {
    /* private mode — just won't remember */
  }
}
function clearShownThisSession() {
  try {
    const keys = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(SHOWN_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => sessionStorage.removeItem(k));
  } catch (_e) {
    /* no-op */
  }
}

// An exit-intent popup offering the $7 activation fee. Desktop fires when the
// cursor leaves the top of the viewport; touch devices fire on a quick scroll
// back up after scrolling down. Testing helpers: append ?exitoffer=test to any
// allowed URL to force it open now, or ?exitoffer=reset to clear the per-session
// gate so it can trigger again.
export default function ExitIntentOffer() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const cardRef = useRef(null);

  const lang =
    (typeof localStorage !== "undefined" &&
      localStorage.getItem("cortexa_lang")) ||
    "en";
  const tr = T[lang] || T.en;

  const { prefix, local } = localeInfo(location.pathname);
  const mode = new URLSearchParams(location.search).get("exitoffer");

  // ?exitoffer=reset — clear the per-session gate + any claimed offer so the
  // popup can be tested repeatedly.
  useEffect(() => {
    if (mode === "reset") {
      clearShownThisSession();
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
      trackEvent("exit_offer_shown", { path: location.pathname, test: true });
    }
  }, [mode, location.pathname]);

  const armed =
    mode !== "test" &&
    offerIsAvailable() &&
    isAllowedPage(local) &&
    !setupOfferActive() &&
    !shownThisSession(local);

  const trigger = useCallback(() => {
    if (shownThisSession(local)) return;
    markShownThisSession(local);
    setOpen(true);
    trackEvent("exit_offer_shown", { path: location.pathname });
  }, [local, location.pathname]);

  const close = useCallback((reason) => {
    setOpen(false);
    trackEvent("exit_offer_dismiss", { reason: reason || "close" });
  }, []);

  const claim = useCallback(() => {
    setSetupOffer(EXIT_OFFER);
    trackEvent("exit_offer_click", { cta: "start_trial" });
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
    const armTimer = setTimeout(() => {
      ready = true;
    }, 2500);

    const onMouseOut = (e) => {
      if (!ready) return;
      if (e.clientY <= 0 && !e.relatedTarget) trigger();
    };

    let lastY = window.scrollY;
    let downMax = 0;
    const onScroll = () => {
      if (!ready) return;
      const y = window.scrollY;
      if (y > lastY) downMax = Math.max(downMax, y);
      if (downMax > 400 && y < 140 && lastY - y > 12) trigger();
      lastY = y;
    };

    document.addEventListener("mouseout", onMouseOut);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(armTimer);
      document.removeEventListener("mouseout", onMouseOut);
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

  if (!open) return null;

  return (
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
  );
}
