import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Common.css";
import apiClient from '../../api/apiClient';

const API_BASE = "https://ai-2-7ikc.onrender.com";
const STORAGE_PREFIX = 'listo_';
export default function Onboarding() {
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
      navigate("/trial");
      return;
    }

    const checkUser = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/user/${userId}`);

        if (!res.ok) throw new Error("API error");

        const data = await res.json();

        if (!data.success) {
          navigate("/trial");
          return;
        }

        if (data?.user?.onboardingCompleted) {
          navigate("/crm/dashboard");
        }
      } catch (err) {
        console.error("CHECK USER ERROR:", err);
        setError("Unable to load onboarding. Please refresh.");
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
      setError("Please make a selection to continue.");
      return;
    }

    setError("");
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleFinish = async () => {
    const userId = localStorage.getItem("trialUserId");

    if (!userId) {
      navigate("/trial");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/auth/save-onboarding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          ...form,
        }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();

      if (data.success) {
          apiClient.setTokens(data.token, null);
          localStorage.setItem(STORAGE_PREFIX + 'user', JSON.stringify(data.user));
          localStorage.setItem('listo_token', data.token);
          localStorage.setItem("onboardingComplete", "true");
          navigate("/dashboard");
      } else {
        setError(data.message || "Could not save onboarding.");
      }
    } catch (err) {
      console.error("SAVE ONBOARDING ERROR:", err);
      setError("Server error. Please try again.");
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

        <h1>Setup your AI CRM</h1>

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <h2>What type of business are you?</h2>

            <button onClick={() => setForm({ ...form, businessType: "real_estate" })}>
              Real Estate
            </button>

            <button onClick={() => setForm({ ...form, businessType: "agency" })}>
              Agency
            </button>

            <button onClick={() => setForm({ ...form, businessType: "solo" })}>
              Solo Agent
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <h2>Where do your leads come from?</h2>

            <button onClick={() => toggleLeadSource("facebook")}>
              Facebook
            </button>

            <button onClick={() => toggleLeadSource("zillow")}>
              Zillow
            </button>

            <button onClick={() => toggleLeadSource("website")}>
              Website
            </button>

            <button onClick={() => toggleLeadSource("referrals")}>
              Referrals
            </button>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div>
            <h2>What is your main goal?</h2>

            <input
              type="text"
              placeholder="e.g. Close more deals"
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
            <h2>Ready to launch 🚀</h2>

            <button onClick={handleFinish} disabled={loading}>
              {loading ? "Saving..." : "Finish Setup"}
            </button>
          </div>
        )}

        {/* NAVIGATION */}
        {step < 4 && (
          <button onClick={nextStep}>
            Continue
          </button>
        )}

        {/* ERROR */}
        {error && <p style={{ color: "red" }}>{error}</p>}

      </div>
    </div>
  );
}