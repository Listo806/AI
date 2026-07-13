import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ClipboardList,
  Home,
  MessageCircle,
  Save,
  Send,
  Sparkles,
  UserRoundCheck,
  Users,
  X,
  Zap,
} from "lucide-react";

import "./AutomationModal.css";

const DEFAULT_FORM = {
  autoReply: true,
  autoFollowUp: true,
  autoBookAppointment: true,
  autoAssignAgent: false,
  autoCreateTask: true,
  autoSendPropertyMatches: true,
  autoSendMarketReport: false,
  autoCollectContactInfo: true,
  autoCollectBudget: true,
  autoCollectTimeline: true,
  followUpAfterMinutes: 30,
  reminderAfterHours: 24,
  hotLeadScore: 80,
};

const AUTOMATIONS = [
  {
    key: "autoReply",
    title: "Auto Reply",
    description:
      "Automatically reply to new messages using your configured AI behavior.",
    icon: MessageCircle,
    accent: "green",
  },
  {
    key: "autoFollowUp",
    title: "Auto Follow-up",
    description:
      "Follow up with leads who have not responded within the selected delay.",
    icon: Send,
    accent: "blue",
  },
  {
    key: "autoBookAppointment",
    title: "Auto Book Appointments",
    description:
      "Allow the AI Agent to book valid appointment slots automatically.",
    icon: CalendarDays,
    accent: "orange",
  },
  {
    key: "autoAssignAgent",
    title: "Auto Assign Agent",
    description:
      "Assign qualified leads to an available team member automatically.",
    icon: UserRoundCheck,
    accent: "purple",
  },
  {
    key: "autoCreateTask",
    title: "Auto Create Tasks",
    description: "Create CRM tasks when follow-up or human action is required.",
    icon: ClipboardList,
    accent: "indigo",
  },
  {
    key: "autoSendPropertyMatches",
    title: "Send Property Matches",
    description:
      "Send matching properties based on lead preferences and imported catalog.",
    icon: Home,
    accent: "green",
  },
  {
    key: "autoSendMarketReport",
    title: "Send Market Reports",
    description:
      "Send market updates and summaries when relevant to the conversation.",
    icon: Sparkles,
    accent: "pink",
  },
  {
    key: "autoCollectContactInfo",
    title: "Collect Contact Information",
    description:
      "Ask for missing phone and email details during qualification.",
    icon: Users,
    accent: "blue",
  },
  {
    key: "autoCollectBudget",
    title: "Collect Budget",
    description: "Ask for the lead’s budget and save it to the CRM profile.",
    icon: Zap,
    accent: "orange",
  },
  {
    key: "autoCollectTimeline",
    title: "Collect Buying Timeline",
    description: "Ask when the lead plans to buy, sell, rent, or invest.",
    icon: CalendarDays,
    accent: "purple",
  },
];

