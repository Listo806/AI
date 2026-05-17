import React, { useEffect, useState } from "react";
import apiClient from "../../api/apiClient";

export default function AppointmentIntegrationPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    provider: "google_calendar",

    bookingEnabled: true,

    propertyToursEnabled: true,

    autoAssignAgent: true,

    meetingDurationMinutes: 30,

    bufferMinutes: 15,

    timezone: "UTC",

    notificationEmail: "",
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await apiClient.request(
        "/integrations/appointment",
      );

      if (res) {
        setForm((prev) => ({
          ...prev,
          ...res,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    try {
      setSaving(true);

      await apiClient.request(
        "/integrations/appointment",
        {
          method: "POST",
          body: JSON.stringify(form),
        },
      );

      alert("Appointment settings saved");
    } catch (err) {
      console.error(err);

      alert("Failed to save appointment settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40 }}>Loading...</div>;
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
          background: "#fff",
          borderRadius: 20,
          padding: 30,
          border: "1px solid #e5e7eb",
        }}
      >
        <h1
          style={{
            fontSize: 34,
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          AI Appointment Booking
        </h1>

        <p
          style={{
            color: "#6b7280",
            marginBottom: 30,
          }}
        >
          Automatically schedule calls, meetings, and property tours with qualified leads.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
          }}
        >
          <div>
            <div style={label}>Calendar Provider</div>

            <select
              style={input}
              value={form.provider}
              onChange={(e) =>
                setForm({
                  ...form,
                  provider: e.target.value,
                })
              }
            >
              <option value="google_calendar">
                Google Calendar
              </option>

              <option value="outlook">
                Microsoft Outlook
              </option>

              <option value="caldav">
                CalDAV
              </option>
            </select>
          </div>

          <div>
            <div style={label}>Meeting Duration</div>

            <input
              type="number"
              style={input}
              value={form.meetingDurationMinutes}
              onChange={(e) =>
                setForm({
                  ...form,
                  meetingDurationMinutes: e.target.value,
                })
              }
            />
          </div>

          <div>
            <div style={label}>Buffer Between Meetings</div>

            <input
              type="number"
              style={input}
              value={form.bufferMinutes}
              onChange={(e) =>
                setForm({
                  ...form,
                  bufferMinutes: e.target.value,
                })
              }
            />
          </div>

          <div>
            <div style={label}>Timezone</div>

            <input
              style={input}
              value={form.timezone}
              onChange={(e) =>
                setForm({
                  ...form,
                  timezone: e.target.value,
                })
              }
            />
          </div>

          <div
            style={{
              gridColumn: "1 / -1",
            }}
          >
            <div style={label}>Notification Email</div>

            <input
              style={input}
              value={form.notificationEmail}
              onChange={(e) =>
                setForm({
                  ...form,
                  notificationEmail: e.target.value,
                })
              }
            />
          </div>

          <label style={checkboxRow}>
            <input
              type="checkbox"
              checked={form.bookingEnabled}
              onChange={() =>
                setForm({
                  ...form,
                  bookingEnabled: !form.bookingEnabled,
                })
              }
            />

            Enable appointment booking
          </label>

          <label style={checkboxRow}>
            <input
              type="checkbox"
              checked={form.propertyToursEnabled}
              onChange={() =>
                setForm({
                  ...form,
                  propertyToursEnabled:
                    !form.propertyToursEnabled,
                })
              }
            />

            Enable property tours
          </label>

          <label style={checkboxRow}>
            <input
              type="checkbox"
              checked={form.autoAssignAgent}
              onChange={() =>
                setForm({
                  ...form,
                  autoAssignAgent: !form.autoAssignAgent,
                })
              }
            />

            Auto assign available agent
          </label>
        </div>

        <button
          onClick={save}
          disabled={saving}
          style={{
            marginTop: 30,
            background: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "14px 20px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

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

const checkboxRow = {
  display: "flex",
  gap: 12,
  alignItems: "center",
};