import React, { useEffect, useMemo, useState } from "react";
import { Bot, Check, MessageCircle, Plus, Save, Trash2, X } from "lucide-react";
import "./AIBehaviorModal.css";

const DEFAULT_FORM = {
  tone: "professional",
  personality: "helpful",
  responseLength: "balanced",
  greetingMessage:
    "Hi! I’m the AI assistant for our real estate team. How can I help you today?",
  fallbackMessage:
    "I’m not fully certain about that. Let me connect you with a team member.",
  escalationMessage: "I’m bringing in a human agent who can help you further.",
  qualificationQuestions: [
    "What type of property are you looking for?",
    "What is your preferred location?",
    "What is your budget range?",
  ],
  forbiddenTopics: [],
  customInstructions: "",
  askOneQuestionAtATime: true,
  confirmBeforeBooking: true,
  mentionAiIdentity: false,
  useEmojis: false,
  proactiveFollowUp: true,
  autoEscalateHotLeads: true,
};

export default function AIBehaviorModal({
  open,
  behavior,
  loading,
  saving,
  error,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [question, setQuestion] = useState("");
  const [forbiddenTopic, setForbiddenTopic] = useState("");

  useEffect(() => {
    if (!open) return;

    setForm({
      ...DEFAULT_FORM,
      ...(behavior || {}),
      qualificationQuestions: Array.isArray(behavior?.qualificationQuestions)
        ? behavior.qualificationQuestions
        : DEFAULT_FORM.qualificationQuestions,
      forbiddenTopics: Array.isArray(behavior?.forbiddenTopics)
        ? behavior.forbiddenTopics
        : [],
    });

    setQuestion("");
    setForbiddenTopic("");
  }, [open, behavior]);

  const canSave = useMemo(
    () =>
      Boolean(
        form.tone &&
        form.personality &&
        form.responseLength &&
        form.greetingMessage.trim(),
      ),
    [form.greetingMessage, form.personality, form.responseLength, form.tone],
  );

  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const addListItem = (key, value, clear) => {
    const clean = String(value || "").trim();
    if (!clean) return;

    setForm((current) => ({
      ...current,
      [key]: Array.from(new Set([...(current[key] || []), clean])).slice(0, 30),
    }));

    clear("");
  };

  const removeListItem = (key, index) => {
    setForm((current) => ({
      ...current,
      [key]: current[key].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!canSave || saving) return;

    await onSave({
      tone: form.tone,
      personality: form.personality,
      responseLength: form.responseLength,
      greetingMessage: form.greetingMessage.trim(),
      fallbackMessage: form.fallbackMessage.trim(),
      escalationMessage: form.escalationMessage.trim(),
      qualificationQuestions: form.qualificationQuestions,
      forbiddenTopics: form.forbiddenTopics,
      customInstructions: form.customInstructions.trim(),
      askOneQuestionAtATime: Boolean(form.askOneQuestionAtATime),
      confirmBeforeBooking: Boolean(form.confirmBeforeBooking),
      mentionAiIdentity: Boolean(form.mentionAiIdentity),
      useEmojis: Boolean(form.useEmojis),
      proactiveFollowUp: Boolean(form.proactiveFollowUp),
      autoEscalateHotLeads: Boolean(form.autoEscalateHotLeads),
    });
  };

  if (!open) return null;

  return (
    <div className="cx-behavior-modal-backdrop" onMouseDown={onClose}>
      <div
        className="cx-behavior-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="cx-behavior-modal-head">
          <div>
            <span className="cx-behavior-modal-icon">
              <Bot size={22} />
            </span>
            <div>
              <h2>AI Behavior</h2>
              <p>Define how your AI Agent speaks, qualifies, and escalates.</p>
            </div>
          </div>

          <button type="button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        {loading ? (
          <div className="cx-behavior-loading">Loading AI behavior...</div>
        ) : (
          <form onSubmit={submit}>
            {error && <div className="cx-behavior-error">{error}</div>}

            <section>
              <h3>Communication style</h3>

              <div className="cx-behavior-grid">
                <label>
                  Response tone
                  <select
                    value={form.tone}
                    onChange={(event) => update("tone", event.target.value)}
                  >
                    <option value="professional">
                      Professional & Friendly
                    </option>
                    <option value="friendly">Friendly & Conversational</option>
                    <option value="sales">Sales Focused</option>
                  </select>
                </label>

                <label>
                  Personality
                  <select
                    value={form.personality}
                    onChange={(event) =>
                      update("personality", event.target.value)
                    }
                  >
                    <option value="helpful">Helpful</option>
                    <option value="consultative">Consultative</option>
                    <option value="concise">Concise</option>
                    <option value="luxury">Luxury</option>
                    <option value="investor_focused">Investor Focused</option>
                  </select>
                </label>

                <label>
                  Response length
                  <select
                    value={form.responseLength}
                    onChange={(event) =>
                      update("responseLength", event.target.value)
                    }
                  >
                    <option value="concise">Concise</option>
                    <option value="balanced">Balanced</option>
                    <option value="detailed">Detailed</option>
                  </select>
                </label>
              </div>
            </section>

            <section>
              <h3>Core messages</h3>

              <div className="cx-behavior-grid">
                <label className="full">
                  Greeting message
                  <textarea
                    rows={3}
                    value={form.greetingMessage}
                    onChange={(event) =>
                      update("greetingMessage", event.target.value)
                    }
                    maxLength={1000}
                  />
                </label>

                <label className="full">
                  Fallback message
                  <textarea
                    rows={3}
                    value={form.fallbackMessage}
                    onChange={(event) =>
                      update("fallbackMessage", event.target.value)
                    }
                    maxLength={1000}
                  />
                </label>

                <label className="full">
                  Escalation message
                  <textarea
                    rows={3}
                    value={form.escalationMessage}
                    onChange={(event) =>
                      update("escalationMessage", event.target.value)
                    }
                    maxLength={1000}
                  />
                </label>
              </div>
            </section>

            <section>
              <h3>Lead qualification questions</h3>

              <ListEditor
                value={question}
                setValue={setQuestion}
                items={form.qualificationQuestions}
                placeholder="Example: When would you like to move?"
                onAdd={() =>
                  addListItem("qualificationQuestions", question, setQuestion)
                }
                onRemove={(index) =>
                  removeListItem("qualificationQuestions", index)
                }
              />
            </section>

            <section>
              <h3>Restricted topics</h3>

              <ListEditor
                value={forbiddenTopic}
                setValue={setForbiddenTopic}
                items={form.forbiddenTopics}
                placeholder="Example: Legal advice"
                onAdd={() =>
                  addListItem(
                    "forbiddenTopics",
                    forbiddenTopic,
                    setForbiddenTopic,
                  )
                }
                onRemove={(index) => removeListItem("forbiddenTopics", index)}
                emptyLabel="No restricted topics added."
              />
            </section>

            <section>
              <h3>Behavior rules</h3>

              <div className="cx-behavior-toggle-list">
                <ToggleRow
                  title="Ask one question at a time"
                  description="Keep conversations natural and easy to answer."
                  active={form.askOneQuestionAtATime}
                  onToggle={() =>
                    update("askOneQuestionAtATime", !form.askOneQuestionAtATime)
                  }
                />

                <ToggleRow
                  title="Confirm before booking"
                  description="Ask the lead to confirm date and time before booking."
                  active={form.confirmBeforeBooking}
                  onToggle={() =>
                    update("confirmBeforeBooking", !form.confirmBeforeBooking)
                  }
                />

                <ToggleRow
                  title="Mention AI identity"
                  description="Tell leads that they are speaking with an AI assistant."
                  active={form.mentionAiIdentity}
                  onToggle={() =>
                    update("mentionAiIdentity", !form.mentionAiIdentity)
                  }
                />

                <ToggleRow
                  title="Use emojis"
                  description="Allow light emoji usage in conversational replies."
                  active={form.useEmojis}
                  onToggle={() => update("useEmojis", !form.useEmojis)}
                />

                <ToggleRow
                  title="Proactive follow-up"
                  description="Allow AI to suggest the next action and follow up."
                  active={form.proactiveFollowUp}
                  onToggle={() =>
                    update("proactiveFollowUp", !form.proactiveFollowUp)
                  }
                />

                <ToggleRow
                  title="Auto escalate hot leads"
                  description="Escalate high-intent leads to a human agent."
                  active={form.autoEscalateHotLeads}
                  onToggle={() =>
                    update("autoEscalateHotLeads", !form.autoEscalateHotLeads)
                  }
                />
              </div>
            </section>

            <section>
              <h3>Custom instructions</h3>

              <textarea
                className="cx-behavior-custom"
                rows={6}
                value={form.customInstructions}
                onChange={(event) =>
                  update("customInstructions", event.target.value)
                }
                placeholder="Add specific rules, brand language, escalation instructions, or other guidance..."
                maxLength={5000}
              />
            </section>

            <footer className="cx-behavior-modal-foot">
              <div>
                {canSave ? (
                  <span className="complete">
                    <Check size={16} />
                    AI behavior is ready
                  </span>
                ) : (
                  <span>Complete the required behavior settings.</span>
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
                {saving ? "Saving..." : "Save AI Behavior"}
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>
  );
}

function ListEditor({
  value,
  setValue,
  items,
  placeholder,
  onAdd,
  onRemove,
  emptyLabel = "No items added.",
}) {
  return (
    <>
      <div className="cx-behavior-list-add">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onAdd();
            }
          }}
          placeholder={placeholder}
          maxLength={250}
        />

        <button type="button" onClick={onAdd}>
          <Plus size={16} />
          Add
        </button>
      </div>

      <div className="cx-behavior-list">
        {items.length === 0 ? (
          <p className="cx-behavior-empty">{emptyLabel}</p>
        ) : (
          items.map((item, index) => (
            <div key={`${item}-${index}`}>
              <span>{index + 1}</span>
              <p>{item}</p>
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label="Remove item"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function ToggleRow({ title, description, active, onToggle }) {
  return (
    <div className="cx-behavior-toggle-row">
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
