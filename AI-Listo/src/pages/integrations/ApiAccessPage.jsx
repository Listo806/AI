import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import apiClient from "../../api/apiClient";

export default function ApiAccessPage() {
  const { t } = useTranslation();
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

      showToast(t("integrations.apiAccess.keyGenerated"));
    } catch (err) {
      console.error(err);

      showToast(t("integrations.apiAccess.keyGenerateFailed"), "error");
    }
  };

  const revoke = async () => {
    try {
      await apiClient.request("/integrations/api-access/revoke", {
        method: "POST",
      });

      setApiKey(null);

      setConfirmOpen(false);

      showToast(t("integrations.apiAccess.keyRevoked"));
    } catch (err) {
      console.error(err);

      showToast(t("integrations.apiAccess.keyRevokeFailed"), "error");
    }
  };

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(apiKey.api_key);

      showToast(t("integrations.apiAccess.keyCopied"), "success");
    } catch (err) {
      showToast(t("integrations.apiAccess.keyCopyFailed"), "error");
    }
  };

  if (loading) {
    return <div>{t("common.loading")}</div>;
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
          <h1 style={title}>{t("integrations.apiAccess.title")}</h1>

          <p style={desc}>{t("integrations.apiAccess.description")}</p>

          {!apiKey ? (
            <button style={button} onClick={generate}>
              {t("integrations.apiAccess.generateKey")}
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
                    {t("integrations.apiAccess.apiKeyLabel")}
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
                  {t("integrations.apiAccess.copyKey")}
                </button>

                <button
                  style={dangerButton}
                  onClick={() => setConfirmOpen(true)}
                >
                  {t("integrations.apiAccess.revokeKey")}
                </button>

                <button style={secondaryButton} onClick={generate}>
                  {t("integrations.apiAccess.regenerate")}
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
          <h2 style={sectionTitle}>
            {t("integrations.apiAccess.documentation")}
          </h2>

          <div style={docBox}>
            <div>
              <strong>{t("integrations.apiAccess.baseUrl")}</strong>
            </div>

            <code>https://backend.cortexaaicrm.com/api/external</code>

            <div
              style={{
                marginTop: 20,
              }}
            >
              <strong>{t("integrations.apiAccess.headers")}</strong>

              <pre>{`x-api-key: YOUR_API_KEY`}</pre>
            </div>

            <div
              style={{
                marginTop: 20,
              }}
            >
              <strong>{t("integrations.apiAccess.exampleRequest")}</strong>

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
          <h2 style={sectionTitle}>
            {t("integrations.apiAccess.usageLogs")}
          </h2>

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

                <div>
                  {t("integrations.apiAccess.statusLabel", {
                    status: log.response_status,
                  })}
                </div>

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
              {t("integrations.apiAccess.revokeConfirmTitle")}
            </h3>

            <p
              style={{
                color: "#6b7280",
                lineHeight: 1.7,
              }}
            >
              {t("integrations.apiAccess.revokeConfirmBody")}
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
                {t("common.cancel")}
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
                {t("integrations.apiAccess.revokeKey")}
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
