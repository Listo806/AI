import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  User, Mail, Phone, Layers, CreditCard, Calendar, Lock, ShieldCheck,
  Check, Edit2, ExternalLink, HelpCircle, Zap,
} from "lucide-react";
import { trackEvent, trackPurchase, setUserData } from "../../utils/track";
import { useAuth } from "../../context/AuthContext";
import {
  fetchNuveiConfig, nuveiSaveToken, nuveiActivate, collectBrowserInfo,
} from "../../api/nuveiApi";
import { mountNuveiForm } from "./nuveiSdk";
import { clearSetupOffer } from "../../utils/offer";
import { buildLocalizedPath } from "../../i18n/locales";
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
    errServer: "Something went wrong. Please try again or use another card.",
    errDeclined: "The payment could not be completed. Please try another card.",
    unavailable: "Payments are being finalized and are not available right now. Please contact support.",
  },
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [lang] = useState(() => localStorage.getItem("cortexa_lang") || "en");
  const tr = t[lang] || t.en;

  const resolvedPlan = normalizePlan(searchParams.get("plan") || localStorage.getItem("trialPlan"));
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
  useEffect(() => { if (user?.id) { localStorage.setItem("trialUserId", user.id); if (user.email) localStorage.setItem("email", user.email); } }, [user]);

  const [config, setConfig] = useState(null);
  const [consent, setConsent] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const submitRef = useRef(null);
  const mountedRef = useRef(false);
  const consentRef = useRef(false);
  useEffect(() => { consentRef.current = consent; }, [consent]);

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

  const usersText = plan.users === 1 ? tr.userOne : tr.userMany.replace("{n}", String(plan.users));

  const finishAndLogin = async () => {
    localStorage.setItem("trialPlan", selectedPlan);
    localStorage.removeItem("password");
    clearSetupOffer();
    localStorage.setItem("cortexa_paid_at", String(Date.now()));
    try { await refreshUser(); } catch (e) {}
    navigate("/dashboard/ai-cortexa-setup", { replace: true });
  };

  // Mount Nuvei's secure card form as soon as the page is ready.
  useEffect(() => {
    if (!config?.enabled || mountedRef.current) return;
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
          onIncomplete: (msg) => { setPaying(false); setErrorMsg(msg); },
        });
        submitRef.current = form.submit;
        form.ready.then((ok) => setFormReady(!!ok));
        const card = await form.done; // resolves after "Pay" click + valid card
        await handleTokenized(card);
      } catch (err) {
        setPaying(false);
        mountedRef.current = false;
        setErrorMsg(err?.message || tr.errServer);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, user]);

  async function handleTokenized(card) {
    setProcessing(true);
    setErrorMsg("");
    try {
      const saved = await nuveiSaveToken(card);
      if (!saved?.cardId) throw new Error(tr.errServer);
      const result = await nuveiActivate({
        planKey: nuveiPlanKey, cardId: saved.cardId,
        browserInfo: collectBrowserInfo(),
        termUrl: `${window.location.origin}/checkout?plan=${selectedPlan}&threeds=return`,
      });
      if (result?.requires3ds && result?.challenge) {
        const url = result.challenge.challenge_request || result.challenge.acs_url || result.challenge.url;
        if (url && /^https?:\/\//i.test(url)) { window.location.href = url; return; }
        setProcessing(false); setPaying(false); setErrorMsg(tr.errDeclined); return;
      }
      if (result?.status === "trialing" || result?.status === "active") {
        setUserData({ email: customer.email, phone: customer.phone });
        trackPurchase({ value: setupFee, currency: "USD", offer: `$${setupFee}`, plan: selectedPlan, transactionId: result.transactionId });
        trackEvent("trial_activated", { plan: selectedPlan, value: setupFee, currency: "USD" });
        await finishAndLogin();
        return;
      }
      setProcessing(false); setPaying(false); setErrorMsg(result?.message || tr.errDeclined);
    } catch (err) {
      setProcessing(false); setPaying(false); setErrorMsg(err?.message || tr.errServer);
    }
  }

  function payNow() {
    setErrorMsg("");
    if (!consentRef.current) { setErrorMsg(tr.errTerms); return; }
    if (!formReady) return;
    setPaying(true);
    const ok = submitRef.current && submitRef.current();
    if (!ok) { setPaying(false); setErrorMsg(tr.errServer); }
  }

  const go = (path) => navigate(buildLocalizedPath(path, lang));

  return (
    <main className="cxo-page">
      <header className="cxo-top">
        <div className="cxo-brand"><ShieldCheck size={22} /> <b>Cortexa</b> <span>{tr.brand}</span></div>
        <div className="cxo-secure"><ShieldCheck size={18} /> {tr.secureCheckout}</div>
      </header>

      <div className="cxo-steps">
        <div className="cxo-step"><div className="cxo-step-dot"><Check size={16} /></div><div className="cxo-step-txt"><b>1. {tr.s1}</b><small>{tr.s1s}</small></div></div>
        <div className="cxo-step-line" />
        <div className="cxo-step"><div className="cxo-step-dot"><Check size={16} /></div><div className="cxo-step-txt"><b>2. {tr.s2}</b><small>{tr.s2s}</small></div></div>
        <div className="cxo-step-line" />
        <div className="cxo-step"><div className="cxo-step-dot">3</div><div className="cxo-step-txt"><b>3. {tr.s3}</b><small>{tr.s3s}</small></div></div>
      </div>

      <div className="cxo-wrap">
        <div className="cxo-grid">
          {/* LEFT */}
          <div className="cxo-col">
            <div className="cxo-card">
              <div className="cxo-chead">
                <div className="cxo-icon"><User size={20} /></div>
                <div className="cxo-chead-copy"><h2>{tr.infoTitle}</h2><p>{tr.infoSub}</p></div>
                <button className="cxo-editlink" onClick={() => go("/trial?plan=" + selectedPlan)}>{tr.edit} <Edit2 size={14} /></button>
              </div>
              <div className="cxo-fields">
                <div><label className="cxo-label">{tr.fullName}</label><div className="cxo-input"><User size={17} /><input value={customer.name} readOnly /></div></div>
                <div><label className="cxo-label">{tr.email}</label><div className="cxo-input"><Mail size={17} /><input value={customer.email} readOnly /></div></div>
                <div><label className="cxo-label">{tr.phone}</label><div className="cxo-input"><Phone size={17} /><input value={customer.phone} readOnly /></div></div>
              </div>
            </div>

            <div className="cxo-card">
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
            </div>
          </div>

          {/* RIGHT */}
          <div className="cxo-col">
            <div className="cxo-card">
              <div className="cxo-chead">
                <div className="cxo-icon"><CreditCard size={20} /></div>
                <div className="cxo-chead-copy"><h2>{tr.payTitle}</h2><p>{tr.paySub}</p></div>
                <CardBrands />
              </div>

              {config && !config.enabled ? (
                <p className="cxo-err">{tr.unavailable}</p>
              ) : (
                <>
                  <p className="cxo-muted" style={{ margin: "16px 0 8px" }}>{tr.cardHint}</p>
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
                    <div className="cxo-badge"><ShieldCheck size={17} /> {tr.tokenization}</div>
                    <div className="cxo-badge-sep" />
                    <div className="cxo-badge"><Lock size={17} /> {tr.threeds}</div>
                  </div>
                  <div className="cxo-processedby">{tr.processedBy}</div>
                </>
              )}
            </div>
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
