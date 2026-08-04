import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import apiClient from "../../api/apiClient";

const providerOptions = [
  {
    value: "stellar_mls",
    label: "Stellar MLS",
  },
  {
    value: "crmls",
    label: "CRMLS",
  },
  {
    value: "bright_mls",
    label: "Bright MLS",
  },
  {
    value: "reso_web_api",
    label: "RESO Web API",
  },
  {
    value: "custom_idx",
    label: "Custom IDX Provider",
  },
];

export default function MlsIdxPage() {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [syncing, setSyncing] = useState(false);

  const [toast, setToast] = useState(null);
  const [feeds, setFeeds] = useState([]);
  const [form, setForm] = useState({
    providerName: "",
    country: "US",
    integrationType: "idx",

    endpointUrl: "",
    username: "",
    password: "",
    apiKey: "",

    syncEnabled: true,

    syncFrequencyMinutes: 60,

    propertyTypes: [],

    compatibilityMode: "reso",
  });

  useEffect(() => {
    load();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({
      message,
      type,
    });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiClient.request("/integrations/mls");
      setFeeds(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    try {
      /*
       * VALIDATION
       */
      if (!form.providerName) {
        showToast(t("integrations.mls.errorSelectProvider"), "error");

        return;
      }

      if (!form.endpointUrl.trim()) {
        showToast(t("integrations.mls.errorEndpointRequired"), "error");

        return;
      }

      try {
        new URL(form.endpointUrl);
      } catch {
        showToast(t("integrations.mls.errorInvalidEndpoint"), "error");

        return;
      }

      setSaving(true);

      await apiClient.request("/integrations/mls", {
        method: "POST",

        body: JSON.stringify(form),
      });

      showToast(t("integrations.mls.savedSuccess"));
      await load();

      setForm({
        providerName: "",
        country: "US",
        integrationType: "idx",

        endpointUrl: "",
        username: "",
        password: "",
        apiKey: "",

        syncEnabled: true,

        syncFrequencyMinutes: 60,

        propertyTypes: [],

        compatibilityMode: "reso",
      });
    } catch (err) {
      console.error(err);

      showToast(t("integrations.mls.saveError"), "error");
    } finally {
      setSaving(false);
    }
  };

  const syncNow = async () => {
    try {
      setSyncing(true);

      await apiClient.request("/integrations/mls/sync", {
        method: "POST",
      });

      showToast(t("integrations.mls.syncStarted"));
    } catch (err) {
      console.error(err);

      showToast(t("integrations.mls.syncError"), "error");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <div>{t("integrations.mls.loading")}</div>;
  }

  return (
    <div
      style={{
        padding: 40,
        background: "#f5f7fb",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
        }}
      >
        <div style={card}>
          <h1 style={title}>{t("integrations.mls.title")}</h1>

          <p style={desc}>{t("integrations.mls.description")}</p>

          <div style={grid}>
            <div>
              <div style={label}>{t("integrations.mls.providerLabel")}</div>

              <select
                style={input}
                value={form.providerName}
                onChange={(e) =>
                  setForm({
                    ...form,
                    providerName: e.target.value,
                  })
                }
              >
                <option value="">{t("integrations.mls.selectProvider")}</option>

                {providerOptions.map((provider) => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={label}>{t("integrations.mls.countryLabel")}</div>

              <select
                style={input}
                value={form.country}
                onChange={(e) =>
                  setForm({
                    ...form,
                    country: e.target.value,
                  })
                }
              >
                <option value="US">
                  {t("integrations.mls.countryUnitedStates")}
                </option>

                <option value="CA">{t("integrations.mls.countryCanada")}</option>

                <option value="AU">
                  {t("integrations.mls.countryAustralia")}
                </option>

                <option value="UK">
                  {t("integrations.mls.countryUnitedKingdom")}
                </option>

                <option value="VN">
                  {t("integrations.mls.countryVietnam")}
                </option>
              </select>
            </div>

            <div>
              <div style={label}>
                {t("integrations.mls.integrationTypeLabel")}
              </div>

              <select
                style={input}
                value={form.integrationType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    integrationType: e.target.value,
                  })
                }
              >
                <option value="idx">IDX</option>

                <option value="rets">RETS</option>

                <option value="reso">RESO Web API</option>
              </select>
            </div>

            <div>
              <div style={label}>{t("integrations.mls.compatibilityLabel")}</div>

              <select
                style={input}
                value={form.compatibilityMode}
                onChange={(e) =>
                  setForm({
                    ...form,
                    compatibilityMode: e.target.value,
                  })
                }
              >
                <option value="reso">
                  {t("integrations.mls.compatibilityResoStandard")}
                </option>

                <option value="rets">
                  {t("integrations.mls.compatibilityRetsLegacy")}
                </option>
              </select>
            </div>

            <div
              style={{
                gridColumn: "1 / -1",
              }}
            >
              <div style={label}>{t("integrations.mls.endpointUrlLabel")}</div>

              <input
                style={input}
                placeholder="https://api.mlsprovider.com"
                value={form.endpointUrl}
                onChange={(e) =>
                  setForm({
                    ...form,
                    endpointUrl: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <div style={label}>{t("integrations.mls.usernameLabel")}</div>

              <input
                style={input}
                value={form.username}
                onChange={(e) =>
                  setForm({
                    ...form,
                    username: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <div style={label}>{t("integrations.mls.passwordLabel")}</div>

              <input
                type="password"
                style={input}
                value={form.password}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password: e.target.value,
                  })
                }
              />
            </div>

            <div
              style={{
                gridColumn: "1 / -1",
              }}
            >
              <div style={label}>{t("integrations.mls.apiKeyLabel")}</div>

              <input
                style={input}
                value={form.apiKey}
                onChange={(e) =>
                  setForm({
                    ...form,
                    apiKey: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <div style={label}>{t("integrations.mls.syncFrequencyLabel")}</div>

              <input
                type="number"
                style={input}
                value={form.syncFrequencyMinutes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    syncFrequencyMinutes: e.target.value,
                  })
                }
              />
            </div>

            <label style={checkboxRow}>
              <input
                type="checkbox"
                checked={form.syncEnabled}
                onChange={() =>
                  setForm({
                    ...form,
                    syncEnabled: !form.syncEnabled,
                  })
                }
              />

              <span>{t("integrations.mls.enableAutomaticSync")}</span>
            </label>
          </div>

          <div
            style={{
              display: "flex",
              gap: 14,
              marginTop: 30,
            }}
          >
            <button style={button} onClick={save} disabled={saving}>
              {saving
                ? t("integrations.mls.saving")
                : t("integrations.mls.saveSettings")}
            </button>

            <button
              style={secondaryButton}
              onClick={syncNow}
              disabled={syncing}
            >
              {syncing
                ? t("integrations.mls.syncing")
                : t("integrations.mls.syncNow")}
            </button>
          </div>
        </div>

        <div
          style={{
            ...card,
            marginTop: 30,
          }}
        >
          <h2 style={sectionTitle}>
            {t("integrations.mls.architectureTitle")}
          </h2>

          <ul
            style={{
              lineHeight: 2,
              color: "#4b5563",
            }}
          >
            <li>{t("integrations.mls.archMultiCountry")}</li>

            <li>{t("integrations.mls.archRetsResoCompat")}</li>

            <li>{t("integrations.mls.archIncrementalSync")}</li>

            <li>{t("integrations.mls.archScheduledImports")}</li>

            <li>{t("integrations.mls.archGlobalProvider")}</li>

            <li>{t("integrations.mls.archMediaSync")}</li>

            <li>{t("integrations.mls.archAgentBrokerMapping")}</li>
          </ul>
        </div>
      </div>

      {toast && (
        <div
          style={{
            position: "fixed",
            top: 30,
            right: 30,
            background: toast.type === "success" ? "#16a34a" : "#dc2626",
            color: "#fff",
            padding: "14px 18px",
            borderRadius: 14,
            fontWeight: 600,
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            zIndex: 9999,
            minWidth: 280,
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

const card = {
  background: "#fff",
  borderRadius: 20,
  padding: 30,
  border: "1px solid #e5e7eb",
};

const title = {
  fontSize: 34,
  fontWeight: 700,
};

const desc = {
  color: "#6b7280",
  marginTop: 10,
  lineHeight: 1.7,
};

const sectionTitle = {
  fontSize: 24,
  fontWeight: 700,
  marginBottom: 20,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 20,
  marginTop: 30,
};

const label = {
  fontWeight: 700,
  marginBottom: 8,
  fontSize: 14,
};

const input = {
  width: "100%",
  padding: 14,
  borderRadius: 12,
  border: "1px solid #d1d5db",
  boxSizing: "border-box",
};

const checkboxRow = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const button = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "14px 20px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButton = {
  ...button,
  background: "#111827",
};
