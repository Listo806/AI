import React, {
  useEffect,
  useState,
} from "react";
import "./AppsIntegrationsHub.css";
import apiClient from "../../api/apiClient";

const availableTriggers = [
  "new_lead",
  "contact_updated",
  "appointment_booked",
  "deal_moved",
];

export default function MakePage() {
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
        /*
         * VALIDATION
         */
        if (!form.webhookUrl.trim()) {
          showToast(
            "Please enter your Make.com webhook URL",
            "error",
          );

          return;
        }

        /*
         * VALIDATE URL FORMAT
         */
        const isValidUrl =
          form.webhookUrl.startsWith(
            "https://hook.",
          );

        if (!isValidUrl) {
          showToast(
            "Invalid Make.com webhook URL",
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
          "Make.com integration saved successfully",
          "success",
        );
      } catch (err) {
        console.error(err);

        showToast(
          err.message ||
            "Failed to save integration",
          "error",
        );
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
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <div style={card}>
          <h1 style={title}>
            Make.com Integration
          </h1>

          <p style={desc}>
            Connect your CRM with
            Make.com automations
            using webhook triggers.
          </p>

          <div style={{ marginTop: 30 }}>
            <div style={label}>
              Make.com Webhook URL
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
              Trigger Events
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
                      {trigger}
                    </span>
                  </label>
                ),
              )}
            </div>
          </div>

          <button
              style={{
                ...button,
                oopacity: saving ? 0.7 : 1,
              }}
              onClick={save}
              disabled={saving}
            >
            {saving
              ? "Saving..."
              : "Save Integration"}
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
            Setup Instructions
          </h2>

          <ol
            style={{
              lineHeight: 2,
              color: "#4b5563",
            }}
          >
            <li>
              Login to Make.com
            </li>

            <li>
              Create a new Scenario
            </li>

            <li>
              Add a Custom Webhook
              module
            </li>

            <li>
              Copy the webhook URL
            </li>

            <li>
              Paste it into this
              page
            </li>

            <li>
              Select the events you
              want to trigger
            </li>

            <li>
              Save integration
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