import { useState } from "react";
import EmailComposer from "./EmailComposer";
import { sendDirectAdminEmail } from "../api/platformApi";
import "./BulkEmailModal.css";
import "./DirectEmailModal.css";

export default function DirectEmailModal({ onClose }) {
  const [to, setTo] = useState("");
  const [content, setContent] = useState({ subject: "", html: "", valid: false });
  const [language, setLanguage] = useState("en");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const validAddress = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim());
  const send = async () => {
    if (!validAddress || !content.valid || sending || sent) return;
    if (!window.confirm(`Send this email to ${to.trim()}?`)) return;
    setSending(true); setError("");
    try {
      const result = await sendDirectAdminEmail({ to: to.trim(), subject: content.subject, html: content.html, language });
      if (result?.ok === false || result?.sent === false) throw new Error(result?.error || result?.reason || "Email was not sent");
      setSent(true);
    } catch (e) { setError(e?.message || "Unable to send email."); }
    finally { setSending(false); }
  };
  return (
    <div className="dem-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !sending) onClose(); }}>
      <section className="dem-dialog" role="dialog" aria-modal="true" aria-labelledby="dem-title">
        <header className="dem-header">
          <div><h2 id="dem-title">Send Email</h2><p>Send a custom email to any address. No customer account is required or created.</p></div>
          <button className="dem-close" type="button" onClick={onClose} disabled={sending} aria-label="Close dialog">×</button>
        </header>
        <div className="dem-scroll">
          <div className="dem-fields">
            <label className="dem-field">Recipient email
              <input type="email" autoComplete="off" placeholder="person@example.com" value={to} onChange={e => setTo(e.target.value)} />
            </label>
            <label className="dem-field dem-language">Language
              <select value={language} onChange={e => setLanguage(e.target.value)}><option value="en">English</option><option value="es">Spanish</option><option value="pt">Portuguese</option></select>
            </label>
          </div>
          <div className="dem-composer"><EmailComposer onChange={setContent} /></div>
          {error && <p className="dem-error" role="alert">{error}</p>}
          {sent && <p className="dem-success" role="status">Email sent successfully to {to.trim()}.</p>}
        </div>
        <footer className="dem-footer">
          <button className="dem-cancel" type="button" onClick={onClose} disabled={sending}>{sent ? "Done" : "Close"}</button>
          <button className="dem-send" type="button" disabled={!validAddress || !content.valid || sending || sent} onClick={send}>{sending ? "Sending…" : sent ? "Sent" : "Send Email"}</button>
        </footer>
      </section>
    </div>
  );
}
