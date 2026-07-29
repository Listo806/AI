import React, { useEffect, useState } from "react";

import apiClient from "../../api/apiClient";

export default function ApiAccessPage() {
  const [loading, setLoading] = useState(true);

  const [apiKey, setApiKey] = useState(null);

  const [usage, setUsage] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({
      message,
      type,
    });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };
  const [confirmOpen, setConfirmOpen] = useState(false);
  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);

      const key = await apiClient.request("/integrations/api-access");

      setApiKey(key);

      const usageRes = await apiClient.request(
        "/integrations/api-access/usage",
      );

      setUsage(usageRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generate = async () => {
    try {
      const res = await apiClient.request("/integrations/api-access/generate", {
        method: "POST",
      });

      setApiKey(res);

      showToast("API key generated successfully");
    } catch (err) {
      console.error(err);

      showToast("Failed to generate API key", "error");
    }
  };

  const revoke = async () => {
    try {
      await apiClient.request("/integrations/api-access/revoke", {
        method: "POST",
      });

      setApiKey(null);

      setConfirmOpen(false);

      showToast("API key revoked");
    } catch (err) {
      console.error(err);

      showToast("Failed to revoke API key", "error");
    }
  };

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(apiKey.api_key);

      showToast("API key copied", "success");
    } catch (err) {
      showToast("Failed to copy API key", "error");
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
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <div style={card}>
          <h1 style={title}>API Access</h1>

          <p style={desc}>
            Generate API keys and connect external systems securely.
          </p>

          {!apiKey ? (
            <button style={button} onClick={generate}>
              Generate API Key
            </button>
          ) : (
            <>
              <div style={apiBox}>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                    }}
                  >
                    API KEY
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      fontFamily: "monospace",
                      fontSize: 15,
                    }}
                  >
                    {apiKey.api_key}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 20,
                }}
              >
                <button style={button} onClick={copyKey}>
                  Copy API Key
                </button>

                <button
                  style={dangerButton}
                  onClick={() => setConfirmOpen(true)}
                >
                  Revoke Key
                </button>

                <button style={secondaryButton} onClick={generate}>
                  Regenerate
                </button>
              </div>
            </>
          )}
        </div>

        <div
          style={{
            ...card,
            marginTop: 30,
          }}
        >
          <h2 style={sectionTitle}>API Documentation</h2>

          <div style={docBox}>
            <div>
              <strong>Base URL:</strong>
            </div>

            <code>https://backend.cortexaaicrm.com/api/external</code>

            <div
              style={{
                marginTop: 20,
              }}
            >
              <strong>Headers</strong>

              <pre>{`x-api-key: YOUR_API_KEY`}</pre>
            </div>

            <div
              style={{
                marginTop: 20,
              }}
            >
              <strong>Example Request</strong>

              <pre>
                {`curl --request GET \
https://backend.cortexaaicrm.com/api/external/leads \
--header "x-api-key: YOUR_API_KEY"`}
              </pre>
            </div>
          </div>
        </div>

        <div
          style={{
            ...card,
            marginTop: 30,
          }}
        >
          <h2 style={sectionTitle}>Usage Logs</h2>

          <div
            style={{
              display: "grid",
              gap: 12,
            }}
          >
            {usage.map((log) => (
              <div key={log.id} style={logRow}>
                <div>
                  <strong>{log.method}</strong> {log.endpoint}
                </div>

                <div>Status: {log.response_status}</div>

                <div>{new Date(log.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {confirmOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9998,
          }}
        >
          <div
            style={{
              width: 420,
              background: "#fff",
              borderRadius: 20,
              padding: 28,
              boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
            }}
          >
            <h3
              style={{
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              Revoke API Key?
            </h3>

            <p
              style={{
                color: "#6b7280",
                lineHeight: 1.7,
              }}
            >
              This will immediately disable all external API access using this
              key.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                marginTop: 30,
              }}
            >
              <button
                onClick={() => setConfirmOpen(false)}
                style={{
                  padding: "12px 18px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>

              <button
                onClick={revoke}
                style={{
                  padding: "12px 18px",
                  borderRadius: 12,
                  border: "none",
                  background: "#dc2626",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Revoke Key
              </button>
            </div>
          </div>
        </div>
      )}
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
            animation: "slideIn 0.25s ease",
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
};

const button = {
  marginTop: 20,
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "12px 18px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButton = {
  ...button,
  background: "#111827",
};

const dangerButton = {
  ...button,
  background: "#dc2626",
};

const apiBox = {
  marginTop: 24,
  padding: 20,
  borderRadius: 16,
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
};

const sectionTitle = {
  fontSize: 24,
  fontWeight: 700,
  marginBottom: 20,
};

const docBox = {
  background: "#111827",
  color: "#fff",
  padding: 24,
  borderRadius: 16,
};

const logRow = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 16,
};
