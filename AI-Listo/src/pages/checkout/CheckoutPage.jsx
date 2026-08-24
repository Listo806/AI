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
import { trackEvent, trackPurchase, setUserData } from "../../utils/track";
import apiClient from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import { fetchPaddleConfig } from "../../api/paddleApi";
import {
  paddleReady,
  initPaddle,
  openPaddleCheckout,
  paddleInlineSettings,
  PADDLE_INLINE_FRAME_CLASS,
} from "./paddleCheckout";
import { clearSetupOffer } from "../../utils/offer";
import { buildLocalizedPath } from "../../i18n/locales";
import "./CheckoutPage.css";

const API_BASE = "https://backend.cortexaaicrm.com";

const PLAN_DATA = {
  solo: { price: 197, annualPrice: 1891.2, startPrice: 7, users: 1 },
  team: { price: 347, annualPrice: 3331.2, startPrice: 14, users: 3, popular: true },
  growth: { price: 497, annualPrice: 4771.2, startPrice: 21, users: 5 },
};

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
    setupFee: "14-day trial (due today)",
    nextCharge: "Next charge",
    acceptToLoad: "Loading secure payment form...",
    havingTrouble: "Having trouble? Open secure checkout",
    dueToday: "Due today",
    checkoutTitle: "Secure checkout",
    checkoutDesc:
      "Pay today for your 14-day trial, then the monthly price. Cancel anytime.",
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
    footer: "Secure payment powered by Paddle. Cancel anytime.",
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
    planNames: { solo: "Plan Solo", team: "Plan Business", growth: "Plan Scale" },
    userCount: { one: "1 usuario", many: "{count} usuarios" },
    mostPopular: "Más Popular",
    month: "/mes",
    afterTrial: "Se renueva cada mes tras tu prueba de 14 días",
    monthlyAfterTrial: "Precio mensual tras tu prueba de 14 días",
    setupFee: "Prueba de 14 días (a pagar hoy)",
    nextCharge: "Próximo cargo",
    acceptToLoad: "Cargando el formulario de pago seguro...",
    havingTrouble: "¿Problemas? Abre el pago seguro",
    dueToday: "A pagar hoy",
    checkoutTitle: "Pago seguro",
    checkoutDesc:
      "Paga hoy tu prueba de 14 días; luego, el precio mensual. Cancela cuando quieras.",
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
    footer: "Pago seguro con Paddle. Cancela cuando quieras.",
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
    planNames: { solo: "Plano Solo", team: "Plano Business", growth: "Plano Scale" },
    userCount: { one: "1 usuário", many: "{count} usuários" },
    mostPopular: "Mais Popular",
    month: "/mês",
    afterTrial: "Renova mensalmente após seu teste de 14 dias",
    monthlyAfterTrial: "Preço mensal após seu teste de 14 dias",
    setupFee: "Teste de 14 dias (a pagar hoje)",
    nextCharge: "Próxima cobrança",
    acceptToLoad: "Carregando formulário de pagamento seguro...",
    havingTrouble: "Problemas? Abra o pagamento seguro",
    dueToday: "A pagar hoje",
    checkoutTitle: "Pagamento seguro",
    checkoutDesc:
      "Pague hoje seu teste de 14 dias; depois, o preço mensal. Cancele quando quiser.",
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
    footer: "Pagamento seguro com Paddle. Cancele quando quiser.",
    validation: {
      terms: "Aceite os Termos e Condições.",
      signup: "Primeiro cadastre-se para começar sua assinatura.",
      server: "Algo deu errado. Tente novamente.",
    },
  },
};

const PLAN_ALIASES = {
  solo: "solo",
  team: "team",
  growth: "growth",
  business: "team",
  scale: "growth",
  pro: "solo",
};

const normalizePlan = (value) => {
  const key = String(value || "").trim().toLowerCase();
  const mapped = PLAN_ALIASES[key];
  return mapped && PLAN_DATA[mapped] ? mapped : null;
};

const formatMoney = (value) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

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

