import React, { useEffect, useState } from "react";
import { Link2, Copy, Check } from "lucide-react";
import { fetchNuveiConfig, nuveiCreateLinkToPay } from "../../api/nuveiApi";

// Admin: generate a Nuvei "Link to Pay" for a custom Web Solutions quotation.
// No fixed prices — the admin enters the approved amount and we return a payment
// link to send the customer. The verified callback marks it paid.

export default function NuveiLinkToPay() {
  const [enabled, setEnabled] = useState(null);
  const [form, setForm] = useState({
    amount: "",
    customerName: "",
    customerEmail: "",
    description: "",
    reference: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchNuveiConfig().then((c) => setEnabled(!!c?.enabled));
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    const amount = Number(form.amount);
    if (!(amount > 0)) return setError("Enter a valid amount.");
    if (!/^\S+@\S+\.\S+$/.test(form.customerEmail)) return setError("Enter a valid customer email.");
    setBusy(true);
    try {
      const res = await nuveiCreateLinkToPay({
        amount,
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        description: form.description.trim(),
        reference: form.reference.trim() || undefined,
      });
      setResult(res);
    } catch (err) {
      setError(err?.message || "Could not create the payment link.");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(result.payUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div style={S.page}>
      <div style={S.head}>
        <Link2 size={20} />
        <h1 style={S.h1}>Web Solutions — Link to Pay</h1>
      </div>
      <p style={S.sub}>
        Enter an approved custom amount and generate a Nuvei payment link to send the customer.
        These one-time payments are kept separate from Cortexa subscriptions.
      </p>

      {enabled === false && (
        <div style={S.warn}>
          Nuvei is not enabled yet. Set <code>NUVEI_ENABLED=true</code> and the server credentials
          to create live payment links.
        </div>
      )}

      <form style={S.card} onSubmit={submit}>
        <div style={S.row}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Amount (USD)</label>
            <input
              style={S.input}
              inputMode="decimal"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Quotation reference (optional)</label>
            <input
              style={S.input}
              placeholder="e.g. WS-2026-014"
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
            />
          </div>
        </div>

        <label style={S.label}>Customer name</label>
        <input
          style={S.input}
          value={form.customerName}
          onChange={(e) => setForm({ ...form, customerName: e.target.value })}
        />

        <label style={S.label}>Customer email</label>
        <input
          style={S.input}
          type="email"
          value={form.customerEmail}
          onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
        />

        <label style={S.label}>Service description</label>
        <textarea
          style={{ ...S.input, minHeight: 72, resize: "vertical" }}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        {error && <div style={S.error}>{error}</div>}

        <button style={S.btn} type="submit" disabled={busy || enabled === false}>
          {busy ? "Generating…" : "Generate payment link"}
        </button>
      </form>

      {result?.payUrl && (
        <div style={S.result}>
          <div style={S.resultLabel}>Payment link (reference {result.reference})</div>
          <div style={S.linkRow}>
            <a href={result.payUrl} target="_blank" rel="noreferrer" style={S.link}>{result.payUrl}</a>
            <button style={S.copyBtn} onClick={copyLink} type="button">
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  page: { maxWidth: 720, margin: "0 auto", padding: 24 },
  head: { display: "flex", alignItems: "center", gap: 10, color: "#111827" },
  h1: { fontSize: 22, fontWeight: 800, margin: 0 },
  sub: { color: "#6b7280", fontSize: 14, margin: "6px 0 20px", lineHeight: 1.5 },
  warn: { background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", fontSize: 13, padding: "10px 12px", borderRadius: 10, marginBottom: 16 },
  card: { background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 6px 24px rgba(0,0,0,.05)" },
  row: { display: "flex", gap: 12, flexWrap: "wrap" },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", margin: "12px 0 6px" },
  input: { width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 10, fontSize: 14, outline: "none" },
  error: { background: "#fef2f2", color: "#b91c1c", fontSize: 13, padding: "10px 12px", borderRadius: 10, margin: "12px 0" },
  btn: { marginTop: 18, padding: "11px 18px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" },
  result: { marginTop: 20, background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 12, padding: 16 },
  resultLabel: { fontSize: 12, fontWeight: 700, color: "#065f46", marginBottom: 8 },
  linkRow: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  link: { color: "#047857", fontSize: 13, wordBreak: "break-all", flex: 1 },
  copyBtn: { display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "#fff", border: "1px solid #a7f3d0", borderRadius: 8, color: "#065f46", fontSize: 13, cursor: "pointer" },
};
