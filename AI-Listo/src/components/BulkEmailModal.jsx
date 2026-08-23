import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Mail, X, Users, Eye, Check, AlertTriangle, Loader } from "lucide-react";
import {
  getBulkEmailTemplates,
  estimateBulkEmail,
  sendBulkEmail,
  getBulkCampaign,
  previewCustomerTemplateEmail,
} from "../api/platformApi";
import "./BulkEmailModal.css";

/**
 * Bulk email campaign modal. Opened from the Customers table when 1+ customers
 * are selected. Flow: compose (pick template) → confirm (eligible / suppressed /
 * invalid + EN/ES/PT breakdown) → result (queued summary + live progress). Sends
 * through the existing Cortexa/SendGrid engine per-recipient (own language),
 * suppression-aware, logged, idempotent. Never uses BCC or the local mail app.
 */
export default function BulkEmailModal({ recipients = [], onClose }) {
  const userIds = useMemo(
    () => Array.from(new Set(recipients.map((r) => r.id).filter(Boolean))),
    [recipients],
  );
  const firstId = userIds[0] || null;

  const [templates, setTemplates] = useState([]);
  const [template, setTemplate] = useState("");
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

  const doPreview = useCallback(async () => {
    if (!firstId || !template) return;
    setPreviewing(true);
    setErr(null);
    try {
      const res = await previewCustomerTemplateEmail(firstId, template);
      if (res?.ok) {
        setPreview({ subject: res.subject, html: res.html, language: res.language });
      } else {
        setErr(res?.error || "Could not build the preview.");
      }
    } catch (e) {
      setErr(e?.message || "Could not build the preview.");
    } finally {
      setPreviewing(false);
    }
  }, [firstId, template]);

  const goConfirm = useCallback(async () => {
    if (!template || !userIds.length) return;
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
  }, [template, userIds]);

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
    setBusy(true);
    setErr(null);
    try {
      const res = await sendBulkEmail({
        template,
        userIds,
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
  }, [busy, template, userIds, pollCampaign]);

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

        {/* STEP 1 — COMPOSE */}
        {step === "compose" && (
          <div className="bem-body">
            <label className="bem-label">Template</label>
            <select
              className="bem-select"
              value={template}
              onChange={(e) => {
                setTemplate(e.target.value);
                setPreview(null);
              }}
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

            <div className="bem-kv">
              <span>Subject</span>
              <b>Automatic — from the template</b>
              <span>Language</span>
              <b>Automatic — each customer's own language (EN / ES / PT)</b>
            </div>

            <button className="bem-btn bem-btn-ghost bem-preview" onClick={doPreview} disabled={previewing || !firstId}>
              <Eye size={15} /> {previewing ? "Building preview…" : "Preview email"}
            </button>

            {preview && (
              <div className="bem-preview-box">
                <div className="bem-preview-meta">
                  <span>Preview ({String(preview.language || "en").toUpperCase()})</span>
                  <span className="bem-preview-subj">{preview.subject}</span>
                </div>
                <iframe title="Email preview" className="bem-iframe" srcDoc={preview.html} />
              </div>
            )}

            {err && <div className="bem-error">{err}</div>}

            <div className="bem-actions">
              <button className="bem-btn bem-btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button className="bem-btn bem-btn-primary" onClick={goConfirm} disabled={busy || !template || !userIds.length}>
                {busy ? "Checking…" : `Send to ${userIds.length} customer${userIds.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — CONFIRM */}
        {step === "confirm" && estimate && (
          <div className="bem-body">
            <div className="bem-confirm-title">
              You are about to send <b>{selectedTemplate?.label || template}</b>
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

            <div className="bem-langs">
              <span className="bem-langs-title">Languages</span>
              <span>English: <b>{estimate.languages.en}</b></span>
              <span>Spanish: <b>{estimate.languages.es}</b></span>
              <span>Portuguese: <b>{estimate.languages.pt}</b></span>
            </div>

            {estimate.eligible === 0 ? (
              <div className="bem-error">
                <AlertTriangle size={14} /> No eligible recipients (all suppressed or invalid). Nothing to send.
              </div>
            ) : (
              <div className="bem-note">
                Each customer gets an individual email in their own language. Suppressed and invalid addresses are skipped automatically.
              </div>
            )}

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
                {busy ? "Sending…" : `Confirm & Send to ${estimate.eligible}`}
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
                {selectedTemplate?.label || template}
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
              <Loader size={13} className="bem-spin" /> Sending in the background…
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
