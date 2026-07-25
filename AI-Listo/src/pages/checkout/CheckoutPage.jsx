import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ExternalLink,
  Mail,
  Phone,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import apiClient from "../../api/apiClient";
import { trackEvent } from "../../utils/track";
import { useAuth } from "../../context/AuthContext";
import "./CheckoutPage.css";

// Checkout with PayPal subscriptions. The customer pays a one-time $97 setup fee
// today, then gets a 14-day free trial, then the monthly plan price. The PayPal
// plan (created in PayPal) carries the setup fee + trial + monthly billing; the
// front end just renders the subscribe button for the selected tier.
const API_BASE = "https://backend.cortexaaicrm.com";
const SETUP_FEE = 97;

// Google Ads purchase conversion. Reusing the existing conversion action for
// now so purchases start counting immediately; swap this for a dedicated
// Purchase label when the client provides one from Google Ads.
const PURCHASE_CONVERSION_SEND_TO = "AW-17836518151/z4trCLizpNgbEIfWjrlC";

const PLAN_DATA = {
  solo: { price: 197, users: 1 },
  team: { price: 347, users: 3, popular: true },
  growth: { price: 497, users: 5 },
};

const t = {
  en: {
    title: "Review your plan",
    subtitle: "You're one step away from starting your subscription.",
    selectedPlan: "Your selected plan",
    planNames: { solo: "Solo Plan", team: "Team Plan", growth: "Growth Plan" },
    userCount: { one: "1 user", many: "{count} users" },
    mostPopular: "Most Popular",
    month: "/month",
    afterTrial: "Applies after your free trial",
    monthlyAfterTrial: "Monthly price after your free trial",
    setupFee: "One-time setup fee (due today)",
    dueToday: "Due today",
    checkoutTitle: "Secure checkout",
    checkoutDesc:
      "You pay the one-time $97 setup fee today. Your 14-day free trial starts now, and your monthly plan begins after the trial. Cancel anytime.",
    informationTitle: "Your information",
    informationDesc: "This is the account we created for your subscription.",
    fullName: "Full name",
    email: "Email address",
    phone: "Phone number",
    agreementPrefix: "I have read and agree to the",
    terms: "Terms and Conditions",
    sdkLoading: "Loading secure checkout...",
    sdkError:
      "We could not load the payment options. Please refresh the page or contact support.",
    processing: "Activating your account...",
    footer: "Secure payment powered by PayPal. Cancel anytime.",
    validation: {
      terms: "Please accept the Terms and Conditions.",
      signup: "Please sign up first to start your subscription.",
      server: "Something went wrong. Please try again.",
    },
  },
  es: {
    title: "Revisa tu plan",
    subtitle: "Estás a un paso de comenzar tu suscripción.",
    selectedPlan: "Tu plan seleccionado",
    planNames: { solo: "Plan Solo", team: "Plan Team", growth: "Plan Growth" },
    userCount: { one: "1 usuario", many: "{count} usuarios" },
    mostPopular: "Más Popular",
    month: "/mes",
    afterTrial: "Se aplica después de tu prueba gratuita",
    monthlyAfterTrial: "Precio mensual después de tu prueba gratuita",
    setupFee: "Tarifa única de configuración (a pagar hoy)",
    dueToday: "A pagar hoy",
    checkoutTitle: "Pago seguro",
    checkoutDesc:
      "Hoy pagas la tarifa única de configuración de $97. Tu prueba gratuita de 14 días comienza ahora y tu plan mensual empieza después de la prueba. Cancela cuando quieras.",
    informationTitle: "Tu información",
    informationDesc: "Esta es la cuenta que creamos para tu suscripción.",
    fullName: "Nombre completo",
    email: "Correo electrónico",
    phone: "Número de teléfono",
    agreementPrefix: "He leído y acepto los",
    terms: "Términos y Condiciones",
    sdkLoading: "Cargando el pago seguro...",
    sdkError:
      "No pudimos cargar las opciones de pago. Actualiza la página o contacta con soporte.",
    processing: "Activando tu cuenta...",
    footer: "Pago seguro con PayPal. Cancela cuando quieras.",
    validation: {
      terms: "Acepta los Términos y Condiciones.",
      signup: "Primero regístrate para comenzar tu suscripción.",
      server: "Algo salió mal. Inténtalo de nuevo.",
    },
  },
  pt: {
    title: "Revise seu plano",
    subtitle: "Você está a um passo de começar sua assinatura.",
    selectedPlan: "Seu plano selecionado",
    planNames: { solo: "Plano Solo", team: "Plano Team", growth: "Plano Growth" },
    userCount: { one: "1 usuário", many: "{count} usuários" },
    mostPopular: "Mais Popular",
    month: "/mês",
    afterTrial: "Aplica-se após seu teste gratuito",
    monthlyAfterTrial: "Preço mensal após seu teste gratuito",
    setupFee: "Taxa única de configuração (a pagar hoje)",
    dueToday: "A pagar hoje",
    checkoutTitle: "Pagamento seguro",
    checkoutDesc:
      "Hoje você paga a taxa única de configuração de $97. Seu teste gratuito de 14 dias começa agora e seu plano mensal começa após o teste. Cancele quando quiser.",
    informationTitle: "Suas informações",
    informationDesc: "Esta é a conta que criamos para sua assinatura.",
    fullName: "Nome completo",
    email: "Endereço de e-mail",
    phone: "Número de telefone",
    agreementPrefix: "Li e concordo com os",
    terms: "Termos e Condições",
    sdkLoading: "Carregando o pagamento seguro...",
    sdkError:
      "Não foi possível carregar as opções de pagamento. Atualize a página ou contate o suporte.",
    processing: "Ativando sua conta...",
    footer: "Pagamento seguro com PayPal. Cancele quando quiser.",
    validation: {
      terms: "Aceite os Termos e Condições.",
      signup: "Primeiro cadastre-se para começar sua assinatura.",
      server: "Algo deu errado. Tente novamente.",
    },
  },
};

