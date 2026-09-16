import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  User, Mail, Phone, Layers, CreditCard, Calendar, Lock, ShieldCheck,
  Edit2, ExternalLink, HelpCircle, Zap,
} from "lucide-react";
import { trackEvent, trackPurchase, setUserData } from "../../utils/track";
import { useAuth } from "../../context/AuthContext";
import {
  fetchNuveiConfig, fetchNuveiSubscription, nuveiSaveToken, nuveiActivate, collectBrowserInfo,
  nuveiThreeDsContinue, nuveiListCards,
} from "../../api/nuveiApi";
import { mountNuveiForm } from "./nuveiSdk";
import apiClient from "../../api/apiClient";
import { clearSetupOffer } from "../../utils/offer";
import { buildLocalizedPath, localeCodeFromPath } from "../../i18n/locales";
import "./CheckoutNuvei.css";

const PLAN_DATA = {
  solo: { price: 127, startPrice: 11, users: 1 },
  team: { price: 297, startPrice: 22, users: 3 },
  growth: { price: 497, startPrice: 33, users: 5 },
};
const NUVEI_KEY = { solo: "solo", team: "business", growth: "scale" };
const PLAN_ALIASES = { solo: "solo", team: "team", growth: "growth", business: "team", scale: "growth", pro: "solo" };
const normalizePlan = (v) => { const k = String(v || "").trim().toLowerCase(); const m = PLAN_ALIASES[k]; return m && PLAN_DATA[m] ? m : null; };
const money = (v) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);

