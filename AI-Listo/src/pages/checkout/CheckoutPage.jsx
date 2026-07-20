import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  BadgeCheck,
  ExternalLink,
  Mail,
  Phone,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import apiClient from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import "./CheckoutPage.css";

// No payment provider is connected yet (the company's merchant account is not
// approved). This page is a plan-review + "start free trial" step only. It does
// NOT collect card details and does NOT charge. When a payment provider is
// approved, a payment step can be added back here (or at the end of the trial).
const API_BASE = "https://backend.cortexaaicrm.com";
const SETUP_FEE = 97;

const PLAN_DATA = {
  solo: { price: 197, users: 1 },
  team: { price: 347, users: 3, popular: true },
  growth: { price: 497, users: 5 },
};

const t = {
  en: {
    title: "Review your plan",
    subtitle: "You're one step away from starting your free trial.",
    selectedPlan: "Your selected plan",
    planNames: { solo: "Solo Plan", team: "Team Plan", growth: "Growth Plan" },
    userCount: { one: "1 user", many: "{count} users" },
    mostPopular: "Most Popular",
    month: "/month",
    afterTrial: "Applies after your free trial",
    monthlyAfterTrial: "Monthly price after your free trial",
    setupFee: "One-time setup fee (after trial)",
    dueToday: "Due today",
    noPaymentTitle: "No payment today",
    noPaymentDesc:
      "Your free trial starts now and no payment is collected today. You will not be charged until a payment method is available and you complete payment setup.",
    informationTitle: "Your information",
    informationDesc: "This is the account we created for your free trial.",
    fullName: "Full name",
    email: "Email address",
    phone: "Phone number",
    agreementPrefix: "I have read and agree to the",
    terms: "Terms and Conditions",
    startTrial: "Start Free Trial",
    processing: "Starting your trial...",
    footer: "No credit card required. Cancel anytime.",
    validation: {
      terms: "Please accept the Terms and Conditions.",
      signup: "Please sign up first to start your trial.",
      server: "Server error. Please try again.",
    },
  },
  es: {
    title: "Revisa tu plan",
    subtitle: "Estás a un paso de comenzar tu prueba gratuita.",
    selectedPlan: "Tu plan seleccionado",
    planNames: { solo: "Plan Solo", team: "Plan Team", growth: "Plan Growth" },
    userCount: { one: "1 usuario", many: "{count} usuarios" },
    mostPopular: "Más Popular",
    month: "/mes",
    afterTrial: "Se aplica después de tu prueba gratuita",
    monthlyAfterTrial: "Precio mensual después de tu prueba gratuita",
    setupFee: "Tarifa única de configuración (después de la prueba)",
    dueToday: "A pagar hoy",
    noPaymentTitle: "Hoy no se cobra nada",
    noPaymentDesc:
      "Tu prueba gratuita comienza ahora y hoy no se cobra ningún pago. No se te cobrará hasta que haya un método de pago disponible y completes la configuración de pago.",
    informationTitle: "Tu información",
    informationDesc: "Esta es la cuenta que creamos para tu prueba gratuita.",
    fullName: "Nombre completo",
    email: "Correo electrónico",
    phone: "Número de teléfono",
    agreementPrefix: "He leído y acepto los",
    terms: "Términos y Condiciones",
    startTrial: "Comenzar prueba gratuita",
    processing: "Iniciando tu prueba...",
    footer: "No se requiere tarjeta de crédito. Cancela cuando quieras.",
    validation: {
      terms: "Acepta los Términos y Condiciones.",
      signup: "Primero regístrate para comenzar tu prueba.",
      server: "Error del servidor. Inténtalo de nuevo.",
    },
  },
  pt: {
    title: "Revise seu plano",
    subtitle: "Você está a um passo de começar seu teste gratuito.",
    selectedPlan: "Seu plano selecionado",
    planNames: { solo: "Plano Solo", team: "Plano Team", growth: "Plano Growth" },
    userCount: { one: "1 usuário", many: "{count} usuários" },
    mostPopular: "Mais Popular",
    month: "/mês",
    afterTrial: "Aplica-se após seu teste gratuito",
    monthlyAfterTrial: "Preço mensal após seu teste gratuito",
    setupFee: "Taxa única de configuração (após o teste)",
    dueToday: "A pagar hoje",
    noPaymentTitle: "Nenhum pagamento hoje",
    noPaymentDesc:
      "Seu teste gratuito começa agora e nenhum pagamento é cobrado hoje. Você não será cobrado até que haja um método de pagamento disponível e você conclua a configuração de pagamento.",
    informationTitle: "Suas informações",
    informationDesc: "Esta é a conta que criamos para seu teste gratuito.",
    fullName: "Nome completo",
    email: "Endereço de e-mail",
    phone: "Número de telefone",
    agreementPrefix: "Li e concordo com os",
    terms: "Termos e Condições",
    startTrial: "Começar teste gratuito",
    processing: "Iniciando seu teste...",
    footer: "Não é necessário cartão de crédito. Cancele quando quiser.",
    validation: {
      terms: "Aceite os Termos e Condições.",
      signup: "Primeiro cadastre-se para começar seu teste.",
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

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const usersText =
    plan.users === 1
      ? tr.userCount.one
      : tr.userCount.many.replace("{count}", String(plan.users));

  // Start the free trial with NO charge. The account was already created (as an
  // active trial) during signup, so we just log the user in and open the product.
  const handleStartTrial = async () => {
    if (loading) return;
    if (!acceptedTerms) {
      alert(tr.validation.terms);
      return;
    }

    const userId = customer.userId || localStorage.getItem("trialUserId");
    if (!userId) {
      // No account yet — route back through signup to create one first.
      alert(tr.validation.signup);
      navigate(`/trial?plan=${encodeURIComponent(selectedPlan)}`);
      return;
    }

    setLoading(true);
    try {
      localStorage.setItem("trialPlan", selectedPlan);
      localStorage.removeItem("password");

      const res = await fetch(`${API_BASE}/api/auth/login-by-id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json().catch(() => ({}));

      if (data.accessToken) {
        apiClient.setTokens(data.accessToken, null);
        localStorage.setItem("listo_access_token", data.accessToken);
        localStorage.setItem("listo_user", JSON.stringify(data.user));
        setUser(data.user);
        navigate("/dashboard", { replace: true });
        return;
      }

      // Account exists but auto-login is unavailable — send them to sign in.
      navigate("/sign-in", { replace: true });
    } catch (error) {
      console.error("START TRIAL ERROR:", error);
      alert(tr.validation.server);
    } finally {
      setLoading(false);
    }
  };

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
                <strong>${formatMoney(SETUP_FEE)}</strong>
              </div>
              <div className="checkout-summary-total">
                <strong>{tr.dueToday}</strong>
                <div>
                  <span>USD</span>
                  <strong>$0.00</strong>
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
                  <h2>{tr.noPaymentTitle}</h2>
                  <p>{tr.noPaymentDesc}</p>
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

              <button
                type="button"
                className="checkout-pay-button"
                onClick={handleStartTrial}
                disabled={loading}
              >
                <BadgeCheck size={23} />
                <span>{loading ? tr.processing : tr.startTrial}</span>
              </button>

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
