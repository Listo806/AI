import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, LockKeyhole } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { createWebSolutionsTransaction, fetchWebSolutionsPaddleConfig } from "../../api/paddleApi";
import {
  initWebSolutionPaddle,
  openWebSolutionPaddleCheckout,
  PADDLE_INLINE_FRAME_CLASS,
  webSolutionPaddleReady,
} from "./webSolutionsPaddleCheckout";
import "./WebSolutionsCheckout.css";

const PLAN_CATALOG = {
  "connection-setup": {
    name: "Connection Setup",
    price: 147,
    included: [
      "Website connection review",
      "Add or improve WhatsApp and phone CTA",
      "Connect customer entry points to your Cortexa AI agent",
      "Configure CRM lead capture and routing",
      "Test the complete connection",
    ],
  },
  "website-optimization": {
    name: "Website Optimization",
    price: 297,
    included: [
      "Website and conversion-path review",
      "Several UX and CTA improvements",
      "Entry-point integration",
      "Tracking and pipeline routing",
      "Complete funnel testing",
    ],
  },
  "full-transformation": {
    name: "Full Transformation",
    price: 547,
    included: [
      "Substantial website redesign",
      "New pages or sections",
      "Responsive optimization",
      "Complete AI and CRM integration",
      "Launch support",
    ],
  },
};

const countryCodeFromBrowser = () => {
  const saved = String(localStorage.getItem("countryCode") || "")
    .trim()
    .toUpperCase();

  if (/^[A-Z]{2}$/.test(saved)) return saved;

  try {
    const locale = new Intl.Locale(navigator.language || "en-US");
    return String(locale.region || "US").toUpperCase();
  } catch {
    return "US";
  }
};

