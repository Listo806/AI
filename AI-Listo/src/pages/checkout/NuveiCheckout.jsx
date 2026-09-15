import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, Lock, Check, CreditCard } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  fetchNuveiConfig,
  nuveiSaveToken,
  nuveiActivate,
  collectBrowserInfo,
} from "../../api/nuveiApi";
import { mountNuveiForm } from "./nuveiSdk";

// Nuvei / Datafast (Paymentez) subscription checkout — /nuvei-checkout?plan=business.
//
// Flow:
//  1. Review: show every required disclosure (activation fee, trial, monthly
//     price, first billing date, auto-renewal + cancellation), take explicit
//     consent to store the card and bill recurring.
//  2. Card: Nuvei's browser SDK renders a PCI-safe card form (the PAN never
//     reaches our servers). On tokenize we save the token, then charge the
//     activation with 3DS and provision the plan.

function money(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + Number(days || 0));
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default function NuveiCheckout() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth() || {};
  const planKey = (params.get("plan") || "business").toLowerCase();

  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState("review"); // review | card | processing | done
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const [formReady, setFormReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const formMounted = useRef(false);
  const submitRef = useRef(null);

  useEffect(() => {
    let alive = true;
    fetchNuveiConfig().then((c) => {
      if (!alive) return;
      setConfig(c);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const plan = useMemo(
    () => (config?.plans || []).find((p) => p.key === planKey) || null,
    [config, planKey],
  );

  // Render the Nuvei tokenization form once we reach the card step.
  useEffect(() => {
    if (step !== "card" || !config || !plan || formMounted.current) return;
    formMounted.current = true;
    setFormReady(false);
    (async () => {
      try {
        const form = await mountNuveiForm({
          containerSelector: "#nuvei-card-form",
          environment: config.environment,
          appCode: config.clientAppCode,
          appKey: config.clientAppKey,
          user: { id: user?.id, email: user?.email },
          country: "ECU",
          locale: "en",
          onIncomplete: (msg) => { setPaying(false); setError(msg); },
        });
        submitRef.current = form.submit;
        form.ready.then((ok) => setFormReady(!!ok));
        const card = await form.done;
        await handleTokenized(card);
      } catch (err) {
        setPaying(false);
        formMounted.current = false;
        setError(err?.message || "The card could not be processed.");
        setStep("review");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, config, plan]);

  function payNow() {
    setError("");
    setPaying(true);
    const ok = submitRef.current && submitRef.current();
    if (!ok) { setPaying(false); setError("Something went wrong. Please try again."); }
  }

  async function handleTokenized(card) {
    setStep("processing");
    setError("");
    try {
      const saved = await nuveiSaveToken(card);
      if (!saved?.cardId) throw new Error("We could not securely save your card.");

      const result = await nuveiActivate({
        planKey,
        cardId: saved.cardId,
        browserInfo: collectBrowserInfo(),
        termUrl: `${window.location.origin}/nuvei-checkout?plan=${planKey}&threeds=return`,
      });

      if (result?.requires3ds && result?.challenge) {
        const url =
          result.challenge.challenge_request ||
          result.challenge.acs_url ||
          result.challenge.url;
        if (url && /^https?:\/\//i.test(url)) {
          window.location.href = url;
          return;
        }
        setError("Your bank requested extra verification. Please try again or use another card.");
        setStep("review");
        formMounted.current = false;
        return;
      }

      if (result?.status === "trialing" || result?.status === "active") {
        setDone(result);
        setStep("done");
        return;
      }

      setError(result?.message || "The payment could not be completed. Please try another card.");
      setStep("review");
      formMounted.current = false;
    } catch (err) {
      setError(err?.message || "Something went wrong processing your payment.");
      setStep("review");
      formMounted.current = false;
    }
  }

  if (loading) {
    return <Shell><p style={S.muted}>Loading secure checkout…</p></Shell>;
  }
  if (!config?.enabled) {
    return (
      <Shell>
        <h1 style={S.h1}>Checkout unavailable</h1>
        <p style={S.muted}>Card payments are not available right now. Please contact support.</p>
      </Shell>
    );
  }
  if (!plan) {
    return (
      <Shell>
        <h1 style={S.h1}>Plan not found</h1>
        <p style={S.muted}>We could not find that plan. Please return to pricing.</p>
        <button style={S.btnGhost} onClick={() => navigate("/pricing")}>Back to pricing</button>
      </Shell>
    );
  }
  if (step === "done" && done) {
    return (
      <Shell>
        <div style={{ textAlign: "center" }}>
          <div style={S.successBadge}><Check size={28} /></div>
          <h1 style={S.h1}>You're all set</h1>
          <p style={S.muted}>
            Your {plan.label} plan is active. A confirmation email with your transaction details is
            on its way.
          </p>
          <button style={S.btnPrimary} onClick={() => navigate("/dashboard")}>Go to my dashboard</button>
        </div>
      </Shell>
    );
  }

  const firstCharge = plan.trialDays > 0 ? addDays(plan.trialDays) : "Today";

  return (
    <Shell>
      <div style={S.grid}>
        {/* Summary */}
        <div style={S.summary}>
          <div style={S.badge}>Secure checkout</div>
          <h1 style={S.h1}>{plan.label}</h1>
          <div style={S.priceRow}>
            <span style={S.price}>{money(plan.monthly)}</span>
            <span style={S.perMonth}>/month</span>
          </div>
          <ul style={S.list}>
            <Li>Billed today: <b>{money(plan.activation)}</b>{plan.trialDays > 0 ? " activation" : ""}</Li>
            {plan.trialDays > 0 && <Li>{plan.trialDays}-day trial</Li>}
            <Li>First monthly charge: <b>{firstCharge}</b></Li>
            <Li>Monthly price after: <b>{money(plan.monthly)}</b></Li>
            <Li>Cancel anytime</Li>
          </ul>
          <div style={S.disclosure}>
            <p>
              By subscribing you agree to an activation charge of <b>{money(plan.activation)}</b> today
              {plan.trialDays > 0
                ? `, a ${plan.trialDays}-day trial, and then automatic monthly billing of ${money(plan.monthly)} starting ${firstCharge}.`
                : ` and automatic monthly billing of ${money(plan.monthly)} starting one month from today.`}
              {" "}Your subscription renews automatically each month until you cancel. You can cancel
              anytime from your account, effective at the end of the current billing period.
            </p>
          </div>
        </div>

        {/* Payment */}
        <div style={S.card}>
          <div style={S.cardHead}>
            <CreditCard size={18} />
            <span>Payment details</span>
          </div>

          {step === "processing" && <p style={S.muted}>Processing your payment…</p>}

          {step !== "processing" && (
            <>
              {/* The Nuvei SDK renders its PCI-safe card form into this container. */}
              <div id="nuvei-card-form" style={{ display: step === "card" ? "block" : "none" }} />

              {step === "card" && (
                <>
                  {error && <div style={S.error}>{error}</div>}
                  <button
                    style={{ ...S.btnPrimary, marginTop: 12, background: formReady && !paying ? "#4f46e5" : "#9ca3af", cursor: formReady && !paying ? "pointer" : "not-allowed" }}
                    disabled={!formReady || paying}
                    onClick={payNow}
                  >
                    {paying ? "Processing…" : `Pay ${money(plan.activation)} and start`}
                  </button>
                </>
              )}

              {step === "review" && (
                <>
                  <label style={S.consent}>
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                    <span>
                      I authorize Cortexa to securely store this card with Nuvei and to charge the
                      activation fee today and the monthly subscription automatically until I cancel.
                    </span>
                  </label>

                  {error && <div style={S.error}>{error}</div>}

                  <button
                    style={{ ...S.btnPrimary, opacity: consent ? 1 : 0.6 }}
                    disabled={!consent}
                    onClick={() => { setError(""); setStep("card"); }}
                  >
                    Continue to payment
                  </button>
                </>
              )}
            </>
          )}

          <div style={S.secure}>
            <Lock size={13} /> Card entered in Nuvei's secure form. We never see or store your full
            card number.
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={S.brand}><ShieldCheck size={18} /> Cortexa AI CRM</div>
        {children}
      </div>
    </div>
  );
}

function Li({ children }) {
  return (
    <li style={S.li}>
      <Check size={15} style={{ color: "#16a34a", flexShrink: 0, marginTop: 2 }} />
      <span>{children}</span>
    </li>
  );
}

const S = {
  page: { minHeight: "100vh", background: "#f3f4f6", padding: "32px 16px", boxSizing: "border-box" },
  wrap: { maxWidth: 860, margin: "0 auto" },
  brand: { display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "#111827", marginBottom: 20 },
  grid: { display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" },
  summary: { flex: "1 1 320px", background: "#111827", color: "#fff", borderRadius: 16, padding: 24 },
  card: { flex: "1 1 360px", background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 8px 30px rgba(0,0,0,.06)" },
  cardHead: { display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "#111827", marginBottom: 16 },
  badge: { display: "inline-block", background: "rgba(255,255,255,.12)", color: "#e5e7eb", fontSize: 12, padding: "4px 10px", borderRadius: 999, marginBottom: 12 },
  h1: { fontSize: 24, fontWeight: 800, margin: "0 0 8px" },
  priceRow: { display: "flex", alignItems: "baseline", gap: 6, marginBottom: 16 },
  price: { fontSize: 34, fontWeight: 800 },
  perMonth: { color: "#9ca3af" },
  list: { listStyle: "none", padding: 0, margin: "0 0 16px", display: "flex", flexDirection: "column", gap: 10 },
  li: { display: "flex", gap: 8, fontSize: 14, color: "#e5e7eb" },
  disclosure: { background: "rgba(255,255,255,.06)", borderRadius: 10, padding: 12, fontSize: 12, color: "#9ca3af", lineHeight: 1.5 },
  consent: { display: "flex", gap: 10, alignItems: "flex-start", fontSize: 12, color: "#4b5563", margin: "4px 0 16px", lineHeight: 1.5 },
  error: { background: "#fef2f2", color: "#b91c1c", fontSize: 13, padding: "10px 12px", borderRadius: 10, marginBottom: 12 },
  btnPrimary: { width: "100%", padding: "13px 16px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer" },
  btnGhost: { padding: "10px 16px", background: "transparent", color: "#4f46e5", border: "1px solid #c7d2fe", borderRadius: 10, fontWeight: 600, cursor: "pointer", marginTop: 12 },
  secure: { display: "flex", alignItems: "center", gap: 6, justifyContent: "center", color: "#6b7280", fontSize: 12, marginTop: 14 },
  muted: { color: "#6b7280" },
  successBadge: { width: 56, height: 56, borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" },
};
