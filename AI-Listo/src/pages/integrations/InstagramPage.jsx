import React, { useEffect, useState } from "react";
import apiClient from "../../api/apiClient";

export default function InstagramPage() {
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
        "Disconnect Instagram integration?",
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
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Instagram Integration</h1>

        <p>
          Connect Instagram Business accounts
          to sync messages, leads, and CRM
          conversations automatically.
        </p>
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
              Instagram Business not connected
            </h3>

            <p
              style={{
                marginTop: 8,
                color: "#6b7280",
              }}
            >
              Connect your Instagram Business
              account to enable:
            </p>

            <ul
              style={{
                marginTop: 16,
                paddingLeft: 18,
                lineHeight: 1.8,
              }}
            >
              <li>Instagram DM sync</li>

              <li>Lead auto-import</li>

              <li>Conversation sync</li>

              <li>AI workflow automation</li>

              <li>CRM contact creation</li>
            </ul>

            <button
              onClick={connectInstagram}
              style={buttonStyle}
            >
              Connect Instagram Business
            </button>
          </div>
        ) : (
          <>
            <div style={sectionStyle}>
              <h3>Connected Instagram</h3>

              <p>
                <strong>Username:</strong>{" "}
                @
                {status?.config
                  ?.instagramUsername || "-"}
              </p>

              <p style={{ marginTop: 8 }}>
                <strong>Facebook Page:</strong>{" "}
                {status?.config?.pageName ||
                  "-"}
              </p>
            </div>

            <div style={sectionStyle}>
              <h3>Sync Status</h3>

              <p>
                Auto-import of Instagram
                conversations and leads is{" "}
                <strong>
                  {status?.config?.syncEnabled
                    ? "enabled"
                    : "disabled"}
                </strong>
              </p>

              <button
                onClick={toggleSync}
                disabled={syncLoading}
                style={buttonStyle}
              >
                {syncLoading
                  ? "Saving..."
                  : status?.config
                        ?.syncEnabled
                    ? "Disable Auto Sync"
                    : "Enable Auto Sync"}
              </button>
            </div>

            <div style={sectionStyle}>
              <h3>Integration Features</h3>

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
                  title="Instagram DMs"
                  description="Sync Instagram messages into CRM conversations."
                />

                <FeatureCard
                  title="Lead Capture"
                  description="Automatically create leads from Instagram interactions."
                />

                <FeatureCard
                  title="AI Automation"
                  description="Trigger AI workflows from Instagram messages."
                />

                <FeatureCard
                  title="Unified Inbox"
                  description="Manage Instagram conversations inside your CRM."
                />
              </div>
            </div>

            <div style={sectionStyle}>
              <h3>Danger Zone</h3>

              <p
                style={{
                  color: "#6b7280",
                  marginBottom: 16,
                }}
              >
                Disconnecting Instagram will
                stop all syncing and automation.
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
                  ? "Disconnecting..."
                  : "Disconnect Instagram"}
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