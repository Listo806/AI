import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CreditCard,
  ExternalLink,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import "./CheckoutPage.css";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  Elements,
} from "@stripe/react-stripe-js";

import { loadStripe } from "@stripe/stripe-js";

const API_BASE = "https://backend.cortexaaicrm.com";
const SETUP_FEE = 97;
const STRIPE_PUBLISHABLE_KEY =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

const stripePromise = STRIPE_PUBLISHABLE_KEY
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : null;
const PLAN_DATA = {
  solo: {
    price: 197,
    users: 1,
  },
  team: {
    price: 347,
    users: 3,
    popular: true,
  },
  growth: {
    price: 497,
    users: 5,
  },
};

const t = {
  en: {
    title: "Complete your purchase",
    subtitle: "You're one step away from unlocking the power of Cortexa.",
    selectedPlan: "Your selected plan",
    planNames: {
      solo: "Solo Plan",
      team: "Team Plan",
      growth: "Growth Plan",
    },
    userCount: {
      one: "1 user",
      many: "{count} users",
    },
    mostPopular: "Most Popular",
    month: "/month",
    setupFee: "One-time setup fee",
    totalToday: "Total due today",
    informationTitle: "Your information",
    informationDesc: "We'll use this to set up your account and billing.",
    fullName: "Full name",
    email: "Email address",
    phone: "Phone number",
    fullNamePlaceholder: "Enter your full name",
    emailPlaceholder: "Enter your email",
    phonePlaceholder: "Enter your phone number",
    paymentTitle: "Payment method",
    paymentDesc:
      "Your card details will be entered securely on the next checkout screen.",
    secureCheckoutTitle: "Secure card checkout",
    secureCheckoutDesc:
      "Cortexa does not store your card number. Payment is completed through the secure payment provider.",
    agreementPrefix: "I have read and agree to the",
    terms: "Terms and Conditions",
    pay: "Pay {total} USD",
    processing: "Processing...",
    secureFooter: "Secure payments. Cancel anytime.",
    preparing: "Preparing checkout...",
    agreementAlert: "Please accept the Terms and Conditions.",
    missingUser:
      "Your trial information is missing. Please complete the trial form again.",
    failed: "Checkout could not be started.",
    serverError: "Server error. Please try again.",
    cardNumber: "Card number",
    expirationDate: "Expiration date",
    cvc: "CVC",
    postalCode: "ZIP / Postal code",
    encryptedPayment: "Your payment is secure and encrypted.",
  },

  es: {
    title: "Completa tu compra",
    subtitle: "Estás a un paso de desbloquear todo el poder de Cortexa.",
    selectedPlan: "Tu plan seleccionado",
    planNames: {
      solo: "Plan Solo",
      team: "Plan Team",
      growth: "Plan Growth",
    },
    userCount: {
      one: "1 usuario",
      many: "{count} usuarios",
    },
    mostPopular: "Más Popular",
    month: "/mes",
    setupFee: "Tarifa única de configuración",
    totalToday: "Total a pagar hoy",
    informationTitle: "Tu información",
    informationDesc:
      "Usaremos estos datos para configurar tu cuenta y facturación.",
    fullName: "Nombre completo",
    email: "Correo electrónico",
    phone: "Número de teléfono",
    fullNamePlaceholder: "Ingresa tu nombre completo",
    emailPlaceholder: "Ingresa tu correo electrónico",
    phonePlaceholder: "Ingresa tu número de teléfono",
    paymentTitle: "Método de pago",
    paymentDesc:
      "Los datos de tu tarjeta se ingresarán de forma segura en la siguiente pantalla de pago.",
    secureCheckoutTitle: "Pago seguro con tarjeta",
    secureCheckoutDesc:
      "Cortexa no almacena el número de tu tarjeta. El pago se completa mediante el proveedor de pagos seguro.",
    agreementPrefix: "He leído y acepto los",
    terms: "Términos y Condiciones",
    pay: "Pagar {total} USD",
    processing: "Procesando...",
    secureFooter: "Pagos seguros. Cancela en cualquier momento.",
    preparing: "Preparando el pago...",
    agreementAlert: "Por favor, acepta los Términos y Condiciones.",
    missingUser:
      "Falta la información de tu prueba. Completa nuevamente el formulario.",
    failed: "No se pudo iniciar el pago.",
    serverError: "Error del servidor. Inténtalo de nuevo.",
    cardNumber: "Número de tarjeta",
    expirationDate: "Fecha de vencimiento",
    cvc: "CVC",
    postalCode: "Código postal",
    encryptedPayment: "Tu pago es seguro y está cifrado.",
  },

  pt: {
    title: "Conclua sua compra",
    subtitle: "Você está a um passo de desbloquear todo o poder da Cortexa.",
    selectedPlan: "Seu plano selecionado",
    planNames: {
      solo: "Plano Solo",
      team: "Plano Team",
      growth: "Plano Growth",
    },
    userCount: {
      one: "1 usuário",
      many: "{count} usuários",
    },
    mostPopular: "Mais Popular",
    month: "/mês",
    setupFee: "Taxa única de configuração",
    totalToday: "Total devido hoje",
    informationTitle: "Suas informações",
    informationDesc:
      "Usaremos estes dados para configurar sua conta e cobrança.",
    fullName: "Nome completo",
    email: "Endereço de e-mail",
    phone: "Número de telefone",
    fullNamePlaceholder: "Digite seu nome completo",
    emailPlaceholder: "Digite seu e-mail",
    phonePlaceholder: "Digite seu número de telefone",
    paymentTitle: "Método de pagamento",
    paymentDesc:
      "Os dados do cartão serão inseridos com segurança na próxima tela de pagamento.",
    secureCheckoutTitle: "Pagamento seguro com cartão",
    secureCheckoutDesc:
      "A Cortexa não armazena o número do seu cartão. O pagamento é concluído pelo provedor de pagamento seguro.",
    agreementPrefix: "Li e concordo com os",
    terms: "Termos e Condições",
    pay: "Pagar {total} USD",
    processing: "Processando...",
    secureFooter: "Pagamentos seguros. Cancele a qualquer momento.",
    preparing: "Preparando o pagamento...",
    agreementAlert: "Aceite os Termos e Condições.",
    missingUser:
      "As informações do seu teste estão ausentes. Preencha o formulário novamente.",
    failed: "Não foi possível iniciar o pagamento.",
    serverError: "Erro do servidor. Tente novamente.",
    cardNumber: "Número do cartão",
    expirationDate: "Data de validade",
    cvc: "CVC",
    postalCode: "CEP / Código postal",
    encryptedPayment: "Seu pagamento é seguro e criptografado.",
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

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [lang] = useState(() => localStorage.getItem("cortexa_lang") || "en");
  const tr = t[lang] || t.en;

  const [loadingScreen, setLoadingScreen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [postalCode, setPostalCode] = useState("");

  const queryPlan = searchParams.get("plan");
  const selectedPlan = normalizePlan(
    queryPlan || localStorage.getItem("trialPlan") || "team",
  );

  const plan = PLAN_DATA[selectedPlan];

  const [customer, setCustomer] = useState({
    name: localStorage.getItem("name") || "",
    email: localStorage.getItem("email") || "",
    phone: localStorage.getItem("phone") || "",
    userId: localStorage.getItem("trialUserId") || "",
  });

  const total = useMemo(() => plan.price + SETUP_FEE, [plan.price]);

  useEffect(() => {
    if (!customer.userId) {
      alert(tr.missingUser);
      navigate("/trial", { replace: true });
      return;
    }

    localStorage.setItem("trialPlan", selectedPlan);

    const timer = window.setTimeout(() => {
      setLoadingScreen(false);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [customer.userId, navigate, selectedPlan, tr.missingUser]);

  const updateCustomer = (field) => (event) => {
    const value = event.target.value;

    setCustomer((current) => ({
      ...current,
      [field]: value,
    }));

    if (field === "name" || field === "email" || field === "phone") {
      localStorage.setItem(field, value);
    }
  };

  const handleCheckout = async () => {
    if (!acceptedTerms) {
      alert(tr.agreementAlert);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/payment/create-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: customer.userId,
          email: customer.email,
          name: customer.name,
          phone: customer.phone,
          plan: selectedPlan,
          planKey: selectedPlan,
          monthlyPrice: plan.price,
          setupFee: SETUP_FEE,
        }),
      });

      const data = await response.json();

      if (data.success && data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      }

      alert(data.message || tr.failed);
    } catch (error) {
      console.error("CHECKOUT ERROR:", error);
      alert(tr.serverError);
    } finally {
      setLoading(false);
    }
  };

  if (loadingScreen) {
    return <div className="checkout-loading">{tr.preparing}</div>;
  }

  const usersText =
    plan.users === 1
      ? tr.userCount.one
      : tr.userCount.many.replace("{count}", String(plan.users));

  return (
    <main className="checkout-page">
      <div className="checkout-shell">
        <header className="checkout-heading">
          <h1>{tr.title}</h1>
          <p>{tr.subtitle}</p>
        </header>

        <section className="checkout-card checkout-summary-card">
          <h2>{tr.selectedPlan}</h2>

          <div className="checkout-plan-row">
            <div className="checkout-plan-main">
              <div className="checkout-plan-icon">
                <Users size={34} strokeWidth={2} />
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
              </div>
            </div>

            <div className="checkout-plan-price">
              <strong>${formatMoney(plan.price)}</strong>
              <span>{tr.month}</span>
            </div>
          </div>

          <div className="checkout-summary-line">
            <span>{tr.setupFee}</span>
            <strong>${formatMoney(SETUP_FEE)}</strong>
          </div>

          <div className="checkout-summary-total">
            <strong>{tr.totalToday}</strong>

            <div>
              <span>USD</span>
              <strong>${formatMoney(total)}</strong>
            </div>
          </div>
        </section>

        <section className="checkout-card">
          <div className="checkout-section-heading">
            <div className="checkout-section-icon">
              <CreditCard size={24} />
            </div>

            <div>
              <h2>{tr.paymentTitle}</h2>
              <p>{tr.paymentDesc}</p>
            </div>
          </div>

          {stripePromise ? (
            <Elements stripe={stripePromise}>
              <div className="checkout-card-fields">
                <label className="checkout-field checkout-field-full">
                  <span>{tr.cardNumber}</span>

                  <div className="checkout-stripe-input">
                    
                    <div className="checkout-stripe-element">
                      <CardNumberElement
                        options={{
                          showIcon: true,
                          style: {
                            base: {
                              fontSize: "16px",
                              color: "#171b2c",
                              fontFamily: "Inter, sans-serif",
                              "::placeholder": {
                                color: "#8b91a3",
                              },
                            },
                            invalid: {
                              color: "#dc2626",
                            },
                          },
                        }}
                      />
                    </div>
                    <CreditCard size={19} />
                  </div>
                </label>

                <label className="checkout-field">
                  <span>{tr.expirationDate}</span>

                  <div className="checkout-stripe-input">
                    <div className="checkout-stripe-element">
                      <CardExpiryElement
                        options={{
                          style: {
                            base: {
                              fontSize: "16px",
                              color: "#171b2c",
                              fontFamily: "Inter, sans-serif",
                              "::placeholder": {
                                color: "#8b91a3",
                              },
                            },
                            invalid: {
                              color: "#dc2626",
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </label>

                <label className="checkout-field">
                  <span>{tr.cvc}</span>

                  <div className="checkout-stripe-input">
                    <div className="checkout-stripe-element">
                      <CardCvcElement
                        options={{
                          style: {
                            base: {
                              fontSize: "16px",
                              color: "#171b2c",
                              fontFamily: "Inter, sans-serif",
                              "::placeholder": {
                                color: "#8b91a3",
                              },
                            },
                            invalid: {
                              color: "#dc2626",
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </label>

                <label className="checkout-field">
                  <span>{tr.postalCode}</span>

                  <div className="checkout-input-wrap">
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(event) => setPostalCode(event.target.value)}
                      placeholder="12345"
                      autoComplete="postal-code"
                    />
                  </div>
                </label>
              </div>

              <div className="checkout-payment-footer">
                <div className="checkout-card-brands">
                  <span>VISA</span>
                  <span>MC</span>
                  <span>AMEX</span>
                  <span>DISCOVER</span>
                </div>

                <div className="checkout-encrypted-note">
                  <LockKeyhole size={16} />
                  <span>{tr.encryptedPayment}</span>
                </div>
              </div>
            </Elements>
          ) : (
            <div className="checkout-stripe-config-error">
              Stripe publishable key is missing. Add
              <code> VITE_STRIPE_PUBLISHABLE_KEY </code>
              to the frontend .env file and restart Vite.
            </div>
          )}
        </section>

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

        <button
          type="button"
          className="checkout-pay-button"
          onClick={handleCheckout}
          disabled={loading}
        >
          <LockKeyhole size={23} />
          <span>
            {loading
              ? tr.processing
              : tr.pay.replace("{total}", `$${formatMoney(total)}`)}
          </span>
        </button>

        <div className="checkout-secure-footer">
          <ShieldCheck size={19} />
          <span>{tr.secureFooter}</span>
        </div>
      </div>
    </main>
  );
}
