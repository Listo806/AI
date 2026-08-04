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
import { trackEvent, trackAdsConversion, setUserData } from "../../utils/track";
import apiClient from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import { fetchPaddleConfig } from "../../api/paddleApi";
import { paddleReady, initPaddle, openPaddleCheckout } from "./paddleCheckout";
import {
  setupOfferActive,
  clearSetupOffer,
  SETUP_PRICE_7,
  OFFER_SETUP_FEE,
} from "../../utils/offer";
import "./CheckoutPage.css";

// Checkout with PayPal subscriptions. The customer pays a one-time $97 setup fee
// today, then gets a 14-day free trial, then the monthly plan price. The PayPal
// plan (created in PayPal) carries the setup fee + trial + monthly billing; the
// front end just renders the subscribe button for the selected tier.
const API_BASE = "https://backend.cortexaaicrm.com";
const SETUP_FEE = 97;

// Dedicated Purchase conversion action (Google Ads). The default below is the
// dedicated "Purchase" action created in Google Ads, separate from Sign-up.
// VITE_ADS_PURCHASE_CONVERSION can override it if it ever changes.
const PURCHASE_CONVERSION_SEND_TO =
  import.meta.env.VITE_ADS_PURCHASE_CONVERSION ||
  "AW-17836518151/2dX2CMD3mNccEIfWjrlC";

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
    footer: "Pagamento seguro com Paddle. Cancele quando quiser.",
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
  const { setUser, refreshUser, user } = useAuth();
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

  // Paddle stays dormant until its config carries a client token AND a price for
  // this plan; until then the PayPal path below is used exactly as before.
  const [paddleConfig, setPaddleConfig] = useState(null);
  const paddleInitRef = useRef(false);

  // Paddle is the active path when it has a client token + a price for this plan.
  // Exit-intent $7 offer: when the visitor claimed it AND Paddle is active AND a
  // $7 price is configured, the setup fee for this checkout becomes $7, not $97.
  const usePaddle = paddleReady(paddleConfig, selectedPlan);
  const offerActive = usePaddle && setupOfferActive();
  const setupFee = offerActive ? OFFER_SETUP_FEE : SETUP_FEE;

  useEffect(() => {
    acceptedTermsRef.current = acceptedTerms;
  }, [acceptedTerms]);

  // Funnel: record that the checkout / plan-review page was viewed.
  useEffect(() => {
    trackEvent("checkout_view", { plan: selectedPlan });
  }, [selectedPlan]);

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
  const reportPaddlePurchaseWhenConfirmed = async () => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        const res = await apiClient.request(
          "/payments/paddle/purchase-conversion/claim",
          { method: "POST" },
        );
        const data = res?.data ?? res;
        if (data?.fire) {
          trackAdsConversion(PURCHASE_CONVERSION_SEND_TO, {
            value: data.value ?? setupFee,
            currency: data.currency ?? "USD",
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
    // The exit-intent $7 offer is consumed once the purchase completes.
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

  // Paddle overlay checkout. Active only when usePaddle (client token + a price
  // for this plan); otherwise the PayPal path below runs unchanged. On a
  // completed checkout the account is activated server-side by the Paddle
  // webhook; here we fire the same conversion/funnel events and log the user in.
  const startPaddle = async () => {
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
        await initPaddle(paddleConfig, (ev) => {
          if (ev?.name === "checkout.completed") {
            const uid = customer.userId || localStorage.getItem("trialUserId");
            setUserData({ email: customer.email, phone: customer.phone });
            trackEvent("trial_activated", {
              plan: selectedPlan,
              value: setupFee,
              currency: "USD",
            });
            setProcessing(true);
            // Do NOT fire the Purchase conversion here. checkout.completed is a
            // browser event that arrives before the payment is confirmed. Poll
            // the backend, which reports fire:true only after the signature-
            // verified Paddle webhook activates the account, and only once per
            // user, so a Thank You page refresh can never re-fire it.
            reportPaddlePurchaseWhenConfirmed();
            if (uid) finishAndLogin(uid);
          }
        });
      }
      trackEvent("paypal_checkout_started", { plan: selectedPlan });
      openPaddleCheckout({
        config: paddleConfig,
        plan: selectedPlan,
        userId,
        email: customer.email,
        setupPriceId: offerActive ? SETUP_PRICE_7 : undefined,
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
            trackEvent("paypal_checkout_started", { plan: selectedPlan });
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
              // Enhanced Conversions: pass the customer's contact info so Google
              // Ads can match this purchase to the ad click (gtag hashes it).
              setUserData({ email: customer.email, phone: customer.phone });
              // Google Ads: count the completed $97 purchase as a conversion.
              trackAdsConversion(PURCHASE_CONVERSION_SEND_TO, {
                value: setupFee,
                currency: "USD",
                transaction_id: data.subscriptionID,
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
                <strong>${formatMoney(setupFee)}</strong>
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
                  <p>{tr.checkoutDesc.replace("$97", `$${setupFee}`)}</p>
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
                {usePaddle ? (
                  <>
                    <button
                      type="button"
                      className="checkout-paddle-btn"
                      onClick={startPaddle}
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
                    {processing && (
                      <p className="checkout-paypal-status">{tr.processing}</p>
                    )}
                    {errorMsg && (
                      <p className="checkout-paypal-error">{errorMsg}</p>
                    )}
                  </>
                ) : (
                  <>
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
