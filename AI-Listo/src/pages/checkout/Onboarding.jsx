import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Common.css";
import apiClient from '../../api/apiClient';
import { useAuth } from "../../context/AuthContext";
import { trackEvent, trackEventOnce } from "../../utils/track";
import {
  explicitLanguageChoice,
  languageFromPrefix,
  localePrefixFromPath,
  userLanguage,
  withLocalePrefix,
} from "../../i18n/funnelLocale";

const STORAGE_PREFIX = 'listo_';

// Workspace names shown on step 1 (the backend returns the ids + English names;
// the labels follow the page language). Unknown ids fall back to the server name.
const WORKSPACE_LABELS = {
  en: {
    business: "Business Suite", sales: "Sales", insurance: "Insurance",
    financial_services: "Financial Services", "customer-service": "Customer Service",
    marketing: "Marketing", projects: "Projects", ecommerce: "E-Commerce",
    "real-estate": "Real Estate", team: "Team",
    "aesthetic-wellness": "Aesthetic & Wellness", "clinic-medical": "Clinic & Medical",
  },
  es: {
    business: "Suite de Negocios", sales: "Ventas", insurance: "Seguros",
    financial_services: "Servicios Financieros", "customer-service": "Servicio al Cliente",
    marketing: "Marketing", projects: "Proyectos", ecommerce: "Comercio Electrónico",
    "real-estate": "Bienes Raíces", team: "Equipo",
    "aesthetic-wellness": "Estética y Bienestar", "clinic-medical": "Clínica y Medicina",
  },
  pt: {
    business: "Suíte de Negócios", sales: "Vendas", insurance: "Seguros",
    financial_services: "Serviços Financeiros", "customer-service": "Atendimento ao Cliente",
    marketing: "Marketing", projects: "Projetos", ecommerce: "E-commerce",
    "real-estate": "Imóveis", team: "Equipe",
    "aesthetic-wellness": "Estética e Bem-estar", "clinic-medical": "Clínica e Medicina",
  },
};

