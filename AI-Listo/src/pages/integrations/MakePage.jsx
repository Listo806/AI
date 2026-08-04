import React, {
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import "./AppsIntegrationsHub.css";
import apiClient from "../../api/apiClient";

const availableTriggers = [
  "new_lead",
  "contact_updated",
  "appointment_booked",
  "deal_moved",
];

const triggerLabelKeys = {
  new_lead: "integrations.make.triggerNewLead",
  contact_updated: "integrations.make.triggerContactUpdated",
  appointment_booked: "integrations.make.triggerAppointmentBooked",
  deal_moved: "integrations.make.triggerDealMoved",
};

export default function MakePage() {
  const { t } = useTranslation();

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [form, setForm] =
    useState({
      webhookUrl: "",
      triggers: [],
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
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);

      const res =
        await apiClient.request(
          "/integrations/make",
        );

      if (res) {
        setForm({
          webhookUrl:
            res.webhook_url || "",

          triggers:
            typeof res.triggers ===
            "string"
              ? JSON.parse(
                  res.triggers,
                )
              : res.triggers || [],
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTrigger = (
    trigger,
  ) => {
    if (
      form.triggers.includes(
        trigger,
      )
    ) {
      setForm({
        ...form,
        triggers:
          form.triggers.filter(
            (t) => t !== trigger,
          ),
      });

      return;
    }

    setForm({
      ...form,
      triggers: [
        ...form.triggers,
        trigger,
      ],
    });
  };

  const save = async () => {
      try {

        if (!form.webhookUrl.trim()) {
          showToast(
            t("integrations.make.enterWebhookUrl"),
            "error",
          );

          return;
        }

        const isValidUrl =
          form.webhookUrl.startsWith(
            "https://hook.",
          );

        if (!isValidUrl) {
          showToast(
            t("integrations.make.invalidWebhookUrl"),
            "error",
          );

          return;
        }

        setSaving(true);

        await apiClient.request(
          "/integrations/make",
          {
            method: "POST",

            body: JSON.stringify(
              form,
            ),
          },
        );

        showToast(
          t("integrations.make.saveSuccess"),
          "success",
        );
      } catch (err) {
        console.error(err);

        showToast(
          err.message ||
            t("integrations.make.saveFailed"),
          "error",
        );
      } finally {
        setSaving(false);
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
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <div style={card}>
          <h1 style={title}>
            {t("integrations.make.title")}
          </h1>

          <p style={desc}>
            {t("integrations.make.description")}
          </p>

          <div style={{ marginTop: 30 }}>
            <div style={label}>
              {t("integrations.make.webhookUrlLabel")}
            </div>

            <input
              style={input}
              placeholder="https://hook.us1.make.com/xxxxx"
              value={
                form.webhookUrl
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  webhookUrl:
                    e.target.value,
                })
              }
            />
          </div>

          <div
            style={{
              marginTop: 30,
            }}
          >
            <div style={label}>
              {t("integrations.make.triggerEvents")}
            </div>

            <div
              style={{
                display: "grid",
                gap: 12,
                marginTop: 14,
              }}
            >
              {availableTriggers.map(
                (trigger) => (
                  <label
                    key={trigger}
                    style={
                      checkboxRow
                    }
                  >
                    <input
                      type="checkbox"
                      checked={form.triggers.includes(
                        trigger,
                      )}
                      onChange={() =>
                        toggleTrigger(
                          trigger,
                        )
                      }
                    />

                    <span>
                      {t(triggerLabelKeys[trigger])}
                    </span>
                  </label>
                ),
              )}
            </div>
          </div>

          <button
              style={{
                ...button,
                opacity: saving ? 0.7 : 1,
              }}
              onClick={save}
              disabled={saving}
            >
            {saving
              ? t("integrations.make.saving")
              : t("integrations.make.saveIntegration")}
          </button>
        </div>

        <div
          style={{
            ...card,
            marginTop: 30,
          }}
        >
          <h2
            style={{
              fontSize: 22,
              marginBottom: 20,
            }}
          >
            {t("integrations.make.setupInstructions")}
          </h2>

          <ol
            style={{
              lineHeight: 2,
              color: "#4b5563",
            }}
          >
            <li>
              {t("integrations.make.step1")}
            </li>

            <li>
              {t("integrations.make.step2")}
            </li>

            <li>
              {t("integrations.make.step3")}
            </li>

            <li>
              {t("integrations.make.step4")}
            </li>

            <li>
              {t("integrations.make.step5")}
            </li>

            <li>
              {t("integrations.make.step6")}
            </li>

            <li>
              {t("integrations.make.step7")}
            </li>
          </ol>
        </div>
      </div>
      {toast && (
          <div
            style={{
              position: "fixed",
              top: 30,
              right: 30,
              background:
                toast.type === "success"
                  ? "#16a34a"
                  : "#dc2626",
              color: "#fff",
              padding: "14px 18px",
              borderRadius: 14,
              fontWeight: 600,
              boxShadow:
                "0 10px 30px rgba(0,0,0,0.15)",
              zIndex: 9999,
              minWidth: 280,
              animation:
                "slideIn 0.25s ease",
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
  marginBottom: 10,
};

const desc = {
  color: "#6b7280",
  lineHeight: 1.7,
};

const label = {
  fontSize: 14,
  fontWeight: 700,
  marginBottom: 8,
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
  padding: 14,
  border: "1px solid #e5e7eb",
  borderRadius: 12,
};

const button = {
  marginTop: 30,
  background: "#7c3aed",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "14px 20px",
  fontWeight: 700,
  cursor: "pointer",
};