const t = {
  en: {
    secureCheckout: "Secure Checkout", brand: "Agentic CRM",
    s1: "Account", s1s: "Completed", s2: "Plan", s2s: "Completed", s3: "Secure payment", s3s: "Your card details",
    infoTitle: "Your information", infoSub: "This is the account we'll create for your subscription.", edit: "Edit",
    fullName: "Full name", email: "Email address", phone: "Phone number",
    planTitle: "Your selected plan", planSub: "Review your plan details below.", changePlan: "Change plan",
    planNames: { solo: "Solo Plan", team: "Business Plan", growth: "Scale Plan" },
    userOne: "1 user", userMany: "{n} users", workspace: "One workspace included",
    activationFee: "Activation fee — due today", trial: "14-day trial", included: "Included",
    firstPayment: "First monthly payment — {date}", thenMonthly: "Then ${p}/month until canceled",
    dueToday: "Due today",
    payTitle: "Secure card payment", paySub: "Activate your account and begin your 14-day trial.",
    cardHint: "Enter your card in Nuvei's secure form:",
    agreePrefix: "I agree to the", terms: "Terms and Conditions", and: "and", privacy: "Privacy Policy",
    paySecurely: "Pay ${a} Securely", processing: "Activating your account...",
    tokenization: "Secure tokenization", threeds: "3DS protected",
    processedBy: "Secure payments processed by Nuvei / Datafast.",
    nextTitle: "What happens next?", nextSub: "You're almost set. Here's what to expect:",
    next1: "Account activated today", next1s: "Get instant access to Cortexa.",
    next2: "Manage or cancel from Billing", next2s: "You're in control anytime.",
    errTerms: "Please agree to the Terms and Conditions to continue.",
    errCard: "Please complete your card details.",
    errServer: "Something went wrong. Please try again or use another card.",
    errDeclined: "The payment could not be completed. Please try another card.",
    errAlreadySubscribed: "You already have an active {plan} subscription. To change plans, please contact support.",
    errConfig: "We could not load the payment form. Please refresh the page or try again in a moment.",
    errPending: "Your payment is still being verified. Please wait a moment and refresh, or contact support if this continues.",
    unavailable: "Payments are being finalized and are not available right now. Please contact support.",
  },
  es: {
    secureCheckout: "Pago seguro", brand: "CRM Agéntico",
    s1: "Cuenta", s1s: "Completado", s2: "Plan", s2s: "Completado", s3: "Pago seguro", s3s: "Datos de tu tarjeta",
    infoTitle: "Tu información", infoSub: "Esta es la cuenta que crearemos para tu suscripción.", edit: "Editar",
    fullName: "Nombre completo", email: "Correo electrónico", phone: "Número de teléfono",
    planTitle: "Tu plan seleccionado", planSub: "Revisa los detalles de tu plan.", changePlan: "Cambiar plan",
    planNames: { solo: "Plan Solo", team: "Plan Business", growth: "Plan Scale" },
    userOne: "1 usuario", userMany: "{n} usuarios", workspace: "Un espacio de trabajo incluido",
    activationFee: "Cuota de activación — a pagar hoy", trial: "Prueba de 14 días", included: "Incluida",
    firstPayment: "Primer pago mensual — {date}", thenMonthly: "Luego ${p}/mes hasta que canceles",
    dueToday: "Total a pagar hoy",
    payTitle: "Pago seguro con tarjeta", paySub: "Activa tu cuenta y comienza tu prueba de 14 días.",
    cardHint: "Ingresa tu tarjeta en el formulario seguro de Nuvei:",
    agreePrefix: "Acepto los", terms: "Términos y Condiciones", and: "y", privacy: "Política de Privacidad",
    paySecurely: "Pagar ${a} de forma segura", processing: "Activando tu cuenta...",
    tokenization: "Tokenización segura", threeds: "Protegido con 3DS",
    processedBy: "Pagos seguros procesados por Nuvei / Datafast.",
    nextTitle: "¿Qué sigue?", nextSub: "Ya casi está. Esto es lo que puedes esperar:",
    next1: "Cuenta activada hoy", next1s: "Acceso inmediato a Cortexa.",
    next2: "Administra o cancela desde Facturación", next2s: "Tú tienes el control en todo momento.",
    errTerms: "Acepta los Términos y Condiciones para continuar.",
    errCard: "Completa los datos de tu tarjeta.",
    errServer: "Algo salió mal. Inténtalo de nuevo o usa otra tarjeta.",
    errDeclined: "No se pudo completar el pago. Prueba con otra tarjeta.",
    errAlreadySubscribed: "Ya tienes una suscripción {plan} activa. Para cambiar de plan, contacta con soporte.",
    errConfig: "No pudimos cargar el formulario de pago. Actualiza la página o inténtalo en un momento.",
    errPending: "Tu pago aún se está verificando. Espera un momento y actualiza, o contacta con soporte si continúa.",
    unavailable: "Los pagos se están finalizando y no están disponibles en este momento. Contacta con soporte.",
  },
  pt: {
    secureCheckout: "Pagamento seguro", brand: "CRM Agêntico",
    s1: "Conta", s1s: "Concluído", s2: "Plano", s2s: "Concluído", s3: "Pagamento seguro", s3s: "Dados do seu cartão",
    infoTitle: "Suas informações", infoSub: "Esta é a conta que criaremos para a sua assinatura.", edit: "Editar",
    fullName: "Nome completo", email: "Endereço de e-mail", phone: "Número de telefone",
    planTitle: "Seu plano selecionado", planSub: "Confira os detalhes do seu plano.", changePlan: "Trocar plano",
    planNames: { solo: "Plano Solo", team: "Plano Business", growth: "Plano Scale" },
    userOne: "1 usuário", userMany: "{n} usuários", workspace: "Um workspace incluído",
    activationFee: "Taxa de ativação — a pagar hoje", trial: "Teste de 14 dias", included: "Incluído",
    firstPayment: "Primeiro pagamento mensal — {date}", thenMonthly: "Depois ${p}/mês até cancelar",
    dueToday: "Total a pagar hoje",
    payTitle: "Pagamento seguro com cartão", paySub: "Ative sua conta e comece seu teste de 14 dias.",
    cardHint: "Informe seu cartão no formulário seguro da Nuvei:",
    agreePrefix: "Concordo com os", terms: "Termos e Condições", and: "e", privacy: "Política de Privacidade",
    paySecurely: "Pagar ${a} com segurança", processing: "Ativando sua conta...",
    tokenization: "Tokenização segura", threeds: "Protegido por 3DS",
    processedBy: "Pagamentos seguros processados pela Nuvei / Datafast.",
    nextTitle: "O que acontece agora?", nextSub: "Está quase pronto. Veja o que esperar:",
    next1: "Conta ativada hoje", next1s: "Acesso imediato ao Cortexa.",
    next2: "Gerencie ou cancele em Faturamento", next2s: "Você tem o controle a qualquer momento.",
    errTerms: "Aceite os Termos e Condições para continuar.",
    errCard: "Preencha os dados do seu cartão.",
    errServer: "Algo deu errado. Tente novamente ou use outro cartão.",
    errDeclined: "Não foi possível concluir o pagamento. Tente outro cartão.",
    errAlreadySubscribed: "Você já tem uma assinatura {plan} ativa. Para trocar de plano, fale com o suporte.",
    errConfig: "Não conseguimos carregar o formulário de pagamento. Atualize a página ou tente novamente em instantes.",
    errPending: "Seu pagamento ainda está sendo verificado. Aguarde um momento e atualize, ou fale com o suporte se continuar.",
    unavailable: "Os pagamentos estão sendo finalizados e não estão disponíveis no momento. Fale com o suporte.",
  },
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { refreshUser, user, loading: authLoading, setUser } = useAuth();
  const [searchParams] = useSearchParams();
  // The URL decides the language: /checkout is English, /es/checkout Spanish,
  // /pt/checkout Portuguese.
  const { pathname } = useLocation();
  const [lang] = useState(() => localeCodeFromPath(pathname));
  const tr = t[lang] || t.en;

  const resolvedPlan = normalizePlan(searchParams.get("plan") || localStorage.getItem("trialPlan"));
  const planIsValid = Boolean(resolvedPlan);
  const selectedPlan = resolvedPlan || "team";
  const plan = PLAN_DATA[selectedPlan];
  const nuveiPlanKey = NUVEI_KEY[selectedPlan];

  // Identity comes from the signed-in user first; localStorage is only a fallback
  // (it can hold a PREVIOUS person's details on a shared browser).
  const customer = {
    name: user?.name || localStorage.getItem("name") || "",
    email: user?.email || localStorage.getItem("email") || "",
    phone: user?.phone || localStorage.getItem("phone") || "",
    userId: user?.id || localStorage.getItem("trialUserId") || "",
  };
  useEffect(() => { if (user?.id) { localStorage.setItem("trialUserId", user.id); if (user.email) localStorage.setItem("email", user.email); } }, [user]);

  const [config, setConfig] = useState(null);
  const [consent, setConsent] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  // Bumped after a decline/error: Nuvei's SDK removes its form after every
  // tokenize response, so a fresh form must be mounted for the customer to retry.
  const [formGen, setFormGen] = useState(0);
  const [blocked, setBlocked] = useState(false); // already has a live subscription
  const submitRef = useRef(null);
  const mountedRef = useRef(false);
  const consentRef = useRef(false);
  useEffect(() => { consentRef.current = consent; }, [consent]);
  const payingRef = useRef(false);
  const processingRef = useRef(false);
  const formGenRef = useRef(0);
  useEffect(() => { payingRef.current = paying; }, [paying]);
  useEffect(() => { processingRef.current = processing; }, [processing]);
  useEffect(() => { formGenRef.current = formGen; }, [formGen]);
  const remountCount = useRef(0);
  const remountForm = () => {
    if (remountCount.current >= 3) { setErrorMsg(tr.errConfig); return; } // stop looping on a dead SDK
    remountCount.current += 1;
    mountedRef.current = false; setFormReady(false); setFormGen((g) => g + 1);
  };

  const nuveiPlan = (config?.plans || []).find((p) => p.key === nuveiPlanKey) || null;
  const setupFee = nuveiPlan ? nuveiPlan.activation : plan.startPrice;
  const monthly = nuveiPlan ? nuveiPlan.monthly : plan.price;
  const trialDays = nuveiPlan ? nuveiPlan.trialDays : 14;
  const firstDate = new Date(Date.now() + trialDays * 86400000)
    .toLocaleDateString(lang === "es" ? "es-ES" : lang === "pt" ? "pt-BR" : "en-US", { year: "numeric", month: "short", day: "numeric" });

  useEffect(() => { if (!planIsValid) navigate(buildLocalizedPath("/pricing", lang), { replace: true }); }, [planIsValid, navigate, lang]);
  useEffect(() => {
    if (!planIsValid) return;
    trackEvent("begin_checkout", { plan: selectedPlan });
    trackEvent("activation_intent", { plan: selectedPlan, offer: `$${setupFee}`, value: setupFee, currency: "USD" });
  }, [selectedPlan, planIsValid, setupFee]);

  useEffect(() => { let c = false; fetchNuveiConfig().then((cf) => { if (!c) setConfig(cf); }); return () => { c = true; }; }, []);

  // A visitor with no session (fresh browser, expired login) must sign in first;
  // otherwise the checkout renders with no form and a disabled Pay button.
  const goSignIn = () => {
    // The sign-in return path may not carry a query string; the checkout reads
    // the plan back from localStorage.
    localStorage.setItem("trialPlan", selectedPlan);
    // Drop the stale in-memory user too, or the sign-in page bounces a
    // "logged-in" visitor straight back here without showing the form.
    try { setUser(null); } catch (e) { /* ignore */ }
    // Keep the customer in their language when they come back.
    const back = buildLocalizedPath("/checkout", lang);
    navigate(`${buildLocalizedPath("/sign-in", lang)}?next=${encodeURIComponent(back)}`, { replace: true });
  };
  useEffect(() => {
    if (authLoading || !planIsValid) return;
    if (!user) goSignIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, planIsValid]);

  // Payment options could not be loaded (offline, blocked): say so instead of
  // showing an empty box with a dead Pay button.
  const [configFailed, setConfigFailed] = useState(false);
  useEffect(() => {
    if (config === null) { const t = setTimeout(() => setConfigFailed(true), 15000); return () => clearTimeout(t); }
    setConfigFailed(false);
  }, [config]);
  useEffect(() => { if (configFailed && !config) setErrorMsg(tr.errConfig); }, [configFailed, config]);

  // Returning from a bank 3D Secure challenge, or waiting on a pending
  // verification: the backend callback finalizes the activation, so poll the
  // subscription and finish once it is live.
  const [awaiting, setAwaiting] = useState(false);
  const payStartedRef = useRef(0); // when this page's own Pay click happened
  const trackedRef = useRef(false);
  useEffect(() => {
    if (authLoading || !user || !planIsValid) return;
    if (searchParams.get("threeds") !== "return") return;
    setAwaiting(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, planIsValid]);
  useEffect(() => {
    if (!awaiting) return;
    let stop = false, tries = 0;
    setProcessing(true); setErrorMsg("");
    const fail = (msg) => { stop = true; setAwaiting(false); setProcessing(false); setPaying(false); setErrorMsg(msg); remountForm(); };
    const tick = async () => {
      if (stop) return;
      let sub = null;
      try {
        const res = await apiClient.request("/nuvei/subscription");
        sub = (res?.data ?? res)?.subscription ?? null;
      } catch (e) {
        if (/session expired/i.test(e?.message || "")) { goSignIn(); return; }
      }
      // No attempt on record (or only one from before this Pay click): there
      // is nothing to wait for.
      const created = sub?.created_at ? new Date(sub.created_at).getTime() : 0;
      const st = String(sub?.status || "");
      const oldFailed = ["payment_failed", "canceled", "refunded", "suspended"].includes(st)
        && payStartedRef.current && created && created < payStartedRef.current - 60000;
      if (!sub || oldFailed) { if (++tries >= 3) { fail(tr.errServer); return; } setTimeout(tick, 3000); return; }
      if (["trialing", "active"].includes(st)) { await completeActivation(sub.activation_transaction_id || sub.id); return; }
      if (["payment_failed", "canceled", "suspended", "refunded"].includes(st) || ++tries >= 20) {
        fail(st === "payment_failed" ? tr.errDeclined : st === "refunded" ? tr.errServer : tr.errPending); return;
      }
      setTimeout(tick, 3000);
    };
    tick();
    return () => { stop = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awaiting]);

  // Every path that ends in a live subscription (immediate approval, bank
  // challenge, review, recovered network error) records the purchase once and
  // lands the customer in the app.
  async function completeActivation(transactionId) {
    if (!trackedRef.current) {
      trackedRef.current = true;
      try {
        setUserData({ email: customer.email, phone: customer.phone });
        trackPurchase({ value: setupFee, currency: "USD", offer: `$${setupFee}`, plan: selectedPlan, transactionId });
        trackEvent("trial_activated", { plan: selectedPlan, value: setupFee, currency: "USD" });
      } catch (e) { /* tracking must never block the customer */ }
    }
    await finishAndLogin();
  }

  const usersText = plan.users === 1 ? tr.userOne : tr.userMany.replace("{n}", String(plan.users));

  const finishAndLogin = async () => {
    localStorage.setItem("trialPlan", selectedPlan);
    localStorage.removeItem("password");
    clearSetupOffer();
    localStorage.setItem("cortexa_paid_at", String(Date.now()));
    try { await refreshUser(); } catch (e) {}
    navigate("/dashboard/ai-cortexa-setup", { replace: true });
  };

  // A customer who already has a live subscription never sees a second
  // payment form: a paid (trialing / active) account goes straight into the
  // app; a past-due one is told so (the backend also refuses the charge).
  useEffect(() => {
    if (authLoading || !user) return;
    if (searchParams.get("threeds") === "return") return; // the poll handles it
    let c = false;
    fetchNuveiSubscription().then((sub) => {
      if (c || !sub) return;
      const st = String(sub.status);
      if (["trialing", "active"].includes(st)) { setBlocked(true); finishAndLogin(); return; }
    });
    return () => { c = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  // Mount Nuvei's secure card form as soon as the page is ready.
  useEffect(() => {
    if (!config?.enabled || mountedRef.current || blocked) return;
    const userId = customer.userId || user?.id;
    if (!userId) return;
    mountedRef.current = true;
    setFormReady(false);
    (async () => {
      try {
        const form = await mountNuveiForm({
          containerSelector: "#nuvei-card-form",
          environment: config.environment,
          appCode: config.clientAppCode,
          appKey: config.clientAppKey,
          user: { id: userId, email: customer.email || user?.email },
          country: "ECU",
          locale: lang,
          onIncomplete: () => { setPaying(false); setErrorMsg(tr.errCard); },
        });
        submitRef.current = form.submit;
        // If Nuvei's secure fields never appear, say so and mount a fresh form
        // instead of leaving a dead Pay button.
        form.ready.then((ok) => { if (ok) { remountCount.current = 0; setFormReady(true); } else { setErrorMsg(tr.errConfig); remountForm(); } });
        const card = await form.done; // resolves after "Pay" click + valid card
        await handleTokenized(card);
      } catch (err) {
        setPaying(false);
        setErrorMsg(err?.message || tr.errServer);
        remountForm();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, user, formGen, blocked]);

  // The bank asked the cardholder to authenticate (3D Secure). Nuvei returns
  // HTML, not URLs: `hidden_iframe` (device fingerprint) is rendered invisibly
  // for ~5s and then the authentication continues server-side;
  // `challenge_request` is the bank's own page, which takes over the window.
  // The bank posts the result to our server, which sends the browser back to
  // this page with ?threeds=return, where the poll above finishes the job.
  async function runThreeDs(result) {
    const ch = result?.challenge || {};
    const req = String(ch.challenge_request || "");
    if (/^https?:\/\//i.test(req.trim())) { window.location.href = req.trim(); return; }
    if (req.trim()) {
      try {
        document.open();
        document.write(req);
        document.close();
        return;
      } catch (e) { /* fall through */ }
    }
    if (ch.hidden_iframe) {
      try {
        const frame = document.createElement("iframe");
        frame.setAttribute("aria-hidden", "true");
        frame.style.cssText = "position:absolute;width:0;height:0;border:0;visibility:hidden;";
        document.body.appendChild(frame);
        const doc = frame.contentDocument || frame.contentWindow?.document;
        if (doc) { doc.open(); doc.write(ch.hidden_iframe); doc.close(); }
      } catch (e) { /* ignore: the server-side continue still runs */ }
      await new Promise((r) => setTimeout(r, 5500));
      let next = null;
      try { next = await nuveiThreeDsContinue(result.subscriptionId); } catch (e) { setAwaiting(true); return; }
      if (next?.requires3ds && next?.challenge) return runThreeDs(next);
      return finishActivation(next);
    }
    // 3DS requested without browser content: continue server-side (Nuvei is
    // waiting for auth_continue), then let the poll finish it.
    try {
      const next = await nuveiThreeDsContinue(result.subscriptionId);
      if (next?.requires3ds && next?.challenge && (next.challenge.challenge_request || next.challenge.hidden_iframe)) return runThreeDs(next);
      if (next?.status && next.status !== "pending_activation") return finishActivation(next);
    } catch (e) { /* fall through to polling */ }
    setAwaiting(true);
  }

  async function finishActivation(result) {
    if (result?.requires3ds && result?.challenge) return runThreeDs(result);
    if (result?.status === "pending_activation") {
      // Anti-fraud / bank review / 3DS in flight: the server finalizes it and
      // this page keeps polling until the account is live.
      setAwaiting(true); return;
    }
    if (result?.status === "trialing" || result?.status === "active") {
      await completeActivation(result.transactionId);
      return;
    }
    setProcessing(false); setPaying(false); setErrorMsg(result?.message || tr.errDeclined); remountForm();
  }

  async function handleTokenized(card) {
    setProcessing(true);
    setErrorMsg("");
    let cardId = null;
    try {
      if (card?.reuseSavedCard && !card?.token) {
        // Nuvei reported this exact card as already stored for this customer
        // (a retry with the same card) without echoing its token: charge the
        // stored card instead of telling the customer it was declined.
        const list = await nuveiListCards();
        const cards = list?.cards || [];
        // Never guess: only the card the customer just typed (by last4), or
        // the single card on file.
        const match = card.last4 ? cards.find((c) => c.last4 === card.last4) : (cards.length === 1 ? cards[0] : null);
        if (!match?.id) throw new Error(tr.errDeclined);
        cardId = match.id;
      } else {
        // A fresh token, or the existing token Nuvei echoed for an already
        // stored card (save-token is idempotent per token).
        const saved = await nuveiSaveToken(card);
        if (!saved?.cardId) throw new Error(tr.errServer);
        cardId = saved.cardId;
      }
      const testScenario = searchParams.get("test3ds") || undefined; // staging-only hook, ignored in production
      const result = await nuveiActivate({
        planKey: nuveiPlanKey, cardId,
        browserInfo: collectBrowserInfo(),
        termUrl: `${window.location.origin}/checkout?plan=${selectedPlan}&threeds=return`,
        ...(testScenario ? { testScenario } : {}),
      });
      await finishActivation(result);
    } catch (err) {
      if (/session expired/i.test(err?.message || "")) { goSignIn(); return; }
      if (cardId && /failed to fetch|networkerror|load failed|timed? ?out|api error: 5\d\d|internal server|bad gateway|gateway time/i.test(err?.message || "")) {
        // The charge request left the browser but no answer came back: the
        // server may well have completed it. Poll instead of asking for a
        // second payment.
        setAwaiting(true); return;
      }
      setProcessing(false); setPaying(false); setErrorMsg(err?.message || tr.errServer); remountForm();
    }
  }

  async function payNow() {
    if (blocked) return;
    setErrorMsg("");
    if (!consentRef.current) { setErrorMsg(tr.errTerms); return; }
    if (!formReady) return;
    setPaying(true);
    payStartedRef.current = Date.now();
    // Confirm the session is still valid before tokenizing (access tokens expire).
    try { await apiClient.request("/users/me"); } catch (e) { if (/session expired/i.test(e?.message || "")) { goSignIn(); return; } }
    const ok = submitRef.current && submitRef.current();
    if (!ok) { setPaying(false); setErrorMsg(tr.errServer); return; }
    // If the secure form never answers the submit, do not leave a frozen button.
    const gen = formGen;
    setTimeout(() => {
      if (!processingRef.current && payingRef.current && formGenRef.current === gen) {
        setPaying(false); setErrorMsg(tr.errServer); remountForm();
      }
    }, 60000);
  }

  const go = (path) => navigate(buildLocalizedPath(path, lang));

  return (
    <main className="cxo-page">
      <div className="cxo-wrap">
        <div className="cxo-grid">
          {/* LEFT */}
          <div className="cxo-col cxo-left-col">
            <section className="cxo-card">
              <div className="cxo-chead">
                <div className="cxo-icon"><User size={20} /></div>
                <div className="cxo-chead-copy"><h2>{tr.infoTitle}</h2><p>{tr.infoSub}</p></div>
                <button className="cxo-editlink" onClick={() => navigate("/account/profile")}>{tr.edit} <Edit2 size={14} /></button>
              </div>
              <div className="cxo-fields">
                <div><label className="cxo-label">{tr.fullName}</label><div className="cxo-input"><User size={17} /><input value={customer.name} readOnly /></div></div>
                <div><label className="cxo-label">{tr.email}</label><div className="cxo-input"><Mail size={17} /><input value={customer.email} readOnly /></div></div>
                <div><label className="cxo-label">{tr.phone}</label><div className="cxo-input"><Phone size={17} /><input value={customer.phone} readOnly /></div></div>
              </div>
            </section>

            <section className="cxo-card">
              <div className="cxo-chead">
                <div className="cxo-icon"><Layers size={20} /></div>
                <div className="cxo-chead-copy"><h2>{tr.planTitle}</h2><p>{tr.planSub}</p></div>
                <button className="cxo-editlink" onClick={() => go("/pricing")}>{tr.changePlan} <ExternalLink size={14} /></button>
              </div>
              <div className="cxo-plan-name">{tr.planNames[selectedPlan]}</div>
              <div className="cxo-plan-sub">{usersText}</div>
              <div className="cxo-plan-sub">{tr.workspace}</div>
              <div className="cxo-divider" />
              <div className="cxo-row"><span>{tr.activationFee}</span><b>${money(setupFee)}</b></div>
              <div className="cxo-row"><span>{tr.trial}</span><span className="inc">{tr.included}</span></div>
              <div className="cxo-row"><span>{tr.firstPayment.replace("{date}", firstDate)}</span><b>${money(monthly)}</b></div>
              <p className="cxo-note">{tr.thenMonthly.replace("{p}", money(monthly))}</p>
              <div className="cxo-divider" />
              <div className="cxo-total"><strong>{tr.dueToday}</strong><div className="amt"><em>USD</em><b>${money(setupFee)}</b></div></div>
            </section>
          </div>

          {/* RIGHT */}
          <div className="cxo-col cxo-right-col">
            <section className="cxo-card cxo-payment-card">
              <div className="cxo-chead">
                <div className="cxo-icon"><CreditCard size={20} /></div>
                <div className="cxo-chead-copy"><h2>{tr.payTitle}</h2><p>{tr.paySub}</p></div>
                <CardBrands />
              </div>

              {config && !config.enabled ? (
                <p className="cxo-err">{tr.unavailable}</p>
              ) : (
                <>
                  
                  <div id="nuvei-card-form" className="cxo-nuvei-host" />

                  <label className="cxo-consent">
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                    <span>{tr.agreePrefix} <a href="/terms" target="_blank" rel="noreferrer">{tr.terms}</a> {tr.and} <a href="/privacy-policy" target="_blank" rel="noreferrer">{tr.privacy}</a>.</span>
                  </label>

                  {errorMsg && <div className="cxo-err">{errorMsg}</div>}

                  <button className="cxo-pay" onClick={payNow} disabled={!formReady || paying || processing || !consent}>
                    <Lock size={17} /> {processing ? tr.processing : tr.paySecurely.replace("{a}", money(setupFee))}
                  </button>

                  <div className="cxo-badges">
                    <div className="cxo-badge"><ShieldCheck size={18} /> {tr.tokenization}</div>
                    <div className="cxo-badge"><Lock size={18} /> {tr.threeds}</div>
                  </div>
                  <div className="cxo-processedby">{tr.processedBy}</div>
                </>
              )}
            </section>
          </div>
        </div>

        <div className="cxo-next">
          <div className="cxo-next-item"><div className="cxo-next-badge"><Zap size={17} /></div><div><b>{tr.nextTitle}</b><small>{tr.nextSub}</small></div></div>
          <div className="cxo-next-item"><div className="cxo-next-badge">1</div><div><b>{tr.next1}</b><small>{tr.next1s}</small></div></div>
          <div className="cxo-next-item"><div className="cxo-next-badge">2</div><div><b>{tr.next2}</b><small>{tr.next2s}</small></div></div>
        </div>
      </div>
    </main>
  );
}

function CardBrands() {
  return (
    <div className="cxo-cards-accepted">
      <svg className="cxo-brandlogo" viewBox="0 0 48 32" width="34" height="22" aria-label="Visa">
        <rect width="48" height="32" rx="4" fill="#fff" stroke="#e6e8ee" />
        <text x="24" y="21" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1a1f71" fontFamily="Arial">VISA</text>
      </svg>
      <svg className="cxo-brandlogo" viewBox="0 0 48 32" width="34" height="22" aria-label="Mastercard">
        <rect width="48" height="32" rx="4" fill="#fff" stroke="#e6e8ee" />
        <circle cx="20" cy="16" r="8" fill="#eb001b" />
        <circle cx="28" cy="16" r="8" fill="#f79e1b" fillOpacity="0.9" />
      </svg>
    </div>
  );
}
