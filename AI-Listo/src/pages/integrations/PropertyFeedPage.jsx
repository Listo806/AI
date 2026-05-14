import React, { useEffect, useState } from "react";

import apiClient from "../../api/apiClient";

export default function PropertyFeedPage() {
  const [feeds, setFeeds] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [syncingId, setSyncingId] = useState(null);

  const [form, setForm] = useState({
    providerName: "",
    feedUrl: "",
    feedType: "xml",
    syncFrequencyMinutes: 60,
  });
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
  useEffect(() => {
    loadFeeds();
  }, []);

  const loadFeeds = async () => {
    try {
      setLoading(true);

      const res = await apiClient.request("/integrations/property-feed");

      setFeeds(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createFeed = async () => {
    try {
      /*
       * VALIDATION
       */
      if (!form.providerName.trim()) {
        showToast("Provider name is required", "error");

        return;
      }

      if (!form.feedUrl.trim()) {
        showToast("Feed URL is required", "error");

        return;
      }

      /*
       * VALIDATE URL
       */
      let parsedUrl;

      try {
        parsedUrl = new URL(form.feedUrl);
      } catch {
        showToast("Invalid feed URL", "error");

        return;
      }

      /*
       * HTTPS ONLY
       */
      if (parsedUrl.protocol !== "https:") {
        showToast("Feed URL must use HTTPS", "error");

        return;
      }

      /*
       * VALIDATE SYNC FREQUENCY
       */
      const frequency = Number(form.syncFrequencyMinutes);

      if (Number.isNaN(frequency) || frequency < 5) {
        showToast("Sync frequency must be at least 5 minutes", "error");

        return;
      }

      setSaving(true);

      await apiClient.request("/integrations/property-feed", {
        method: "POST",

        body: JSON.stringify({
          ...form,
          syncFrequencyMinutes: frequency,
        }),
      });

      showToast("Property feed added successfully");

      await loadFeeds();

      setForm({
        providerName: "",
        feedUrl: "",
        feedType: "xml",
        syncFrequencyMinutes: 60,
      });
    } catch (err) {
      console.error(err);

      showToast(err.message || "Failed to create feed", "error");
    } finally {
      setSaving(false);
    }
  };

  const syncFeed = async (feedId) => {
    try {
      setSyncingId(feedId);

      await apiClient.request(`/integrations/property-feed/${feedId}/sync`, {
        method: "POST",
      });

      await loadFeeds();

      alert("Feed synced successfully");
    } catch (err) {
      console.error(err);
    } finally {
      setSyncingId(null);
    }
  };

  const toggleSync = async (feed) => {
    try {
      await apiClient.request(
        `/integrations/property-feed/${feed.id}/toggle-sync`,
        {
          method: "POST",

          body: JSON.stringify({
            enabled: !feed.syncEnabled,
          }),
        },
      );

      await loadFeeds();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteFeed = async (feedId) => {
    try {
      await apiClient.request(`/integrations/property-feed/${feedId}`, {
        method: "DELETE",
      });

      await loadFeeds();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className="page-container"
      style={{
        background: "#f5f7fb",
        minHeight: "100vh",
        padding: "40px 20px",
      }}
    >
      <div
        className="page-header"
        style={{
          marginBottom: 30,
        }}
      >
        <h1
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: "#111827",
            marginBottom: 10,
          }}
        >
          Property Feed Sync
        </h1>

        <p
          style={{
            color: "#6b7280",
            fontSize: 17,
            maxWidth: 700,
            lineHeight: 1.7,
          }}
        >
          Connect XML and JSON property feeds into your CRM and automatically
          sync listings.
        </p>
      </div>

      <div style={cardStyle}>
        <h2
          style={{
            marginBottom: 20,
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          Add Property Feed
        </h2>

        <div
          style={{
            display: "grid",
            gap: 18,
          }}
        >
          <div>
            <div style={labelStyle}>Provider Name</div>

            <input
              style={inputStyle}
              placeholder="Example: Zillow Feed"
              value={form.providerName}
              onChange={(e) =>
                setForm({
                  ...form,
                  providerName: e.target.value,
                })
              }
            />
          </div>

          <div>
            <div style={labelStyle}>Feed URL</div>

            <input
              style={inputStyle}
              placeholder="https://example.com/feed.xml"
              value={form.feedUrl}
              onChange={(e) =>
                setForm({
                  ...form,
                  feedUrl: e.target.value,
                })
              }
            />
          </div>

          <div>
            <div style={labelStyle}>Feed Type</div>

            <select
              style={inputStyle}
              value={form.feedType}
              onChange={(e) =>
                setForm({
                  ...form,
                  feedType: e.target.value,
                })
              }
            >
              <option value="xml">XML Feed</option>

              <option value="json">JSON Feed</option>
            </select>
          </div>

          <div>
            <div style={labelStyle}>Sync Frequency</div>

            <input
              style={inputStyle}
              type="number"
              placeholder="60"
              value={form.syncFrequencyMinutes}
              onChange={(e) =>
                setForm({
                  ...form,
                  syncFrequencyMinutes: e.target.value,
                })
              }
            />
          </div>

          <button
            onClick={createFeed}
            disabled={saving}
            style={{
              ...buttonStyle,
              height: 50,
            }}
          >
            {saving ? "Saving..." : "Add Feed"}
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: 40,
        }}
      >
        <h2
          style={{
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 20,
            color: "#111827",
          }}
        >
          Connected Feeds
        </h2>

        {loading ? (
          <p>Loading...</p>
        ) : feeds.length === 0 ? (
          <div style={emptyStyle}>No property feeds connected yet.</div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 20,
            }}
          >
            {feeds.map((feed) => (
              <div key={feed.id} style={cardStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <h3
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      margin: 0,
                      color: "#111827",
                    }}
                  >
                    {feed.providerName}
                  </h3>

                  <div
                    style={{
                      background: feed.syncEnabled ? "#dcfce7" : "#fee2e2",

                      color: feed.syncEnabled ? "#166534" : "#991b1b",

                      padding: "6px 12px",

                      borderRadius: 999,

                      fontSize: 13,

                      fontWeight: 600,
                    }}
                  >
                    {feed.syncEnabled ? "Enabled" : "Disabled"}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: 10,
                    color: "#4b5563",
                    lineHeight: 1.7,
                  }}
                >
                  <div>
                    <strong>URL:</strong> {feed.feedUrl}
                  </div>

                  <div>
                    <strong>Type:</strong> {feed.feedType.toUpperCase()}
                  </div>

                  <div>
                    <strong>Properties:</strong> {feed.totalProperties}
                  </div>

                  <div>
                    <strong>Frequency:</strong> Every{" "}
                    {feed.syncFrequencyMinutes} minutes
                  </div>
                </div>

                {feed.lastError && (
                  <div
                    style={{
                      marginTop: 16,
                      background: "#fef2f2",
                      color: "#b91c1c",
                      padding: 12,
                      borderRadius: 10,
                      fontSize: 14,
                    }}
                  >
                    {feed.lastError}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginTop: 20,
                    flexWrap: "wrap",
                  }}
                >
                  <button onClick={() => syncFeed(feed.id)} style={buttonStyle}>
                    {syncingId === feed.id ? "Syncing..." : "Sync Now"}
                  </button>

                  <button
                    onClick={() => toggleSync(feed)}
                    style={secondaryButton}
                  >
                    {feed.syncEnabled ? "Disable" : "Enable"}
                  </button>

                  <button
                    onClick={() => deleteFeed(feed.id)}
                    style={dangerButton}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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

const cardStyle = {
  background: "#fff",
  borderRadius: 18,
  padding: 24,
  border: "1px solid #e5e7eb",
  boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
};

const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
};

const labelStyle = {
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 8,
  color: "#374151",
};

const buttonStyle = {
  padding: "12px 18px",
  borderRadius: 12,
  border: "none",
  cursor: "pointer",
  background: "#2563eb",
  color: "#fff",
  fontWeight: 600,
  fontSize: 15,
  maxWidth: "150px",
};

const secondaryButton = {
  ...buttonStyle,
  background: "#111827",
};

const dangerButton = {
  ...buttonStyle,
  background: "#dc2626",
};

const emptyStyle = {
  background: "#fff",
  border: "1px dashed #d1d5db",
  borderRadius: 16,
  padding: 40,
  textAlign: "center",
  color: "#6b7280",
};
