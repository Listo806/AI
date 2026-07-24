import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { trackEvent } from "../../utils/track";
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
    placeholders: {
      name: "Full Name",
      email: "Email Address",
      phone: "Phone Number (Required)",
      password: "Password",
    },
    choosePlan: "Choose your trial plan",
    choosePlanNote: "You can change or upgrade anytime.",
    mostPopular: "MOST POPULAR",
    users: {
      one: "1 user",
      three: "3 users",
      five: "5 users",
    },
    btnNormal: "Continue",
    btnLoading: "Creating Account...",
    footerNote:
      "No payment required today. You'll review your plan and start your free trial.",
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
    placeholders: {
      name: "Nombre completo",
      email: "Correo electrónico",
      phone: "Número de teléfono (obligatorio)",
      password: "Contraseña",
    },
    choosePlan: "Elige tu plan de prueba",
    choosePlanNote: "Puedes cambiarlo o mejorarlo en cualquier momento.",
    mostPopular: "MÁS POPULAR",
    users: {
      one: "1 usuario",
      three: "3 usuarios",
      five: "5 usuarios",
    },
    btnNormal: "Continuar",
    btnLoading: "Creando cuenta...",
    footerNote:
      "No se requiere pago hoy. Revisarás tu plan y comenzarás tu prueba gratuita.",
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
    placeholders: {
      name: "Nome completo",
      email: "Endereço de e-mail",
      phone: "Número de telefone (obrigatório)",
      password: "Senha",
    },
    choosePlan: "Escolha seu plano de teste",
    choosePlanNote: "Você pode alterar ou fazer upgrade a qualquer momento.",
    mostPopular: "MAIS POPULAR",
    users: {
      one: "1 usuário",
      three: "3 usuários",
      five: "5 usuários",
    },
    btnNormal: "Continuar",
    btnLoading: "Criando conta...",
    footerNote:
      "Nenhum pagamento hoje. Você revisará seu plano e começará seu teste gratuito.",
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
    // Retargeting: visitor began the trial signup.
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
      localStorage.removeItem("password"); // never persist the raw password client-side
      localStorage.setItem("trialPlan", form.plan);
      // Retargeting: trial account created (not yet activated/paid).
      trackEvent("account_created", { plan: form.plan });
      navigate(`/checkout?plan=${encodeURIComponent(form.plan)}&source=trial`);
    } catch (error) {
      console.error("SUBMIT ERROR:", error);
      alert(error.message || tr.errors.server);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="trial-v2-page">
      <section className="trial-v2-shell">
        <header className="trial-v2-hero">
          <h1>
            {tr.title}
            <span>{tr.titleAccent}</span>
          </h1>

          <div className="trial-v2-ai-row" aria-label="AI capabilities">
            <strong>
              <em>AI</em> {tr.aiLeads}
            </strong>
            <strong>
              <em>AI</em> {tr.aiQualifies}
            </strong>
            <strong>
              <em>AI</em> {tr.aiCloses}
            </strong>
          </div>

          <p className="trial-v2-qualifies">{tr.qualifies}</p>
        </header>

        <div className="trial-v2-card">
          <form onSubmit={handleSubmit}>
            <div className="trial-v2-fields">
              <label className="trial-v2-field">
                <User size={20} aria-hidden="true" />
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
                <Mail size={20} aria-hidden="true" />
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

              <label className="trial-v2-field">
                <Phone size={20} aria-hidden="true" />
                <input
                  type="tel"
                  name="phone"
                  placeholder={tr.placeholders.phone}
                  autoComplete="tel"
                  required
                  value={form.phone}
                  onChange={handleChange}
                />
              </label>

              <label className="trial-v2-field">
                <LockKeyhole size={20} aria-hidden="true" />
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
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </label>
            </div>

            <div className="trial-v2-plan-heading">
              <div className="trial-v2-plan-icon">
                <Box size={34} />
              </div>
              <div>
                <h2>{tr.choosePlan}</h2>
                <p>{tr.choosePlanNote}</p>
              </div>
            </div>

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
                      size={36}
                      strokeWidth={1.8}
                    />
                    <span className="trial-v2-plan-copy">
                      <strong>{name}</strong>
                      <small>{tr.users[usersKey]}</small>
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="submit"
              className="trial-v2-submit"
              disabled={loading}
            >
              <span>
                <LockKeyhole size={22} />{" "}
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
    </main>
  );
}
