import React, {
  useEffect,
  useState,
} from "react";

import { useTranslation } from "react-i18next";

import apiClient from "../../api/apiClient";

export default function GoogleAdsPage() {
  const { t } = useTranslation();

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
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [campaignError, setCampaignError] = useState("");

  const connected = Boolean(config?.google_ads_account_id && config?.has_refresh_token !== false && config?.connected !== false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      setCampaignError("");
      setCampaigns([]);

      const configRes =
        await apiClient.request(
          "/integrations/google-ads",
        );

      const account = configRes?.google_ads_account_id && configRes?.has_refresh_token !== false && configRes?.connected !== false;
      setConfig(account ? configRes : null);

      if (account) {
        setSelectedCampaignIds(
          typeof configRes.selected_campaign_ids === "string"
            ? JSON.parse(
                configRes.selected_campaign_ids,
              )
            : configRes.selected_campaign_ids || [],
        );

        setConversionTrackingEnabled(
          configRes.conversion_tracking_enabled,
        );

        try {
          const campaignsRes = await apiClient.request("/integrations/google-ads/campaigns");
          setCampaigns(Array.isArray(campaignsRes) ? campaignsRes : []);
        } catch (campaignErr) {
          setCampaignError(campaignErr?.message || t("integrations.googleAds.campaignLoadFailed"));
        }
      }
    } catch (err) {
      console.error(err);
      setConfig(null);
      setError(err?.message || t("integrations.googleAds.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const connectGoogleAds = async () => {
    try {
      setConnecting(true);
      setError("");
      const res = await apiClient.request("/integrations/google-ads/connect");
      if (!res?.url || !/^https:\/\//i.test(res.url)) {
        throw new Error(t("integrations.googleAds.missingAuthorizationUrl"));
      }
      window.location.assign(res.url);
    } catch (err) {
      setError(err?.message || t("integrations.googleAds.connectFailed"));
      setConnecting(false);
    }
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

      alert(t("integrations.googleAds.settingsSaved"));
    } catch (err) {
      console.error(err);
      setError(err?.message || t("integrations.googleAds.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>{t("integrations.googleAds.loading")}</div>;
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
            {t("integrations.googleAds.title")}
          </h1>

          <p style={desc}>
            {t("integrations.googleAds.description")}
          </p>

          {error && <div role="alert" style={errorBox}>{error}</div>}

          {!connected ? (
            <button
              style={button}
              onClick={connectGoogleAds}
              disabled={connecting}
            >
              {connecting ? t("integrations.googleAds.connecting") : t("integrations.googleAds.connect")}
            </button>
          ) : (
            <>
              <div
                style={infoBox}
              >
                <div>
                  <strong>
                    {t("integrations.googleAds.connectedAccountLabel")}
                  </strong>{" "}
                  {config.google_ads_account_name ? `${config.google_ads_account_name} · ` : ""}{config.google_ads_account_id}
                </div>
              </div>
              <button type="button" style={{...button, marginTop: 14, background: "#334155"}} onClick={connectGoogleAds} disabled={connecting}>
                {connecting ? t("integrations.googleAds.connecting") : t("integrations.googleAds.reconnect")}
              </button>
              <p style={{fontSize: 13, color: "#64748b"}}>{t("integrations.googleAds.reconnectHelp")}</p>
              {campaignError && <div role="alert" style={errorBox}>{campaignError}</div>}

              <div
                style={{
                  marginTop: 30,
                }}
              >
                <div style={label}>
                  {t("integrations.googleAds.campaignSelection")}
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
                            {t(
                              "integrations.googleAds.campaignStatus",
                              {
                                status:
                                  campaign
                                    .campaign
                                    .status,
                              },
                            )}
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
                      {t("integrations.googleAds.enableConversionTracking")}
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color:
                          "#6b7280",
                      }}
                    >
                      {t("integrations.googleAds.conversionTrackingDesc")}
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
                  ? t("integrations.googleAds.saving")
                  : t("integrations.googleAds.saveSettings")}
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
            {t("integrations.googleAds.setupTitle")}
          </h2>

          <ol
            style={{
              lineHeight: 2,
              color: "#4b5563",
            }}
          >
            <li>
              {t("integrations.googleAds.setupStep1")}
            </li>

            <li>
              {t("integrations.googleAds.setupStep2")}
            </li>

            <li>
              {t("integrations.googleAds.setupStep3")}
            </li>

            <li>
              {t("integrations.googleAds.setupStep4")}
            </li>

            <li>
              {t("integrations.googleAds.setupStep5")}
            </li>

            <li>
              {t("integrations.googleAds.setupStep6")}
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
const errorBox = { marginTop: 18, padding: 14, borderRadius: 10, color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca" };
