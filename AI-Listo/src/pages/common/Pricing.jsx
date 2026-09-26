import React, { useEffect, useRef, useState } from "react";
import { useLocaleSwitch } from "../../i18n/useLocaleSwitch";
import "./Common.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import { trackEvent } from "../../utils/track";
import { localePrefixFromPath, withLocalePrefix } from "../../i18n/funnelLocale";
import { useAuth } from "../../context/AuthContext";
import { selectAccountPlan } from "../../api/platformApi";
import {
  Menu,
  X,
  Check,
  ShieldCheck,
  Layers,
  Activity,
  CircleDollarSign,
  UserPlus,
  Wrench,
  Building2,
  Bot,
  MessageSquare,
  GitFork,
  Home,
  Users,
  ShieldAlert,
  Zap,
  BarChart3,
  Target,
  TrendingUp,
  Crosshair,
  Gem,
  RefreshCw,
  User,
  Settings,
  CheckCircle,
  CheckCircle2,
  HelpCircle,
  LockKeyhole,
} from "lucide-react";

const pricingV3 = {
  en: {
    title: "Transparent pricing for every team.",
    monthly: "Billed monthly",
    annually: "Billed annually",
    save: "Save 20%",
    popular: "",
    toStart: "to start",
    keyFeatures: "FEATURES:",
    everythingFree: "FEATURES:",
    everythingSolo: "FEATURES:",
    everythingBusiness: "FEATURES:",
    ctaTrial: "Start 14-Day Trial",
    then: "Then",
    perMonth: "/month",
    perYear: "/year",
    workspaceIncluded: "1 Workspace Included",
    userIncluded: "1 User Included",
    usersIncluded: "{count} Users Included",
    oneTimeActivation: "one-time activation",
    annualSavings: "20% savings vs.",
    atMonthlyPricing: "at monthly pricing",
    paidTrialNote: "Solo, Business, and Scale plans include a 14-day trial.",
    plans: {
      solo: {
        name: "Solo Plan",
        desc: "Everything you need to start getting started.",
        price: "$11",
        users: "",
        features: [
          "Full CRM & Contact Management",
          "Lead & Pipeline Management",
          "Advanced Dashboard & Insights",
          "AI Chat (Standard)",
          "AI Conversations (250/mo)",
          "Workflow Builder (25/mo)",
          "Advanced Automations",
          "Calendar & Scheduling",
          "Documents & File Storage",
          "Custom Fields (Standard)",
          "Forms & Surveys",
          "Web Forms",
          "Integrations (Core)",
          "API Access (Limited)",
          "Mobile App Access",
          "Priority Support (Email)",
        ],
      },
      business: {
        name: "Business Plan",
        desc: "More tools. Smarter workflows. More power.",
        price: "$22",
        users: "3 users",
        features: [
          "Team Workspace (3 Users)",
          "Advanced Permissions & Roles",
          "Advanced Reports & Analytics",
          "Custom Dashboards",
          "Custom Objects & Fields",
          "Advanced Workflow Builder",
          "Multi-Pipeline Management",
          "AI Chat (Advanced)",
          "AI Conversations (1,000/mo)",
          "Lead Scoring & Qualification",
          "Smart Segmentation",
          "Documents & eSignatures",
          "Integrations (Zapier, Make, etc.)",
          "API Access (Standard)",
          "Advanced Search & Filters",
          "Priority Support (Email & Chat)",
        ],
      },
      scale: {
        name: "Scale Plan",
        desc: "All the power you need to grow without limits.",
        price: "$33",
        users: "5 users",
        features: [
          "Team Workspace (5 Users)",
          "Unlimited AI Usage",
          "AI Chat (Premium)",
          "AI Conversations (Unlimited)",
          "Advanced Automations (Unlimited)",
          "Multi-Pipeline Management (Advanced)",
          "Advanced Lead Scoring",
          "Predictive Analytics",
          "Custom Integrations",
          "API Access (Advanced)",
          "White Label (Your Brand)",
          "Custom Domain",
          "SLA & Uptime Guarantee",
          "Priority Phone Support",
          "Dedicated Account Manager",
          "Onboarding & Implementation",
          "Premium Support (24/7)",
        ],
      },
    },
  },
  es: {
    title: "Precios transparentes para cada equipo.",
    monthly: "Facturado mensualmente",
    annually: "Facturado anualmente",
    save: "Ahorra 20%",
    popular: "",
    toStart: "para comenzar",
    keyFeatures: "CARACTERÍSTICAS:",
    everythingFree: "CARACTERÍSTICAS:",
    everythingSolo: "CARACTERÍSTICAS:",
    everythingBusiness: "CARACTERÍSTICAS:",
    ctaTrial: "Iniciar prueba de 14 días",
    then: "Luego",
    perMonth: "/mes",
    perYear: "/año",
    workspaceIncluded: "1 espacio de trabajo incluido",
    userIncluded: "1 usuario incluido",
    usersIncluded: "{count} usuarios incluidos",
    oneTimeActivation: "activación única",
    annualSavings: "20% de ahorro vs.",
    atMonthlyPricing: "con precio mensual",
    paidTrialNote: "Los planes Solo, Business y Scale incluyen una prueba de 14 días.",
    plans: {
      solo: {
        name: "Plan Solo",
        desc: "Todo lo que necesitas para empezar.",
        price: "$11",
        users: "",
        features: [
          "CRM completo y gestión de contactos",
          "Gestión de leads y pipeline",
          "Panel e insights avanzados",
          "Chat con IA (Estándar)",
          "Conversaciones con IA (250/mes)",
          "Constructor de flujos (25/mes)",
          "Automatizaciones avanzadas",
          "Calendario y programación",
          "Documentos y almacenamiento de archivos",
          "Campos personalizados (Estándar)",
          "Formularios y encuestas",
          "Formularios web",
          "Integraciones (Core)",
          "Acceso API (Limitado)",
          "Acceso a la aplicación móvil",
          "Soporte prioritario (Email)",
        ],
      },
      business: {
        name: "Plan Business",
        desc: "Más herramientas. Flujos más inteligentes. Más potencia.",
        price: "$22",
        users: "3 usuarios",
        features: [
          "Espacio de trabajo del equipo (3 usuarios)",
          "Permisos y roles avanzados",
          "Informes y analítica avanzados",
          "Paneles personalizados",
          "Objetos y campos personalizados",
          "Constructor de flujos avanzado",
          "Gestión de múltiples pipelines",
          "Chat con IA (Avanzado)",
          "Conversaciones con IA (1.000/mes)",
          "Puntuación y calificación de leads",
          "Segmentación inteligente",
          "Documentos y firmas electrónicas",
          "Integraciones (Zapier, Make, etc.)",
          "Acceso API (Estándar)",
          "Búsqueda y filtros avanzados",
          "Soporte prioritario (Email y chat)",
        ],
      },
      scale: {
        name: "Plan Scale",
        desc: "Toda la potencia que necesitas para crecer sin límites.",
        price: "$33",
        users: "5 usuarios",
        features: [
          "Espacio de trabajo del equipo (5 usuarios)",
          "Uso ilimitado de IA",
          "Chat con IA (Premium)",
          "Conversaciones con IA (Ilimitadas)",
          "Automatizaciones avanzadas (Ilimitadas)",
          "Gestión de múltiples pipelines (Avanzada)",
          "Puntuación avanzada de leads",
          "Analítica predictiva",
          "Integraciones personalizadas",
          "Acceso API (Avanzado)",
          "Marca blanca (Tu marca)",
          "Dominio personalizado",
          "Garantía de SLA y disponibilidad",
          "Soporte telefónico prioritario",
          "Gerente de cuenta dedicado",
          "Onboarding e implementación",
          "Soporte Premium (24/7)",
        ],
      },
    },
  },
  pt: {
    title: "Preços transparentes para todas as equipes.",
    monthly: "Cobrado mensalmente",
    annually: "Cobrado anualmente",
    save: "Economize 20%",
    popular: "",
    toStart: "para começar",
    keyFeatures: "RECURSOS:",
    everythingFree: "RECURSOS:",
    everythingSolo: "RECURSOS:",
    everythingBusiness: "RECURSOS:",
    ctaTrial: "Iniciar teste de 14 dias",
    then: "Depois",
    perMonth: "/mês",
    perYear: "/ano",
    workspaceIncluded: "1 espaço de trabalho incluído",
    userIncluded: "1 usuário incluído",
    usersIncluded: "{count} usuários incluídos",
    oneTimeActivation: "ativação única",
    annualSavings: "20% de economia vs.",
    atMonthlyPricing: "com preço mensal",
    paidTrialNote: "Os planos Solo, Business e Scale incluem um teste de 14 dias.",
    plans: {
      solo: {
        name: "Plano Solo",
        desc: "Tudo o que você precisa para começar.",
        price: "$11",
        users: "",
        features: [
          "CRM completo e gestão de contatos",
          "Gestão de leads e pipeline",
          "Dashboard e insights avançados",
          "Chat com IA (Padrão)",
          "Conversas com IA (250/mês)",
          "Construtor de fluxos (25/mês)",
          "Automações avançadas",
          "Calendário e agendamento",
          "Documentos e armazenamento de arquivos",
          "Campos personalizados (Padrão)",
          "Formulários e pesquisas",
          "Formulários web",
          "Integrações (Core)",
          "Acesso à API (Limitado)",
          "Acesso ao aplicativo móvel",
          "Suporte prioritário (E-mail)",
        ],
      },
      business: {
        name: "Plano Business",
        desc: "Mais ferramentas. Fluxos mais inteligentes. Mais potência.",
        price: "$22",
        users: "3 usuários",
        features: [
          "Workspace de equipe (3 usuários)",
          "Permissões e funções avançadas",
          "Relatórios e análises avançadas",
          "Dashboards personalizados",
          "Objetos e campos personalizados",
          "Construtor de fluxos avançado",
          "Gestão de múltiplos pipelines",
          "Chat com IA (Avançado)",
          "Conversas com IA (1.000/mês)",
          "Pontuação e qualificação de leads",
          "Segmentação inteligente",
          "Documentos e assinaturas eletrônicas",
          "Integrações (Zapier, Make, etc.)",
          "Acesso à API (Padrão)",
          "Pesquisa e filtros avançados",
          "Suporte prioritário (E-mail e chat)",
        ],
      },
      scale: {
        name: "Plano Scale",
        desc: "Toda a potência de que você precisa para crescer sem limites.",
        price: "$33",
        users: "5 usuários",
        features: [
          "Workspace de equipe (5 usuários)",
          "Uso ilimitado de IA",
          "Chat com IA (Premium)",
          "Conversas com IA (Ilimitadas)",
          "Automações avançadas (Ilimitadas)",
          "Gestão de múltiplos pipelines (Avançada)",
          "Pontuação avançada de leads",
          "Análises preditivas",
          "Integrações personalizadas",
          "Acesso à API (Avançado)",
          "White Label (Sua marca)",
          "Domínio personalizado",
          "Garantia de SLA e disponibilidade",
          "Suporte telefônico prioritário",
          "Gerente de conta dedicado",
          "Onboarding e implementação",
          "Suporte Premium (24/7)",
        ],
      },
    },
  },
};

