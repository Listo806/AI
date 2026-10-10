import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, XCircle, RefreshCw, Landmark } from 'lucide-react';
import apiClient from '../../api/apiClient';

const endpoint = '/admin/marketplace/bank-transfers';
const money = (cents, currency = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(Number(cents || 0) / 100);
const date = (value) => value ? new Date(value).toLocaleString() : '—';
const styles = {
  page: { padding: '24px', maxWidth: 1320, margin: '0 auto', color: 'var(--text-primary, #132342)' },
  panel: { background: 'var(--card-bg, #fff)', border: '1px solid #dbe3f0', borderRadius: 12, padding: 18 },
  input: { width: '100%', minHeight: 40, border: '1px solid #cbd5e1', borderRadius: 8, padding: 10, background: 'transparent', color: 'inherit' },
  button: { padding: '9px 13px', borderRadius: 8, border: '1px solid #cbd5e1', cursor: 'pointer', background: 'transparent', color: 'inherit' },
};
const asRows = (res) => Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res) ? res : [];
export default function MarketplaceBankTransferApprovals() {
  const [status, setStatus] = useState('pending_review');
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [reviewing, setReviewing] = useState(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try { setRows(asRows(await apiClient.request(`${endpoint}${status ? `?status=${encodeURIComponent(status)}` : ''}`))); }
    catch (err) { setError(err?.message || 'Unable to load bank transfers.'); }
    finally { setBusy(false); }
  }, [status]);
  useEffect(() => { load(); }, [load]);
  async function review(approve) {
    if (!reviewing || !note.trim()) { setError('A review note is required.'); return; }
    if (!window.confirm(`${approve ? 'Approve' : 'Reject'} this transfer? Only approve after verifying the funds in the bank account.`)) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await apiClient.request(`${endpoint}/${encodeURIComponent(reviewing.id)}/review`, { method: 'POST', body: JSON.stringify({ approve, note: note.trim() }) });
      setMessage(`Transfer ${approve ? 'approved' : 'rejected'} successfully.`);
      setReviewing(null); setNote(''); await load();
    } catch (err) { setError(err?.message || 'Review failed. Please refresh and check whether it was already processed.'); }
    finally { setBusy(false); }
  }
  return <div style={styles.page}>
    <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
      <div><h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Bank Transfer Approvals</h1><p style={{ color: '#64748b', margin: '6px 0 0' }}>ListoQasa Marketplace · Verify funds independently before approving.</p></div>
      <button style={styles.button} onClick={load} disabled={busy}><RefreshCw size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Refresh</button>
    </header>
    {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}{message && <p role="status" style={{ color: '#15803d' }}>{message}</p>}
    <div style={{ ...styles.panel, marginBottom: 18, display: 'flex', gap: 12, alignItems: 'center' }}><Landmark size={20} /><label htmlFor="bank-status">Status</label><select id="bank-status" style={{ ...styles.input, width: 200 }} value={status} onChange={e => setStatus(e.target.value)}><option value="pending_review">Pending review</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="">All / History</option></select></div>
    <div style={{ ...styles.panel, overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 930, textAlign: 'left', fontSize: 14 }}><thead><tr>{['Submitted','Customer','Plan','Amount','Bank reference','Status','Reviewed by / At','Actions'].map(h => <th key={h} style={{ padding: '12px 10px', borderBottom: '1px solid #dbe3f0' }}>{h}</th>)}</tr></thead><tbody>{rows.map(r => <tr key={r.id}>{[
      date(r.created_at), r.customer_email || r.user_id, r.plan_key, money(r.price_cents, r.currency), r.transaction_reference || r.bank_transaction_reference || r.transfer_reference || '—', r.status, r.reviewed_by ? `${r.reviewed_by} · ${date(r.reviewed_at)}` : '—'
    ].map((v, i) => <td key={i} style={{ padding: '12px 10px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top', overflowWrap: 'anywhere' }}>{v}</td>)}<td style={{ padding: 10, borderBottom: '1px solid #e2e8f0' }}>{r.status === 'pending_review' ? <button style={styles.button} onClick={() => { setReviewing(r); setNote(''); setError(''); }}>Review</button> : <span title={r.review_note || ''}>{r.review_note || 'Reviewed'}</span>}</td></tr>)}{!busy && rows.length === 0 && <tr><td colSpan={8} style={{ padding: 28, textAlign: 'center', color: '#64748b' }}>No transfers found for this status.</td></tr>}</tbody></table>{busy && <p role="status">Loading…</p>}</div>
    {reviewing && <div role="dialog" aria-modal="true" aria-label="Review bank transfer" style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#0008', display: 'grid', placeItems: 'center', padding: 16 }}><div style={{ ...styles.panel, width: 'min(100%, 520px)', boxShadow: '0 18px 50px #0003' }}><h2 style={{ marginTop: 0 }}>Review bank transfer</h2><p><strong>{reviewing.customer_email}</strong> · {reviewing.plan_key} · {money(reviewing.price_cents, reviewing.currency)}</p><p>Bank reference: {reviewing.transaction_reference || reviewing.bank_transaction_reference || reviewing.transfer_reference || '—'}</p><p style={{ color: '#b45309' }}>Approve only after checking the funds received in your verified bank account.</p><label htmlFor="bank-review-note">Review notes (required)</label><textarea id="bank-review-note" style={{ ...styles.input, minHeight: 100, marginTop: 8 }} value={note} maxLength={1000} onChange={e => setNote(e.target.value)} /><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}><button style={{ ...styles.button, background: '#16a34a', color: '#fff' }} disabled={busy || !note.trim()} onClick={() => review(true)}><CheckCircle2 size={16} style={{ verticalAlign: 'middle' }} /> Approve</button><button style={{ ...styles.button, background: '#dc2626', color: '#fff' }} disabled={busy || !note.trim()} onClick={() => review(false)}><XCircle size={16} style={{ verticalAlign: 'middle' }} /> Reject</button><button style={styles.button} disabled={busy} onClick={() => setReviewing(null)}>Cancel</button></div></div></div>}
  </div>;
}
