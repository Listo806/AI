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
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  loadStripe,
} from "@stripe/stripe-js";
import {
  useAuth,
} from "../../context/AuthContext";
import "./WebSolutionsCheckout.css";

const API_BASE =
  "https://backend.cortexaaicrm.com";

const PLAN_CATALOG = {
  "connection-setup": {
    name:
      "Connection Setup",
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
    name:
      "Website Optimization",
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
    name:
      "Full Transformation",
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

const elementOptions = {
  style: {
    base: {
      color: "#07142e",
      fontFamily:
        "Inter, sans-serif",
      fontSize: "16px",

      "::placeholder": {
        color: "#8b97aa",
      },
    },

    invalid: {
      color: "#dc2626",
    },
  },
};

function CheckoutForm({
  serviceId,
  plan,
}) {
  const {
    user,
  } = useAuth();

  const stripe =
    useStripe();

  const elements =
    useElements();

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

    country:
      "United States",

    accepted: false,
  }));

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    completed,
    setCompleted,
  ] = useState(false);

  const update =
    (key) => (event) => {
      setForm((prev) => ({
        ...prev,

        [key]:
          event.target
            .type ===
          "checkbox"
            ? event.target
                .checked
            : event.target
                .value,
      }));
    };

  const purchase =
    async () => {
      if (
        loading ||
        completed
      ) {
        return;
      }

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

      if (
        !stripe ||
        !elements
      ) {
        setError(
          "Secure payment is still loading.",
        );
        return;
      }

      const card =
        elements.getElement(
          CardNumberElement,
        );

      if (!card) {
        setError(
          "Card details are not ready.",
        );
        return;
      }

      setLoading(true);

      try {
        const initResponse =
          await fetch(
            `${API_BASE}/api/payment/web-solutions/create-payment-intent`,
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
                  user?.id ||
                  null,
              }),
            },
          );

        const init =
          await initResponse
            .json()
            .catch(() => ({}));

        if (
          !initResponse.ok ||
          !init?.clientSecret
        ) {
          throw new Error(
            init?.message ||
              "Unable to initialize secure payment.",
          );
        }

        const payment =
          await stripe
            .confirmCardPayment(
              init.clientSecret,
              {
                payment_method: {
                  card,

                  billing_details: {
                    name:
                      form.fullName.trim(),

                    email:
                      form.email.trim(),

                    phone:
                      form.phone.trim() ||
                      undefined,
                  },
                },
              },
            );

        if (payment.error) {
          throw new Error(
            payment.error
              .message ||
              "Payment was declined.",
          );
        }

        if (
          payment
            .paymentIntent
            ?.status !==
          "succeeded"
        ) {
          throw new Error(
            "Payment has not completed.",
          );
        }

        const verifyResponse =
          await fetch(
            `${API_BASE}/api/payment/web-solutions/confirm`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                paymentIntentId:
                  payment
                    .paymentIntent
                    .id,

                serviceId,

                userId:
                  user?.id ||
                  null,
              }),
            },
          );

        const verified =
          await verifyResponse
            .json()
            .catch(() => ({}));

        if (
          !verifyResponse.ok ||
          !verified?.success
        ) {
          throw new Error(
            verified?.message ||
              "Payment was received but could not be finalized.",
          );
        }

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

        setCompleted(true);
      } catch (e) {
        console.error(
          "Web Solutions Stripe payment error:",
          e,
        );

        setError(
          e?.message ||
            "Payment could not be completed.",
        );
      } finally {
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
            and complete your secure
            one-time payment.
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

          <label>
            <span>
              Card Number
            </span>

            <div className="wsc-stripe-field">
              <CardNumberElement
                options={{
                  ...elementOptions,
                  showIcon: true,
                }}
              />
            </div>
          </label>

          <div className="wsc-payment-grid">
            <label>
              <span>
                MM / YY
              </span>

              <div className="wsc-stripe-field">
                <CardExpiryElement
                  options={
                    elementOptions
                  }
                />
              </div>
            </label>

            <label>
              <span>
                CVC
              </span>

              <div className="wsc-stripe-field">
                <CardCvcElement
                  options={
                    elementOptions
                  }
                />
              </div>
            </label>
          </div>

          <label>
            <span>
              Name on Card
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
              Billing Country
            </span>

            <select
              value={
                form.country
              }
              onChange={update(
                "country",
              )}
            >
              <option>
                United States
              </option>

              <option>
                Canada
              </option>

              <option>
                United Kingdom
              </option>

              <option>
                Australia
              </option>

              <option>
                Spain
              </option>

              <option>
                Portugal
              </option>

              <option>
                Vietnam
              </option>
            </select>
          </label>

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
            <button
              className="wsc-submit"
              type="button"
              disabled={loading}
              onClick={purchase}
            >
              {loading
                ? "Processing..."
                : `Complete Purchase — $${plan.price}`}
            </button>
          )}

          <div className="wsc-encrypted">
            <LockKeyhole
              size={16}
            />

            <span>
              Your payment
              information is
              encrypted and secure.
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

export default function WebSolutionsCheckout() {
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
    stripePromise,
    setStripePromise,
  ] = useState(null);

  const [
    configError,
    setConfigError,
  ] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response =
          await fetch(
            `${API_BASE}/api/payment/web-solutions/config`,
          );

        const data =
          await response
            .json()
            .catch(() => ({}));

        const key =
          data?.publishableKey ||
          import.meta.env
            .VITE_STRIPE_PUBLISHABLE_KEY ||
          "";

        if (
          !key ||
          !String(key).startsWith(
            "pk_",
          )
        ) {
          throw new Error(
            "Stripe publishable key is missing or invalid.",
          );
        }

        if (!cancelled) {
          setStripePromise(
            loadStripe(key),
          );
        }
      } catch (e) {
        if (!cancelled) {
          setConfigError(
            e?.message ||
              "Stripe payment configuration is unavailable.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (configError) {
    return (
      <div className="wsc-page">
        <div className="wsc-container">
          <div className="wsc-error">
            {configError}
          </div>
        </div>
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="wsc-page">
        <div className="wsc-container">
          Loading secure payment...
        </div>
      </div>
    );
  }

  return (
    <Elements
      stripe={
        stripePromise
      }
      options={{
        locale: "auto",
      }}
    >
      <CheckoutForm
        serviceId={
          serviceId
        }
        plan={plan}
      />
    </Elements>
  );
}