export default function Onboarding() {
  const { t, i18n } = useTranslation();
  const { user, refreshUser } = useAuth();
  // The page's language prefix (/es, /pt, /es-ec): kept on the sign-in /
  // verification hops and used as the language carried into the (unprefixed) CRM.
  const routePrefix = localePrefixFromPath(window.location.pathname);
  const onboardingPath = withLocalePrefix(routePrefix, "/onboarding");
  const signInPath = `${withLocalePrefix(routePrefix, "/sign-in")}?next=${encodeURIComponent(onboardingPath)}`;
  const verifyPath = withLocalePrefix(routePrefix, "/verify-email");
  const pageLang = languageFromPrefix(routePrefix);
  const labels = WORKSPACE_LABELS[pageLang] || WORKSPACE_LABELS.en;
  const workspaceTrackedRef = useRef(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [workspaces, setWorkspaces] = useState([]);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    businessType: "",
    leadSources: [],
    mainGoal: "",
  });

  const hasSession = () =>
    !!(apiClient.accessToken || localStorage.getItem(STORAGE_PREFIX + "access_token"));

  // Auth / verification failures from the onboarding API send the customer to
  // the step they are missing instead of leaving them on a broken page.
  const handleAuthError = (err) => {
    const status = err?.status || err?.response?.status;
    if (status === 401 || !hasSession()) {
      navigate(signInPath, { replace: true });
      return true;
    }
    if (status === 403) {
      const code = String(err?.data?.code || err?.response?.data?.code || err?.code || '');
      const message = String(err?.data?.message || err?.response?.data?.message || err?.message || '');
      // Only verification-specific 403s belong on Verify Email. Workspace/plan
      // permission errors must remain visible here instead of causing a false redirect.
      if (code === 'EMAIL_VERIFICATION_REQUIRED' || /email.*verif/i.test(message)) {
        navigate(verifyPath, { replace: true });
        return true;
      }
    }
    return false;
  };

  // 🔒 PROTECT ROUTE: the signed-in account (JWT) decides everything here. A
  // customer who opens the verification link on another device signs in first
  // and comes straight back to this page.
  useEffect(() => {
    if (!hasSession()) {
      navigate(signInPath, { replace: true });
      return;
    }

    let dead = false;
    const checkUser = async () => {
      try {
        const data = await apiClient.request("/onboarding/state");
        if (dead) return;

        // Already onboarded (or the team already has its workspace): skip ahead.
        if (data?.completed) {
          navigate(data.route || "/dashboard", { replace: true });
          return;
        }

        const available = Array.isArray(data?.workspaces) ? data.workspaces : [];
        setWorkspaces(available);
        // Restore a previously saved choice after an interrupted/failed activation,
        // but never invent a selection that the backend did not return.
        if (data?.workspaceId && available.some((ws) => ws.id === data.workspaceId)) {
          setForm((prev) => prev.businessType ? prev : { ...prev, businessType: data.workspaceId });
        }
        // onboarding_started: once per browser session for this account.
        trackEventOnce(`onboarding_started:${user?.id || "session"}`, "onboarding_started", { language: pageLang });
      } catch (err) {
        if (dead) return;
        if (handleAuthError(err)) return;
        console.error("CHECK USER ERROR:", err);
        setError(t("onboarding.loadError"));
      }
    };

    checkUser();
    return () => {
      dead = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // ======================
  // HANDLERS
  // ======================

  const toggleLeadSource = (source) => {
    setForm((prev) => {
      const exists = prev.leadSources.includes(source);

      return {
        ...prev,
        leadSources: exists
          ? prev.leadSources.filter((item) => item !== source)
          : [...prev.leadSources, source],
      };
    });
  };

  const canContinue = () => {
    if (step === 1) return !!form.businessType;
    if (step === 2) return true;
    if (step === 3) return !!form.mainGoal;
    return true;
  };

  const nextStep = () => {
    if (!canContinue()) {
      setError(t("onboarding.selectToContinue"));
      return;
    }

    setError("");
    // workspace_selected: the business type chosen on step 1, once per
    // selection (a changed choice is a new selection).
    if (step === 1 && form.businessType && workspaceTrackedRef.current !== form.businessType) {
      workspaceTrackedRef.current = form.businessType;
      trackEvent("workspace_selected", { workspace: form.businessType, language: pageLang });
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleFinish = async () => {
    if (!hasSession()) {
      navigate(signInPath, { replace: true });
      return;
    }
    if (!form.businessType) {
      setStep(1);
      setError(t("onboarding.selectToContinue"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      // The chosen business type IS the workspace id; the server links it to the
      // account's active CRM plan (the one included Workspace) and marks
      // onboarding complete. Identity comes from the JWT only.
      const data = await apiClient.request("/onboarding", {
        method: "POST",
        body: JSON.stringify({
          workspaceId: form.businessType,
          leadSources: form.leadSources,
          mainGoal: form.mainGoal,
        }),
      });

      if (data?.success) {
        trackEventOnce(`onboarding_completed:${user?.id || "session"}`, "onboarding_completed", {
          workspace: data.workspaceId || form.businessType || undefined,
          language: pageLang,
        }, "local");

        try { await refreshUser?.(); } catch (_e) { /* never block entry */ }

        // /dashboard is not language-prefixed: carry the language into it
        // (explicit choice > account preference > this page's language).
        const lang = explicitLanguageChoice() || userLanguage(user) || pageLang;
        if (lang && String(i18n.language || "").slice(0, 2) !== lang) {
          i18n.changeLanguage(lang);
        }

        navigate(data.route || "/dashboard", { replace: true });
      } else {
        setError(data?.message || t("onboarding.saveError"));
      }
    } catch (err) {
      if (handleAuthError(err)) return;
      console.error("SAVE ONBOARDING ERROR:", err);
      const message = err?.data?.message || err?.response?.data?.message || err?.message;
      setError(err?.status === 400 ? t("onboarding.selectToContinue") : (message || t("onboarding.serverError")));
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // UI
  // ======================

  return (
    <div className="onboarding-page">
      <div className="container">

        <h1>{t("onboarding.title")}</h1>

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <h2>{t("onboarding.step1Question")}</h2>

            {workspaces.map((ws) => (
              <button
                key={ws.id}
                aria-pressed={form.businessType === ws.id}
                style={form.businessType === ws.id ? { outline: "2px solid #6366f1", outlineOffset: 2 } : undefined}
                onClick={() => setForm({ ...form, businessType: ws.id })}
              >
                {labels[ws.id] || ws.name}
              </button>
            ))}
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <h2>{t("onboarding.step2Question")}</h2>

            <button onClick={() => toggleLeadSource("facebook")}>
              {t("onboarding.sourceFacebook")}
            </button>

            <button onClick={() => toggleLeadSource("zillow")}>
              {t("onboarding.sourceZillow")}
            </button>

            <button onClick={() => toggleLeadSource("website")}>
              {t("onboarding.sourceWebsite")}
            </button>

            <button onClick={() => toggleLeadSource("referrals")}>
              {t("onboarding.sourceReferrals")}
            </button>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div>
            <h2>{t("onboarding.step3Question")}</h2>

            <input
              type="text"
              placeholder={t("onboarding.mainGoalPlaceholder")}
              value={form.mainGoal}
              onChange={(e) =>
                setForm({ ...form, mainGoal: e.target.value })
              }
            />
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div>
            <h2>{t("onboarding.step4Title")}</h2>

            <button onClick={handleFinish} disabled={loading}>
              {loading ? t("onboarding.saving") : t("onboarding.finishSetup")}
            </button>
          </div>
        )}

        {/* NAVIGATION */}
        {step < 4 && (
          <button onClick={nextStep}>
            {t("onboarding.continue")}
          </button>
        )}

        {/* ERROR */}
        {error && <p style={{ color: "red" }}>{error}</p>}

      </div>
    </div>
  );
}