export default function WebSolutionsCheckout() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const requestedId = searchParams.get("plan") || "connection-setup";
  const plan = PLAN_CATALOG[requestedId] || PLAN_CATALOG["connection-setup"];

  const [form, setForm] = useState(() => ({
    fullName: localStorage.getItem("name") || user?.name || "",
    businessName: "",
    email: localStorage.getItem("email") || user?.email || "",
    phone: localStorage.getItem("phone") || user?.phone || "",
    website: "",
    country: "United States",
    countryCode: countryCodeFromBrowser(),
    accepted: false,
  }));

  const [paddleConfig, setPaddleConfig] = useState(null);
  const [checkoutState, setCheckoutState] = useState("loading");
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  const paddleInitRef = useRef(false);
  const inlineOpenedRef = useRef(false);
  const acceptedRef = useRef(false);

  const ready = webSolutionPaddleReady(paddleConfig);

  useEffect(() => {
    acceptedRef.current = form.accepted;
  }, [form.accepted]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const config = await fetchWebSolutionsPaddleConfig();
      if (!cancelled) {
        setPaddleConfig(config);
        setCheckoutState(config ? "ready" : "error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const update = (key) => (event) => {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;

    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handlePaddleEvent = (event) => {
    if (event?.name !== "checkout.completed") return;

    setCompleted(true);
    setCheckoutState("completed");

    const transactionId =
      event?.data?.transaction_id ||
      event?.data?.id ||
      "";

    if (transactionId) {
      sessionStorage.setItem(
        "cortexa_web_solution_transaction",
        transactionId,
      );
    }
  };

  const openCheckout = async (inline = true) => {
    if (!form.accepted) {
      setError("Please accept the Terms of Service.");
      return;
    }

    if (!form.fullName.trim() || !form.email.trim()) {
      setError("Please enter your full name and email address.");
      return;
    }

    if (!ready) {
      setError("Secure payment is unavailable right now. Please contact support.");
      return;
    }

    setError("");

    try {
      if (!paddleInitRef.current) {
        paddleInitRef.current = true;
        await initWebSolutionPaddle(paddleConfig, handlePaddleEvent);
      }

      const transaction = await createWebSolutionsTransaction({
        serviceId: requestedId,
        fullName: form.fullName.trim(),
        businessName: form.businessName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        website: form.website.trim(),
        userId: user?.id || null,
      });

      if (!transaction?.transactionId) {
        throw new Error("Unable to create secure Paddle transaction");
      }

      openWebSolutionPaddleCheckout({
        transactionId: transaction.transactionId,
        inline,
      });

      if (inline) {
        inlineOpenedRef.current = true;
      }

      setCheckoutState("open");
    } catch (e) {
      console.error("Web Solutions Paddle checkout error:", e);
      setError(
        e?.message ||
          "Unable to open the secure payment form. Please try again.",
      );
      setCheckoutState("error");
    }
  };

  /*
   * Paddle inline checkout needs the customer details first.
   * Once the user accepts terms and provides the minimum required fields,
   * automatically mount the real secure payment form.
   */
  useEffect(() => {
    if (!ready || inlineOpenedRef.current || completed) return;
    if (!form.accepted) return;
    if (!form.fullName.trim() || !form.email.trim()) return;

    openCheckout(true);
  }, [
    ready,
    form.accepted,
    form.fullName,
    form.email,
    completed,
  ]);

  return (
    <div className="wsc-page">
      <header className="wsc-header">
        <div className="wsc-container wsc-header-inner">
          <Link to="/" className="wsc-wordmark">
            CORTEXA
          </Link>

          <div className="wsc-secure">
            <LockKeyhole size={18} />
            <span>Secure Checkout</span>
          </div>
        </div>
      </header>

      <main className="wsc-container wsc-main">
        <section className="wsc-left">
          <div className="wsc-breadcrumb">
            <Link to="/web-solutions">Web Solutions</Link>
            <span>/</span>
            <span>Checkout</span>
          </div>

          <h1>Complete Your Purchase</h1>
          <p className="wsc-lead">
            Review your service, enter your details, and complete your secure
            one-time payment.
          </p>

          <article className="wsc-card wsc-plan-card">
            <div className="wsc-card-title">Your Web Solutions Plan</div>

            <div className="wsc-plan-summary">
              <div>
                <h2>{plan.name}</h2>
                <span className="wsc-one-time-pill">ONE-TIME SERVICE</span>
              </div>

              <div className="wsc-plan-price">
                <strong>${plan.price}</strong>
                <span>one-time</span>
              </div>
            </div>

            <div className="wsc-divider" />

            <strong className="wsc-included-title">Included work:</strong>

            <ul className="wsc-included">
              {plan.included.map((item) => (
                <li key={item}>
                  <Check size={20} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="wsc-card">
            <div className="wsc-card-title">Your Information</div>

            <div className="wsc-info-grid">
              <label>
                <span>Full Name</span>
                <input
                  value={form.fullName}
                  onChange={update("fullName")}
                  placeholder="e.g. Alex Carter"
                />
              </label>

              <label>
                <span>Business Name</span>
                <input
                  value={form.businessName}
                  onChange={update("businessName")}
                  placeholder="e.g. Carter & Co."
                />
              </label>

              <label>
                <span>Email Address</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  placeholder="e.g. alex@yourbusiness.com"
                />
              </label>

              <label>
                <span>Phone / WhatsApp</span>
                <input
                  value={form.phone}
                  onChange={update("phone")}
                  placeholder="e.g. +1 555 123 4567"
                />
              </label>

              <label className="full">
                <span>Website URL</span>
                <input
                  value={form.website}
                  onChange={update("website")}
                  placeholder="e.g. https://www.yourbusiness.com"
                />
              </label>
            </div>
          </article>
        </section>

        <section className="wsc-card wsc-payment-card">
          <div className="wsc-payment-heading">
            <h2>Payment Details</h2>
            <div>
              <LockKeyhole size={17} />
              <span>Secure encrypted payment.</span>
            </div>
          </div>

          <div className="wsc-order-summary">
            <h3>Order Summary</h3>
            <div>
              <span>{plan.name}</span>
              <span>${plan.price.toFixed(2)}</span>
            </div>
            <div className="total">
              <strong>Total due today</strong>
              <strong>${plan.price.toFixed(2)}</strong>
            </div>
          </div>

          <div className="wsc-charge-note">
            ONE-TIME PAYMENT — NO RECURRING CHARGE
          </div>

          <label className="wsc-terms">
            <input
              type="checkbox"
              checked={form.accepted}
              onChange={update("accepted")}
            />
            <span>
              I agree to the <a href="/terms">Terms of Service</a> and
              acknowledge that this is a one-time professional service fee.
            </span>
          </label>

          {error && <div className="wsc-error">{error}</div>}

          {completed ? (
            <div className="wsc-payment-success">
              <Check size={26} />
              <strong>Payment received</strong>
              <span>
                Thank you. Cortexa will contact you regarding the next steps.
              </span>
            </div>
          ) : (
            <>
              <div className="wsc-paddle-wrap">
                {checkoutState === "loading" && (
                  <div className="wsc-paddle-loading">
                    Loading secure payment form...
                  </div>
                )}

                <div
                  className={`${PADDLE_INLINE_FRAME_CLASS} wsc-paddle-inline`}
                />
              </div>

              <button
                className="wsc-submit"
                type="button"
                disabled={!form.accepted || !ready}
                onClick={() => openCheckout(false)}
              >
                Complete Purchase — ${plan.price}
              </button>
            </>
          )}

          <div className="wsc-encrypted">
            <LockKeyhole size={16} />
            <span>Your payment information is encrypted and secure.</span>
          </div>

          <div className="wsc-support">
            Questions before purchasing?{" "}
            <a href="mailto:support@cortexaaicrm.com">
              Contact Cortexa Support
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