export default function PricingPage() {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("cortexa_lang") || "en";
  });

  const [langOpen, setLangOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const pv3 = pricingV3[lang] || pricingV3.en;

  const navigate = useNavigate();
  const location = useLocation();
  // Keep the visitor's language through the funnel: /es/pricing -> /es/trial,
  // /es/checkout, /es/sign-in (same for /pt and the Ecuador /es-ec namespace).
  // The CRM (/dashboard) is not localized and stays unprefixed.
  const routePrefix = localePrefixFromPath(location.pathname);
  const funnelPath = (path) => withLocalePrefix(routePrefix, path);
  const { user, setUser } = useAuth();
  const cycle = billingCycle === "annually" ? "annual" : "monthly";

  // pricing_view: once per pricing page view (this mount).
  const pricingViewRef = useRef(false);
  useEffect(() => {
    if (pricingViewRef.current) return;
    pricingViewRef.current = true;
    trackEvent("pricing_view", { language: lang, billing_cycle: cycle });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const billingPrices = {
    solo: {
      activation: 11,
      monthly: 127,
      annual: 1219.2,
      monthlyAnnualized: 2364,
    },
    team: {
      activation: 22,
      monthly: 297,
      annual: 2851.2,
      monthlyAnnualized: 4164,
    },
    growth: {
      activation:33,
      monthly: 497,
      annual: 4771.2,
      monthlyAnnualized: 5964,
    },
  };

  const formatUsd = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);

  const getRecurringPrice = (planKey) => {
    const plan = billingPrices[planKey];
    if (!plan) return null;

    return {
      amount: cycle === "annual" ? plan.annual : plan.monthly,
      period: cycle === "annual" ? pv3.perYear : pv3.perMonth,
      savingsBase: plan.monthlyAnnualized,
    };
  };

  const renderPaidPrice = (planKey) => {
    const plan = billingPrices[planKey];
    const recurring = getRecurringPrice(planKey);

    return (
      <div className="cx-pricing-v3-paid-pricing">
        <div className="cx-pricing-v3-price">
          <strong>{formatUsd(plan.activation)}</strong>
          <span>{pv3.toStart}</span>
        </div>
        <div className="cx-pricing-v3-inclusions">
          <span><Check size={16} strokeWidth={2.8} /> {pv3.workspaceIncluded}</span>
          <i aria-hidden="true" />
          <span><User size={16} strokeWidth={2.6} /> {planKey === "solo" ? pv3.userIncluded : pv3.usersIncluded.replace("{count}", planKey === "team" ? "3" : "5")}</span>
        </div>
        <div className="cx-pricing-v3-activation-label">
          {formatUsd(plan.activation)} {pv3.oneTimeActivation}
        </div>

        <div className="cx-pricing-v3-then-row" aria-label={pv3.then}>
          <span />
          <b>{pv3.then}</b>
          <span />
        </div>

        <div className="cx-pricing-v3-recurring">
          <strong>{formatUsd(recurring.amount)}</strong>
          <span>{recurring.period}</span>
        </div>

        {cycle === "annual" && (
          <div className="cx-pricing-v3-saving-detail">
            ({pv3.annualSavings} {formatUsd(recurring.savingsBase)}{pv3.perYear} {pv3.atMonthlyPricing})
          </div>
        )}
      </div>
    );
  };

  // New signup flow:
  // CTA -> Create Account -> Pricing -> Review / Checkout.
  //
  // The latest backend already exposes /trial/select-plan through
  // selectAccountPlan(), so preserve that developer integration.
  const onPlanCta = (e, planKey) => {
    trackEvent("plan_selected", {
      plan: planKey,
      billing_cycle: planKey === "free" ? "free" : cycle,
      // What is charged today for this plan (the activation fee; 0 for Free).
      value: planKey === "free" ? 0 : billingPrices[planKey]?.activation ?? 0,
      currency: "USD",
      language: lang,
    });

    if (planKey !== "free") {
      const selectedPricing = billingPrices[planKey];
      localStorage.setItem(
        "pendingPricingSelection",
        JSON.stringify({
          plan: planKey,
          billingCycle: cycle,
          activationAmount: selectedPricing.activation,
          recurringAmount:
            cycle === "annual"
              ? selectedPricing.annual
              : selectedPricing.monthly,
          recurringFrequency: cycle === "annual" ? "year" : "month",
          currency: "USD",
        }),
      );
    }

    const hasRegisteredAccount = Boolean(
      user || localStorage.getItem("trialUserId"),
    );

    // Pricing can still be visited publicly. If there is no registered account,
    // account creation must happen FIRST. We intentionally do not send the user
    // directly to Checkout or bind the selected plan yet.
    if (!hasRegisteredAccount) {
      e.preventDefault();

      localStorage.setItem("pendingPlanIntent", planKey);
      localStorage.setItem(
        "pendingBillingCycle",
        planKey === "free" ? "free" : cycle,
      );

      navigate(`${funnelPath("/trial")}?from=pricing`);
      return;
    }

    e.preventDefault();

    (async () => {
      try {
        const res = await selectAccountPlan({
          plan: planKey,
          billingCycle: planKey === "free" ? undefined : cycle,
        });

        const data = res?.data ?? res;
        const selectedPlan = data?.plan || planKey;

        localStorage.setItem("trialPlan", selectedPlan);
        localStorage.setItem(
          "signupFlowStage",
          planKey === "free" || data?.free
            ? "free_plan_selected"
            : "checkout",
        );

        if (planKey === "free" || data?.free) {
          navigate("/dashboard", { replace: true });
          return;
        }

        navigate(
          `${funnelPath("/checkout")}?plan=${encodeURIComponent(selectedPlan)}&billing=${cycle}&source=trial`,
          { replace: true },
        );
      } catch (error) {
        console.error("PLAN SELECTION ERROR:", error);

        // A stale account id from an earlier visit with no live session: the
        // account exists, so sign in (never register twice) and come back.
        if (/session expired|unauthori[sz]ed|401/i.test(error?.message || "")) {
          localStorage.removeItem("trialUserId");
          localStorage.setItem("trialPlan", planKey);
          try { setUser(null); } catch (e) { /* ignore */ }
          navigate(`${funnelPath("/sign-in")}?next=${encodeURIComponent(funnelPath("/pricing"))}`);
          return;
        }

        // Do not create a second registration. If the account exists but the
        // authenticated plan-update failed, keep the visitor on Pricing.
        alert(
          error?.message ||
            "Unable to save your selected plan. Please try again.",
        );
      }
    })();
  };

  return (
    <div className="pricing-page pricing-v3-page">
      <main className="main-content pricing-v3-main">
        <section className="cx-pricing-v3" aria-labelledby="pricing-v3-title">
          <div className="cx-pricing-v3-heading">
            <h1 id="pricing-v3-title">{pv3.title}</h1>

            <div
              className="cx-pricing-v3-billing"
              aria-label="Billing frequency"
            >
              <button
                type="button"
                className={billingCycle === "monthly" ? "active" : ""}
                onClick={() => setBillingCycle("monthly")}
              >
                {pv3.monthly}
              </button>

              <button
                type="button"
                className={`cx-pricing-v3-switch ${billingCycle === "annually" ? "annual" : ""}`}
                onClick={() =>
                  setBillingCycle((current) =>
                    current === "monthly" ? "annually" : "monthly",
                  )
                }
                aria-label={`${pv3.monthly} / ${pv3.annually}`}
                aria-pressed={billingCycle === "annually"}
              >
                <span />
              </button>

              <button
                type="button"
                className={billingCycle === "annually" ? "active" : ""}
                onClick={() => setBillingCycle("annually")}
              >
                {pv3.annually}
              </button>

              <span className="cx-pricing-v3-save">{pv3.save}</span>
            </div>
          </div>

          <div className="cx-pricing-v3-grid">
            <article className="cx-pricing-v3-card">
              <div className="cx-pricing-v3-card-top">
                <h2>{pv3.plans.solo.name}</h2>
                <p className="cx-pricing-v3-desc">{pv3.plans.solo.desc}</p>
                {renderPaidPrice("solo")}
                <Link
                  to={`${funnelPath("/trial")}?from=pricing`}
                  className="cx-pricing-v3-cta"
                  onClick={(e) => onPlanCta(e, "solo")}
                >
                  {pv3.ctaTrial}
                </Link>
              </div>
              <div className="cx-pricing-v3-features">
                <h3>{pv3.keyFeatures}</h3>
                <ul>
                  {pv3.plans.solo.features.map((feature) => (
                    <li key={feature}>
                      <Check size={18} strokeWidth={2.5} />{" "}
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            <article className="cx-pricing-v3-card cx-pricing-v3-card-business">
              <div className="cx-pricing-v3-card-top">
                <div className="cx-pricing-v3-name-row">
                  <h2>{pv3.plans.business.name}</h2>
                  {pv3.popular && (
                    <span className="cx-pricing-v3-popular">{pv3.popular}</span>
                  )}
                </div>
                <p className="cx-pricing-v3-desc">{pv3.plans.business.desc}</p>
                {renderPaidPrice("team")}
                <Link
                  to={`${funnelPath("/trial")}?from=pricing`}
                  className="cx-pricing-v3-cta cx-pricing-v3-cta-business"
                  onClick={(e) => onPlanCta(e, "team")}
                >
                  {pv3.ctaTrial}
                </Link>
              </div>
              <div className="cx-pricing-v3-features">
                <h3>{pv3.keyFeatures}</h3>
                <ul>
                  {pv3.plans.business.features.map((feature) => (
                    <li key={feature}>
                      <Check size={18} strokeWidth={2.5} />{" "}
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            <article className="cx-pricing-v3-card">
              <div className="cx-pricing-v3-card-top">
                <h2>{pv3.plans.scale.name}</h2>
                <p className="cx-pricing-v3-desc">{pv3.plans.scale.desc}</p>
                {renderPaidPrice("growth")}
                <Link
                  to={`${funnelPath("/trial")}?from=pricing`}
                  className="cx-pricing-v3-cta"
                  onClick={(e) => onPlanCta(e, "growth")}
                >
                  {pv3.ctaTrial}
                </Link>
              </div>
              <div className="cx-pricing-v3-features">
                <h3>{pv3.keyFeatures}</h3>
                <ul>
                  {pv3.plans.scale.features.map((feature) => (
                    <li key={feature}>
                      <Check size={18} strokeWidth={2.5} />{" "}
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </div>

          <p className="cx-pricing-v3-paid-trial-note">
            {pv3.paidTrialNote}
          </p>

        </section>
      </main>
    </div>
  );
}