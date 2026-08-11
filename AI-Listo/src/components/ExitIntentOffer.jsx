import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  X,
  ArrowRight,
  User,
  Mail,
  Phone,
  LockKeyhole,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { trackEvent, getAttribution } from "../utils/track";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { currentSiteLanguage } from "../i18n/currentLanguage";

// Exit-intent popup: a registration form. On submit it creates the Cortexa
// account immediately (source = exit_popup, no plan yet — a saved lead) and
// sends the visitor to the pricing page to choose a plan next. Details are saved
// before any payment and never re-entered. Replaces the old $7 activation popup.
const T = {
  en: {
    headline1: "WAIT!",
    headline2: "DON'T LEAVE!",
    sub: "Start Your Free Trial Today.",
    desc: "Get started with Cortexa for $0. Create your account now and choose the plan that fits your business on the next step.",
    name: "Full Name",
    email: "Email Address",
    phone: "Phone Number (Required)",
    password: "Password",
    cta: "CREATE MY ACCOUNT & SEE PLANS",
    creating: "Creating your account…",
    reassure: "Start for $0. Upgrade when you're ready.",
    close: "Close",
    errRequired: "Please fill in all fields.",
    errEmail: "Please enter a valid email address.",
    errExists: "That email is already registered. Please log in instead.",
    errGeneric: "Something went wrong. Please try again.",
  },
  es: {
    headline1: "¡ESPERA!",
    headline2: "NO TE VAYAS.",
    sub: "Comienza tu prueba gratis hoy.",
    desc: "Empieza con Cortexa por $0. Crea tu cuenta ahora y elige el plan que se adapte a tu negocio en el siguiente paso.",
    name: "Nombre completo",
    email: "Correo electrónico",
    phone: "Número de teléfono (obligatorio)",
    password: "Contraseña",
    cta: "CREAR MI CUENTA Y VER PLANES",
    creating: "Creando tu cuenta…",
    reassure: "Empieza por $0. Mejora cuando quieras.",
    close: "Cerrar",
    errRequired: "Completa todos los campos.",
    errEmail: "Ingresa un correo electrónico válido.",
    errExists: "Ese correo ya está registrado. Inicia sesión.",
    errGeneric: "Algo salió mal. Inténtalo de nuevo.",
  },
  pt: {
    headline1: "ESPERE!",
    headline2: "NÃO SAIA.",
    sub: "Comece seu teste grátis hoje.",
    desc: "Comece com a Cortexa por $0. Crie sua conta agora e escolha o plano ideal para o seu negócio na próxima etapa.",
    name: "Nome completo",
    email: "Endereço de e-mail",
    phone: "Número de telefone (obrigatório)",
    password: "Senha",
    cta: "CRIAR MINHA CONTA E VER PLANOS",
    creating: "Criando sua conta…",
    reassure: "Comece por $0. Faça upgrade quando quiser.",
    close: "Fechar",
    errRequired: "Preencha todos os campos.",
    errEmail: "Digite um e-mail válido.",
    errExists: "Esse e-mail já está cadastrado. Faça login.",
    errGeneric: "Algo deu errado. Tente novamente.",
  },
};

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://backend.cortexaaicrm.com/api";

// Allowed pages (locale-stripped): the locale homes and the editorial pages.
function isAllowedPage(local) {
  return local === "" || local.startsWith("editorial/");
}

function localeInfo(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  let prefix = "";
  if (["es", "pt", "pt-br", "de", "fr", "it"].includes(parts[0])) {
    prefix = `/${parts[0]}`;
    parts.shift();
  }
  return { prefix, local: parts.join("/") };
}

// Shown at most once per page per PAGE LOAD (in-memory; a reload re-arms it).
const shownThisLoad = new Set();
const shownThisSession = (local) => shownThisLoad.has(local);
const markShownThisSession = (local) => shownThisLoad.add(local);
const clearShownThisSession = () => shownThisLoad.clear();

