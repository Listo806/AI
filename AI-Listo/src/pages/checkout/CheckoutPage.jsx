import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ExternalLink, Mail, Phone, ShieldCheck, User, Users, Lock } from "lucide-react";
import { trackEvent, trackPurchase, setUserData } from "../../utils/track";
import { useAuth } from "../../context/AuthContext";
import {
  fetchNuveiConfig,
  nuveiSaveToken,
  nuveiActivate,
  collectBrowserInfo,
} from "../../api/nuveiApi";
import { tokenizeCard } from "./nuveiSdk";
import { clearSetupOffer } from "../../utils/offer";
import { buildLocalizedPath } from "../../i18n/locales";
import "./CheckoutPage.css";

// Checkout is powered by Nuvei / Datafast (Paymentez). The card is entered in
// Nuvei's own secure browser form, so the PAN/CVV never reach our servers; we
// receive only the token, then charge the activation fee (with 3DS) and start
// the 14-day trial. Paddle has been removed from this flow.

// Display fallback only — the authoritative activation/monthly amounts come from
// GET /api/nuvei/config (which reads the canonical plan-config on the backend).
const PLAN_DATA = {
  solo: { price: 127, startPrice: 11, users: 1 },
  team: { price: 297, startPrice: 22, users: 3, popular: true },
  growth: { price: 497, startPrice: 33, users: 5 },
};

// checkout plan key -> nuvei catalog key
const NUVEI_KEY = { solo: "solo", team: "business", growth: "scale" };

const t = {
  en: {
    title: "Review your plan",
    subtitle: "You're one step away from starting your subscription.",
    selectedPlan: "Your selected plan",
    planNames: { solo: "Solo Plan", team: "Business Plan", growth: "Scale Plan" },
    userCount: { one: "1 user", many: "{count} users" },
    mostPopular: "Most Popular",
    month: "/month",
    afterTrial: "Renews monthly after your 14-day trial",
    monthlyAfterTrial: "Monthly price after your 14-day trial",
    setupFee: "Activation fee (due today)",
    nextCharge: "First monthly charge",
    dueToday: "Due today",
    checkoutTitle: "Secure checkout",
    checkoutDesc: "Pay the activation fee today, start your 14-day trial, then the monthly price. Cancel anytime.",
    informationTitle: "Your information",
    informationDesc: "This is the account we created for your subscription.",
    fullName: "Full name",
    email: "Email address",
    phone: "Phone number",
    consent: "I authorize Cortexa to securely store my card with Nuvei and to charge the activation fee today and the monthly subscription automatically until I cancel. My subscription renews each month and I can cancel anytime, effective at the end of the current billing period.",
    terms: "Terms and Conditions",
    continueBtn: "Continue to secure payment",
    processing: "Activating your account...",
    footer: "Secure payment powered by Nuvei. Cancel anytime.",
    cardHint: "Enter your card details in the secure form below.",
    validation: {
      terms: "Please authorize the payment to continue.",
      signup: "Please sign up first to start your subscription.",
      server: "Something went wrong. Please try again or use another card.",
      declined: "The payment could not be completed. Please try another card.",
    },
  },
  es: {
    title: "Revisa tu plan",
    subtitle: "Estás a un paso de comenzar tu suscripción.",
    selectedPlan: "Tu plan seleccionado",
    planNames: { solo: "Plan Solo", team: "Plan Negocios", growth: "Plan Scale" },
    userCount: { one: "1 usuario", many: "{count} usuarios" },
    mostPopular: "Más Popular",
    month: "/mes",
    afterTrial: "Se renueva cada mes tras tu prueba de 14 días",
    monthlyAfterTrial: "Precio mensual tras tu prueba de 14 días",
    setupFee: "Cargo de activación (a pagar hoy)",
    nextCharge: "Primer cargo mensual",
    dueToday: "A pagar hoy",
    checkoutTitle: "Pago seguro",
    checkoutDesc: "Paga hoy el cargo de activación, inicia tu prueba de 14 días y luego el precio mensual. Cancela cuando quieras.",
    informationTitle: "Tu información",
    informationDesc: "Esta es la cuenta que creamos para tu suscripción.",
    fullName: "Nombre completo",
    email: "Correo electrónico",
    phone: "Número de teléfono",
    consent: "Autorizo a Cortexa a guardar mi tarjeta de forma segura con Nuvei y a cobrar el cargo de activación hoy y la suscripción mensual de forma automática hasta que cancele. Mi suscripción se renueva cada mes y puedo cancelar cuando quiera, con efecto al final del período de facturación actual.",
    terms: "Términos y Condiciones",
    continueBtn: "Continuar al pago seguro",
    processing: "Activando tu cuenta...",
    footer: "Pago seguro con Nuvei. Cancela cuando quieras.",
    cardHint: "Ingresa los datos de tu tarjeta en el formulario seguro.",
    validation: {
      terms: "Autoriza el pago para continuar.",
      signup: "Primero regístrate para comenzar tu suscripción.",
      server: "Algo salió mal. Inténtalo de nuevo o usa otra tarjeta.",
      declined: "No se pudo completar el pago. Prueba con otra tarjeta.",
    },
  },
  pt: {
    title: "Revise seu plano",
    subtitle: "Você está a um passo de começar sua assinatura.",
    selectedPlan: "Seu plano selecionado",
    planNames: { solo: "Plano Solo", team: "Plano Business", growth: "Plano Scale" },
    userCount: { one: "1 usuário", many: "{count} usuários" },
    mostPopular: "Mais Popular",
    month: "/mês",
    afterTrial: "Renova mensalmente após seu teste de 14 dias",
    monthlyAfterTrial: "Preço mensal após seu teste de 14 dias",
    setupFee: "Taxa de ativação (a pagar hoje)",
    nextCharge: "Primeira cobrança mensal",
    dueToday: "A pagar hoje",
    checkoutTitle: "Pagamento seguro",
    checkoutDesc: "Pague a taxa de ativação hoje, inicie seu teste de 14 dias e depois o preço mensal. Cancele quando quiser.",
    informationTitle: "Suas informações",
    informationDesc: "Esta é a conta que criamos para sua assinatura.",
    fullName: "Nome completo",
    email: "Endereço de e-mail",
    phone: "Número de telefone",
    consent: "Autorizo a Cortexa a armazenar meu cartão com segurança na Nuvei e a cobrar a taxa de ativação hoje e a assinatura mensal automaticamente até eu cancelar. Minha assinatura renova a cada mês e posso cancelar quando quiser, com efeito ao fim do período de faturamento atual.",
    terms: "Termos e Condições",
    continueBtn: "Continuar para o pagamento seguro",
    processing: "Ativando sua conta...",
    footer: "Pagamento seguro com Nuvei. Cancele quando quiser.",
    cardHint: "Insira os dados do seu cartão no formulário seguro.",
    validation: {
      terms: "Autorize o pagamento para continuar.",
      signup: "Primeiro cadastre-se para começar sua assinatura.",
      server: "Algo deu errado. Tente novamente ou use outro cartão.",
      declined: "Não foi possível concluir o pagamento. Tente outro cartão.",
    },
  },
};

