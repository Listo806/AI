import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, XCircle, RefreshCw, Landmark } from 'lucide-react';
import apiClient from '../../api/apiClient';
import { useTheme } from '../../theme/ThemeProvider';
import { useTranslation } from 'react-i18next';

const copy = {
  "en": {
    "title": "Bank Transfer Approvals",
    "subtitle": "ListoQasa Marketplace · Verify funds independently before approving.",
    "refresh": "Refresh",
    "status": "Status",
    "pending": "Pending review",
    "approved": "Approved",
    "rejected": "Rejected",
    "history": "All / History",
    "submitted": "Submitted",
    "customer": "Customer",
    "plan": "Plan",
    "amount": "Amount",
    "reference": "Bank reference",
    "reviewer": "Reviewed by / At",
    "actions": "Actions",
    "review": "Review",
    "reviewed": "Reviewed",
    "empty": "No transfers found for this status.",
    "loading": "Loading…",
    "reviewTitle": "Review bank transfer",
    "warning": "Approve only after checking the funds received in your verified bank account.",
    "notes": "Review notes (required)",
    "approve": "Approve",
    "reject": "Reject",
    "cancel": "Cancel",
    "noteRequired": "A review note is required.",
    "confirmApprove": "Approve this transfer? Only approve after verifying the funds in the bank account.",
    "confirmReject": "Reject this transfer? Only approve after verifying the funds in the bank account.",
    "successApprove": "Transfer approved successfully.",
    "successReject": "Transfer rejected successfully.",
    "loadError": "Unable to load bank transfers.",
    "reviewError": "Review failed. Please refresh and check whether it was already processed.",
    "bankReference": "Bank reference:"
  },
  "es": {
    "title": "Aprobaciones de transferencias bancarias",
    "subtitle": "Marketplace de ListoQasa · Verifique los fondos de forma independiente antes de aprobar.",
    "refresh": "Actualizar",
    "status": "Estado",
    "pending": "Pendiente de revisión",
    "approved": "Aprobado",
    "rejected": "Rechazado",
    "history": "Todos / Historial",
    "submitted": "Enviado",
    "customer": "Cliente",
    "plan": "Plan",
    "amount": "Importe",
    "reference": "Referencia bancaria",
    "reviewer": "Revisado por / Fecha",
    "actions": "Acciones",
    "review": "Revisar",
    "reviewed": "Revisado",
    "empty": "No se encontraron transferencias con este estado.",
    "loading": "Cargando…",
    "reviewTitle": "Revisar transferencia bancaria",
    "warning": "Apruebe únicamente después de verificar que los fondos llegaron a la cuenta bancaria confirmada.",
    "notes": "Notas de revisión (obligatorias)",
    "approve": "Aprobar",
    "reject": "Rechazar",
    "cancel": "Cancelar",
    "noteRequired": "Es obligatorio ingresar una nota de revisión.",
    "confirmApprove": "¿Aprobar esta transferencia? Confirme primero la recepción de los fondos.",
    "confirmReject": "¿Rechazar esta transferencia? Verifique la información antes de continuar.",
    "successApprove": "Transferencia aprobada correctamente.",
    "successReject": "Transferencia rechazada correctamente.",
    "loadError": "No se pudieron cargar las transferencias.",
    "reviewError": "No se pudo completar la revisión. Actualice y compruebe si ya se procesó.",
    "bankReference": "Referencia bancaria:"
  },
  "pt": {
    "title": "Aprovações de transferências bancárias",
    "subtitle": "Marketplace ListoQasa · Confirme os fundos de forma independente antes de aprovar.",
    "refresh": "Atualizar",
    "status": "Status",
    "pending": "Pendente de análise",
    "approved": "Aprovado",
    "rejected": "Rejeitado",
    "history": "Todos / Histórico",
    "submitted": "Enviado",
    "customer": "Cliente",
    "plan": "Plano",
    "amount": "Valor",
    "reference": "Referência bancária",
    "reviewer": "Analisado por / Em",
    "actions": "Ações",
    "review": "Analisar",
    "reviewed": "Analisado",
    "empty": "Nenhuma transferência encontrada para este status.",
    "loading": "Carregando…",
    "reviewTitle": "Analisar transferência bancária",
    "warning": "Aprove somente após confirmar o recebimento dos fundos na conta bancária verificada.",
    "notes": "Notas da análise (obrigatórias)",
    "approve": "Aprovar",
    "reject": "Rejeitar",
    "cancel": "Cancelar",
    "noteRequired": "É obrigatório informar uma nota de análise.",
    "confirmApprove": "Aprovar esta transferência? Confirme primeiro o recebimento dos fundos.",
    "confirmReject": "Rejeitar esta transferência? Verifique as informações antes de continuar.",
    "successApprove": "Transferência aprovada com sucesso.",
    "successReject": "Transferência rejeitada com sucesso.",
    "loadError": "Não foi possível carregar as transferências.",
    "reviewError": "Falha na análise. Atualize e verifique se já foi processada.",
    "bankReference": "Referência bancária:"
  }
};
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
  const { isDark } = useTheme();
  const { i18n } = useTranslation();
  const lang = String(i18n.resolvedLanguage || i18n.language || 'en').slice(0, 2);
  const tr = copy[lang] || copy.en;
  const locale = lang === 'es' ? 'es-EC' : lang === 'pt' ? 'pt-BR' : 'en-US';
  const formatDate = (value) => value ? new Date(value).toLocaleString(locale) : '—';
  const palette = isDark ? {
    text: '#f1f5f9', muted: '#a9b8cf', panel: '#151c2b',
    border: '#344258', input: '#1e293b', button: '#263348',
    warning: '#fbbf24', row: '#344258'
  } : {
    text: '#14233d', muted: '#64748b', panel: '#ffffff',
    border: '#dbe3f0', input: '#ffffff', button: '#ffffff',
    warning: '#a45109', row: '#e2e8f0'
  };
  const panelStyle = { ...styles.panel, background: palette.panel, color: palette.text, borderColor: palette.border };
  const buttonStyle = { ...styles.button, background: palette.button, color: palette.text, borderColor: palette.border };
  const inputStyle = { ...styles.input, background: palette.input, color: palette.text, borderColor: palette.border };
  const cellStyle = { padding: '12px 10px', borderBottom: `1px solid ${palette.row}`, color: palette.text, verticalAlign: 'top', overflowWrap: 'anywhere' };
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
    catch (err) { setError(err?.message || tr.loadError); }
    finally { setBusy(false); }
  }, [status]);
  useEffect(() => { load(); }, [load]);
  async function review(approve) {
    if (!reviewing || !note.trim()) { setError(tr.noteRequired); return; }
    if (!window.confirm((approve ? tr.confirmApprove : tr.confirmReject))) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await apiClient.request(`${endpoint}/${encodeURIComponent(reviewing.id)}/review`, { method: 'POST', body: JSON.stringify({ approve, note: note.trim() }) });
      setMessage((approve ? tr.successApprove : tr.successReject));
      setReviewing(null); setNote(''); await load();
    } catch (err) { setError(err?.message || tr.reviewError); }
    finally { setBusy(false); }
  }
  return <div style={{ ...styles.page, color: palette.text }}>
    <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
      <div><h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>{tr.title}</h1><p style={{ color: palette.muted, margin: '6px 0 0' }}>{tr.subtitle}</p></div>
      <button style={buttonStyle} onClick={load} disabled={busy}><RefreshCw size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />{tr.refresh}</button>
    </header>
    {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}{message && <p role="status" style={{ color: '#15803d' }}>{message}</p>}
    <div style={{ ...panelStyle, marginBottom: 18, display: 'flex', gap: 12, alignItems: 'center' }}><Landmark size={20} /><label htmlFor="bank-status">{tr.status}</label><select id="bank-status" style={{ ...inputStyle, width: 200, colorScheme: isDark ? 'dark' : 'light' }} value={status} onChange={e => setStatus(e.target.value)}><option value="pending_review">{tr.pending}</option><option value="approved">{tr.approved}</option><option value="rejected">{tr.rejected}</option><option value="">{tr.history}</option></select></div>
    <div style={{ ...panelStyle, overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 930, textAlign: 'left', fontSize: 14 }}><thead><tr>{[tr.submitted,tr.customer,tr.plan,tr.amount,tr.reference,tr.status,tr.reviewer,tr.actions].map(h => <th key={h} style={{ padding: '12px 10px', borderBottom: `1px solid ${palette.border}`, color: palette.text }}>{h}</th>)}</tr></thead><tbody>{rows.map(r => <tr key={r.id}>{[
      formatDate(r.created_at), r.customer_email || r.user_id, r.plan_key, money(r.price_cents, r.currency), r.transaction_reference || r.bank_transaction_reference || r.transfer_reference || '—', (r.status === 'pending_review' ? tr.pending : r.status === 'approved' ? tr.approved : r.status === 'rejected' ? tr.rejected : r.status), r.reviewed_by ? `${r.reviewed_by} · ${formatDate(r.reviewed_at)}` : '—'
    ].map((v, i) => <td key={i} style={cellStyle}>{v}</td>)}<td style={{ padding: 10, borderBottom: `1px solid ${palette.row}`, color: palette.text }}>{r.status === 'pending_review' ? <button style={buttonStyle} onClick={() => { setReviewing(r); setNote(''); setError(''); }}>{tr.review}</button> : <span title={r.review_note || ''}>{r.review_note || tr.reviewed}</span>}</td></tr>)}{!busy && rows.length === 0 && <tr><td colSpan={8} style={{ padding: 28, textAlign: 'center', color: palette.muted }}>{tr.empty}</td></tr>}</tbody></table>{busy && <p role="status">{tr.loading}</p>}</div>
    {reviewing && <div role="dialog" aria-modal="true" aria-label={tr.reviewTitle} style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#0008', display: 'grid', placeItems: 'center', padding: 16 }}><div style={{ ...panelStyle, width: 'min(100%, 520px)', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', boxShadow: '0 18px 50px #0003' }}><h2 style={{ marginTop: 0 }}>{tr.reviewTitle}</h2><p><strong>{reviewing.customer_email}</strong> · {reviewing.plan_key} · {money(reviewing.price_cents, reviewing.currency)}</p><p>{tr.bankReference} {reviewing.transaction_reference || reviewing.bank_transaction_reference || reviewing.transfer_reference || '—'}</p><p style={{ color: palette.warning }}>{tr.warning}</p><label htmlFor="bank-review-note">{tr.notes}</label><textarea id="bank-review-note" style={{ ...inputStyle, minHeight: 100, marginTop: 8 }} value={note} maxLength={1000} onChange={e => setNote(e.target.value)} /><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}><button style={{ ...buttonStyle, background: '#16a34a', color: '#fff' }} disabled={busy || !note.trim()} onClick={() => review(true)}><CheckCircle2 size={16} style={{ verticalAlign: 'middle' }} /> {tr.approve}</button><button style={{ ...buttonStyle, background: '#dc2626', color: '#fff' }} disabled={busy || !note.trim()} onClick={() => review(false)}><XCircle size={16} style={{ verticalAlign: 'middle' }} /> {tr.reject}</button><button style={buttonStyle} disabled={busy} onClick={() => setReviewing(null)}>{tr.cancel}</button></div></div></div>}
  </div>;
}
