import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Clock3,
  Globe2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import "./AppointmentRulesModal.css";

const DAYS = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
];

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Ho_Chi_Minh",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const DEFAULT_FORM = {
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  startTime: "09:00",
  endTime: "18:00",
  bookingDuration: 30,
  bufferBefore: 0,
  bufferAfter: 0,
  maxDailyBookings: 20,
  allowWeekends: false,
  autoConfirm: true,
  requireHumanApproval: false,
  reminderMinutes: 30,
  googleCalendarEnabled: false,
  outlookCalendarEnabled: false,
  intakeQuestions: [],
};

export default function AppointmentRulesModal({
  open,
  rules,
  loading,
  saving,
  error,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [question, setQuestion] = useState("");

  useEffect(() => {
    if (!open) return;

    setForm({
      ...DEFAULT_FORM,
      ...(rules || {}),
      workingDays: Array.isArray(rules?.workingDays)
        ? rules.workingDays
        : DEFAULT_FORM.workingDays,
      intakeQuestions: Array.isArray(rules?.intakeQuestions)
        ? rules.intakeQuestions
        : [],
    });

    setQuestion("");
  }, [open, rules]);

  const canSave = useMemo(() => {
    return (
      form.workingDays.length > 0 &&
      form.startTime &&
      form.endTime &&
      form.startTime < form.endTime &&
      Number(form.bookingDuration) >= 15 &&
      Number(form.maxDailyBookings) >= 1
    );
  }, [form]);

  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const toggleDay = (day) => {
    setForm((current) => {
      const exists = current.workingDays.includes(day);

      const workingDays = exists
        ? current.workingDays.filter((item) => item !== day)
        : [...current.workingDays, day];

      return {
        ...current,
        workingDays,
        allowWeekends:
          workingDays.includes("saturday") || workingDays.includes("sunday"),
      };
    });
  };

  const addQuestion = () => {
    const clean = String(question || "").trim();

    if (!clean) return;

    setForm((current) => ({
      ...current,
      intakeQuestions: Array.from(
        new Set([...(current.intakeQuestions || []), clean]),
      ).slice(0, 20),
    }));

    setQuestion("");
  };

  const removeQuestion = (index) => {
    setForm((current) => ({
      ...current,
      intakeQuestions: current.intakeQuestions.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    }));
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!canSave || saving) return;

    await onSave({
      timezone: form.timezone,
      workingDays: form.workingDays,
      startTime: form.startTime,
      endTime: form.endTime,
      bookingDuration: Number(form.bookingDuration),
      bufferBefore: Number(form.bufferBefore),
      bufferAfter: Number(form.bufferAfter),
      maxDailyBookings: Number(form.maxDailyBookings),
      allowWeekends: Boolean(form.allowWeekends),
      autoConfirm: Boolean(form.autoConfirm),
      requireHumanApproval: Boolean(form.requireHumanApproval),
      reminderMinutes: Number(form.reminderMinutes),
      googleCalendarEnabled: Boolean(form.googleCalendarEnabled),
      outlookCalendarEnabled: Boolean(form.outlookCalendarEnabled),
      intakeQuestions: form.intakeQuestions,
    });
  };

  if (!open) return null;

  return (
    <div className="cx-appointment-modal-backdrop" onMouseDown={onClose}>
      <div
        className="cx-appointment-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="cx-appointment-modal-head">
          <div>
            <span className="cx-appointment-modal-icon">
              <CalendarDays size={22} />
            </span>

            <div>
              <h2>Appointment Rules</h2>
              <p>Define when and how your AI Agent can book appointments.</p>
            </div>
          </div>

          <button type="button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        {loading ? (
          <div className="cx-appointment-loading">
            Loading appointment rules...
          </div>
        ) : (
          <form onSubmit={submit}>
            {error && <div className="cx-appointment-modal-error">{error}</div>}

            <section>
              <h3>Availability</h3>

              <div className="cx-appointment-form-grid">
                <label className="full">
                  Working days
                  <div className="cx-appointment-days">
                    {DAYS.map((day) => {
                      const active = form.workingDays.includes(day.key);

                      return (
                        <button
                          type="button"
                          key={day.key}
                          className={active ? "active" : ""}
                          onClick={() => toggleDay(day.key)}
                        >
                          {active && <Check size={14} />}
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </label>

                <label>
                  Start time
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(event) =>
                      update("startTime", event.target.value)
                    }
                  />
                </label>

                <label>
                  End time
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(event) => update("endTime", event.target.value)}
                  />
                </label>

                <label>
                  Timezone
                  <div className="cx-appointment-input-icon">
                    <Globe2 size={17} />
                    <select
                      value={form.timezone}
                      onChange={(event) =>
                        update("timezone", event.target.value)
                      }
                    >
                      {TIMEZONES.map((timezone) => (
                        <option key={timezone} value={timezone}>
                          {timezone}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>

                <label>
                  Maximum bookings per day
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={form.maxDailyBookings}
                    onChange={(event) =>
                      update("maxDailyBookings", event.target.value)
                    }
                  />
                </label>
              </div>
            </section>

            <section>
              <h3>Booking settings</h3>

              <div className="cx-appointment-form-grid three">
                <label>
                  Duration
                  <select
                    value={form.bookingDuration}
                    onChange={(event) =>
                      update("bookingDuration", event.target.value)
                    }
                  >
                    {[15, 30, 45, 60, 90, 120].map((value) => (
                      <option key={value} value={value}>
                        {value} minutes
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Buffer before
                  <select
                    value={form.bufferBefore}
                    onChange={(event) =>
                      update("bufferBefore", event.target.value)
                    }
                  >
                    {[0, 5, 10, 15, 30, 45, 60].map((value) => (
                      <option key={value} value={value}>
                        {value} minutes
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Buffer after
                  <select
                    value={form.bufferAfter}
                    onChange={(event) =>
                      update("bufferAfter", event.target.value)
                    }
                  >
                    {[0, 5, 10, 15, 30, 45, 60].map((value) => (
                      <option key={value} value={value}>
                        {value} minutes
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Reminder
                  <div className="cx-appointment-input-icon">
                    <Clock3 size={17} />
                    <select
                      value={form.reminderMinutes}
                      onChange={(event) =>
                        update("reminderMinutes", event.target.value)
                      }
                    >
                      {[0, 15, 30, 60, 120, 1440].map((value) => (
                        <option key={value} value={value}>
                          {value === 0
                            ? "No reminder"
                            : value === 1440
                              ? "1 day before"
                              : `${value} minutes before`}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
              </div>
            </section>

            <section>
              <h3>Approval & automation</h3>

              <div className="cx-appointment-toggle-list">
                <ToggleRow
                  title="Auto confirm appointments"
                  description="Confirm appointments immediately when a valid slot is available."
                  active={form.autoConfirm}
                  onToggle={() => update("autoConfirm", !form.autoConfirm)}
                />

                <ToggleRow
                  title="Require human approval"
                  description="Keep appointments pending until a team member approves them."
                  active={form.requireHumanApproval}
                  onToggle={() =>
                    update("requireHumanApproval", !form.requireHumanApproval)
                  }
                />

                <ToggleRow
                  title="Google Calendar"
                  description="Allow AI to use your connected Google Calendar."
                  active={form.googleCalendarEnabled}
                  onToggle={() =>
                    update("googleCalendarEnabled", !form.googleCalendarEnabled)
                  }
                />

                <ToggleRow
                  title="Outlook Calendar"
                  description="Allow AI to use your connected Outlook Calendar."
                  active={form.outlookCalendarEnabled}
                  onToggle={() =>
                    update(
                      "outlookCalendarEnabled",
                      !form.outlookCalendarEnabled,
                    )
                  }
                />
              </div>
            </section>

            <section>
              <h3>Lead intake questions</h3>

              <div className="cx-appointment-question-add">
                <input
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addQuestion();
                    }
                  }}
                  placeholder="Example: Which property would you like to view?"
                  maxLength={250}
                />

                <button type="button" onClick={addQuestion}>
                  <Plus size={16} />
                  Add
                </button>
              </div>

              <div className="cx-appointment-question-list">
                {form.intakeQuestions.length === 0 ? (
                  <p className="cx-appointment-empty">
                    No custom intake questions added.
                  </p>
                ) : (
                  form.intakeQuestions.map((item, index) => (
                    <div key={`${item}-${index}`}>
                      <span>{index + 1}</span>
                      <p>{item}</p>
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        aria-label="Remove question"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            <footer className="cx-appointment-modal-foot">
              <div>
                {canSave ? (
                  <span className="complete">
                    <Check size={16} />
                    Appointment rules are ready
                  </span>
                ) : (
                  <span>
                    Select working days and a valid availability range.
                  </span>
                )}
              </div>

              <button
                type="button"
                className="secondary"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary"
                disabled={!canSave || saving}
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Appointment Rules"}
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>
  );
}

function ToggleRow({ title, description, active, onToggle }) {
  return (
    <div className="cx-appointment-toggle-row">
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>

      <button
        type="button"
        className={`cx-switch ${active ? "on" : ""}`}
        onClick={onToggle}
      >
        <i />
      </button>
    </div>
  );
}
