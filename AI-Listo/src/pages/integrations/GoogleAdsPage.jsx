import React, {
  useEffect,
  useState,
} from "react";

import apiClient from "../../api/apiClient";

export default function GoogleAdsPage() {
  const [loading, setLoading] =
    useState(true);

  const [config, setConfig] =
    useState(null);

  const [campaigns, setCampaigns] =
    useState([]);

  const [selectedCampaignIds, setSelectedCampaignIds] =
    useState([]);

  const [conversionTrackingEnabled, setConversionTrackingEnabled] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);

      const configRes =
        await apiClient.request(
          "/integrations/google-ads",
        );

      setConfig(configRes);

      if (configRes) {
        setSelectedCampaignIds(
          configRes.selected_campaign_ids ||
            [],
        );

        setConversionTrackingEnabled(
          configRes.conversion_tracking_enabled,
        );

        const campaignsRes =
          await apiClient.request(
            "/integrations/google-ads/campaigns",
          );

        setCampaigns(
          campaignsRes || [],
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const connectGoogleAds =
    async () => {
      const res =
        await apiClient.request(
          "/integrations/google-ads/connect",
        );

      window.location.href =
        res.url;
    };

  const toggleCampaign = (
    campaignId,
  ) => {
    if (
      selectedCampaignIds.includes(
        campaignId,
      )
    ) {
      setSelectedCampaignIds(
        selectedCampaignIds.filter(
          (id) =>
            id !== campaignId,
        ),
      );

      return;
    }

    setSelectedCampaignIds([
      ...selectedCampaignIds,
      campaignId,
    ]);
  };

  const save = async () => {
    try {
      setSaving(true);

      await apiClient.request(
        "/integrations/google-ads/settings",
        {
          method: "POST",

          body: JSON.stringify({
            selectedCampaignIds,
            conversionTrackingEnabled,
          }),
        },
      );

      alert(
        "Google Ads settings saved",
      );
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
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
          <h1 style={title}>
            Google Ads Integration
          </h1>

          <p style={desc}>
            Connect your Google Ads
            account and track campaign
            performance, CPL, ROAS,
            and conversions.
          </p>

          {!config ? (
            <button
              style={button}
              onClick={
                connectGoogleAds
              }
            >
              Connect Google Ads
            </button>
          ) : (
            <>
              <div
                style={infoBox}
              >
                <div>
                  <strong>
                    Connected Account:
                  </strong>{" "}
                  {
                    config.google_ads_account_id
                  }
                </div>
              </div>

              <div
                style={{
                  marginTop: 30,
                }}
              >
                <div style={label}>
                  Campaign Selection
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: 12,
                    marginTop: 16,
                  }}
                >
                  {campaigns.map(
                    (
                      campaign,
                    ) => (
                      <label
                        key={
                          campaign
                            .campaign
                            .id
                        }
                        style={
                          checkboxRow
                        }
                      >
                        <input
                          type="checkbox"
                          checked={selectedCampaignIds.includes(
                            campaign
                              .campaign
                              .id,
                          )}
                          onChange={() =>
                            toggleCampaign(
                              campaign
                                .campaign
                                .id,
                            )
                          }
                        />

                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                            }}
                          >
                            {
                              campaign
                                .campaign
                                .name
                            }
                          </div>

                          <div
                            style={{
                              fontSize: 13,
                              color:
                                "#6b7280",
                            }}
                          >
                            Status:{" "}
                            {
                              campaign
                                .campaign
                                .status
                            }
                          </div>
                        </div>
                      </label>
                    ),
                  )}
                </div>
              </div>

              <div
                style={{
                  marginTop: 30,
                }}
              >
                <label
                  style={
                    checkboxRow
                  }
                >
                  <input
                    type="checkbox"
                    checked={
                      conversionTrackingEnabled
                    }
                    onChange={() =>
                      setConversionTrackingEnabled(
                        !conversionTrackingEnabled,
                      )
                    }
                  />

                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                      }}
                    >
                      Enable Conversion
                      Tracking
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color:
                          "#6b7280",
                      }}
                    >
                      Track leads,
                      ROAS, CPL and
                      campaign
                      conversions.
                    </div>
                  </div>
                </label>
              </div>

              <button
                style={{
                  ...button,
                  marginTop: 30,
                }}
                onClick={save}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Settings"}
              </button>
            </>
          )}
        </div>

        <div
          style={{
            ...card,
            marginTop: 30,
          }}
        >
          <h2
            style={{
              fontSize: 24,
              marginBottom: 20,
            }}
          >
            Google Setup
          </h2>

          <ol
            style={{
              lineHeight: 2,
              color: "#4b5563",
            }}
          >
            <li>
              Create a Google Cloud
              Project
            </li>

            <li>
              Enable Google Ads API
            </li>

            <li>
              Configure OAuth
              consent screen
            </li>

            <li>
              Add redirect URI
            </li>

            <li>
              Generate OAuth
              credentials
            </li>

            <li>
              Request Google Ads
              Developer Token
            </li>
          </ol>
        </div>
      </div>
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
  marginBottom: 10,
};

const desc = {
  color: "#6b7280",
  lineHeight: 1.7,
};

const button = {
  marginTop: 30,
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "14px 20px",
  fontWeight: 700,
  cursor: "pointer",
};

const label = {
  fontWeight: 700,
  marginBottom: 10,
};

const checkboxRow = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: 16,
  border: "1px solid #e5e7eb",
  borderRadius: 14,
};

const infoBox = {
  marginTop: 30,
  padding: 18,
  borderRadius: 14,
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
};