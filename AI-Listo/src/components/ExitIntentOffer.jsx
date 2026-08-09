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

  const lang =
    (typeof localStorage !== "undefined" &&
      localStorage.getItem("cortexa_lang")) ||
    "en";
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

  const inputWrap = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    border: "1px solid #d7d9de",
    borderRadius: 12,
    padding: "13px 14px",
    background: "#fff",
  };
  const inputStyle = {
    border: "none",
    outline: "none",
    flex: 1,
    fontSize: 15,
    background: "transparent",
    color: "#0f172a",
  };

  return (
    <div
      onClick={() => close("backdrop")}
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2147483000,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-popup-title"
        tabIndex={-1}
        ref={cardRef}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 500,
          maxHeight: "92vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 20,
          padding: "38px 34px 26px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          textAlign: "center",
        }}
      >
        <button
          type="button"
          aria-label={tr.close}
          onClick={() => close("x")}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 34,
            height: 34,
            borderRadius: "50%",
            border: "1px solid #e5e7eb",
            background: "#fff",
            color: "#0f172a",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={18} />
        </button>

        <h2
          id="exit-popup-title"
          style={{
            margin: "0 0 8px",
            fontSize: 38,
            lineHeight: 1.02,
            fontWeight: 800,
            letterSpacing: "-0.01em",
            color: "#0b0b0c",
          }}
        >
          {tr.headline1} — {tr.headline2}
        </h2>
        <h3
          style={{
            margin: "0 0 10px",
            fontSize: 22,
            fontWeight: 800,
            color: "#0b0b0c",
          }}
        >
          {tr.sub}
        </h3>
        <p
          style={{
            margin: "0 auto 20px",
            maxWidth: 380,
            fontSize: 14.5,
            lineHeight: 1.5,
            color: "#4b5563",
          }}
        >
          {tr.desc}
        </p>

        <form
          onSubmit={submit}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <label style={inputWrap}>
            <User size={19} color="#6b7280" />
            <input
              style={inputStyle}
              type="text"
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder={tr.name}
              autoComplete="name"
            />
          </label>
          <label style={inputWrap}>
            <Mail size={19} color="#6b7280" />
            <input
              style={inputStyle}
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder={tr.email}
              autoComplete="email"
            />
          </label>
          <label style={inputWrap}>
            <Phone size={19} color="#6b7280" />
            <input
              style={inputStyle}
              type="tel"
              name="phone"
              value={form.phone}
              onChange={onChange}
              placeholder={tr.phone}
              autoComplete="tel"
            />
          </label>
          <label style={inputWrap}>
            <LockKeyhole size={19} color="#6b7280" />
            <input
              style={inputStyle}
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
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "#6b7280",
                display: "flex",
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </label>

          {error && (
            <div style={{ color: "#dc2626", fontSize: 13, textAlign: "left" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              width: "100%",
              padding: "15px 18px",
              borderRadius: 12,
              border: "none",
              background: "#0b0b0c",
              color: "#fff",
              fontSize: 15.5,
              fontWeight: 700,
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? tr.creating : tr.cta}
            {!loading && <ArrowRight size={19} />}
          </button>
        </form>

        <p
          style={{
            margin: "16px 0 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            fontSize: 13,
            color: "#6b7280",
          }}
        >
          <ShieldCheck size={16} /> {tr.reassure}
        </p>
      </div>
    </div>
  );
}
