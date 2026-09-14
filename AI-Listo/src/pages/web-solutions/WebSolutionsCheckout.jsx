import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useSearchParams,
} from "react-router-dom";
import {
  Check,
  LockKeyhole,
} from "lucide-react";
import {
  useAuth,
} from "../../context/AuthContext";
import "./WebSolutionsCheckout.css";

const API_BASE =
  "https://backend.cortexaaicrm.com";

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

export default function WebSolutionsCheckout() {
  const {
    user,
  } = useAuth();

  const [
    searchParams,
  ] = useSearchParams();

  const requestedId =
    searchParams.get("plan") ||
    "connection-setup";

  const serviceId =
    PLAN_CATALOG[requestedId]
      ? requestedId
      : "connection-setup";

  const plan =
    useMemo(
      () =>
        PLAN_CATALOG[
          serviceId
        ],
      [serviceId],
    );

  const [
    form,
    setForm,
  ] = useState(() => ({
    fullName:
      localStorage.getItem(
        "name",
      ) ||
      user?.name ||
      "",

    businessName: "",

    email:
      localStorage.getItem(
        "email",
      ) ||
      user?.email ||
      "",

    phone:
      localStorage.getItem(
        "phone",
      ) ||
      user?.phone ||
      "",

    website: "",

    accepted: false,
  }));

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    confirming,
    setConfirming,
  ] = useState(false);

  const [
    completed,
    setCompleted,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const stripeState =
    searchParams.get("stripe");

  const sessionId =
    searchParams.get(
      "session_id",
    );

  useEffect(() => {
    if (
      stripeState !==
        "success" ||
      !sessionId
    ) {
      if (
        stripeState ===
        "cancelled"
      ) {
        setError(
          "Payment was cancelled. You have not been charged.",
        );
      }

      return;
    }

    let cancelled = false;

    (async () => {
      setConfirming(true);
      setError("");

      try {
        const response =
          await fetch(
            `${API_BASE}/api/payment/web-solutions/confirm-checkout-session`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                sessionId,
              }),
            },
          );

        const data =
          await response
            .json()
            .catch(() => ({}));

        if (
          !response.ok ||
          !data?.success
        ) {
          throw new Error(
            data?.message ||
              "The payment could not be verified.",
          );
        }

        if (!cancelled) {
          setCompleted(true);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e?.message ||
              "The payment could not be verified.",
          );
        }
      } finally {
        if (!cancelled) {
          setConfirming(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    stripeState,
    sessionId,
  ]);

  const update =
    (key) => (event) => {
      const value =
        event.target.type ===
        "checkbox"
          ? event.target.checked
          : event.target.value;

      setForm((prev) => ({
        ...prev,
        [key]: value,
      }));
    };

  const handlePurchase =
    async () => {
      if (loading) return;

      setError("");

      if (
        !form.fullName.trim()
      ) {
        setError(
          "Please enter your full name.",
        );
        return;
      }

      if (
        !/^\S+@\S+\.\S+$/.test(
          form.email.trim(),
        )
      ) {
        setError(
          "Please enter a valid email address.",
        );
        return;
      }

      if (!form.accepted) {
        setError(
          "Please accept the Terms of Service.",
        );
        return;
      }

      setLoading(true);

      try {
        localStorage.setItem(
          "name",
          form.fullName.trim(),
        );

        localStorage.setItem(
          "email",
          form.email.trim(),
        );

        localStorage.setItem(
          "phone",
          form.phone.trim(),
        );

        const response =
          await fetch(
            `${API_BASE}/api/payment/web-solutions/create-checkout-session`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                serviceId,

                fullName:
                  form.fullName.trim(),

                businessName:
                  form.businessName.trim(),

                email:
                  form.email.trim(),

                phone:
                  form.phone.trim(),

                website:
                  form.website.trim(),

                userId:
                  user?.id || null,
              }),
            },
          );

        const data =
          await response
            .json()
            .catch(() => ({}));

        if (
          !response.ok ||
          !data?.checkoutUrl
        ) {
          throw new Error(
            data?.message ||
              "Unable to open secure checkout.",
          );
        }

        window.location.assign(
          data.checkoutUrl,
        );
      } catch (e) {
        console.error(
          "Web Solutions hosted checkout error:",
          e,
        );

        setError(
          e?.message ||
            "Payment could not be started.",
        );

        setLoading(false);
      }
    };

  return (
    <div className="wsc-page">
      <header className="wsc-header">
        <div className="wsc-container wsc-header-inner">
          <Link
            to="/"
            className="wsc-wordmark"
          >
            CORTEXA
          </Link>

          <div className="wsc-secure">
            <LockKeyhole
              size={18}
            />

            <span>
              Secure Checkout
            </span>
          </div>
        </div>
      </header>

      <main className="wsc-container wsc-main">
        <section className="wsc-left">
          <div className="wsc-breadcrumb">
            <Link to="/web-solutions">
              Web Solutions
            </Link>

            <span>/</span>

            <span>
              Checkout
            </span>
          </div>

          <h1>
            Complete Your Purchase
          </h1>

          <p className="wsc-lead">
            Review your service,
            enter your details,
            and complete your
            secure one-time payment.
          </p>

          <article className="wsc-card wsc-plan-card">
            <div className="wsc-card-title">
              Your Web Solutions Plan
            </div>

            <div className="wsc-plan-summary">
              <div>
                <h2>
                  {plan.name}
                </h2>

                <span className="wsc-one-time-pill">
                  ONE-TIME SERVICE
                </span>
              </div>

              <div className="wsc-plan-price">
                <strong>
                  ${plan.price}
                </strong>

                <span>
                  one-time
                </span>
              </div>
            </div>

            <div className="wsc-divider" />

            <strong className="wsc-included-title">
              Included work:
            </strong>

            <ul className="wsc-included">
              {plan.included.map(
                (item) => (
                  <li key={item}>
                    <Check
                      size={20}
                    />

                    <span>
                      {item}
                    </span>
                  </li>
                ),
              )}
            </ul>
          </article>

          <article className="wsc-card">
            <div className="wsc-card-title">
              Your Information
            </div>

            <div className="wsc-info-grid">
              <label>
                <span>
                  Full Name
                </span>

                <input
                  value={
                    form.fullName
                  }
                  onChange={update(
                    "fullName",
                  )}
                  placeholder="e.g. Alex Carter"
                />
              </label>

              <label>
                <span>
                  Business Name
                </span>

                <input
                  value={
                    form.businessName
                  }
                  onChange={update(
                    "businessName",
                  )}
                  placeholder="e.g. Carter & Co."
                />
              </label>

              <label>
                <span>
                  Email Address
                </span>

                <input
                  type="email"
                  value={form.email}
                  onChange={update(
                    "email",
                  )}
                  placeholder="e.g. alex@yourbusiness.com"
                />
              </label>

              <label>
                <span>
                  Phone / WhatsApp
                </span>

                <input
                  value={form.phone}
                  onChange={update(
                    "phone",
                  )}
                  placeholder="e.g. +1 555 123 4567"
                />
              </label>

              <label className="full">
                <span>
                  Website URL
                </span>

                <input
                  value={form.website}
                  onChange={update(
                    "website",
                  )}
                  placeholder="e.g. https://www.yourbusiness.com"
                />
              </label>
            </div>
          </article>
        </section>

        <section className="wsc-card wsc-payment-card">
          <div className="wsc-payment-heading">
            <h2>
              Payment Details
            </h2>

            <div>
              <LockKeyhole
                size={17}
              />

              <span>
                Secure encrypted payment.
              </span>
            </div>
          </div>

          <div className="wsc-hosted-payment-note">
            Card details will be
            entered on Stripe&apos;s
            secure hosted checkout
            after you click the button
            below.
          </div>

          <div className="wsc-divider" />

          <div className="wsc-order-summary">
            <h3>
              Order Summary
            </h3>

            <div>
              <span>
                {plan.name}
              </span>

              <span>
                ${plan.price.toFixed(
                  2,
                )}
              </span>
            </div>

            <div className="total">
              <strong>
                Total due today
              </strong>

              <strong>
                ${plan.price.toFixed(
                  2,
                )}
              </strong>
            </div>
          </div>

          <div className="wsc-charge-note">
            ONE-TIME PAYMENT —
            NO RECURRING CHARGE
          </div>

          <label className="wsc-terms">
            <input
              type="checkbox"
              checked={
                form.accepted
              }
              onChange={update(
                "accepted",
              )}
            />

            <span>
              I agree to the{" "}
              <a href="/terms">
                Terms of Service
              </a>{" "}
              and acknowledge that
              this is a one-time
              professional service fee.
            </span>
          </label>

          {error && (
            <div className="wsc-error">
              {error}
            </div>
          )}

          {confirming && (
            <div className="wsc-payment-success">
              <strong>
                Verifying payment...
              </strong>
            </div>
          )}

          {completed ? (
            <div className="wsc-payment-success">
              <Check
                size={26}
              />

              <strong>
                Payment received
              </strong>

              <span>
                Thank you. Cortexa
                will contact you
                regarding the next
                steps.
              </span>
            </div>
          ) : (
            !confirming && (
              <button
                className="wsc-submit"
                type="button"
                disabled={loading}
                onClick={
                  handlePurchase
                }
              >
                {loading
                  ? "Opening secure checkout..."
                  : `Complete Purchase — $${plan.price}`}
              </button>
            )
          )}

          <div className="wsc-encrypted">
            <LockKeyhole
              size={16}
            />

            <span>
              Payment is completed on
              Stripe&apos;s secure
              checkout.
            </span>
          </div>

          <div className="wsc-support">
            Questions before
            purchasing?{" "}

            <a href="mailto:support@cortexaaicrm.com">
              Contact Cortexa
              Support
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
