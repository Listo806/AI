import { useEffect, useState } from "react";
import { setupApi } from "./setupApi";
import { useSetup } from "./useSetup";
import "./setup.css";

export default function SetupAssistance() {
  const { data } = useSetup();

  const [form, setForm] = useState({
    assistanceType: "AI Agent Setup Assistance",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!data) return;

    setForm((current) => ({
      ...current,
      workspace: data.workspace_id || "",
      mainConversionGoal: data.selected_objective || "",
    }));
  }, [data]);

  if (!data) {
    return <main className="setup-shell">Loading…</main>;
  }

  const fields = [
    "businessName",
    "contactName",
    "contactEmail",
    "phoneOrWhatsApp",
    "websiteUrl",
    "servicesOrProducts",
    "businessHours",
    "mainConversionGoal",
    "existingWhatsAppNumber",
    "businessPhone",
    "marketingTrafficPages",
    "preferredEntryPoint",
    "additionalInstructions",
  ];

  const updateField = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const fieldLabel = (key) =>
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (char) => char.toUpperCase());

  const submit = async () => {
    try {
      setMessage("");

      const result = await setupApi.assist(form);

      if (result.duplicate) {
        setMessage(
          `Existing request ${result.request.request_code} is still open.`
        );
        return;
      }

      setMessage(
        `Request ${result.request.request_code} submitted successfully.`
      );
    } catch (error) {
      setMessage(error?.message || "Unable to submit assistance request.");
    }
  };

  return (
    <main className="setup-shell">
      <div className="setup-head">
        <div>
          <h1>Setup &amp; Website Assistance</h1>
          <p className="setup-muted">
            Request optional implementation help from the Cortexa team.
          </p>
        </div>
      </div>

      {data.assistanceRequest && (
        <div className="setup-card setup-assist-status">
          <b>{data.assistanceRequest.request_code}</b>
          {" — "}
          {data.assistanceRequest.status}

          {data.assistanceRequest.latest_response && (
            <p>{data.assistanceRequest.latest_response}</p>
          )}
        </div>
      )}

      <div className="setup-card">
        <div className="setup-objectives">
          {[
            "AI Agent Setup Assistance",
            "Website & Connection Assistance",
          ].map((type) => (
            <button
              type="button"
              className={`setup-choice ${
                form.assistanceType === type ? "active" : ""
              }`}
              onClick={() => updateField("assistanceType", type)}
              key={type}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="setup-form">
          {fields.map((key) => (
            <label
              className={`setup-field ${
                key === "additionalInstructions" ? "full" : ""
              }`}
              key={key}
            >
              <span>{fieldLabel(key)}</span>

              {key === "additionalInstructions" ? (
                <textarea
                  rows={4}
                  value={form[key] || ""}
                  onChange={(event) =>
                    updateField(key, event.target.value)
                  }
                />
              ) : (
                <input
                  value={form[key] || ""}
                  onChange={(event) =>
                    updateField(key, event.target.value)
                  }
                />
              )}
            </label>
          ))}

          <label className="setup-field">
            <span>Desired action</span>
            <select
              value={form.desiredAction || ""}
              onChange={(event) =>
                updateField("desiredAction", event.target.value)
              }
            >
              <option value="">Select</option>
              {[
                "Purchase",
                "Appointment",
                "Quote",
                "Viewing",
                "Demo",
                "Support",
              ].map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="setup-notice">
          <b>
            Custom setup and website implementation are optional paid services
            quoted separately based on your requirements.
          </b>
        </p>

        <div className="setup-actions">
          <button type="button" className="setup-btn" onClick={submit}>
            Request Assistance
          </button>
        </div>

        {message && <p>{message}</p>}
      </div>
    </main>
  );
}
