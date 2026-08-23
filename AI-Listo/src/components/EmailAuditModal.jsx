import { useState, useCallback } from "react";
import { X, BarChart3, AlertTriangle } from "lucide-react";
import { getEmailAudit } from "../api/platformApi";
import "./EmailAuditModal.css";

/**
 * Admin "Email Send Audit" — runs a full breakdown of everything sent on a given
 * day against the live email log: totals, auto/manual/bulk split, per-template
 * counts, per-recipient distribution, the heaviest recipients, and how many
 * EXISTING customers received more than one email that day (the backfill signal).
 * Read-only; nothing is sent or changed.
 */
export default function EmailAuditModal({ onClose }) {
  const [date, setDate] = useState("2026-08-20");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [data, setData] = useState(null);

  const run = useCallback(async () => {
    setBusy(true);
    setErr(null);
    setData(null);
    try {
      const res = await getEmailAudit(date);
      if (!res?.ok) {
        setErr(res?.error || "Could not run the audit.");
        return;
      }
      setData(res);
    } catch (e) {
      setErr(e?.message || "Could not run the audit.");
    } finally {
      setBusy(false);
    }
  }, [date]);

  const t = data?.totals;

  return (
    <div className="eaud-ov" onClick={onClose}>
      <div className="eaud-modal" role="dialog" aria-label="Email Send Audit" onClick={(e) => e.stopPropagation()}>
        <button className="eaud-x" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
        <div className="eaud-head">
          <div className="eaud-badge">
            <BarChart3 size={22} />
          </div>
          <div>
            <h3>Email Send Audit</h3>
            <p>Everything Cortexa sent on one day — auto, manual and bulk.</p>
          </div>
        </div>

        <div className="eaud-controls">
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <button className="eaud-btn eaud-btn-primary" onClick={run} disabled={busy}>
            {busy ? "Running…" : "Run audit"}
          </button>
        </div>

        {err && <div className="eaud-error">{err}</div>}

        {data && (
          <div className="eaud-results">
            <div className="eaud-stats">
              <div className="eaud-stat"><b>{t.total}</b><span>Total emails</span></div>
              <div className="eaud-stat"><b>{t.recipients}</b><span>Unique recipients</span></div>
              <div className="eaud-stat"><b>{data.maxPerRecipient}</b><span>Max to one person</span></div>
              <div className="eaud-stat"><b>{t.auto}</b><span>Auto</span></div>
              <div className="eaud-stat"><b>{t.bulk}</b><span>Bulk</span></div>
              <div className="eaud-stat"><b>{t.manual}</b><span>Manual</span></div>
            </div>

            <div
              className={`eaud-verdict ${data.oldCustomersWithMultiple > 0 ? "warn" : "ok"}`}
            >
              {data.oldCustomersWithMultiple > 0 ? (
                <>
                  <AlertTriangle size={15} />{" "}
                  <b>{data.oldCustomersWithMultiple}</b> existing customer(s)
                  (registered before this day) received more than one email that day.
                </>
              ) : (
                <>No pre-existing customer received more than one email that day.</>
              )}
            </div>

            <div className="eaud-section-title">Recipients by email count</div>
            <div className="eaud-dist">
              {Object.entries(data.distribution).map(([k, v]) => (
                <div className="eaud-dist-row" key={k}>
                  <span>{k} email{k === "1" ? "" : "s"}</span>
                  <b>{v}</b>
                </div>
              ))}
            </div>

            <div className="eaud-section-title">Heaviest recipients</div>
            <div className="eaud-list">
              {data.topRecipients.map((r, i) => (
                <div className="eaud-row" key={i}>
                  <span className="eaud-email">{r.email}</span>
                  <b>{r.n}</b>
                </div>
              ))}
            </div>

            <div className="eaud-section-title">Templates sent</div>
            <div className="eaud-list">
              {data.perTemplate.map((r, i) => (
                <div className="eaud-row" key={i}>
                  <span className={`eaud-type eaud-${r.send_type}`}>{r.send_type}</span>
                  <span className="eaud-email">{r.template}</span>
                  <b>{r.n}</b>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
