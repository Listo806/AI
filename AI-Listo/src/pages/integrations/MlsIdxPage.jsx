import React, { useEffect, useState } from "react";

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
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [syncing, setSyncing] = useState(false);

  const [toast, setToast] = useState(null);

  const [config, setConfig] = useState({
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

      if (res) {
        setConfig({
          ...config,
          ...res,
        });
      }
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
      if (!config.providerName) {
        showToast("Please select MLS provider", "error");

        return;
      }

      if (!config.endpointUrl.trim()) {
        showToast("Endpoint URL is required", "error");

        return;
      }

      try {
        new URL(config.endpointUrl);
      } catch {
        showToast("Invalid endpoint URL", "error");

        return;
      }

      setSaving(true);

      await apiClient.request("/integrations/mls", {
        method: "POST",

        body: JSON.stringify(config),
      });

      showToast("MLS integration saved successfully");
    } catch (err) {
      console.error(err);

      showToast("Failed to save MLS integration", "error");
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

      showToast("MLS sync started");
    } catch (err) {
      console.error(err);

      showToast("Failed to sync MLS", "error");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
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
          <h1 style={title}>MLS / IDX Feed</h1>

          <p style={desc}>
            Connect MLS providers, RETS feeds, RESO APIs, and IDX systems into
            your CRM.
          </p>

          <div style={grid}>
            <div>
              <div style={label}>MLS Provider</div>

              <select
                style={input}
                value={config.providerName}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    providerName: e.target.value,
                  })
                }
              >
                <option value="">Select Provider</option>

                {providerOptions.map((provider) => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={label}>Country</div>

              <select
                style={input}
                value={config.country}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    country: e.target.value,
                  })
                }
              >
                <option value="US">United States</option>

                <option value="CA">Canada</option>

                <option value="AU">Australia</option>

                <option value="UK">United Kingdom</option>

                <option value="VN">Vietnam</option>
              </select>
            </div>

            <div>
              <div style={label}>Integration Type</div>

              <select
                style={input}
                value={config.integrationType}
                onChange={(e) =>
                  setConfig({
                    ...config,
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
              <div style={label}>Compatibility</div>

              <select
                style={input}
                value={config.compatibilityMode}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    compatibilityMode: e.target.value,
                  })
                }
              >
                <option value="reso">RESO Standard</option>

                <option value="rets">RETS Legacy</option>
              </select>
            </div>

            <div
              style={{
                gridColumn: "1 / -1",
              }}
            >
              <div style={label}>Endpoint URL</div>

              <input
                style={input}
                placeholder="https://api.mlsprovider.com"
                value={config.endpointUrl}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    endpointUrl: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <div style={label}>Username</div>

              <input
                style={input}
                value={config.username}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    username: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <div style={label}>Password</div>

              <input
                type="password"
                style={input}
                value={config.password}
                onChange={(e) =>
                  setConfig({
                    ...config,
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
              <div style={label}>API Key</div>

              <input
                style={input}
                value={config.apiKey}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    apiKey: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <div style={label}>Sync Frequency</div>

              <input
                type="number"
                style={input}
                value={config.syncFrequencyMinutes}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    syncFrequencyMinutes: e.target.value,
                  })
                }
              />
            </div>

            <label style={checkboxRow}>
              <input
                type="checkbox"
                checked={config.syncEnabled}
                onChange={() =>
                  setConfig({
                    ...config,
                    syncEnabled: !config.syncEnabled,
                  })
                }
              />

              <span>Enable automatic sync</span>
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
              {saving ? "Saving..." : "Save Settings"}
            </button>

            <button
              style={secondaryButton}
              onClick={syncNow}
              disabled={syncing}
            >
              {syncing ? "Syncing..." : "Sync Now"}
            </button>
          </div>
        </div>

        <div
          style={{
            ...card,
            marginTop: 30,
          }}
        >
          <h2 style={sectionTitle}>Architecture</h2>

          <ul
            style={{
              lineHeight: 2,
              color: "#4b5563",
            }}
          >
            <li>Multi-country MLS architecture</li>

            <li>RETS + RESO Web API compatibility</li>

            <li>Incremental sync support</li>

            <li>Scheduled IDX imports</li>

            <li>Future-ready global provider support</li>

            <li>Property media & image synchronization</li>

            <li>Agent & broker mapping support</li>
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
