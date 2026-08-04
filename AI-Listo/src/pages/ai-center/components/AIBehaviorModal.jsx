import React, { useEffect, useMemo, useState } from "react";
import { Bot, Check, MessageCircle, Plus, Save, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  const [form, setForm] = useState(DEFAULT_FORM);
  const [question, setQuestion] = useState("");
  const [forbiddenTopic, setForbiddenTopic] = useState("");

  useEffect(() => {
    if (!open) return;

    setForm({
      ...DEFAULT_FORM,
      greetingMessage: t(
        "aiCenter.behaviorModal.defaultGreeting",
        "Hi! I’m the AI assistant for our real estate team. How can I help you today?",
      ),
      fallbackMessage: t(
        "aiCenter.behaviorModal.defaultFallback",
        "I’m not fully certain about that. Let me connect you with a team member.",
      ),
      escalationMessage: t(
        "aiCenter.behaviorModal.defaultEscalation",
        "I’m bringing in a human agent who can help you further.",
      ),
      ...(behavior || {}),
      qualificationQuestions: Array.isArray(behavior?.qualificationQuestions)
        ? behavior.qualificationQuestions
        : [
            t(
              "aiCenter.behaviorModal.defaultQuestion1",
              "What type of property are you looking for?",
            ),
            t(
              "aiCenter.behaviorModal.defaultQuestion2",
              "What is your preferred location?",
            ),
            t(
              "aiCenter.behaviorModal.defaultQuestion3",
              "What is your budget range?",
            ),
          ],
      forbiddenTopics: Array.isArray(behavior?.forbiddenTopics)
        ? behavior.forbiddenTopics
        : [],
    });

    setQuestion("");
    setForbiddenTopic("");
  }, [open, behavior, t]);

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
              <h2>{t("aiCenter.behaviorModal.title", "AI Behavior")}</h2>
              <p>
                {t(
                  "aiCenter.behaviorModal.subtitle",
                  "Define how your AI Agent speaks, qualifies, and escalates.",
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t("aiCenter.behaviorModal.closeAria", "Close")}
          >
            <X size={20} />
          </button>
        </header>

        {loading ? (
          <div className="cx-behavior-loading">
            {t("aiCenter.behaviorModal.loading", "Loading AI behavior...")}
          </div>
        ) : (
          <form onSubmit={submit}>
            {error && <div className="cx-behavior-error">{error}</div>}

            <section>
              <h3>
                {t(
                  "aiCenter.behaviorModal.communicationStyle",
                  "Communication style",
                )}
              </h3>

              <div className="cx-behavior-grid">
                <label>
                  {t("aiCenter.behaviorModal.responseTone", "Response tone")}
                  <select
                    value={form.tone}
                    onChange={(event) => update("tone", event.target.value)}
                  >
                    <option value="professional">
                      {t(
                        "aiCenter.behaviorModal.toneProfessional",
                        "Professional & Friendly",
                      )}
                    </option>
                    <option value="friendly">
                      {t(
                        "aiCenter.behaviorModal.toneFriendly",
                        "Friendly & Conversational",
                      )}
                    </option>
                    <option value="sales">
                      {t("aiCenter.behaviorModal.toneSales", "Sales Focused")}
                    </option>
                  </select>
                </label>

                <label>
                  {t("aiCenter.behaviorModal.personality", "Personality")}
                  <select
                    value={form.personality}
                    onChange={(event) =>
                      update("personality", event.target.value)
                    }
                  >
                    <option value="helpful">
                      {t("aiCenter.behaviorModal.personalityHelpful", "Helpful")}
                    </option>
                    <option value="consultative">
                      {t(
                        "aiCenter.behaviorModal.personalityConsultative",
                        "Consultative",
                      )}
                    </option>
                    <option value="concise">
                      {t("aiCenter.behaviorModal.concise", "Concise")}
                    </option>
                    <option value="luxury">
                      {t("aiCenter.behaviorModal.personalityLuxury", "Luxury")}
                    </option>
                    <option value="investor_focused">
                      {t(
                        "aiCenter.behaviorModal.personalityInvestorFocused",
                        "Investor Focused",
                      )}
                    </option>
                  </select>
                </label>

                <label>
                  {t(
                    "aiCenter.behaviorModal.responseLength",
                    "Response length",
                  )}
                  <select
                    value={form.responseLength}
                    onChange={(event) =>
                      update("responseLength", event.target.value)
                    }
                  >
                    <option value="concise">
                      {t("aiCenter.behaviorModal.concise", "Concise")}
                    </option>
                    <option value="balanced">
                      {t("aiCenter.behaviorModal.lengthBalanced", "Balanced")}
                    </option>
                    <option value="detailed">
                      {t("aiCenter.behaviorModal.lengthDetailed", "Detailed")}
                    </option>
                  </select>
                </label>
              </div>
            </section>

            <section>
              <h3>{t("aiCenter.behaviorModal.coreMessages", "Core messages")}</h3>

              <div className="cx-behavior-grid">
                <label className="full">
                  {t(
                    "aiCenter.behaviorModal.greetingMessage",
                    "Greeting message",
                  )}
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
                  {t(
                    "aiCenter.behaviorModal.fallbackMessage",
                    "Fallback message",
                  )}
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
                  {t(
                    "aiCenter.behaviorModal.escalationMessage",
                    "Escalation message",
                  )}
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
              <h3>
                {t(
                  "aiCenter.behaviorModal.leadQualificationQuestions",
                  "Lead qualification questions",
                )}
              </h3>

              <ListEditor
                value={question}
                setValue={setQuestion}
                items={form.qualificationQuestions}
                placeholder={t(
                  "aiCenter.behaviorModal.questionPlaceholder",
                  "Example: When would you like to move?",
                )}
                onAdd={() =>
                  addListItem("qualificationQuestions", question, setQuestion)
                }
                onRemove={(index) =>
                  removeListItem("qualificationQuestions", index)
                }
              />
            </section>

            <section>
              <h3>
                {t("aiCenter.behaviorModal.restrictedTopics", "Restricted topics")}
              </h3>

              <ListEditor
                value={forbiddenTopic}
                setValue={setForbiddenTopic}
                items={form.forbiddenTopics}
                placeholder={t(
                  "aiCenter.behaviorModal.topicPlaceholder",
                  "Example: Legal advice",
                )}
                onAdd={() =>
                  addListItem(
                    "forbiddenTopics",
                    forbiddenTopic,
                    setForbiddenTopic,
                  )
                }
                onRemove={(index) => removeListItem("forbiddenTopics", index)}
                emptyLabel={t(
                  "aiCenter.behaviorModal.noRestrictedTopics",
                  "No restricted topics added.",
                )}
              />
            </section>

            <section>
              <h3>{t("aiCenter.behaviorModal.behaviorRules", "Behavior rules")}</h3>

              <div className="cx-behavior-toggle-list">
                <ToggleRow
                  title={t(
                    "aiCenter.behaviorModal.ruleAskOneTitle",
                    "Ask one question at a time",
                  )}
                  description={t(
                    "aiCenter.behaviorModal.ruleAskOneDesc",
                    "Keep conversations natural and easy to answer.",
                  )}
                  active={form.askOneQuestionAtATime}
                  onToggle={() =>
                    update("askOneQuestionAtATime", !form.askOneQuestionAtATime)
                  }
                />

                <ToggleRow
                  title={t(
                    "aiCenter.behaviorModal.ruleConfirmBookingTitle",
                    "Confirm before booking",
                  )}
                  description={t(
                    "aiCenter.behaviorModal.ruleConfirmBookingDesc",
                    "Ask the lead to confirm date and time before booking.",
                  )}
                  active={form.confirmBeforeBooking}
                  onToggle={() =>
                    update("confirmBeforeBooking", !form.confirmBeforeBooking)
                  }
                />

                <ToggleRow
                  title={t(
                    "aiCenter.behaviorModal.ruleMentionAiTitle",
                    "Mention AI identity",
                  )}
                  description={t(
                    "aiCenter.behaviorModal.ruleMentionAiDesc",
                    "Tell leads that they are speaking with an AI assistant.",
                  )}
                  active={form.mentionAiIdentity}
                  onToggle={() =>
                    update("mentionAiIdentity", !form.mentionAiIdentity)
                  }
                />

                <ToggleRow
                  title={t("aiCenter.behaviorModal.ruleUseEmojisTitle", "Use emojis")}
                  description={t(
                    "aiCenter.behaviorModal.ruleUseEmojisDesc",
                    "Allow light emoji usage in conversational replies.",
                  )}
                  active={form.useEmojis}
                  onToggle={() => update("useEmojis", !form.useEmojis)}
                />

                <ToggleRow
                  title={t(
                    "aiCenter.behaviorModal.ruleProactiveTitle",
                    "Proactive follow-up",
                  )}
                  description={t(
                    "aiCenter.behaviorModal.ruleProactiveDesc",
                    "Allow AI to suggest the next action and follow up.",
                  )}
                  active={form.proactiveFollowUp}
                  onToggle={() =>
                    update("proactiveFollowUp", !form.proactiveFollowUp)
                  }
                />

                <ToggleRow
                  title={t(
                    "aiCenter.behaviorModal.ruleAutoEscalateTitle",
                    "Auto escalate hot leads",
                  )}
                  description={t(
                    "aiCenter.behaviorModal.ruleAutoEscalateDesc",
                    "Escalate high-intent leads to a human agent.",
                  )}
                  active={form.autoEscalateHotLeads}
                  onToggle={() =>
                    update("autoEscalateHotLeads", !form.autoEscalateHotLeads)
                  }
                />
              </div>
            </section>

            <section>
              <h3>
                {t(
                  "aiCenter.behaviorModal.customInstructions",
                  "Custom instructions",
                )}
              </h3>

              <textarea
                className="cx-behavior-custom"
                rows={6}
                value={form.customInstructions}
                onChange={(event) =>
                  update("customInstructions", event.target.value)
                }
                placeholder={t(
                  "aiCenter.behaviorModal.customInstructionsPlaceholder",
                  "Add specific rules, brand language, escalation instructions, or other guidance...",
                )}
                maxLength={5000}
              />
            </section>

            <footer className="cx-behavior-modal-foot">
              <div>
                {canSave ? (
                  <span className="complete">
                    <Check size={16} />
                    {t("aiCenter.behaviorModal.ready", "AI behavior is ready")}
                  </span>
                ) : (
                  <span>
                    {t(
                      "aiCenter.behaviorModal.completePrompt",
                      "Complete the required behavior settings.",
                    )}
                  </span>
                )}
              </div>

              <button
                type="button"
                className="secondary"
                onClick={onClose}
                disabled={saving}
              >
                {t("aiCenter.behaviorModal.cancel", "Cancel")}
              </button>

              <button
                type="submit"
                className="primary"
                disabled={!canSave || saving}
              >
                <Save size={16} />
                {saving
                  ? t("aiCenter.behaviorModal.saving", "Saving...")
                  : t("aiCenter.behaviorModal.save", "Save AI Behavior")}
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
  emptyLabel,
}) {
  const { t } = useTranslation();

  const resolvedEmptyLabel =
    emptyLabel ?? t("aiCenter.behaviorModal.noItemsAdded", "No items added.");

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
          {t("aiCenter.behaviorModal.add", "Add")}
        </button>
      </div>

      <div className="cx-behavior-list">
        {items.length === 0 ? (
          <p className="cx-behavior-empty">{resolvedEmptyLabel}</p>
        ) : (
          items.map((item, index) => (
            <div key={`${item}-${index}`}>
              <span>{index + 1}</span>
              <p>{item}</p>
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={t(
                  "aiCenter.behaviorModal.removeItemAria",
                  "Remove item",
                )}
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