export default function AutomationModal({
  open,
  automations,
  loading,
  saving,
  error,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => {
    if (!open) return;
    setForm({ ...DEFAULT_FORM, ...(automations || {}) });
  }, [open, automations]);

  const enabledCount = useMemo(
    () =>
      AUTOMATIONS.reduce(
        (total, item) => total + (Boolean(form[item.key]) ? 1 : 0),
        0,
      ),
    [form],
  );

  const canSave = useMemo(
    () =>
      enabledCount > 0 &&
      Number(form.followUpAfterMinutes) >= 5 &&
      Number(form.reminderAfterHours) >= 1 &&
      Number(form.hotLeadScore) >= 1 &&
      Number(form.hotLeadScore) <= 100,
    [
      enabledCount,
      form.followUpAfterMinutes,
      form.hotLeadScore,
      form.reminderAfterHours,
    ],
  );

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!canSave || saving) return;

    await onSave({
      autoReply: Boolean(form.autoReply),
      autoFollowUp: Boolean(form.autoFollowUp),
      autoBookAppointment: Boolean(form.autoBookAppointment),
      autoAssignAgent: Boolean(form.autoAssignAgent),
      autoCreateTask: Boolean(form.autoCreateTask),
      autoSendPropertyMatches: Boolean(form.autoSendPropertyMatches),
      autoSendMarketReport: Boolean(form.autoSendMarketReport),
      autoCollectContactInfo: Boolean(form.autoCollectContactInfo),
      autoCollectBudget: Boolean(form.autoCollectBudget),
      autoCollectTimeline: Boolean(form.autoCollectTimeline),
      followUpAfterMinutes: Number(form.followUpAfterMinutes),
      reminderAfterHours: Number(form.reminderAfterHours),
      hotLeadScore: Number(form.hotLeadScore),
    });
  };

  if (!open) return null;

  return (
    <div className="cx-automation-modal-backdrop" onMouseDown={onClose}>
      <div
        className="cx-automation-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="cx-automation-modal-head">
          <div>
            <span className="cx-automation-modal-icon">
              <Zap size={22} />
            </span>
            <div>
              <h2>Automations</h2>
              <p>
                Choose which actions your AI Agent can perform automatically.
              </p>
            </div>
          </div>

          <button type="button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        {loading ? (
          <div className="cx-automation-loading">Loading automations...</div>
        ) : (
          <form onSubmit={submit}>
            {error && <div className="cx-automation-error">{error}</div>}

            <section>
              <div className="cx-automation-section-head">
                <div>
                  <h3>AI Actions</h3>
                  <p>
                    {enabledCount} of {AUTOMATIONS.length} automations enabled
                  </p>
                </div>

                <span>
                  <Zap size={15} />
                  {enabledCount} active
                </span>
              </div>

              <div className="cx-automation-list">
                {AUTOMATIONS.map((item) => {
                  const Icon = item.icon;
                  const active = Boolean(form[item.key]);

                  return (
                    <div
                      className={`cx-automation-row ${active ? "active" : ""}`}
                      key={item.key}
                    >
                      <div className={`cx-automation-row-icon ${item.accent}`}>
                        <Icon size={19} />
                      </div>

                      <div className="cx-automation-row-copy">
                        <strong>{item.title}</strong>
                        <p>{item.description}</p>
                      </div>

                      <button
                        type="button"
                        className={`cx-switch ${active ? "on" : ""}`}
                        onClick={() => update(item.key, !active)}
                        aria-pressed={active}
                      >
                        <i />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <h3>Timing & qualification</h3>

              <div className="cx-automation-settings-grid">
                <label>
                  Follow-up delay
                  <select
                    value={form.followUpAfterMinutes}
                    onChange={(event) =>
                      update("followUpAfterMinutes", event.target.value)
                    }
                  >
                    {[5, 10, 15, 30, 60, 120, 360, 720, 1440].map((value) => (
                      <option key={value} value={value}>
                        {value < 60
                          ? `${value} minutes`
                          : value === 60
                            ? "1 hour"
                            : value < 1440
                              ? `${value / 60} hours`
                              : "1 day"}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Reminder delay
                  <select
                    value={form.reminderAfterHours}
                    onChange={(event) =>
                      update("reminderAfterHours", event.target.value)
                    }
                  >
                    {[1, 2, 4, 8, 12, 24, 48, 72, 168].map((value) => (
                      <option key={value} value={value}>
                        {value < 24
                          ? `${value} hours`
                          : value === 24
                            ? "1 day"
                            : value < 168
                              ? `${value / 24} days`
                              : "1 week"}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Hot lead score
                  <div className="cx-automation-score-input">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={form.hotLeadScore}
                      onChange={(event) =>
                        update("hotLeadScore", event.target.value)
                      }
                    />
                    <span>/ 100</span>
                  </div>
                </label>
              </div>
            </section>

            <div className="cx-automation-note">
              <Check size={17} />
              <div>
                <strong>Human controls remain available</strong>
                <p>
                  Team members can pause AI, take over a conversation, or
                  disable individual automations at any time.
                </p>
              </div>
            </div>

            <footer className="cx-automation-modal-foot">
              <div>
                {canSave ? (
                  <span className="complete">
                    <Check size={16} />
                    Automation settings are ready
                  </span>
                ) : (
                  <span>
                    Enable at least one automation and check the limits.
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
                {saving ? "Saving..." : "Save Automations"}
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>
  );
}