const PLAN_ALIASES = { solo: "solo", team: "team", growth: "growth", business: "team", scale: "growth", pro: "solo" };
const normalizePlan = (value) => {
  const key = String(value || "").trim().toLowerCase();
  const mapped = PLAN_ALIASES[key];
  return mapped && PLAN_DATA[mapped] ? mapped : null;
};

const formatMoney = (value) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [lang] = useState(() => localStorage.getItem("cortexa_lang") || "en");
  const tr = t[lang] || t.en;

  const requestedPlan = searchParams.get("plan") || localStorage.getItem("trialPlan");
  const resolvedPlan = normalizePlan(requestedPlan);
  const planIsValid = Boolean(resolvedPlan);
  const selectedPlan = resolvedPlan || "team";
  const plan = PLAN_DATA[selectedPlan];
  const nuveiPlanKey = NUVEI_KEY[selectedPlan];

  const [customer] = useState(() => ({
    name: localStorage.getItem("name") || "",
    email: localStorage.getItem("email") || "",
    phone: localStorage.getItem("phone") || "",
    userId: localStorage.getItem("trialUserId") || "",
  }));

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem("trialUserId", user.id);
      if (user.email) localStorage.setItem("email", user.email);
    }
  }, [user]);

  const [config, setConfig] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [step, setStep] = useState("review"); // review | card | processing
  const [errorMsg, setErrorMsg] = useState("");
  const formMounted = useRef(false);
  const acceptedTermsRef = useRef(false);
  const checkoutStartedRef = useRef(false);
  const purchaseDoneRef = useRef(false);

  useEffect(() => { acceptedTermsRef.current = acceptedTerms; }, [acceptedTerms]);

  // Authoritative amounts from the Nuvei config (falls back to display prices).
  const nuveiPlan = (config?.plans || []).find((p) => p.key === nuveiPlanKey) || null;
  const setupFee = nuveiPlan ? nuveiPlan.activation : plan.startPrice;
  const recurringPrice = nuveiPlan ? nuveiPlan.monthly : plan.price;
  const trialDays = nuveiPlan ? nuveiPlan.trialDays : 14;

  const nextChargeStr = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000)
    .toLocaleDateString(lang === "es" ? "es-ES" : lang === "pt" ? "pt-BR" : "en-US",
      { year: "numeric", month: "short", day: "numeric" });

  useEffect(() => {
    if (!planIsValid) navigate(buildLocalizedPath("/pricing", lang), { replace: true });
  }, [planIsValid, navigate, lang]);

  useEffect(() => {
    if (!planIsValid) return;
    checkoutStartedRef.current = true;
    trackEvent("begin_checkout", { plan: selectedPlan });
    trackEvent("activation_intent", { plan: selectedPlan, offer: `$${setupFee}`, value: setupFee, currency: "USD" });
  }, [selectedPlan, planIsValid, setupFee]);

  useEffect(() => {
    let cancelled = false;
    fetchNuveiConfig().then((c) => { if (!cancelled) setConfig(c); });
    return () => { cancelled = true; };
  }, []);

  const usersText = plan.users === 1 ? tr.userCount.one : tr.userCount.many.replace("{count}", String(plan.users));

  const finishAndLogin = async () => {
    localStorage.setItem("trialPlan", selectedPlan);
    localStorage.removeItem("password");
    clearSetupOffer();
    localStorage.setItem("cortexa_paid_at", String(Date.now()));
    try { await refreshUser(); } catch (e) {}
    navigate("/dashboard/ai-cortexa-setup", { replace: true });
  };

  function startPayment() {
    setErrorMsg("");
    if (!acceptedTermsRef.current) { setErrorMsg(tr.validation.terms); return; }
    const userId = customer.userId || localStorage.getItem("trialUserId") || user?.id;
    if (!userId) {
      setErrorMsg(tr.validation.signup);
      navigate(`/trial?plan=${encodeURIComponent(selectedPlan)}`);
      return;
    }
    setStep("card");
  }

  // Render the Nuvei secure card form when we reach the card step.
  useEffect(() => {
    if (step !== "card" || !config?.enabled || formMounted.current) return;
    formMounted.current = true;
    (async () => {
      try {
        const card = await tokenizeCard({
          containerSelector: "#nuvei-card-form",
          environment: config.environment,
          appCode: config.clientAppCode,
          appKey: config.clientAppKey,
          user: { id: customer.userId || user?.id, email: customer.email || user?.email },
          country: "ECU",
          locale: lang,
        });
        await handleTokenized(card);
      } catch (err) {
        formMounted.current = false;
        setErrorMsg(err?.message || tr.validation.server);
        setStep("review");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, config]);

  async function handleTokenized(card) {
    setStep("processing");
    setErrorMsg("");
    try {
      const saved = await nuveiSaveToken(card);
      if (!saved?.cardId) throw new Error(tr.validation.server);

      const result = await nuveiActivate({
        planKey: nuveiPlanKey,
        cardId: saved.cardId,
        browserInfo: collectBrowserInfo(),
        termUrl: `${window.location.origin}/checkout?plan=${selectedPlan}&threeds=return`,
      });

      if (result?.requires3ds && result?.challenge) {
        const url = result.challenge.challenge_request || result.challenge.acs_url || result.challenge.url;
        if (url && /^https?:\/\//i.test(url)) { window.location.href = url; return; }
        setErrorMsg(tr.validation.declined);
        setStep("review"); formMounted.current = false; return;
      }

      if (result?.status === "trialing" || result?.status === "active") {
        purchaseDoneRef.current = true;
        setUserData({ email: customer.email, phone: customer.phone });
        trackPurchase({ value: setupFee, currency: "USD", offer: `$${setupFee}`, plan: selectedPlan, transactionId: result.transactionId });
        trackEvent("trial_activated", { plan: selectedPlan, value: setupFee, currency: "USD" });
        await finishAndLogin();
        return;
      }

      setErrorMsg(result?.message || tr.validation.declined);
      setStep("review"); formMounted.current = false;
    } catch (err) {
      setErrorMsg(err?.message || tr.validation.server);
      setStep("review"); formMounted.current = false;
    }
  }

  return (
    <main className="checkout-page">
      <div className="checkout-shell">
        <div className="checkout-shell-grid">
          <div className="checkout-shell-1 checkout-left-column">
            <header className="checkout-heading">
              <h1>{tr.title}</h1>
              <p>{tr.subtitle}</p>
            </header>

            {/* 1. YOUR INFORMATION */}
            <section className="checkout-card checkout-info-card">
              <div className="checkout-left-card-heading">
                <div className="checkout-left-heading-icon"><User size={28} strokeWidth={2} /></div>
                <div className="checkout-left-heading-copy">
                  <h2><span className="checkout-step-number">1.</span> {tr.informationTitle}</h2>
                  <p>{tr.informationDesc}</p>
                </div>
              </div>
              <div className="checkout-info-grid checkout-info-grid-left">
                <label className="checkout-field checkout-field-full">
                  <span>{tr.fullName}</span>
                  <div className="checkout-input-wrap checkout-left-input">
                    <User size={18} strokeWidth={2} />
                    <input type="text" value={customer.name} readOnly />
                  </div>
                </label>
                <label className="checkout-field checkout-field-full">
                  <span>{tr.email}</span>
                  <div className="checkout-input-wrap checkout-left-input">
                    <Mail size={18} strokeWidth={2} />
                    <input type="email" value={customer.email} readOnly />
                  </div>
                </label>
                <label className="checkout-field checkout-field-full">
                  <span>{tr.phone}</span>
                  <div className="checkout-input-wrap checkout-left-input">
                    <Phone size={18} strokeWidth={2} />
                    <input type="tel" value={customer.phone} readOnly />
                  </div>
                </label>
              </div>
            </section>

            {/* 2. YOUR SELECTED PLAN */}
            <section className="checkout-card checkout-summary-card checkout-plan-card">
              <div className="checkout-left-card-heading checkout-plan-card-heading">
                <div className="checkout-left-heading-icon"><Users size={28} strokeWidth={2} /></div>
                <div className="checkout-left-heading-copy">
                  <h2><span className="checkout-step-number">2.</span> {tr.selectedPlan}</h2>
                </div>
              </div>

              <div className="checkout-plan-content-row">
                <div className="checkout-plan-details">
                  {plan.popular && <span className="checkout-left-popular-badge">{tr.mostPopular}</span>}
                  <h3>{tr.planNames[selectedPlan]}</h3>
                  <p className="checkout-plan-users">{usersText}</p>
                  <small className="checkout-plan-after-trial">{tr.afterTrial}</small>
                </div>
                <div className="checkout-plan-price checkout-left-plan-price">
                  <small>{tr.monthlyAfterTrial}</small>
                  <strong>${formatMoney(recurringPrice)}</strong>
                  <span>{tr.month}</span>
                </div>
              </div>

              <div className="checkout-left-plan-divider" />

              <div className="checkout-summary-line checkout-left-summary-line">
                <span>{tr.setupFee}</span>
                <strong>${formatMoney(setupFee)}</strong>
              </div>

              <div className="checkout-summary-line checkout-next-charge checkout-left-summary-line">
                <span>{tr.nextCharge}</span>
                <span className="checkout-next-charge-val">${formatMoney(recurringPrice)} · {nextChargeStr}</span>
              </div>

              <div className="checkout-summary-total checkout-left-summary-total">
                <strong>{tr.dueToday}</strong>
                <div><span>USD</span> <strong>${formatMoney(setupFee)}</strong></div>
              </div>
            </section>
          </div>

          <div className="checkout-shell-1 shell-2">
            <section className="checkout-card">
              <div className="checkout-section-heading">
                <div className="checkout-section-icon"><ShieldCheck size={24} /></div>
                <div>
                  <h2><span className="checkout-step-number">3.</span> {tr.checkoutTitle}</h2>
                  <p>{tr.checkoutDesc}</p>
                </div>
              </div>

              {step === "review" && (
                <>
                  <label className="checkout-terms">
                    <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
                    <span>{tr.consent}</span>
                  </label>
                  <div style={{ margin: "6px 0 14px", fontSize: 13 }}>
                    <a href="/terms" target="_blank" rel="noreferrer">
                      {tr.terms} <ExternalLink size={13} style={{ verticalAlign: "middle" }} />
                    </a>
                  </div>

                  {errorMsg && <p className="checkout-paypal-error">{errorMsg}</p>}

                  {config && !config.enabled ? (
                    <p className="checkout-paypal-error">
                      Payments are being finalized and are not available right now. Please contact support.
                    </p>
                  ) : (
                    <button
                      type="button"
                      className="checkout-paddle-btn"
                      onClick={startPayment}
                      disabled={!acceptedTerms}
                      style={{
                        width: "100%", padding: "14px 16px", borderRadius: "8px", border: "none",
                        background: acceptedTerms ? "#4f46e5" : "#9ca3af", color: "#fff",
                        fontSize: "16px", fontWeight: 600, cursor: acceptedTerms ? "pointer" : "not-allowed",
                      }}
                    >
                      {tr.continueBtn} · ${formatMoney(setupFee)}
                    </button>
                  )}
                </>
              )}

              {step === "card" && (
                <>
                  <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>{tr.cardHint}</p>
                  <div id="nuvei-card-form" />
                  {errorMsg && <p className="checkout-paypal-error">{errorMsg}</p>}
                </>
              )}

              {step === "processing" && <p className="checkout-paypal-status">{tr.processing}</p>}

              <div className="checkout-secure-footer">
                <Lock size={17} />
                <span>{tr.footer}</span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
