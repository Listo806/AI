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

// IMPORTANT BILLING MAPPING:
// The amounts below are the public "to start" charges. They are NOT monthly plans.
// Each starting charge stays connected to the existing recurring subscription:
// solo   -> $7 now  -> $197/month
// team   -> $14 now -> $347/month (displayed as Business)
// growth -> $21 now -> $497/month (displayed as Scale)
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
    acceptToLoad: "Accept the Terms to load the secure payment form.",
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
    acceptToLoad: "Acepta los Términos para cargar el formulario de pago seguro.",
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
    acceptToLoad: "Aceite os Termos para carregar o formulário de pagamento seguro.",
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

// Accept both the new tier names (business/scale) and the legacy checkout keys
// (solo/team/growth), mapping everything to the checkout's keys. Returns null for
// free / unknown / missing so checkout NEVER silently bills the wrong tier — the
// caller redirects to pricing instead of defaulting to any plan.
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
  const { setUser, refreshUser, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [lang] = useState(() => localStorage.getItem("cortexa_lang") || "en");
  const tr = t[lang] || t.en;

  const requestedPlan =
    searchParams.get("plan") || localStorage.getItem("trialPlan");
  const resolvedPlan = normalizePlan(requestedPlan);
  // True only when a real plan was supplied. A charge is gated on this, so a
  // missing/unknown plan can never be billed as the display default below.
  const planIsValid = Boolean(resolvedPlan);
  const selectedPlan = resolvedPlan || "team";
  const plan = PLAN_DATA[selectedPlan];
  const billingCycle =
    String(searchParams.get("billing") || "monthly").toLowerCase() === "annual"
      ? "annual"
      : "monthly";

  const [customer] = useState(() => ({
    name: localStorage.getItem("name") || "",
    email: localStorage.getItem("email") || "",
    phone: localStorage.getItem("phone") || "",
    userId: localStorage.getItem("trialUserId") || "",
  }));

  // Resume-checkout robustness: when a signed-in user reaches checkout (e.g. they
  // logged back in on another device to finish paying), sync their account
  // id/email into localStorage so the payment links to the correct account.
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem("trialUserId", user.id);
      if (user.email) localStorage.setItem("email", user.email);
    }
  }, [user]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [sdkStatus, setSdkStatus] = useState("loading"); // loading | ready | error
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Refs so the PayPal button callbacks read the latest values.
  const acceptedTermsRef = useRef(false);
  const paypalContainerRef = useRef(null);
  const buttonsRenderedRef = useRef(false);

  // Checkout-abandon tracking. checkoutStartedRef flips true once the visitor
  // reaches a valid paid checkout; purchaseDoneRef flips true the moment a
  // payment completes; abandonFiredRef guards against firing twice. selectedPlan
  // is mirrored to a ref so the unmount/pagehide handler reads the latest plan.
  const checkoutStartedRef = useRef(false);
  const purchaseDoneRef = useRef(false);
  const abandonFiredRef = useRef(false);
  const selectedPlanRef = useRef(selectedPlan);
  useEffect(() => {
    selectedPlanRef.current = selectedPlan;
  }, [selectedPlan]);

  // Paddle stays dormant until its config carries a client token AND a price for
  // this plan; until then the PayPal path below is used exactly as before.
  const [paddleConfig, setPaddleConfig] = useState(null);
  const paddleInitRef = useRef(false);
  // Guards the one-time mount of the inline Paddle payment form into our page.
  const inlineMountedRef = useRef(false);

  // Paddle is usable only when BOTH price IDs for this offer exist:
  // 1) the plan-specific starting charge ($7/$14/$21)
  // 2) the existing recurring subscription ($197/$347/$497)
  // This prevents accidentally creating a $7/$14/$21 monthly subscription.
  const usePaddle = paddleReady(paddleConfig, selectedPlan, billingCycle);
  // Annual must have its own Paddle price. When it is missing the checkout is
  // blocked (never silently billed monthly) until the annual Price ID is set.
  const annualUnavailable =
    billingCycle === "annual" &&
    !!paddleConfig &&
    !paddleConfig?.annualPrices?.[selectedPlan];
  const setupFee = plan.startPrice;
  const recurringPrice =
    billingCycle === "annual" ? plan.annualPrice : plan.price;
  // First recurring charge = end of the 14-day trial (today + 14 days), shown to
  // the customer as future-billing info above the prominent "Due today" total.
  const nextChargeStr = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toLocaleDateString(
      lang === "es" ? "es-ES" : lang === "pt" ? "pt-BR" : "en-US",
      { year: "numeric", month: "short", day: "numeric" },
    );

  useEffect(() => {
    acceptedTermsRef.current = acceptedTerms;
  }, [acceptedTerms]);

  // Safety: if checkout was reached without a valid plan (missing or unknown
  // param), send the customer back to pricing to choose one, rather than showing
  // or charging a default plan.
  useEffect(() => {
    if (!planIsValid) {
      navigate(buildLocalizedPath("/pricing", lang), { replace: true });
    }
  }, [planIsValid, navigate, lang]);

  // Funnel: the user reached the checkout for a paid plan. This is the
  // begin_checkout stage and also the "activation intent" signal (someone who
  // reached the paid $7/$14/$21 activation checkout but has not paid yet) used to
  // build the activation-intent retargeting audience.
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

  // Funnel: fire a single checkout_abandoned event if the visitor engaged the
  // paid checkout but leaves — closing the tab (pagehide) or navigating away
  // (unmount) — without completing a purchase. This is the direct signal for the
  // checkout-abandon retargeting audience. A completed purchase sets
  // purchaseDoneRef first, so paying customers never fire it. Best-effort and
  // guarded so it can never fire twice or block navigation.
  useEffect(() => {
    const fireAbandon = (e) => {
      if (abandonFiredRef.current) return;
      // A persisted pagehide means the page is going into the back/forward cache
      // (e.g. a mobile app-switch to fetch a card) and may be restored, so the
      // visitor has not really left — don't count it as an abandon.
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

  // Load Paddle config once (null on error, so PayPal remains the fallback).
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

  // The user is already authenticated (from trial signup), so after payment
  // succeeds we just refresh their status and open the product.
  // Fire the Google Ads Purchase conversion only once the backend confirms the
  // Paddle payment activated the account. The webhook lands a few seconds after
  // the browser's checkout.completed, so poll a one-time server claim: it
  // returns fire:true a single time for a confirmed, not-yet-reported user, so
  // the tag fires exactly once and a page refresh can never re-trigger it.
  const reportPaddlePurchaseWhenConfirmed = async (paddleTxnId) => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        const res = await apiClient.request(
          "/payments/paddle/purchase-conversion/claim",
          { method: "POST" },
        );
        const data = res?.data ?? res;
        if (data?.fire) {
          // Fire GA4 purchase + the Google Ads Purchase conversion, with the
          // real value + offer + plan from the server (authoritative) and a
          // transaction id for dedup (server value, else the Paddle event's).
          trackPurchase({
            value: data.value ?? setupFee,
            currency: data.currency ?? "USD",
            offer: data.offer ?? `$${setupFee}`,
            plan: data.plan ?? selectedPlan,
            transactionId: data.transactionId ?? paddleTxnId,
          });
          return;
        }
      } catch (_e) {
        // Webhook may not have landed yet; keep polling.
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  };

  const finishAndLogin = async (userId) => {
    localStorage.setItem("trialPlan", selectedPlan);
    localStorage.removeItem("password");
    // Clear any legacy exit-offer flag so it cannot affect a later checkout.
    clearSetupOffer();
    // Payment just completed. Record it so the dashboard paywall gate lets them
    // straight in while the Paddle webhook catches up and flips payment_status to
    // active server-side (prevents bouncing a just-paid customer back to checkout).
    localStorage.setItem("cortexa_paid_at", String(Date.now()));
    try {
      await refreshUser();
    } catch (e) {
      // ignore; webhook + next load will reconcile status
    }
    // Onboarding: a brand-new customer lands on Setup first (connect WhatsApp QR
    // + initial configuration), then moves into the CRM from there.
    navigate("/dashboard/ai-cortexa-setup", { replace: true });
  };

  // Shared Paddle event handler (used by both the inline and the overlay-fallback
  // paths). On a completed checkout the account is activated server-side by the
  // signature-verified webhook; here we fire the conversion/funnel events and log
  // the user in.
  const handlePaddleEvent = (ev) => {
    if (ev?.name !== "checkout.completed") return;
    // Payment completed: this visitor did not abandon checkout.
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
    // Do NOT fire the Purchase conversion here. checkout.completed is a browser
    // event that arrives before the payment is confirmed. Poll the backend, which
    // reports fire:true only after the signature-verified Paddle webhook activates
    // the account, and only once per user, so a Thank You page refresh can never
    // re-fire it.
    reportPaddlePurchaseWhenConfirmed(paddleTxnId);
    if (uid) finishAndLogin(uid);
  };

  // INLINE Paddle checkout: render the payment form inside our page (into the
  // element carrying PADDLE_INLINE_FRAME_CLASS) once the customer accepts the
  // Terms. This keeps OUR order summary — where "Due today" is the final and most
  // prominent price — visible while they pay, so the recurring amount never
  // visually overpowers today's charge (matches the approved layout). Mounts once.
  useEffect(() => {
    if (!usePaddle || !acceptedTerms || inlineMountedRef.current) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usePaddle, acceptedTerms, paddleConfig, selectedPlan, billingCycle]);

  // Overlay fallback: only used if the inline form fails to load, so a customer
  // is never left unable to pay. Opens Paddle's standard overlay checkout.
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
        startingCharge: setupFee,
        billingCycle,
      });
    } catch (error) {
      console.error("PADDLE CHECKOUT ERROR:", error);
      setErrorMsg(tr.validation.server);
    }
  };

  useEffect(() => {
    if (usePaddle) return; // Paddle handles checkout; skip PayPal init.
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
            // Funnel: customer clicked the PayPal button.
            trackEvent("paypal_button_click", { plan: selectedPlan });
            // Never charge a missing/unknown plan — go pick one first.
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
            // Funnel: validation passed, the PayPal checkout is opening.
            trackEvent("paddle_checkout_started", { plan: selectedPlan, startingCharge: setupFee });
            return actions.resolve();
          },
          createSubscription: (data, actions) =>
            actions.subscription.create({ plan_id: planId }),
          onApprove: async (data) => {
            // Payment approved: this visitor did not abandon checkout.
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
              // Enhanced Conversions: pass the customer's contact info so Google
              // Ads can match this purchase to the ad click (gtag hashes it).
              setUserData({ email: customer.email, phone: customer.phone });
              // Fire GA4 purchase + the Google Ads Purchase conversion with the
              // value, offer, plan, and the subscription id as the transaction id.
              trackPurchase({
                value: setupFee,
                currency: "USD",
                offer: `$${setupFee}`,
                plan: selectedPlan,
                transactionId: data.subscriptionID,
              });
              // Funnel + retargeting: trial activated (paid). Used to exclude
              // these customers from acquisition retargeting audiences.
              trackEvent("trial_activated", {
                plan: selectedPlan,
                value: setupFee,
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
            // Funnel: PayPal checkout errored (helps quantify checkout blocks).
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlan, usePaddle]);

  return (
    <main className="checkout-page">
      <div className="checkout-shell">
        <div className="checkout-shell-grid">
          <div className="checkout-shell-1">
            <header className="checkout-heading">
              <h1>{tr.title}</h1>
              <p>{tr.subtitle}</p>
            </header>
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
                {usePaddle ? (
                  <>
                    {!acceptedTerms && (
                      <p className="checkout-paypal-status">{tr.acceptToLoad}</p>
                    )}
                    {/* Paddle injects the inline payment form into this element
                        (matched by class). Our summary above stays the prominent
                        price, so "Due today" is the final amount the customer sees. */}
                    <div
                      className={`${PADDLE_INLINE_FRAME_CLASS} checkout-inline-frame`}
                      style={{ display: acceptedTerms ? "block" : "none" }}
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