// Submitting suppresses the popup for the rest of the browser SESSION only.
const CLAIMED_KEY = "cortexa_exit_claimed";
const claimedThisSession = () => {
  try {
    return sessionStorage.getItem(CLAIMED_KEY) === "1";
  } catch (_e) {
    return false;
  }
};
const markClaimedThisSession = () => {
  try {
    sessionStorage.setItem(CLAIMED_KEY, "1");
  } catch (_e) {
    /* private mode */
  }
};
const clearClaimedThisSession = () => {
  try {
    sessionStorage.removeItem(CLAIMED_KEY);
  } catch (_e) {
    /* no-op */
  }
};

const MOBILE_FALLBACK_MS =
  Number(import.meta.env.VITE_EXIT_OFFER_MOBILE_DELAY_MS) || 12000;

export default function ExitIntentOffer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const cardRef = useRef(null);

  // The actual site language the visitor is on (URL version first), used both to
  // show the popup in that language and to save it with the registration.
  const lang = currentSiteLanguage();
  const tr = T[lang] || T.en;

  const { prefix, local } = localeInfo(location.pathname);
  const mode = new URLSearchParams(location.search).get("exitoffer");
  const isLoggedIn = !!user;

  useEffect(() => {
    if (mode === "reset") {
      clearShownThisSession();
      clearClaimedThisSession();
    }
  }, [mode]);

  useEffect(() => {
    if (mode === "test" && !isLoggedIn) {
      setOpen(true);
      trackEvent("exit_popup_view", { path: location.pathname, test: true });
    }
  }, [mode, location.pathname, isLoggedIn]);

  const armed =
    mode !== "test" &&
    !isLoggedIn &&
    isAllowedPage(local) &&
    !claimedThisSession() &&
    !shownThisSession(local);

  const trigger = useCallback(() => {
    if (shownThisSession(local)) return;
    markShownThisSession(local);
    setOpen(true);
    trackEvent("exit_popup_view", { path: location.pathname });
  }, [local, location.pathname]);

  const close = useCallback((reason) => {
    setOpen(false);
    trackEvent("exit_popup_dismiss", { reason: reason || "close" });
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const submit = useCallback(
    async (e) => {
      e.preventDefault();
      if (loading) return;
      const name = form.name.trim();
      const email = form.email.trim();
      const phone = form.phone.trim();
      const password = form.password;
      if (!name || !email || !phone || !password) {
        setError(tr.errRequired);
        return;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        setError(tr.errEmail);
        return;
      }
      setError("");
      setLoading(true);
      try {
        const attribution = getAttribution();
        const res = await fetch(`${API_BASE}/trial/start-trial`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            phone,
            password,
            source: "exit_popup",
            language: lang,
            landingPage: attribution.landingPage || null,
            utm: attribution.utm || {},
            gclid: attribution.gclid || null,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setError(tr.errExists);
          setLoading(false);
          return;
        }
        if (!res.ok || !data.success) {
          setError(data.message || tr.errGeneric);
          setLoading(false);
          return;
        }
        // Save the account details so the rest of the funnel never re-asks.
        localStorage.setItem("trialUserId", data.userId);
        localStorage.setItem("email", email);
        localStorage.setItem("name", name);
        localStorage.setItem("phone", phone);
        if (data.accessToken) {
          apiClient.setTokens(data.accessToken, data.refreshToken);
          localStorage.setItem("listo_user", JSON.stringify(data.user));
          setUser(data.user);
        }
        trackEvent("exit_popup_signup", { source: "exit_popup" });
        markClaimedThisSession();
        setOpen(false);
        // Straight to the pricing page (localized) to choose a plan.
        navigate(`${prefix}/pricing`);
      } catch (_err) {
        setError(tr.errGeneric);
        setLoading(false);
      }
    },
    [form, loading, tr, lang, navigate, prefix, setUser],
  );

  // Exit-intent detection (desktop cursor-leaves-top; mobile scroll-up + timed
  // fallback). Re-arms whenever `armed` changes.
  useEffect(() => {
    if (!armed) return undefined;
    let ready = false;
    const armTimer = setTimeout(() => {
      ready = true;
    }, 2500);

    const leftViaTop = (e) => !e.relatedTarget && e.clientY <= 8;
    const onMouseOut = (e) => {
      if (ready && leftViaTop(e)) trigger();
    };
    const onMouseLeave = (e) => {
      if (ready && leftViaTop(e)) trigger();
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

    const isTouch =
      (typeof window !== "undefined" &&
        ((window.matchMedia &&
          window.matchMedia("(pointer: coarse)").matches) ||
          "ontouchstart" in window)) ||
      (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0);
    let mobileTimer;
    if (isTouch) {
      mobileTimer = setTimeout(() => trigger(), MOBILE_FALLBACK_MS);
    }

    document.addEventListener("mouseout", onMouseOut);
    document.documentElement.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(armTimer);
      if (mobileTimer) clearTimeout(mobileTimer);
      document.removeEventListener("mouseout", onMouseOut);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, [armed, trigger]);

  // Escape to close, focus the card, and lock page scroll while open.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") close("escape");
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = window.setTimeout(() => cardRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(id);
    };
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      onClick={() => close("backdrop")}
      role="presentation"
      className="exit-offer-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-popup-title"
        tabIndex={-1}
        ref={cardRef}
        className="exit-offer-card"
      >
        <button
          type="button"
          aria-label={tr.close}
          onClick={() => close("x")}
          className="exit-offer-close"
        >
          <X size={18} />
        </button>

        <h2 id="exit-popup-title" className="exit-offer-title">
          {tr.headline1}
        </h2>

        <h3 className="exit-offer-subtitle">{tr.sub}</h3>

        <p className="exit-offer-desc">{tr.desc}</p>

        <form onSubmit={submit} className="exit-offer-form">
          <label className="exit-offer-input-wrap">
            <User size={19} />
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder={tr.name}
              autoComplete="name"
            />
          </label>

          <label className="exit-offer-input-wrap">
            <Mail size={19} />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder={tr.email}
              autoComplete="email"
            />
          </label>

          <label className="exit-offer-input-wrap">
            <Phone size={19} />
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={onChange}
              placeholder={tr.phone}
              autoComplete="tel"
            />
          </label>

          <label className="exit-offer-input-wrap">
            <LockKeyhole size={19} />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={onChange}
              placeholder={tr.password}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label="Toggle password visibility"
              className="exit-offer-password-toggle"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </label>

          {error && <div className="exit-offer-error">{error}</div>}

          <div className="exit-offer-benefits">
            <div className="exit-offer-benefit-title">
              <span className="exit-offer-new">NEW</span>
              <strong>{tr.reassure}</strong>
            </div>

            <div className="exit-offer-benefit-row">
              <ShieldCheck size={18} />
              <span>Start free with our $0 plan</span>
            </div>
            <div className="exit-offer-benefit-row">
              <ShieldCheck size={18} />
              <span>Upgrade anytime, no pressure</span>
            </div>
            <div className="exit-offer-benefit-row">
              <ShieldCheck size={18} />
              <span>Unlock powerful features as you grow</span>
            </div>
            <div className="exit-offer-benefit-row">
              <ShieldCheck size={18} />
              <span>Cancel anytime, risk-free</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="exit-offer-submit"
          >
            <span>{loading ? tr.creating : tr.cta}</span>
            {!loading && <ArrowRight size={19} />}
          </button>
        </form>

        <p className="exit-offer-reassure">
          <ShieldCheck size={16} />
          <span>{tr.reassure}</span>
        </p>
      </div>

      <style>{`
        /* ===============================
           SHARED
        =============================== */
        .exit-offer-backdrop {
          position: fixed;
          inset: 0;
          z-index: 2147483000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          background: rgba(0,0,0,.72);
          backdrop-filter: blur(2px);
        }

        .exit-offer-card {
          position: relative;
          width: 100%;
          font-family:
            system-ui,
            -apple-system,
            "Segoe UI",
            Roboto,
            Helvetica,
            Arial,
            sans-serif;
          text-align: center;
        }

        .exit-offer-close {
          position: absolute;
          display: grid;
          place-items: center;
          cursor: pointer;
        }

        .exit-offer-form {
          display: flex;
          flex-direction: column;
        }

        .exit-offer-input-wrap {
          width: 100%;
          display: flex;
          align-items: center;
        }

        .exit-offer-input-wrap input {
          min-width: 0;
          flex: 1;
          border: 0;
          outline: none;
          background: transparent;
          font: inherit;
        }

        .exit-offer-password-toggle {
          border: 0;
          background: transparent;
          display: grid;
          place-items: center;
          cursor: pointer;
          padding: 0;
        }

        .exit-offer-error {
          color: #dc2626;
          text-align: left;
        }

        .exit-offer-submit {
          width: 100%;
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          border: 0;
          cursor: pointer;
        }

        .exit-offer-submit:disabled {
          opacity: .72;
          cursor: wait;
        }

        .exit-offer-benefits {
          display: none;
        }

        /* ===============================
           DESKTOP — WHITE POPUP
        =============================== */
        @media (min-width: 769px) {
          .exit-offer-card {
            max-width: 615px;
            max-height: 92vh;
            overflow-y: auto;
            padding: 44px 46px 28px;
            border-radius: 28px;
            background: #fff;
            color: #111;
            box-shadow: 0 28px 80px rgba(0,0,0,.38);
          }

          .exit-offer-close {
            top: 18px;
            right: 18px;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            border: 1px solid #d9dde5;
            background: #fff;
            color: #111827;
          }

          .exit-offer-title {
            margin: 0 0 10px;
            font-size: 76px;
            line-height: .95;
            font-weight: 900;
            letter-spacing: -0.055em;
            color: #000;
          }

          .exit-offer-subtitle {
            margin: 0 0 12px;
            font-size: 26px;
            line-height: 1.15;
            font-weight: 800;
            color: #000;
          }

          .exit-offer-desc {
            max-width: 475px;
            margin: 0 auto 26px;
            font-size: 15px;
            line-height: 1.5;
            color: #5b6472;
          }

          .exit-offer-form {
            gap: 11px;
          }

          .exit-offer-input-wrap {
            min-height: 54px;
            padding: 0 16px;
            gap: 11px;
            border: 1px solid #d8dde5;
            border-radius: 12px;
            background: #fff;
            color: #7a8492;
          }

          .exit-offer-input-wrap input {
            height: 52px;
            font-size: 15px;
            color: #111827;
          }

          .exit-offer-input-wrap input::placeholder {
            color: #6f7782;
            opacity: 1;
          }

          .exit-offer-password-toggle {
            width: 30px;
            height: 30px;
            color: #7a8492;
          }

          .exit-offer-benefits {
            margin-top: 8px;
            padding: 18px 18px 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            border-radius: 12px;
            background: #f8f9fb;
            text-align: left;
          }

          .exit-offer-benefit-title {
            display: flex;
            align-items: center;
            gap: 9px;
            font-size: 15px;
            color: #111;
          }

          .exit-offer-new {
            padding: 3px 7px;
            border-radius: 4px;
            background: #4f7fe8;
            color: #fff;
            font-size: 11px;
            font-weight: 700;
          }

          .exit-offer-benefit-row {
            display: flex;
            align-items: center;
            gap: 9px;
            color: #111;
            font-size: 14px;
          }

          .exit-offer-benefit-row svg {
            color: #2563eb;
            flex: 0 0 auto;
          }

          .exit-offer-submit {
            min-height: 58px;
            margin-top: 9px;
            padding: 0 20px 0 28px;
            border-radius: 11px;
            background: #000;
            color: #fff;
          }

          .exit-offer-submit span {
            padding-left: 20px;
            font-size: 16px;
            font-weight: 800;
            text-align: center;
          }

          .exit-offer-submit svg {
            justify-self: end;
          }

          .exit-offer-reassure {
            margin: 16px 0 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            color: #6b7280;
            font-size: 13px;
          }
        }

        /* ===============================
           MOBILE — DARK POPUP
        =============================== */
        @media (max-width: 768px) {
          .exit-offer-backdrop {
            padding: 10px;
            background: rgba(0,0,0,.84);
            backdrop-filter: blur(3px);
          }

          .exit-offer-card {
            max-width: 320px;
            max-height: 94vh;
            overflow-y: auto;
            padding: 30px 22px 18px;
            border-radius: 18px;
            background: linear-gradient(180deg, #242424 0%, #1d1d1d 100%);
            color: #fff;
            box-shadow: 0 24px 65px rgba(0,0,0,.5);
          }

          .exit-offer-close {
            top: 11px;
            right: 11px;
            width: 29px;
            height: 29px;
            border: 0;
            border-radius: 50%;
            background: #505050;
            color: #e8e8e8;
          }

          .exit-offer-title {
            margin: 0 0 14px;
            color: #fff;
            font-size: 55px;
            line-height: .93;
            font-weight: 900;
            letter-spacing: -0.05em;
          }

          .exit-offer-subtitle {
            margin: 0 0 8px;
            color: #fff;
            font-size: 17px;
            line-height: 1.2;
            font-weight: 800;
          }

          .exit-offer-desc {
            max-width: 265px;
            margin: 0 auto 19px;
            color: #d1d1d1;
            font-size: 12px;
            line-height: 1.5;
          }

          .exit-offer-form {
            gap: 9px;
          }

          .exit-offer-input-wrap {
            min-height: 43px;
            padding: 0 12px;
            gap: 9px;
            border: 1px solid #494949;
            border-radius: 9px;
            background: rgba(255,255,255,.012);
            color: #b3b3b3;
          }

          .exit-offer-input-wrap input {
            height: 41px;
            color: #f5f5f5;
            font-size: 12px;
          }

          .exit-offer-input-wrap input::placeholder {
            color: #b7b7b7;
            opacity: 1;
          }

          .exit-offer-password-toggle {
            width: 27px;
            height: 27px;
            color: #aaa;
          }

          .exit-offer-error {
            font-size: 11.5px;
            color: #ff8f8f;
          }

          /* Hide desktop benefits block on mobile */
          .exit-offer-benefits {
            display: none !important;
          }

          .exit-offer-submit {
            min-height: 54px;
            margin-top: 1px;
            padding: 0 14px 0 18px;
            border-radius: 9px;
            background: linear-gradient(180deg, #303030 0%, #292929 100%);
            color: #fff;
          }

          .exit-offer-submit span {
            padding-left: 14px;
            font-size: 12.5px;
            line-height: 1.18;
            font-weight: 800;
            text-align: center;
          }

          .exit-offer-submit svg {
            justify-self: end;
            color: #d8d8d8;
          }

          .exit-offer-reassure {
            margin: 13px 0 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            color: #cecece;
            font-size: 10px;
            line-height: 1.3;
          }

          .exit-offer-reassure svg {
            color: #c7c7c7;
            flex: 0 0 auto;
          }
        }

        @media (max-width: 350px) {
          .exit-offer-card {
            max-width: 300px;
            padding-left: 18px;
            padding-right: 18px;
          }

          .exit-offer-title {
            font-size: 49px;
          }

          .exit-offer-submit span {
            padding-left: 8px;
            font-size: 11.5px;
          }
        }
      `}</style>
    </div>
  );
}
