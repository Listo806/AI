import React, {
  useEffect,
  useState,
} from "react";

import apiClient from "../../api/apiClient";

export default function PropertyFeedPage() {
  const [feeds, setFeeds] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [syncingId, setSyncingId] =
    useState(null);

  const [form, setForm] =
    useState({
      providerName: "",
      feedUrl: "",
      feedType: "xml",
      syncFrequencyMinutes: 60,
    });

  useEffect(() => {
    loadFeeds();
  }, []);

  const loadFeeds = async () => {
    try {
      setLoading(true);

      const res =
        await apiClient.request(
          "/integrations/property-feed",
        );

      setFeeds(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createFeed = async () => {
    try {
      setSaving(true);

      await apiClient.request(
        "/integrations/property-feed",
        {
          method: "POST",

          body: JSON.stringify(form),
        },
      );

      await loadFeeds();

      setForm({
        providerName: "",
        feedUrl: "",
        feedType: "xml",
        syncFrequencyMinutes: 60,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const syncFeed = async (
    feedId,
  ) => {
    try {
      setSyncingId(feedId);

      await apiClient.request(
        `/integrations/property-feed/${feedId}/sync`,
        {
          method: "POST",
        },
      );

      await loadFeeds();

      alert(
        "Feed synced successfully",
      );
    } catch (err) {
      console.error(err);
    } finally {
      setSyncingId(null);
    }
  };

  const toggleSync = async (
    feed,
  ) => {
    try {
      await apiClient.request(
        `/integrations/property-feed/${feed.id}/toggle-sync`,
        {
          method: "POST",

          body: JSON.stringify({
            enabled:
              !feed.syncEnabled,
          }),
        },
      );

      await loadFeeds();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteFeed = async (
    feedId,
  ) => {
    try {
      await apiClient.request(
        `/integrations/property-feed/${feedId}`,
        {
          method: "DELETE",
        },
      );

      await loadFeeds();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>
          Property Feed Sync
        </h1>

        <p>
          Connect XML and JSON
          property feeds into
          your CRM.
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
        <div
          style={{
            display: "grid",
            gap: 16,
          }}
        >
          <input
            placeholder="Provider Name"
            value={form.providerName}
            onChange={(e) =>
              setForm({
                ...form,
                providerName:
                  e.target.value,
              })
            }
          />

          <input
            placeholder="Feed URL"
            value={form.feedUrl}
            onChange={(e) =>
              setForm({
                ...form,
                feedUrl:
                  e.target.value,
              })
            }
          />

          <select
            value={form.feedType}
            onChange={(e) =>
              setForm({
                ...form,
                feedType:
                  e.target.value,
              })
            }
          >
            <option value="xml">
              XML Feed
            </option>

            <option value="json">
              JSON Feed
            </option>
          </select>

          <input
            type="number"
            placeholder="Sync Frequency Minutes"
            value={
              form.syncFrequencyMinutes
            }
            onChange={(e) =>
              setForm({
                ...form,
                syncFrequencyMinutes:
                  e.target.value,
              })
            }
          />

          <button
            onClick={createFeed}
            disabled={saving}
            style={buttonStyle}
          >
            {saving
              ? "Saving..."
              : "Add Feed"}
          </button>
        </div>

        <div
          style={{
            marginTop: 32,
          }}
        >
          <h3>
            Connected Feeds
          </h3>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 16,
                marginTop: 16,
              }}
            >
              {feeds.map((feed) => (
                <div
                  key={feed.id}
                  style={{
                    border:
                      "1px solid #e5e7eb",

                    borderRadius: 12,

                    padding: 16,
                  }}
                >
                  <h4>
                    {
                      feed.providerName
                    }
                  </h4>

                  <p>
                    {feed.feedUrl}
                  </p>

                  <p>
                    Type:
                    {
                      feed.feedType
                    }
                  </p>

                  <p>
                    Properties:
                    {
                      feed.totalProperties
                    }
                  </p>

                  <p>
                    Frequency:
                    Every{" "}
                    {
                      feed.syncFrequencyMinutes
                    }{" "}
                    minutes
                  </p>

                  <p>
                    Sync:
                    {feed.syncEnabled
                      ? " Enabled"
                      : " Disabled"}
                  </p>

                  {feed.lastError && (
                    <p
                      style={{
                        color:
                          "red",
                      }}
                    >
                      {
                        feed.lastError
                      }
                    </p>
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      marginTop: 16,
                    }}
                  >
                    <button
                      onClick={() =>
                        syncFeed(
                          feed.id,
                        )
                      }
                      style={
                        buttonStyle
                      }
                    >
                      {syncingId ===
                      feed.id
                        ? "Syncing..."
                        : "Sync Now"}
                    </button>

                    <button
                      onClick={() =>
                        toggleSync(
                          feed,
                        )
                      }
                      style={
                        buttonStyle
                      }
                    >
                      {feed.syncEnabled
                        ? "Disable"
                        : "Enable"}
                    </button>

                    <button
                      onClick={() =>
                        deleteFeed(
                          feed.id,
                        )
                      }
                      style={
                        buttonStyle
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const buttonStyle = {
  padding: "10px 18px",
  borderRadius: 10,
  border: "none",
  cursor: "pointer",
};