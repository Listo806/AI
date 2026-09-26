import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Common.css";
import apiClient from '../../api/apiClient';
import { trackEvent, trackEventOnce } from "../../utils/track";
import {
  explicitLanguageChoice,
  languageFromPrefix,
  localePrefixFromPath,
  userLanguage,
  withLocalePrefix,
} from "../../i18n/funnelLocale";

const API_BASE = "https://backend.cortexaaicrm.com";
const STORAGE_PREFIX = 'listo_';
export default function Onboarding() {
  const { t, i18n } = useTranslation();
  // The page's language prefix (/es, /pt, /es-ec): used for the localized
  // /trial fallback and as the language carried into the (unprefixed) CRM.
  const routePrefix = localePrefixFromPath(window.location.pathname);
  const trialPath = withLocalePrefix(routePrefix, "/trial");
  const pageLang = languageFromPrefix(routePrefix);
  const workspaceTrackedRef = useRef(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [form, setForm] = useState({
    businessType: "",
    leadSources: [],
    mainGoal: "",
  });

  // 🔒 PROTECT ROUTE
  useEffect(() => {
    const userId = localStorage.getItem("trialUserId");

    if (!userId) {
      navigate(trialPath);
      return;
    }

    // onboarding_started: once per browser session for this account.
    trackEventOnce(`onboarding_started:${userId}`, "onboarding_started", { language: pageLang });

    const checkUser = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/user/${userId}`);

        if (!res.ok) throw new Error("API error");

        const data = await res.json();

        if (!data.success) {
          navigate(trialPath);
          return;
        }

        if (data?.user?.onboardingCompleted) {
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("CHECK USER ERROR:", err);
        setError(t("onboarding.loadError"));
      }
    };

    checkUser();
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
    const userId = localStorage.getItem("trialUserId");

    if (!userId) {
      navigate(trialPath);
      return;
    }

    setLoading(true);
    setError("");
    console.log("ONBOARDING PAYLOAD:", {
      userId,
      ...form,
    });
    
    try {
      const data = await apiClient.request('/auth/save-onboarding', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          ...form,
        }),
      });

      //if (!res.ok) throw new Error("API error");

      //const data = await res.json();
        console.log("SAVE ONBOARDING RESPONSE:", data);
      if (data.success) {
          apiClient.setTokens(data.token, null);

          localStorage.setItem('listo_access_token', data.token);
          localStorage.setItem('listo_user', JSON.stringify(data.user));

          trackEventOnce(`onboarding_completed:${userId}`, "onboarding_completed", {
            workspace: form.businessType || undefined,
            language: pageLang,
          }, "local");

          // /dashboard is not language-prefixed: carry the language into it
          // (explicit choice > account preference > this page's language).
          const lang = explicitLanguageChoice() || userLanguage(data.user) || pageLang;
          if (lang && String(i18n.language || "").slice(0, 2) !== lang) {
            i18n.changeLanguage(lang);
          }

          navigate("/dashboard");
      } else {
        setError(data.message || t("onboarding.saveError"));
      }
    } catch (err) {
      console.error("SAVE ONBOARDING ERROR:", err);
      setError(t("onboarding.serverError"));
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

            <button onClick={() => setForm({ ...form, businessType: "real_estate" })}>
              {t("onboarding.businessRealEstate")}
            </button>

            <button onClick={() => setForm({ ...form, businessType: "agency" })}>
              {t("onboarding.businessAgency")}
            </button>

            <button onClick={() => setForm({ ...form, businessType: "solo" })}>
              {t("onboarding.businessSolo")}
            </button>
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