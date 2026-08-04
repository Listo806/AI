import React, {
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import apiClient from "../../api/apiClient";

export default function TiktokPage() {
  const { t } = useTranslation();

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [syncing, setSyncing] =
    useState(false);

  const [toast, setToast] =
    useState(null);

  const [form, setForm] = useState({
    appId: "",
    appSecret: "",
    accessToken: "",
    advertiserId: "",

    leadgenEnabled: true,
    autoSync: true,

    syncFrequencyMinutes: 60,
  });

  useEffect(() => {
    load();
  }, []);

  const showToast = (
    message,
    type = "success",
  ) => {
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

      const res =
        await apiClient.request(
          "/integrations/tiktok",
        );

      if (res) {
        setForm({
          ...form,
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
      if (!form.appId) {
        showToast(
          t("integrations.tiktok.appIdRequired"),
          "error",
        );

        return;
      }

      setSaving(true);

      await apiClient.request(
        "/integrations/tiktok",
        {
          method: "POST",

          body: JSON.stringify(form),
        },
      );

      showToast(
        t("integrations.tiktok.saved"),
      );
    } catch (err) {
      console.error(err);

      showToast(
        t("integrations.tiktok.saveError"),
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const syncNow = async () => {
    try {
      setSyncing(true);

      await apiClient.request(
        "/integrations/tiktok/sync",
        {
          method: "POST",
        },
      );

      showToast(
        t("integrations.tiktok.syncStarted"),
      );
    } catch (err) {
      console.error(err);

      showToast(
        t("integrations.tiktok.syncError"),
        "error",
      );
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <div>{t("integrations.tiktok.loading")}</div>;
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
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <div style={card}>
          <h1 style={title}>
            {t("integrations.tiktok.title")}
          </h1>

          <p style={desc}>
            {t("integrations.tiktok.subtitle")}
          </p>

          <div style={grid}>
            <div>
              <div style={label}>
                {t("integrations.tiktok.appId")}
              </div>

              <input
                style={input}
                value={form.appId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    appId:
                      e.target.value,
                  })
                }
              />
            </div>

            <div>
              <div style={label}>
                {t("integrations.tiktok.appSecret")}
              </div>

              <input
                type="password"
                style={input}
                value={form.appSecret}
                onChange={(e) =>
                  setForm({
                    ...form,
                    appSecret:
                      e.target.value,
                  })
                }
              />
            </div>

            <div
              style={{
                gridColumn:
                  "1 / -1",
              }}
            >
              <div style={label}>
                {t("integrations.tiktok.accessToken")}
              </div>

              <input
                style={input}
                value={
                  form.accessToken
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    accessToken:
                      e.target.value,
                  })
                }
              />
            </div>

            <div>
              <div style={label}>
                {t("integrations.tiktok.advertiserId")}
              </div>

              <input
                style={input}
                value={
                  form.advertiserId
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    advertiserId:
                      e.target.value,
                  })
                }
              />
            </div>

            <div>
              <div style={label}>
                {t("integrations.tiktok.syncFrequency")}
              </div>

              <input
                type="number"
                style={input}
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
            </div>

            <label style={checkbox}>
              <input
                type="checkbox"
                checked={
                  form.leadgenEnabled
                }
                onChange={() =>
                  setForm({
                    ...form,
                    leadgenEnabled:
                      !form.leadgenEnabled,
                  })
                }
              />

              <span>
                {t("integrations.tiktok.enableLeadSync")}
              </span>
            </label>

            <label style={checkbox}>
              <input
                type="checkbox"
                checked={
                  form.autoSync
                }
                onChange={() =>
                  setForm({
                    ...form,
                    autoSync:
                      !form.autoSync,
                  })
                }
              />

              <span>
                {t("integrations.tiktok.automaticSync")}
              </span>
            </label>
          </div>

          <div
            style={{
              display: "flex",
              gap: 14,
              marginTop: 30,
            }}
          >
            <button
              style={button}
              onClick={save}
            >
              {saving
                ? t("integrations.tiktok.saving")
                : t("integrations.tiktok.saveSettings")}
            </button>

            <button
              style={secondaryButton}
              onClick={syncNow}
            >
              {syncing
                ? t("integrations.tiktok.syncing")
                : t("integrations.tiktok.syncLeads")}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div style={toastStyle}>
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
};

const title = {
  fontSize: 34,
  fontWeight: 700,
};

const desc = {
  color: "#6b7280",
  marginTop: 10,
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
};

const input = {
  width: "100%",
  padding: 14,
  borderRadius: 12,
  border: "1px solid #d1d5db",
  boxSizing: "border-box",
};

const checkbox = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const button = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  padding: "14px 20px",
  borderRadius: 12,
  fontWeight: 700,
};

const secondaryButton = {
  ...button,
  background: "#111827",
};

const toastStyle = {
  position: "fixed",
  top: 30,
  right: 30,
  background: "#16a34a",
  color: "#fff",
  padding: "14px 18px",
  borderRadius: 14,
};