const normalizePlan = (value) => {
  const key = String(value || "").toLowerCase();
  return PLAN_DATA[key] ? key : "team";
};

const formatMoney = (value) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

// Load the PayPal JS SDK once. Sandbox vs live is decided by the client id we
// pass (a sandbox client id loads the sandbox environment automatically).
const loadPayPalSdk = (clientId) =>
  new Promise((resolve, reject) => {
    if (window.paypal) {
      resolve();
      return;
    }
    const existing = document.getElementById("paypal-sdk");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.id = "paypal-sdk";
    script.src =
      `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}` +
      `&vault=true&intent=subscription&currency=USD`;
    script.onload = () => resolve();
    script.onerror = reject;
    document.body.appendChild(script);
  });

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [lang] = useState(() => localStorage.getItem("cortexa_lang") || "en");
  const tr = t[lang] || t.en;

  const selectedPlan = normalizePlan(
    searchParams.get("plan") || localStorage.getItem("trialPlan") || "team",
  );
  const plan = PLAN_DATA[selectedPlan];

  const [customer] = useState(() => ({
    name: localStorage.getItem("name") || "",
    email: localStorage.getItem("email") || "",
    phone: localStorage.getItem("phone") || "",
    userId: localStorage.getItem("trialUserId") || "",
  }));
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [sdkStatus, setSdkStatus] = useState("loading"); // loading | ready | error
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Refs so the PayPal button callbacks read the latest values.
  const acceptedTermsRef = useRef(false);
  const paypalContainerRef = useRef(null);
  const buttonsRenderedRef = useRef(false);

  useEffect(() => {
    acceptedTermsRef.current = acceptedTerms;
  }, [acceptedTerms]);

  const usersText =
    plan.users === 1
      ? tr.userCount.one
      : tr.userCount.many.replace("{count}", String(plan.users));

  // Log the user in after payment succeeds, then open the product.
  const finishAndLogin = async (userId) => {
    localStorage.setItem("trialPlan", selectedPlan);
    localStorage.removeItem("password");
    const res = await fetch(`${API_BASE}/api/auth/login-by-id`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.accessToken) {
      apiClient.setTokens(data.accessToken, null);
      localStorage.setItem("listo_access_token", data.accessToken);
      localStorage.setItem("listo_user", JSON.stringify(data.user));
      setUser(data.user);
      navigate("/dashboard", { replace: true });
      return;
    }
    // Payment worked but auto-login is unavailable — send them to sign in.
    navigate("/sign-in", { replace: true });
  };

  useEffect(() => {
    let cancelled = false;

    const renderButtons = (planId) => {
      if (
        buttonsRenderedRef.current ||
        !window.paypal ||
        !paypalContainerRef.current
      ) {
        return;
      }
      buttonsRenderedRef.current = true;

      window.paypal
        .Buttons({
          style: {
            layout: "vertical",
            color: "gold",
            shape: "rect",
            label: "subscribe",
          },
          // Block the flow until terms are accepted and an account exists.
          onClick: (data, actions) => {
            if (!acceptedTermsRef.current) {
              alert(tr.validation.terms);
              return actions.reject();
            }
            const userId =
              customer.userId || localStorage.getItem("trialUserId");
            if (!userId) {
              alert(tr.validation.signup);
              navigate(`/trial?plan=${encodeURIComponent(selectedPlan)}`);
              return actions.reject();
            }
            return actions.resolve();
          },
          createSubscription: (data, actions) =>
            actions.subscription.create({ plan_id: planId }),
          onApprove: async (data) => {
            setErrorMsg("");
            setProcessing(true);
            try {
              const userId =
                customer.userId || localStorage.getItem("trialUserId");
              const confirmRes = await fetch(
                `${API_BASE}/api/payment/paypal/confirm-subscription`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    userId,
                    subscriptionId: data.subscriptionID,
                    plan: selectedPlan,
                  }),
                },
              );
              const confirm = await confirmRes.json().catch(() => ({}));
              if (!confirm.success) {
                setErrorMsg(tr.validation.server);
                setProcessing(false);
                return;
              }
              // Google Ads: count the completed $97 purchase as a conversion.
              if (typeof window.gtag === "function") {
                window.gtag("event", "conversion", {
                  send_to: PURCHASE_CONVERSION_SEND_TO,
                  value: SETUP_FEE,
                  currency: "USD",
                  transaction_id: data.subscriptionID,
                });
              }
              // Retargeting: trial activated (paid). Used to exclude these
              // customers from acquisition retargeting audiences.
              trackEvent("trial_activated", {
                plan: selectedPlan,
                value: SETUP_FEE,
                currency: "USD",
              });
              await finishAndLogin(userId);
            } catch (error) {
              console.error("PAYPAL APPROVE ERROR:", error);
              setErrorMsg(tr.validation.server);
              setProcessing(false);
            }
          },
          onError: (err) => {
            console.error("PAYPAL ERROR:", err);
            setErrorMsg(tr.validation.server);
          },
        })
        .render(paypalContainerRef.current);
    };

    const init = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/payment/paypal/plans`);
        const cfg = await res.json().catch(() => ({}));
        const clientId = cfg?.clientId;
        const planId = cfg?.plans?.[selectedPlan];
        if (!clientId || !planId) {
          if (!cancelled) setSdkStatus("error");
          return;
        }
        await loadPayPalSdk(clientId);
        if (cancelled) return;
        renderButtons(planId);
        setSdkStatus("ready");
      } catch (error) {
        console.error("PAYPAL INIT ERROR:", error);
        if (!cancelled) setSdkStatus("error");
      }
    };

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlan]);

  return (
    <main className="checkout-page">
      <div className="checkout-shell">
        <header className="checkout-heading">
          <h1>{tr.title}</h1>
          <p>{tr.subtitle}</p>
        </header>

        <div className="checkout-shell-grid">
          <div className="checkout-shell-1">
            <section className="checkout-card checkout-summary-card">
              <h2>{tr.selectedPlan}</h2>
              <div className="checkout-plan-row">
                <div className="checkout-plan-main">
                  <div className="checkout-plan-icon">
                    <Users size={34} />
                  </div>
                  <div className="checkout-plan-copy">
                    <div className="checkout-plan-name-row">
                      <h3>{tr.planNames[selectedPlan]}</h3>
                      {plan.popular && (
                        <span className="checkout-popular-badge">
                          {tr.mostPopular}
                        </span>
                      )}
                    </div>
                    <p>{usersText}</p>
                    <small className="checkout-plan-after-trial">
                      {tr.afterTrial}
                    </small>
                  </div>
                </div>
                <div className="checkout-plan-price">
                  <small>{tr.monthlyAfterTrial}</small>
                  <strong>${formatMoney(plan.price)}</strong>
                  <span>{tr.month}</span>
                </div>
              </div>
              <div className="checkout-summary-line">
                <span>{tr.setupFee}</span>
                <strong>${formatMoney(SETUP_FEE)}</strong>
              </div>
              <div className="checkout-summary-total">
                <strong>{tr.dueToday}</strong>
                <div>
                  <span>USD</span>
                  <strong>${formatMoney(SETUP_FEE)}</strong>
                </div>
              </div>
            </section>

            <section className="checkout-card">
              <div className="checkout-section-heading">
                <div className="checkout-section-icon">
                  <User size={24} />
                </div>
                <div>
                  <h2>{tr.informationTitle}</h2>
                  <p>{tr.informationDesc}</p>
                </div>
              </div>

              <div className="checkout-info-grid">
                <label className="checkout-field">
                  <span>{tr.fullName}</span>
                  <div className="checkout-input-wrap">
                    <User size={19} />
                    <input type="text" value={customer.name} readOnly />
                  </div>
                </label>

                <label className="checkout-field">
                  <span>{tr.email}</span>
                  <div className="checkout-input-wrap">
                    <Mail size={19} />
                    <input type="email" value={customer.email} readOnly />
                  </div>
                </label>

                <label className="checkout-field checkout-field-full">
                  <span>{tr.phone}</span>
                  <div className="checkout-input-wrap">
                    <Phone size={19} />
                    <input type="tel" value={customer.phone} readOnly />
                  </div>
                </label>
              </div>
            </section>
          </div>

          <div className="checkout-shell-1">
            <section className="checkout-card">
              <div className="checkout-section-heading">
                <div className="checkout-section-icon">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h2>{tr.checkoutTitle}</h2>
                  <p>{tr.checkoutDesc}</p>
                </div>
              </div>

              <div className="divider"></div>

              <label className="checkout-terms">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                />
                <span>
                  {tr.agreementPrefix}{" "}
                  <a href="/terms" target="_blank" rel="noreferrer">
                    {tr.terms}
                    <ExternalLink size={14} />
                  </a>
                </span>
              </label>

              <div className="checkout-paypal">
                <div
                  ref={paypalContainerRef}
                  className="checkout-paypal-buttons"
                />
                {sdkStatus === "loading" && (
                  <p className="checkout-paypal-status">{tr.sdkLoading}</p>
                )}
                {sdkStatus === "error" && (
                  <p className="checkout-paypal-error">{tr.sdkError}</p>
                )}
                {processing && (
                  <p className="checkout-paypal-status">{tr.processing}</p>
                )}
                {errorMsg && (
                  <p className="checkout-paypal-error">{errorMsg}</p>
                )}
              </div>

              <div className="checkout-secure-footer">
                <ShieldCheck size={19} />
                <span>{tr.footer}</span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
