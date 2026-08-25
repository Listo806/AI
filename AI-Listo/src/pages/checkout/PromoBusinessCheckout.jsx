import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Check, Infinity as InfinityIcon, Users, Layers, LayoutGrid } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { fetchPaddleConfig } from "../../api/paddleApi";
import { initPaddle, openBusinessPromoCheckout } from "./paddleCheckout";
import { trackEvent, trackPurchase, setUserData } from "../../utils/track";
import { clearSetupOffer } from "../../utils/offer";

// Standalone landing for the promotional Business offer ($257/month, 25% off).
// Reached from the bulk promo email CTA. It opens a SINGLE recurring $257 Paddle
// item (no trial, charged today) and, on payment, the webhook provisions the
// Business plan. Deliberately separate from CheckoutPage.jsx so the 14-day-trial
// checkout flow is never affected.

const COPY = {
  en: {
    badge: "Limited time offer",
    plan: "Business Plan",
    special: "Special Offer",
    perMonth: "/month",
    was: "$347/month",
    save: "You save $90 every month",
    feats: ["Unlimited AI", "Up to 3 Users", "1 Workspace Included", "Full Platform Access"],
    billedToday: "Billed today",
    cta: "Claim Your $257 Offer",
    secure: "Secure checkout • Cancel anytime",
    loading: "Loading secure checkout…",
    processing: "Activating your Business plan…",
    signInTitle: "Please sign in to claim this offer",
    signInBody: "Sign in to your Cortexa account, then open this link again to complete your $257 Business upgrade.",
    signIn: "Sign in",
    trouble: "If the payment window did not open, click the button again.",
    notReady: "This offer is not available right now. Please contact support.",
  },
  es: {
    badge: "Oferta por tiempo limitado",
    plan: "Plan Negocios",
    special: "Oferta Especial",
    perMonth: "/mes",
    was: "$347/mes",
    save: "Ahorras $90 cada mes",
    feats: ["IA ilimitada", "Hasta 3 usuarios", "1 Workspace incluido", "Acceso completo a la plataforma"],
    billedToday: "A pagar hoy",
    cta: "Obtener mi plan por $257",
    secure: "Pago seguro • Cancela cuando quieras",
    loading: "Cargando el pago seguro…",
    processing: "Activando tu plan Negocios…",
    signInTitle: "Inicia sesión para obtener esta oferta",
    signInBody: "Inicia sesión en tu cuenta de Cortexa y vuelve a abrir este enlace para completar tu mejora a Negocios por $257.",
    signIn: "Iniciar sesión",
    trouble: "Si la ventana de pago no se abrió, vuelve a hacer clic en el botón.",
    notReady: "Esta oferta no está disponible en este momento. Contacta con soporte.",
  },
  pt: {
    badge: "Oferta por tempo limitado",
    plan: "Plano Business",
    special: "Oferta Especial",
    perMonth: "/mês",
    was: "$347/mês",
    save: "Você economiza $90 por mês",
    feats: ["IA ilimitada", "Até 3 usuários", "1 Workspace incluído", "Acesso completo à plataforma"],
    billedToday: "A pagar hoje",
    cta: "Garantir meu plano por $257",
    secure: "Pagamento seguro • Cancele quando quiser",
    loading: "Carregando o pagamento seguro…",
    processing: "Ativando seu plano Business…",
    signInTitle: "Entre para garantir esta oferta",
    signInBody: "Entre na sua conta Cortexa e abra este link novamente para concluir seu upgrade Business por $257.",
    signIn: "Entrar",
    trouble: "Se a janela de pagamento não abriu, clique no botão novamente.",
    notReady: "Esta oferta não está disponível no momento. Fale com o suporte.",
  },
};

const PURPLE = "#6d5cf0";

