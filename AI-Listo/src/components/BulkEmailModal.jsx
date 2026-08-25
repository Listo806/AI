import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Mail, X, Users, Check, AlertTriangle, Loader, Globe } from "lucide-react";
import {
  getBulkEmailTemplates,
  estimateBulkEmail,
  sendBulkEmail,
  getBulkCampaign,
  previewBulkTemplate,
} from "../api/platformApi";
import "./BulkEmailModal.css";

/**
 * Bulk email campaign modal. Opened from the Customers table when 1+ customers
 * are selected.
 *
 * Flow (client spec):
 *   Select customers → Select template → Select language → Preview full email →
 *   Review recipients → Send.
 *
 * Language is REQUIRED and the WHOLE campaign is sent in that one language — the
 * system never silently defaults to English. The preview shows exactly what will
 * be sent in the chosen language, and the final review restates template +
 * language + recipient count with one last full preview before sending.
 */

const LANGS = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "pt", label: "Portuguese" },
];
const langLabel = (code) => LANGS.find((l) => l.code === code)?.label || "—";

export default function BulkEmailModal({ recipients = [], onClose }) {
  const userIds = useMemo(
    () => Array.from(new Set(recipients.map((r) => r.id).filter(Boolean))),
    [recipients],
  );
  const firstId = userIds[0] || null;

  const [templates, setTemplates] = useState([]);
  const [template, setTemplate] = useState("");
  const [language, setLanguage] = useState(""); // "" until the admin chooses
  const [step, setStep] = useState("compose"); // compose | confirm | result
  const [estimate, setEstimate] = useState(null);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(null);
  const [failReasons, setFailReasons] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [preview, setPreview] = useState(null); // {subject, html, language}
  const [previewing, setPreviewing] = useState(false);
  const clientToken = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    getBulkEmailTemplates()
      .then((list) => {
        setTemplates(list);
        if (list.length) setTemplate(list[0].name);
      })
      .catch(() => setErr("Could not load templates."));
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const selectedTemplate = templates.find((t) => t.name === template);

  // Auto-build the full preview whenever the template OR language changes, so the
  // admin always sees exactly what will be sent in the chosen language. Works
  // with or without a sample recipient.
  useEffect(() => {
    if (!template || !language) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    setPreviewing(true);
    setErr(null);
    previewBulkTemplate({ template, language, userId: firstId })
      .then((res) => {
        if (cancelled) return;
        if (res?.ok) {
          setPreview({ subject: res.subject, html: res.html, language: res.language });
        } else {
          setErr(res?.error || "Could not build the preview.");
          setPreview(null);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setErr(e?.message || "Could not build the preview.");
        setPreview(null);
      })
      .finally(() => {
        if (!cancelled) setPreviewing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [template, language, firstId]);

  const goConfirm = useCallback(async () => {
    if (!template || !language || !userIds.length) return;
    setBusy(true);
    setErr(null);
    try {
      const est = await estimateBulkEmail({ template, userIds });
      if (!est?.ok) {
        setErr(est?.error || "Could not prepare the send.");
        return;
      }
      setEstimate(est);
      clientToken.current =
        (window.crypto?.randomUUID && window.crypto.randomUUID()) ||
        `bulk-${Date.now()}-${userIds.length}`;
      setStep("confirm");
    } catch (e) {
      setErr(e?.message || "Could not prepare the send.");
    } finally {
      setBusy(false);
    }
  }, [template, language, userIds]);

  const pollCampaign = useCallback((id) => {
    if (!id) return;
    if (pollRef.current) clearInterval(pollRef.current);
    const tick = async () => {
      try {
        const res = await getBulkCampaign(id);
        if (res?.ok && res.campaign) {
          setProgress(res.campaign.progress);
          if (Array.isArray(res.campaign.errors)) setFailReasons(res.campaign.errors);
          if (res.campaign.status === "completed" && pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }
      } catch {
        /* ignore poll errors */
      }
    };
    tick();
    pollRef.current = setInterval(tick, 4000);
  }, []);

  const confirmSend = useCallback(async () => {
    if (busy) return;
    if (!language) {
      setErr("Select the campaign language before sending.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await sendBulkEmail({
        template,
        userIds,
        language,
        clientToken: clientToken.current,
      });
      if (!res?.ok) {
        setErr(res?.error || "Could not start the campaign.");
        return;
      }
      setResult(res);
      setStep("result");
      pollCampaign(res.campaignId);
    } catch (e) {
      setErr(e?.message || "Could not start the campaign.");
    } finally {
      setBusy(false);
    }
  }, [busy, template, userIds, language, pollCampaign]);

  const PreviewBox = () =>
    previewing ? (
      <div className="bem-preview-box bem-preview-loading">
        <Loader size={15} className="bem-spin" /> Building preview…
      </div>
    ) : preview ? (
      <div className="bem-preview-box">
        <div className="bem-preview-meta">
          <span>Preview · {langLabel(preview.language)}</span>
          <span className="bem-preview-subj">{preview.subject}</span>
        </div>
        <iframe title="Email preview" className="bem-iframe" srcDoc={preview.html} />
      </div>
    ) : null;

  return (
    <div className="bem-ov" onClick={onClose}>
      <div className="bem-modal" role="dialog" aria-label="Send Bulk Email" onClick={(e) => e.stopPropagation()}>
        <button className="bem-x" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="bem-head">
          <div className="bem-badge">
            <Mail size={22} />
          </div>
          <div>
            <h3>Send Bulk Email</h3>
            <p>
              <Users size={13} /> {userIds.length} customer
              {userIds.length === 1 ? "" : "s"} selected
            </p>
          </div>
        </div>

        {/* STEP 1 — COMPOSE (template + language + preview) */}
        {step === "compose" && (
          <div className="bem-body">
            <label className="bem-label">Template</label>
            <select
              className="bem-select"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            >
              {templates.length === 0 && <option value="">Loading…</option>}
              {templates.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.label}
                </option>
              ))}
            </select>
            {selectedTemplate?.description && (
              <div className="bem-hint">{selectedTemplate.description}</div>
            )}

            <label className="bem-label bem-label-lang">
              <Globe size={13} /> Language <span className="bem-req">required</span>
            </label>
            <div className="bem-lang-group" role="group" aria-label="Campaign language">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  className={`bem-lang-btn ${language === l.code ? "bem-lang-on" : ""}`}
                  onClick={() => setLanguage(l.code)}
                >
                  {l.label}
                </button>
              ))}
            </div>
            {!language ? (
              <div className="bem-hint">
                Choose the language for this campaign. Every selected customer will
                receive this version.
              </div>
            ) : (
              <div className="bem-hint">
                All {userIds.length} customer{userIds.length === 1 ? "" : "s"} will
                receive the <b>{langLabel(language)}</b> version.
              </div>
            )}

            <PreviewBox />

            {err && <div className="bem-error">{err}</div>}

            <div className="bem-actions">
              <button className="bem-btn bem-btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button
                className="bem-btn bem-btn-primary"
                onClick={goConfirm}
                disabled={busy || !template || !language || !userIds.length || previewing}
              >
                {busy ? "Checking…" : "Review recipients"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — CONFIRM / FINAL REVIEW */}
        {step === "confirm" && estimate && (
          <div className="bem-body">
            <div className="bem-review-card">
              <div className="bem-review-row">
                <span>Template</span>
                <b>{selectedTemplate?.label || template}</b>
              </div>
              <div className="bem-review-row">
                <span>Language</span>
                <b className="bem-review-lang">{langLabel(language)}</b>
              </div>
              <div className="bem-review-row">
                <span>Recipients</span>
                <b>
                  {estimate.eligible} customer{estimate.eligible === 1 ? "" : "s"}
                </b>
              </div>
            </div>

            <div className="bem-stats">
              <div className="bem-stat">
                <span className="bem-stat-n">{estimate.eligible}</span>
                <span className="bem-stat-l">Will receive</span>
              </div>
              <div className="bem-stat bem-stat-warn">
                <span className="bem-stat-n">{estimate.suppressed}</span>
                <span className="bem-stat-l">Suppressed / unsubscribed</span>
              </div>
              <div className="bem-stat bem-stat-muted">
                <span className="bem-stat-n">{estimate.invalid}</span>
                <span className="bem-stat-l">Invalid / no email</span>
              </div>
            </div>

            {estimate.eligible === 0 ? (
              <div className="bem-error">
                <AlertTriangle size={14} /> No eligible recipients (all suppressed or invalid). Nothing to send.
              </div>
            ) : (
              <div className="bem-note">
                All {estimate.eligible} eligible customer{estimate.eligible === 1 ? "" : "s"} will
                receive the <b>{langLabel(language)}</b> version of{" "}
                <b>{selectedTemplate?.label || template}</b>. Suppressed and invalid
                addresses are skipped automatically. Review the full email once more below.
              </div>
            )}

            <div className="bem-review-preview-label">Final preview</div>
            <PreviewBox />

            {err && <div className="bem-error">{err}</div>}

            <div className="bem-actions">
              <button className="bem-btn bem-btn-ghost" onClick={() => setStep("compose")} disabled={busy}>
                Back
              </button>
              <button
                className="bem-btn bem-btn-primary"
                onClick={confirmSend}
                disabled={busy || estimate.eligible === 0}
              >
                {busy ? "Sending…" : `Send Bulk Email · ${langLabel(language)}`}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — RESULT */}
        {step === "result" && result && (
          <div className="bem-body">
            <div className="bem-success">
              <div className="bem-success-ico">
                <Check size={26} />
              </div>
              <div className="bem-success-title">
                {result.duplicate ? "Campaign already started" : "Bulk email started"}
              </div>
              <div className="bem-success-sub">
                {(selectedTemplate?.label || template)} · {langLabel(result.sendLanguage || language)}
              </div>
            </div>

            <div className="bem-result-grid">
              <div><span>Selected</span><b>{result.selected}</b></div>
              <div><span>Eligible</span><b>{result.eligible}</b></div>
              <div><span>Suppressed</span><b>{result.suppressed}</b></div>
              <div><span>Invalid</span><b>{result.invalid}</b></div>
              <div><span>Queued</span><b>{result.queued}</b></div>
            </div>

            <div className="bem-progress">
              {progress && progress.pending === 0 ? (
                <>
                  <Check size={13} />{" "}
                  {progress.failed
                    ? "Finished — some deliveries failed"
                    : "All emails sent"}
                </>
              ) : (
                <>
                  <Loader size={13} className="bem-spin" /> Sending in the
                  background…
                </>
              )}
              {progress && (
                <span className="bem-progress-counts">
                  Sent <b>{progress.sent}</b> · Pending <b>{progress.pending}</b>
                  {progress.failed ? <> · Failed <b>{progress.failed}</b></> : null}
                </span>
              )}
            </div>
            {failReasons.length > 0 && (
              <div
                className="bem-error"
                style={{ flexDirection: "column", alignItems: "flex-start" }}
              >
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  <AlertTriangle size={13} /> Delivery failures — reason:
                </div>
                {failReasons.map((f, i) => (
                  <div key={i} style={{ fontSize: 12 }}>
                    {f.reason} <b>({f.count})</b>
                  </div>
                ))}
              </div>
            )}
            <div className="bem-note">
              Queued means accepted for delivery — not every message is delivered instantly. Track delivery in the email log.
            </div>

            <div className="bem-actions">
              <button className="bem-btn bem-btn-primary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
