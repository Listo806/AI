import React, { useMemo, useState } from "react";
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
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import "./CheckoutPage.css";

const API_BASE = "https://backend.cortexaaicrm.com";
const SETUP_FEE = 97;
const STRIPE_PUBLISHABLE_KEY =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = STRIPE_PUBLISHABLE_KEY
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : null;

const PLAN_DATA = {
  solo: { price: 197, users: 1 },
  team: { price: 347, users: 3, popular: true },
  growth: { price: 497, users: 5 },
};

const t = {
  en: {
    title: "Complete your purchase",
    subtitle: "You're one step away from unlocking the power of Cortexa.",
    selectedPlan: "Your selected plan",
    planNames: { solo: "Solo Plan", team: "Team Plan", growth: "Growth Plan" },
    userCount: { one: "1 user", many: "{count} users" },
    mostPopular: "Most Popular",
    month: "/month",
    selectedAfterTrial: "Selected for after the free trial",
    monthlyAfterTrial: "Monthly price after the free trial",
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
    paymentDesc: "Enter your card details to complete your purchase.",
    cardNumber: "Card number",
    expirationDate: "Expiration date",
    cvc: "CVC",
    postalCode: "ZIP / Postal code",
    encryptedPayment: "Your payment is secure and encrypted.",
    agreementPrefix: "I have read and agree to the",
    terms: "Terms and Conditions",
    pay: "Pay {total} USD",
    processing: "Processing...",
    secureFooter: "Secure payments. Cancel anytime.",
    validation: {
      name: "Please enter your full name.",
      email: "Please enter a valid email address.",
      phone: "Please enter your phone number.",
      terms: "Please accept the Terms and Conditions.",
      stripe:
        "Stripe is not configured. Add VITE_STRIPE_PUBLISHABLE_KEY and restart Vite.",
      card: "Please check your card details.",
      payment: "Payment could not be completed.",
      server: "Server error. Please try again.",
    },
  },
  es: {
    title: "Completa tu compra",
    subtitle: "Estás a un paso de desbloquear todo el poder de Cortexa.",
    selectedPlan: "Tu plan seleccionado",
    planNames: { solo: "Plan Solo", team: "Plan Team", growth: "Plan Growth" },
    userCount: { one: "1 usuario", many: "{count} usuarios" },
    mostPopular: "Más Popular",
    month: "/mes",
    selectedAfterTrial: "Seleccionado para después de la prueba gratuita",
    monthlyAfterTrial: "Precio mensual después de la prueba gratuita",
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
    paymentDesc: "Ingresa los datos de tu tarjeta para completar la compra.",
    cardNumber: "Número de tarjeta",
    expirationDate: "Fecha de vencimiento",
    cvc: "CVC",
    postalCode: "Código postal",
    encryptedPayment: "Tu pago es seguro y está cifrado.",
    agreementPrefix: "He leído y acepto los",
    terms: "Términos y Condiciones",
    pay: "Pagar {total} USD",
    processing: "Procesando...",
    secureFooter: "Pagos seguros. Cancela en cualquier momento.",
    validation: {
      name: "Ingresa tu nombre completo.",
      email: "Ingresa un correo electrónico válido.",
      phone: "Ingresa tu número de teléfono.",
      terms: "Acepta los Términos y Condiciones.",
      stripe:
        "Stripe no está configurado. Agrega VITE_STRIPE_PUBLISHABLE_KEY y reinicia Vite.",
      card: "Revisa los datos de tu tarjeta.",
      payment: "No se pudo completar el pago.",
      server: "Error del servidor. Inténtalo de nuevo.",
    },
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
    userCount: { one: "1 usuário", many: "{count} usuários" },
    mostPopular: "Mais Popular",
    month: "/mês",
    selectedAfterTrial: "Selecionado para após o teste gratuito",
    monthlyAfterTrial: "Preço mensal após o teste gratuito",
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
    paymentDesc: "Insira os dados do cartão para concluir sua compra.",
    cardNumber: "Número do cartão",
    expirationDate: "Data de validade",
    cvc: "CVC",
    postalCode: "CEP / Código postal",
    encryptedPayment: "Seu pagamento é seguro e criptografado.",
    agreementPrefix: "Li e concordo com os",
    terms: "Termos e Condições",
    pay: "Pagar {total} USD",
    processing: "Processando...",
    secureFooter: "Pagamentos seguros. Cancele a qualquer momento.",
    validation: {
      name: "Digite seu nome completo.",
      email: "Digite um e-mail válido.",
      phone: "Digite seu número de telefone.",
      terms: "Aceite os Termos e Condições.",
      stripe:
        "O Stripe não está configurado. Adicione VITE_STRIPE_PUBLISHABLE_KEY e reinicie o Vite.",
      card: "Verifique os dados do cartão.",
      payment: "Não foi possível concluir o pagamento.",
      server: "Erro do servidor. Tente novamente.",
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

const isEmail = (value) => /^\S+@\S+\.\S+$/.test(String(value || "").trim());

function CheckoutForm({ tr, selectedPlan, plan, source }) {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  const shouldPrefill = source === "trial";
  const [customer, setCustomer] = useState(() => ({
    name: shouldPrefill ? localStorage.getItem("name") || "" : "",
    email: shouldPrefill ? localStorage.getItem("email") || "" : "",
    phone: shouldPrefill ? localStorage.getItem("phone") || "" : "",
    userId: shouldPrefill ? localStorage.getItem("trialUserId") || "" : "",
  }));
  const [postalCode, setPostalCode] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const isTrialCheckout = source === "trial";
  const dueToday = useMemo(
    () => (isTrialCheckout ? SETUP_FEE : plan.price + SETUP_FEE),
    [isTrialCheckout, plan.price],
  );

  const updateCustomer = (field) => (event) => {
    const value = event.target.value;
    setCustomer((current) => ({ ...current, [field]: value }));
  };

  const updatePhone = (value) => {
    setCustomer((current) => ({ ...current, phone: value }));
  };

  const validate = () => {
    if (!customer.name.trim()) return tr.validation.name;
    if (!isEmail(customer.email)) return tr.validation.email;
    if (!customer.phone.trim()) return tr.validation.phone;
    if (!acceptedTerms) return tr.validation.terms;
    if (!stripe || !elements) return tr.validation.stripe;
    return "";
  };

  const handleCheckout = async () => {
    if (loading) return;
    const validationError = validate();
    if (validationError) {
      alert(validationError);
      return;
    }

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) {
      alert(tr.validation.card);
      return;
    }

    setLoading(true);
    try {
      localStorage.setItem("trialPlan", selectedPlan);
      localStorage.setItem("name", customer.name);
      localStorage.setItem("email", customer.email);
      localStorage.setItem("phone", customer.phone);

      const response = await fetch(
        `${API_BASE}/api/payment/create-payment-intent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: customer.userId || null,
            source,
            name: customer.name.trim(),
            email: customer.email.trim(),
            phone: customer.phone,
            plan: selectedPlan,
            planKey: selectedPlan,
            monthlyPrice: plan.price,
            setupFee: SETUP_FEE,
            amount: Math.round(dueToday * 100),
            currency: "usd",
            chargeMonthlyNow: !isTrialCheckout,
            startSubscriptionAfterTrial: isTrialCheckout,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.clientSecret) {
        throw new Error(data.message || tr.validation.payment);
      }

      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardNumber,
          billing_details: {
            name: customer.name.trim(),
            email: customer.email.trim(),
            phone: customer.phone,
            address: { postal_code: postalCode.trim() || undefined },
          },
        },
      });

      if (result.error) {
        throw new Error(result.error.message || tr.validation.card);
      }

      if (result.paymentIntent?.status === "succeeded") {
        const successUrl = data.successUrl || "/sign-in";
        navigate(successUrl, { replace: true });
        return;
      }

      throw new Error(tr.validation.payment);
    } catch (error) {
      console.error("CHECKOUT ERROR:", error);
      alert(error.message || tr.validation.server);
    } finally {
      setLoading(false);
    }
  };

  const usersText =
    plan.users === 1
      ? tr.userCount.one
      : tr.userCount.many.replace("{count}", String(plan.users));

  return (
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
              {isTrialCheckout && (
                <small className="checkout-plan-after-trial">
                  {tr.selectedAfterTrial}
                </small>
              )}
            </div>
          </div>
          <div className="checkout-plan-price">
            {isTrialCheckout && <small>{tr.monthlyAfterTrial}</small>}
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
            <strong>${formatMoney(dueToday)}</strong>
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
              <input
                type="text"
                value={customer.name}
                onChange={updateCustomer("name")}
                placeholder={tr.fullNamePlaceholder}
                autoComplete="name"
              />
            </div>
          </label>

          <label className="checkout-field">
            <span>{tr.email}</span>
            <div className="checkout-input-wrap">
              <Mail size={19} />
              <input
                type="email"
                value={customer.email}
                onChange={updateCustomer("email")}
                placeholder={tr.emailPlaceholder}
                autoComplete="email"
              />
            </div>
          </label>

          <label className="checkout-field checkout-field-full">
            <span>{tr.phone}</span>
            <div className="checkout-phone-shell">
              <Phone className="checkout-phone-leading-icon" size={19} />
              <PhoneInput
                country="us"
                value={customer.phone}
                onChange={updatePhone}
                enableSearch
                countryCodeEditable={false}
                placeholder={tr.phonePlaceholder}
                containerClass="checkout-phone-container"
                inputClass="checkout-phone-input"
                buttonClass="checkout-phone-button"
                dropdownClass="checkout-phone-dropdown"
              />
            </div>
          </label>
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
                        "::placeholder": { color: "#8b91a3" },
                      },
                      invalid: { color: "#dc2626" },
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
                        "::placeholder": { color: "#8b91a3" },
                      },
                      invalid: { color: "#dc2626" },
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
                        "::placeholder": { color: "#8b91a3" },
                      },
                      invalid: { color: "#dc2626" },
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
            : tr.pay.replace("{total}", `$${formatMoney(dueToday)}`)}
        </span>
      </button>

      <div className="checkout-secure-footer">
        <ShieldCheck size={19} />
        <span>{tr.secureFooter}</span>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const [lang] = useState(() => localStorage.getItem("cortexa_lang") || "en");
  const tr = t[lang] || t.en;
  const selectedPlan = normalizePlan(
    searchParams.get("plan") || localStorage.getItem("trialPlan") || "team",
  );
  const sourceParam = searchParams.get("source");
  const source =
    sourceParam === "trial" || sourceParam === "pricing"
      ? sourceParam
      : localStorage.getItem("trialUserId")
        ? "trial"
        : "pricing";
  const plan = PLAN_DATA[selectedPlan];

  return (
    <main className="checkout-page">
      {stripePromise ? (
        <Elements
          stripe={stripePromise}
          options={{
            locale: lang === "es" ? "es" : lang === "pt" ? "pt-BR" : "en",
          }}
        >
          <CheckoutForm
            tr={tr}
            selectedPlan={selectedPlan}
            plan={plan}
            source={source}
          />
        </Elements>
      ) : (
        <div className="checkout-shell">
          <div className="checkout-stripe-config-error">
            {tr.validation.stripe}
          </div>
        </div>
      )}
    </main>
  );
}