const detectBrowserCountryCode = () => {
  const stored = String(localStorage.getItem("countryCode") || "").trim().toUpperCase();

  if (/^[A-Z]{2}$/.test(stored)) {
    return stored;
  }

  try {
    const languages =
      Array.isArray(navigator.languages) && navigator.languages.length
        ? navigator.languages
        : [navigator.language];

    for (const language of languages) {
      if (!language) continue;

      try {
        const locale = new Intl.Locale(language);
        const region = String(locale.region || "").trim().toUpperCase();

        if (/^[A-Z]{2}$/.test(region)) {
          return region;
        }
      } catch (_e) {}

      const match = String(language).match(/[-_]([A-Za-z]{2})$/);
      if (match?.[1]) {
        return match[1].toUpperCase();
      }
    }
  } catch (_e) {}

  return "";
};

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
  const billingCycle =
    String(searchParams.get("billing") || "monthly").toLowerCase() === "annual"
      ? "annual"
      : "monthly";

  const [customer] = useState(() => {
    const countryCode = String(
      localStorage.getItem("countryCode") || detectBrowserCountryCode() || ""
    ).trim().toUpperCase();

    const postalCode = String(
      localStorage.getItem("postalCode") || localStorage.getItem("zipCode") || ""
    ).trim();

    const region = String(localStorage.getItem("region") || "").trim();

    if (/^[A-Z]{2}$/.test(countryCode)) {
      localStorage.setItem("countryCode", countryCode);
    }

    return {
      name: localStorage.getItem("name") || "",
      email: localStorage.getItem("email") || "",
      phone: localStorage.getItem("phone") || "",
      countryCode: /^[A-Z]{2}$/.test(countryCode) ? countryCode : "",
      postalCode,
      region,
      userId: localStorage.getItem("trialUserId") || "",
    };
  });

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem("trialUserId", user.id);
      if (user.email) localStorage.setItem("email", user.email);
    }
  }, [user]);

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [, setSdkStatus] = useState("loading");
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const acceptedTermsRef = useRef(false);
  const paypalContainerRef = useRef(null);
  const buttonsRenderedRef = useRef(false);

  const checkoutStartedRef = useRef(false);
  const purchaseDoneRef = useRef(false);
  const abandonFiredRef = useRef(false);
  const selectedPlanRef = useRef(selectedPlan);

  useEffect(() => {
    selectedPlanRef.current = selectedPlan;
  }, [selectedPlan]);

  const [paddleConfig, setPaddleConfig] = useState(null);
  const paddleInitRef = useRef(false);
  const inlineMountedRef = useRef(false);

  const usePaddle = paddleReady(paddleConfig, selectedPlan, billingCycle);
  const annualUnavailable =
    billingCycle === "annual" &&
    !!paddleConfig &&
    !paddleConfig?.annualPrices?.[selectedPlan];
  const setupFee = plan.startPrice;
  const recurringPrice =
    billingCycle === "annual" ? plan.annualPrice : plan.price;

  const nextChargeStr = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toLocaleDateString(
      lang === "es" ? "es-ES" : lang === "pt" ? "pt-BR" : "en-US",
      { year: "numeric", month: "short", day: "numeric" },
    );

  useEffect(() => {
    acceptedTermsRef.current = acceptedTerms;
  }, [acceptedTerms]);

  useEffect(() => {
    if (!planIsValid) {
      navigate(buildLocalizedPath("/pricing", lang), { replace: true });
    }
  }, [planIsValid, navigate, lang]);

  useEffect(() => {
    if (!planIsValid) return;
    checkoutStartedRef.current = true;
    trackEvent("begin_checkout", { plan: selectedPlan });
    trackEvent("activation_intent", {
      plan: selectedPlan,
      offer: `$${setupFee}`,
      value: setupFee,
      currency: "USD",
    });
  }, [selectedPlan, planIsValid, setupFee]);

  useEffect(() => {
    const fireAbandon = (e) => {
      if (abandonFiredRef.current) return;
      if (e && e.persisted) return;
      if (!checkoutStartedRef.current || purchaseDoneRef.current) return;
      abandonFiredRef.current = true;
      trackEvent("checkout_abandoned", { plan: selectedPlanRef.current });
    };
    window.addEventListener("pagehide", fireAbandon);
    return () => {
      window.removeEventListener("pagehide", fireAbandon);
      fireAbandon();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cfg = await fetchPaddleConfig();
      if (!cancelled) setPaddleConfig(cfg);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const usersText =
    plan.users === 1
      ? tr.userCount.one
      : tr.userCount.many.replace("{count}", String(plan.users));

  const reportPaddlePurchaseWhenConfirmed = async (paddleTxnId) => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        const res = await apiClient.request(
          "/payments/paddle/purchase-conversion/claim",
          { method: "POST" },
        );
        const data = res?.data ?? res;
        if (data?.fire) {
          trackPurchase({
            value: data.value ?? setupFee,
            currency: data.currency ?? "USD",
            offer: data.offer ?? `$${setupFee}`,
            plan: data.plan ?? selectedPlan,
            transactionId: data.transactionId ?? paddleTxnId,
          });
          return;
        }
      } catch (_e) {}
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  };

  const finishAndLogin = async () => {
    localStorage.setItem("trialPlan", selectedPlan);
    localStorage.removeItem("password");
    clearSetupOffer();
    localStorage.setItem("cortexa_paid_at", String(Date.now()));
    try {
      await refreshUser();
    } catch (e) {}
    navigate("/dashboard/ai-cortexa-setup", { replace: true });
  };

  const handlePaddleEvent = (ev) => {
    if (ev?.name !== "checkout.completed") return;
    if (!acceptedTermsRef.current) {
      alert(tr.validation.terms);
      return;
    }
    purchaseDoneRef.current = true;
    const uid = customer.userId || localStorage.getItem("trialUserId");
    const paddleTxnId = ev?.data?.transaction_id || ev?.data?.id || undefined;
    setUserData({ email: customer.email, phone: customer.phone });
    trackEvent("trial_activated", {
      plan: selectedPlan,
      value: setupFee,
      currency: "USD",
    });
    setProcessing(true);
    reportPaddlePurchaseWhenConfirmed(paddleTxnId);
    if (uid) finishAndLogin();
  };

  useEffect(() => {
    if (!usePaddle || inlineMountedRef.current) return;
    if (!paddleConfig || !planIsValid) return;
    const userId = customer.userId || localStorage.getItem("trialUserId");
    if (!userId) return;
    let cancelled = false;

    (async () => {
      try {
        if (!paddleInitRef.current) {
          paddleInitRef.current = true;
          await initPaddle(paddleConfig, handlePaddleEvent);
        }
        if (cancelled) return;
        inlineMountedRef.current = true;
        setErrorMsg("");
        trackEvent("paddle_checkout_started", {
          plan: selectedPlan,
          startingCharge: setupFee,
        });
        openPaddleCheckout({
          config: paddleConfig,
          plan: selectedPlan,
          userId,
          email: customer.email,
          countryCode: customer.countryCode,
          postalCode: customer.postalCode,
          region: customer.region,
          startingCharge: setupFee,
          billingCycle,
          settings: paddleInlineSettings(),
        });
      } catch (error) {
        inlineMountedRef.current = false;
        console.error("PADDLE INLINE ERROR:", error);
        setErrorMsg(tr.validation.server);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [usePaddle, paddleConfig, selectedPlan, billingCycle]);

  const startPaddleOverlayFallback = async () => {
    if (!planIsValid) {
      navigate(buildLocalizedPath("/pricing", lang), { replace: true });
      return;
    }
    if (!acceptedTermsRef.current) {
      alert(tr.validation.terms);
      return;
    }
    const userId = customer.userId || localStorage.getItem("trialUserId");
    if (!userId) {
      alert(tr.validation.signup);
      navigate(`/trial?plan=${encodeURIComponent(selectedPlan)}`);
      return;
    }
    setErrorMsg("");
    try {
      if (!paddleInitRef.current) {
        paddleInitRef.current = true;
        await initPaddle(paddleConfig, handlePaddleEvent);
      }
      trackEvent("paddle_checkout_started", {
        plan: selectedPlan,
        startingCharge: setupFee,
      });
      openPaddleCheckout({
        config: paddleConfig,
        plan: selectedPlan,
        userId,
        email: customer.email,
        countryCode: customer.countryCode,
        postalCode: customer.postalCode,
        region: customer.region,
        startingCharge: setupFee,
        billingCycle,
      });
    } catch (error) {
      console.error("PADDLE CHECKOUT ERROR:", error);
      setErrorMsg(tr.validation.server);
    }
  };

  useEffect(() => {
    if (usePaddle) return;
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
          onClick: (data, actions) => {
            trackEvent("paypal_button_click", { plan: selectedPlan });
            if (!planIsValid) {
              navigate(buildLocalizedPath("/pricing", lang), { replace: true });
              return actions.reject();
            }
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
            trackEvent("paddle_checkout_started", { plan: selectedPlan, startingCharge: setupFee });
            return actions.resolve();
          },
          createSubscription: (data, actions) =>
            actions.subscription.create({ plan_id: planId }),
          onApprove: async (data) => {
            purchaseDoneRef.current = true;
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
              setUserData({ email: customer.email, phone: customer.phone });
              trackPurchase({
                value: setupFee,
                currency: "USD",
                offer: `$${setupFee}`,
                plan: selectedPlan,
                transactionId: data.subscriptionID,
              });
              trackEvent("trial_activated", {
                plan: selectedPlan,
                value: setupFee,
                currency: "USD",
              });
              await finishAndLogin();
            } catch (error) {
              console.error("PAYPAL APPROVE ERROR:", error);
              setErrorMsg(tr.validation.server);
              setProcessing(false);
            }
          },
          onError: (err) => {
            console.error("PAYPAL ERROR:", err);
            trackEvent("paypal_checkout_error", { plan: selectedPlan });
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
  }, [selectedPlan, usePaddle]);

  return (
    <main className="checkout-page">
      <div className="checkout-shell">
        <header className="checkout-heading">
          <h1>{tr.title}</h1>
          <p>{tr.subtitle}</p>
        </header>
        <div className="checkout-shell-grid">
          
          <div className="checkout-shell-1"> 
            <div>        
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
                    <strong>${formatMoney(recurringPrice)}</strong>
                    <span>{billingCycle === "annual" ? "/year" : tr.month}</span>
                  </div>
                </div>
                <div className="checkout-summary-line">
                  <span>{tr.setupFee}</span>
                  <strong>${formatMoney(setupFee)}</strong>
                </div>
                <div className="checkout-summary-line checkout-next-charge">
                  <span>{tr.nextCharge}</span>
                  <span className="checkout-next-charge-val">
                    ${formatMoney(recurringPrice)} · {nextChargeStr}
                  </span>
                </div>
                <div className="checkout-summary-total">
                  <strong>{tr.dueToday}</strong>
                  <div>
                    <span>USD</span>
                    <strong>${formatMoney(setupFee)}</strong>
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
          </div>

          <div className="checkout-shell-1 shell-2">
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

              <div className="checkout-paypal">
                {usePaddle ? (
                  <>
                    <div
                      className={`${PADDLE_INLINE_FRAME_CLASS} checkout-inline-frame`}
                      style={{ display: "block" }}
                    />
                    {processing && (
                      <p className="checkout-paypal-status">{tr.processing}</p>
                    )}
                    {errorMsg && (
                      <>
                        <p className="checkout-paypal-error">{errorMsg}</p>
                        <button
                          type="button"
                          className="checkout-paddle-btn"
                          onClick={startPaddleOverlayFallback}
                          disabled={processing}
                          style={{
                            width: "100%",
                            padding: "14px 16px",
                            borderRadius: "8px",
                            border: "none",
                            background: "#111827",
                            color: "#fff",
                            fontSize: "16px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {`Pay $${setupFee} and start your trial`}
                        </button>
                      </>
                    )}
                  </>
                ) : annualUnavailable ? (
                  <>
                    <p className="checkout-paypal-error">
                      Annual billing for this plan is being finalized and is not
                      available yet. Please switch to monthly billing to continue.
                    </p>
                    {errorMsg && (
                      <p className="checkout-paypal-error">{errorMsg}</p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="checkout-paypal-error">
                      Pricing is not configured yet for this offer. The starting-price
                      ID and recurring-price ID must both be configured before checkout
                      can open.
                    </p>
                    {errorMsg && (
                      <p className="checkout-paypal-error">{errorMsg}</p>
                    )}
                  </>
                )}
              </div>

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