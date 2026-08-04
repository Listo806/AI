import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import apiClient from "../../api/apiClient";

export default function InstagramPage() {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState(null);

  const [syncLoading, setSyncLoading] = useState(false);

  const [disconnectLoading, setDisconnectLoading] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);

      const res = await apiClient.request(
        "/integrations/instagram/config/status",
      );

      setStatus(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const connectInstagram = async () => {
    try {
      const res = await apiClient.request(
        "/integrations/instagram/connect",
      );

      window.location.href = res.url;
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSync = async () => {
    try {
      setSyncLoading(true);

      await apiClient.request(
        "/integrations/instagram/toggle-sync",
        {
          method: "POST",

          body: JSON.stringify({
            enabled:
              !status?.config?.syncEnabled,
          }),
        },
      );

      await loadStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setSyncLoading(false);
    }
  };

  const disconnectInstagram = async () => {
    try {
      const confirmed = window.confirm(
        t("integrations.instagram.disconnectConfirm"),
      );

      if (!confirmed) {
        return;
      }

      setDisconnectLoading(true);

      await apiClient.request(
        "/integrations/instagram/disconnect",
        {
          method: "DELETE",
        },
      );

      await loadStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setDisconnectLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <p>{t("integrations.instagram.loading")}</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{t("integrations.instagram.pageTitle")}</h1>

        <p>{t("integrations.instagram.pageSubtitle")}</p>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 24,
          border: "1px solid #e5e7eb",
          marginTop: 24,
        }}
      >
        {!status?.isConfigured ? (
          <div>
            <h3>
              {t("integrations.instagram.notConnectedTitle")}
            </h3>

            <p
              style={{
                marginTop: 8,
                color: "#6b7280",
              }}
            >
              {t("integrations.instagram.connectPrompt")}
            </p>

            <ul
              style={{
                marginTop: 16,
                paddingLeft: 18,
                lineHeight: 1.8,
              }}
            >
              <li>{t("integrations.instagram.benefitDmSync")}</li>

              <li>{t("integrations.instagram.benefitLeadAutoImport")}</li>

              <li>{t("integrations.instagram.benefitConversationSync")}</li>

              <li>{t("integrations.instagram.benefitAiWorkflow")}</li>

              <li>{t("integrations.instagram.benefitCrmContact")}</li>
            </ul>

            <button
              onClick={connectInstagram}
              style={buttonStyle}
            >
              {t("integrations.instagram.connectButton")}
            </button>
          </div>
        ) : (
          <>
            <div style={sectionStyle}>
              <h3>{t("integrations.instagram.connectedTitle")}</h3>

              <p>
                <strong>{t("integrations.instagram.usernameLabel")}</strong>{" "}
                @
                {status?.config
                  ?.instagramUsername || "-"}
              </p>

              <p style={{ marginTop: 8 }}>
                <strong>{t("integrations.instagram.facebookPageLabel")}</strong>{" "}
                {status?.config?.pageName ||
                  "-"}
              </p>
            </div>

            <div style={sectionStyle}>
              <h3>{t("integrations.instagram.syncStatusTitle")}</h3>

              <p>
                {t("integrations.instagram.autoImportStatus")}{" "}
                <strong>
                  {status?.config?.syncEnabled
                    ? t("integrations.instagram.enabled")
                    : t("integrations.instagram.disabled")}
                </strong>
              </p>

              <button
                onClick={toggleSync}
                disabled={syncLoading}
                style={buttonStyle}
              >
                {syncLoading
                  ? t("integrations.instagram.saving")
                  : status?.config
                        ?.syncEnabled
                    ? t("integrations.instagram.disableAutoSync")
                    : t("integrations.instagram.enableAutoSync")}
              </button>
            </div>

            <div style={sectionStyle}>
              <h3>{t("integrations.instagram.integrationFeaturesTitle")}</h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16,
                  marginTop: 16,
                }}
              >
                <FeatureCard
                  title={t("integrations.instagram.featureDmsTitle")}
                  description={t("integrations.instagram.featureDmsDesc")}
                />

                <FeatureCard
                  title={t("integrations.instagram.featureLeadCaptureTitle")}
                  description={t("integrations.instagram.featureLeadCaptureDesc")}
                />

                <FeatureCard
                  title={t("integrations.instagram.featureAiAutomationTitle")}
                  description={t("integrations.instagram.featureAiAutomationDesc")}
                />

                <FeatureCard
                  title={t("integrations.instagram.featureUnifiedInboxTitle")}
                  description={t("integrations.instagram.featureUnifiedInboxDesc")}
                />
              </div>
            </div>

            <div style={sectionStyle}>
              <h3>{t("integrations.instagram.dangerZoneTitle")}</h3>

              <p
                style={{
                  color: "#6b7280",
                  marginBottom: 16,
                }}
              >
                {t("integrations.instagram.dangerZoneDesc")}
              </p>

              <button
                onClick={disconnectInstagram}
                disabled={disconnectLoading}
                style={{
                  ...buttonStyle,
                  background: "#ef4444",
                  color: "#fff",
                }}
              >
                {disconnectLoading
                  ? t("integrations.instagram.disconnecting")
                  : t("integrations.instagram.disconnectButton")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 18,
        background: "#fafafa",
      }}
    >
      <h4
        style={{
          marginBottom: 10,
        }}
      >
        {title}
      </h4>

      <p
        style={{
          color: "#6b7280",
          lineHeight: 1.6,
          fontSize: 14,
        }}
      >
        {description}
      </p>
    </div>
  );
}

const sectionStyle = {
  marginBottom: 32,
};

const buttonStyle = {
  marginTop: 16,
  padding: "10px 18px",
  borderRadius: 10,
  border: "none",
  cursor: "pointer",
};