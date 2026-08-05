import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { trackEvent, trackSignupConversion } from "../../utils/track";
import apiClient from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import {
  BarChart3,
  Box,
  ChevronRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import "./Common.css";

const t = {
  en: {
    title: "Steps away from activating your",
    titleAccent: "Agentic AI Revenue OS.",
    aiLeads: "Leads.",
    aiQualifies: "Qualifies.",
    aiCloses: "Closes.",
    qualifies: "AI Qualifies in 60 Seconds!",
    mobileTitle: "Create your account",
    mobileSubtitle: "Get started with your free trial.",
    placeholders: {
      name: "Full Name",
      email: "Email Address",
      phone: "Phone Number (Required)",
      password: "Password",
    },
    required: "Required",
    choosePlan: "Choose your trial plan",
    mobileChoosePlan: "Choose your plan",
    choosePlanNote: "You can change or upgrade anytime.",
    mobileChoosePlanNote: "You can change or upgrade your plan at any time.",
    mostPopular: "MOST POPULAR",
    users: {
      one: "1 user",
      three: "3 users",
      five: "5 users",
    },
    planDescriptions: {
      solo: "Perfect for individuals",
      team: "Up to 3 users",
      growth: "Up to 5 users",
    },
    btnNormal: "Continue",
    mobileBtnNormal: "Start Your Free Trial",
    btnLoading: "Creating Account...",
    footerNote:
      "No payment required today. You'll review your plan and start your free trial.",
    mobileFooterNote: "Cancel or change anytime.",
    errors: {
      server: "Server error. Please try again.",
      generic: "Unable to create your trial account.",
    },
  },
  es: {
    title: "A solo unos pasos de activar tu",
    titleAccent: "Agentic AI Revenue OS.",
    aiLeads: "Leads.",
    aiQualifies: "Califica.",
    aiCloses: "Cierra.",
    qualifies: "¡La IA califica en 60 segundos!",
    mobileTitle: "Crea tu cuenta",
    mobileSubtitle: "Comienza tu prueba gratuita.",
    placeholders: {
      name: "Nombre completo",
      email: "Correo electrónico",
      phone: "Número de teléfono",
      password: "Contraseña",
    },
    required: "Obligatorio",
    choosePlan: "Elige tu plan de prueba",
    mobileChoosePlan: "Elige tu plan",
    choosePlanNote: "Puedes cambiarlo o mejorarlo en cualquier momento.",
    mobileChoosePlanNote: "Puedes cambiar o mejorar tu plan en cualquier momento.",
    mostPopular: "MÁS POPULAR",
    users: {
      one: "1 usuario",
      three: "3 usuarios",
      five: "5 usuarios",
    },
    planDescriptions: {
      solo: "Perfecto para individuos",
      team: "Hasta 3 usuarios",
      growth: "Hasta 5 usuarios",
    },
    btnNormal: "Continuar",
    mobileBtnNormal: "Iniciar prueba gratuita",
    btnLoading: "Creando cuenta...",
    footerNote:
      "No se requiere pago hoy. Revisarás tu plan y comenzarás tu prueba gratuita.",
    mobileFooterNote: "Cancela o cambia cuando quieras.",
    errors: {
      server: "Error del servidor. Inténtalo de nuevo.",
      generic: "No se pudo crear tu cuenta de prueba.",
    },
  },
  pt: {
    title: "A poucos passos de ativar seu",
    titleAccent: "Sistema Operacional de Receita com IA Agêntica.",
    aiLeads: "Leads.",
    aiQualifies: "Qualifica.",
    aiCloses: "Fecha.",
    qualifies: "A IA qualifica em 60 segundos!",
    mobileTitle: "Crie sua conta",
    mobileSubtitle: "Comece seu teste gratuito.",
    placeholders: {
      name: "Nome completo",
      email: "Endereço de e-mail",
      phone: "Número de telefone",
      password: "Senha",
    },
    required: "Obrigatório",
    choosePlan: "Escolha seu plano de teste",
    mobileChoosePlan: "Escolha seu plano",
    choosePlanNote: "Você pode alterar ou fazer upgrade a qualquer momento.",
    mobileChoosePlanNote: "Você pode alterar ou fazer upgrade do plano a qualquer momento.",
    mostPopular: "MAIS POPULAR",
    users: {
      one: "1 usuário",
      three: "3 usuários",
      five: "5 usuários",
    },
    planDescriptions: {
      solo: "Perfeito para indivíduos",
      team: "Até 3 usuários",
      growth: "Até 5 usuários",
    },
    btnNormal: "Continuar",
    mobileBtnNormal: "Iniciar teste gratuito",
    btnLoading: "Criando conta...",
    footerNote:
      "Nenhum pagamento hoje. Você revisará seu plano e começará seu teste gratuito.",
    mobileFooterNote: "Cancele ou altere quando quiser.",
    errors: {
      server: "Erro no servidor. Tente novamente.",
      generic: "Não foi possível criar sua conta de teste.",
    },
  },
};

const plans = [
  { id: "solo", name: "Solo", usersKey: "one", Icon: User },
  { id: "team", name: "Team", usersKey: "three", Icon: Users, popular: true },
  { id: "growth", name: "Growth", usersKey: "five", Icon: BarChart3 },
];

export default function StartTrial() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [lang] = useState(() => localStorage.getItem("cortexa_lang") || "en");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(() => {
    const planParam = new URLSearchParams(window.location.search).get("plan");
    const plan = ["solo", "team", "growth"].includes(planParam)
      ? planParam
      : "team";

    return {
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "owner",
      plan,
    };
  });

  const tr = t[lang] || t.en;

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const selectPlan = (plan) => {
    setForm((current) => ({ ...current, plan }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    trackEvent("signup_started", { plan: form.plan });

    try {
      const response = await fetch(
        "https://backend.cortexaaicrm.com/api/trial/start-trial",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.message || tr.errors.generic);
      }

      localStorage.setItem("trialUserId", data.userId);
      localStorage.setItem("email", form.email);
      localStorage.setItem("name", form.name);
      localStorage.setItem("phone", form.phone);
      localStorage.removeItem("password");
      localStorage.setItem("trialPlan", form.plan);

      if (data.accessToken) {
        apiClient.setTokens(data.accessToken, data.refreshToken);
        localStorage.setItem("listo_user", JSON.stringify(data.user));
        setUser(data.user);
      }

      trackEvent("account_created", { plan: form.plan });
      trackSignupConversion();
      navigate(`/checkout?plan=${encodeURIComponent(form.plan)}&source=trial`);
    } catch (error) {
      console.error("SUBMIT ERROR:", error);
      alert(error.message || tr.errors.server);
    } finally {
      setLoading(false);
    }
  };

  const renderFields = (mobile = false) => (
    <div className="trial-v2-fields">
      <label className="trial-v2-field">
        <User size={mobile ? 25 : 20} aria-hidden="true" />
        <input
          type="text"
          name="name"
          placeholder={tr.placeholders.name}
          autoComplete="name"
          required
          value={form.name}
          onChange={handleChange}
        />
      </label>

      <label className="trial-v2-field">
        <Mail size={mobile ? 25 : 20} aria-hidden="true" />
        <input
          type="email"
          name="email"
          placeholder={tr.placeholders.email}
          autoComplete="email"
          required
          value={form.email}
          onChange={handleChange}
        />
      </label>

      <label className="trial-v2-field trial-v2-phone-field">
        <Phone size={mobile ? 25 : 20} aria-hidden="true" />
        <input
          type="tel"
          name="phone"
          placeholder={tr.placeholders.phone}
          autoComplete="tel"
          required
          value={form.phone}
          onChange={handleChange}
        />
        {mobile && <span className="trial-mobile-required">{tr.required}</span>}
      </label>

      <label className="trial-v2-field">
        <LockKeyhole size={mobile ? 25 : 20} aria-hidden="true" />
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder={tr.placeholders.password}
          autoComplete="new-password"
          minLength={6}
          required
          value={form.password}
          onChange={handleChange}
        />
        <button
          type="button"
          className="trial-v2-password-toggle"
          onClick={() => setShowPassword((visible) => !visible)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={mobile ? 26 : 20} /> : <Eye size={mobile ? 26 : 20} />}
        </button>
      </label>
    </div>
  );

  const renderPlans = (mobile = false) => (
    <div className="trial-v2-plans">
      {plans.map(({ id, name, usersKey, Icon, popular }) => {
        const selected = form.plan === id;

        return (
          <button
            key={id}
            type="button"
            className={`trial-v2-plan ${selected ? "selected" : ""}`}
            onClick={() => selectPlan(id)}
            aria-pressed={selected}
          >
            {popular && (
              <span className="trial-v2-popular">{tr.mostPopular}</span>
            )}

            <span className="trial-v2-radio" aria-hidden="true">
              <span />
            </span>

            <Icon
              className="trial-v2-plan-symbol"
              size={mobile ? 42 : 36}
              strokeWidth={1.8}
            />

            <span className="trial-v2-plan-copy">
              <strong>{name}</strong>
              <small>
                {mobile ? tr.planDescriptions[id] : tr.users[usersKey]}
              </small>
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <main className="trial-v2-page">
      {/* Desktop/tablet layout: giữ nguyên layout hiện tại */}
      <section className="trial-v2-shell trial-v2-desktop-layout">
        <header className="trial-v2-hero">
          <h1>
            {tr.title}
            <span>{tr.titleAccent}</span>
          </h1>

          <div className="trial-v2-ai-row" aria-label="AI capabilities">
            <strong><em>AI</em> {tr.aiLeads}</strong>
            <strong><em>AI</em> {tr.aiQualifies}</strong>
            <strong><em>AI</em> {tr.aiCloses}</strong>
          </div>

          <p className="trial-v2-qualifies">{tr.qualifies}</p>
        </header>

        <div className="trial-v2-card">
          <form onSubmit={handleSubmit}>
            {renderFields(false)}

            <div className="trial-v2-plan-heading">
              <div className="trial-v2-plan-icon">
                <Box size={34} />
              </div>
              <div>
                <h2>{tr.choosePlan}</h2>
                <p>{tr.choosePlanNote}</p>
              </div>
            </div>

            {renderPlans(false)}

            <button type="submit" className="trial-v2-submit" disabled={loading}>
              <span>
                <LockKeyhole size={22} />
                {loading ? tr.btnLoading : tr.btnNormal}
              </span>
              <ChevronRight size={22} />
            </button>

            <div className="trial-v2-security">
              <ShieldCheck size={22} />
              <p>{tr.footerNote}</p>
            </div>
          </form>
        </div>
      </section>

      {/* Mobile-only layout */}
      <section className="trial-mobile-layout">
        <div className="trial-mobile-card">
          <div className="trial-mobile-brand" aria-hidden="true">
            <Box size={48} strokeWidth={1.8} />
          </div>

          <header className="trial-mobile-header">
            <h1>{tr.mobileTitle}</h1>
            <p>{tr.mobileSubtitle}</p>
          </header>

          <form onSubmit={handleSubmit}>
            {renderFields(true)}

            <div className="trial-mobile-divider" />

            <div className="trial-mobile-plan-heading">
              <div className="trial-mobile-plan-title">
                <ShieldCheck size={32} />
                <h2>{tr.mobileChoosePlan}</h2>
              </div>
              <p>{tr.mobileChoosePlanNote}</p>
            </div>

            {renderPlans(true)}

            <button type="submit" className="trial-v2-submit trial-mobile-submit" disabled={loading}>
              <span>{loading ? tr.btnLoading : tr.mobileBtnNormal}</span>
              <ChevronRight size={25} />
            </button>

            <div className="trial-v2-security trial-mobile-security">
              <LockKeyhole size={18} />
              <p>{tr.mobileFooterNote}</p>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}