export default function PromoBusinessCheckout() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const lang = (localStorage.getItem("cortexa_lang") || "en").slice(0, 2);
  const tr = COPY[lang] || COPY.en;

  const [config, setConfig] = useState(null);
  const [ready, setReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const paddleInitRef = useRef(false);
  const purchaseDoneRef = useRef(false);

  const identity = useMemo(() => {
    const userId = user?.id || localStorage.getItem("trialUserId") || "";
    const email = user?.email || localStorage.getItem("email") || "";
    const countryCode = String(localStorage.getItem("countryCode") || "").trim().toUpperCase();
    const postalCode = String(localStorage.getItem("postalCode") || localStorage.getItem("zipCode") || "").trim();
    const region = String(localStorage.getItem("region") || "").trim();
    const phone = localStorage.getItem("phone") || "";
    return { userId, email, phone, countryCode, postalCode, region };
  }, [user]);

  const promo = config?.businessPromo257 || null;
  const priceId = promo?.priceId || null;

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem("trialUserId", user.id);
      if (user.email) localStorage.setItem("email", user.email);
    }
  }, [user]);

  const finishAndLogin = async () => {
    localStorage.setItem("trialPlan", "team");
    localStorage.removeItem("password");
    clearSetupOffer();
    localStorage.setItem("cortexa_paid_at", String(Date.now()));
    try {
      await refreshUser();
    } catch (_e) {}
    navigate("/dashboard/ai-cortexa-setup", { replace: true });
  };

  const handlePaddleEvent = (ev) => {
    if (ev?.name !== "checkout.completed") return;
    purchaseDoneRef.current = true;
    const txnId = ev?.data?.transaction_id || ev?.data?.id || undefined;
    setUserData({ email: identity.email, phone: identity.phone });
    trackPurchase({
      value: 257,
      currency: "USD",
      offer: "$257",
      plan: "team",
      transactionId: txnId,
    });
    trackEvent("promo_business257_purchase", { value: 257, currency: "USD" });
    setProcessing(true);
    finishAndLogin();
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cfg = await fetchPaddleConfig();
      if (cancelled) return;
      setConfig(cfg);
      try {
        if (cfg?.clientToken && !paddleInitRef.current) {
          paddleInitRef.current = true;
          await initPaddle(cfg, handlePaddleEvent);
        }
        if (!cancelled) setReady(true);
      } catch (_e) {
        if (!cancelled) setReady(false);
      }
    })();
    trackEvent("begin_checkout", { plan: "team", offer: "$257", promo: "business257" });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCheckout = () => {
    if (!identity.userId) {
      // Return to this offer after signing in (SignIn honors a safe ?next=).
      navigate("/sign-in?next=/checkout-business-offer");
      return;
    }
    if (!ready || !priceId) return;
    try {
      trackEvent("paddle_checkout_started", { plan: "team", offer: "$257", promo: "business257" });
      openBusinessPromoCheckout({
        priceId,
        userId: identity.userId,
        email: identity.email,
        countryCode: identity.countryCode,
        postalCode: identity.postalCode,
        region: identity.region,
      });
    } catch (e) {
      console.error("PROMO CHECKOUT ERROR:", e);
    }
  };

  const featIcons = [
    <InfinityIcon size={18} key="ai" />,
    <Users size={18} key="u" />,
    <LayoutGrid size={18} key="w" />,
    <Layers size={18} key="p" />,
  ];

  const notLoggedIn = !identity.userId;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f1f1f6",
        padding: "24px 16px",
        fontFamily: "Inter, Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          width: "min(460px, 100%)",
          background: "#fff",
          border: "1px solid #e7e3fb",
          borderRadius: 18,
          boxShadow: "0 18px 50px rgba(24,18,60,0.12)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "26px 28px 6px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: PURPLE, textTransform: "uppercase" }}>
            {tr.badge}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 8 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#101322" }}>{tr.plan}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: PURPLE }}>{tr.special}</div>
            </div>
            <span
              style={{
                background: PURPLE,
                color: "#fff",
                fontSize: 12,
                fontWeight: 800,
                lineHeight: 1.1,
                padding: "8px 12px",
                borderRadius: 8,
                textAlign: "center",
              }}
            >
              25%
              <br />
              OFF
            </span>
          </div>

          <div style={{ marginTop: 14 }}>
            <span style={{ fontSize: 44, fontWeight: 800, color: PURPLE }}>$257</span>
            <span style={{ fontSize: 16, color: "#475467" }}>{tr.perMonth}</span>
          </div>
          <div style={{ marginTop: 4 }}>
            <span style={{ fontSize: 14, color: "#98a2b3", textDecoration: "line-through", marginRight: 12 }}>
              {tr.was}
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>{tr.save}</span>
          </div>
        </div>

        <div style={{ padding: "16px 28px 4px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {tr.feats.map((f, i) => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, color: "#101322", fontSize: 13 }}>
              <span style={{ color: PURPLE, display: "inline-flex" }}>{featIcons[i]}</span>
              {f}
            </div>
          ))}
        </div>

        <div style={{ padding: "18px 28px 8px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              background: "#faf9ff",
              border: "1px solid #e7e3fb",
              borderRadius: 10,
              marginBottom: 14,
            }}
          >
            <strong style={{ color: "#101322", fontSize: 15 }}>{tr.billedToday}</strong>
            <strong style={{ color: PURPLE, fontSize: 20 }}>$257.00</strong>
          </div>

          {notLoggedIn ? (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#101322", marginBottom: 6 }}>{tr.signInTitle}</div>
              <p style={{ fontSize: 13, color: "#475467", lineHeight: 1.5, marginTop: 0 }}>{tr.signInBody}</p>
              <button type="button" onClick={openCheckout} style={btnStyle}>
                {tr.signIn}
              </button>
            </div>
          ) : (
            <>
              <button type="button" onClick={openCheckout} disabled={!ready || !priceId} style={{ ...btnStyle, opacity: !ready || !priceId ? 0.6 : 1 }}>
                {tr.cta} →
              </button>
              <div style={{ textAlign: "center", fontSize: 12, color: "#98a2b3", marginTop: 10 }}>
                <ShieldCheck size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                {tr.secure}
              </div>
              {processing && (
                <div style={{ textAlign: "center", fontSize: 13, color: PURPLE, marginTop: 10 }}>{tr.processing}</div>
              )}
              {!ready && !priceId && (
                <div style={{ textAlign: "center", fontSize: 12, color: "#98a2b3", marginTop: 8 }}>{tr.loading}</div>
              )}
              <div style={{ textAlign: "center", fontSize: 11.5, color: "#98a2b3", marginTop: 10 }}>{tr.trouble}</div>
            </>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 22px" }}>
          <img
            src="https://www.cortexaaicrm.com/cortexa-email-logo.png"
            alt="Cortexa"
            style={{ height: 26, width: "auto", opacity: 0.85 }}
          />
        </div>
      </div>
    </main>
  );
}

const btnStyle = {
  display: "block",
  width: "100%",
  background: PURPLE,
  color: "#fff",
  fontSize: 16,
  fontWeight: 700,
  border: "none",
  borderRadius: 10,
  padding: "15px 20px",
  cursor: "pointer",
};
