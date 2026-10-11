import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, XCircle, RefreshCw, Landmark, Clock3, DollarSign, Search, CalendarDays, FileText, History, AlertTriangle, X } from 'lucide-react';
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

const more = {
 en: {period:'Reporting period',thisMonth:'This Month',allTime:'All time',pendingQueue:'Current outstanding queue',approvedAmount:'Approved Amount',search:'Search customer or bank reference',dateFilter:'Submitted date',start:'Start date',end:'End date',billing:'Billing period',monthly:'Monthly',yearly:'Yearly',name:'Customer name',email:'Email',receipt:'Payment receipt',noReceipt:'No receipt uploaded.',reviewHistory:'Review history',noHistory:'No previous reviews.',verify:'I confirmed this payment reached our bank account.',verifyNeeded:'Confirm receipt of funds before approving.',verifyWarning:'Verify the deposit in your bank account. A reference or receipt alone does not confirm payment.',approveActivate:'Approve & activate plan',rejectPayment:'Reject payment',footnote:'Approval activates the Marketplace plan. Rejection leaves it inactive.',notProvided:'Not provided',showing:'Showing',requests:'requests',all:'All statuses',reviewNote:'Record your verification details or reason for rejection.',noResults:'No matching transfers.',dateError:'Start date must not be after end date.'},
 es: {period:'Período del informe',thisMonth:'Este mes',allTime:'Todo el período',pendingQueue:'Solicitudes pendientes',approvedAmount:'Importe aprobado',search:'Buscar cliente o referencia bancaria',dateFilter:'Fecha de envío',start:'Fecha inicial',end:'Fecha final',billing:'Período de facturación',monthly:'Mensual',yearly:'Anual',name:'Nombre del cliente',email:'Correo',receipt:'Comprobante de pago',noReceipt:'No se ha subido comprobante.',reviewHistory:'Historial de revisión',noHistory:'Sin revisiones anteriores.',verify:'Confirmo que el pago llegó a nuestra cuenta bancaria.',verifyNeeded:'Confirme la recepción de fondos antes de aprobar.',verifyWarning:'Verifique el depósito en su banco. Una referencia o comprobante no confirma el pago.',approveActivate:'Aprobar y activar plan',rejectPayment:'Rechazar pago',footnote:'La aprobación activa el plan. El rechazo lo deja inactivo.',notProvided:'No proporcionado',showing:'Mostrando',requests:'solicitudes',all:'Todos los estados',reviewNote:'Anote los detalles de verificación o el motivo del rechazo.',noResults:'No hay transferencias coincidentes.',dateError:'La fecha inicial no puede ser posterior a la final.'},
 pt: {period:'Período do relatório',thisMonth:'Este mês',allTime:'Todo o período',pendingQueue:'Fila de análise pendente',approvedAmount:'Valor aprovado',search:'Buscar cliente ou referência bancária',dateFilter:'Data de envio',start:'Data inicial',end:'Data final',billing:'Período de cobrança',monthly:'Mensal',yearly:'Anual',name:'Nome do cliente',email:'E-mail',receipt:'Comprovante de pagamento',noReceipt:'Nenhum comprovante enviado.',reviewHistory:'Histórico de análise',noHistory:'Nenhuma análise anterior.',verify:'Confirmo que o pagamento chegou à nossa conta bancária.',verifyNeeded:'Confirme o recebimento dos fundos antes de aprovar.',verifyWarning:'Verifique o depósito na conta bancária. Uma referência ou comprovante não confirma o pagamento.',approveActivate:'Aprovar e ativar plano',rejectPayment:'Rejeitar pagamento',footnote:'A aprovação ativa o plano. A rejeição o mantém inativo.',notProvided:'Não informado',showing:'Exibindo',requests:'solicitações',all:'Todos os status',reviewNote:'Registre os detalhes da verificação ou o motivo da rejeição.',noResults:'Nenhuma transferência encontrada.',dateError:'A data inicial não pode ser posterior à final.'}
};
const endpoint = '/admin/marketplace/bank-transfers';
const rowsOf = (response) => Array.isArray(response?.data?.data) ? response.data.data : Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
const amount = (row) => Number(row.price_cents ?? row.amount_cents ?? 0) / 100;
const money = (value, currency = 'USD', locale = 'en-US') => new Intl.NumberFormat(locale, {style:'currency',currency:currency || 'USD'}).format(Number(value || 0));
const reference = r => r.bank_transaction_reference || r.transaction_reference || r.transfer_reference || r.reference || '—';
const planName = (key) => {
 const known = {'owner-standard':'Standard Exposure','owner-enhanced':'Enhanced Exposure','owner-maximum':'Maximum Exposure','agent-essential':'Essential','agent-growth':'Growth','agent-premium':'Premium'};
 return known[key] || String(key || '—').split('-').filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
};
const formatDateOnly = (d) => d ? new Date(d).toISOString().slice(0,10) : '';
const isThisMonth = (value) => {if(!value)return false; const d=new Date(value),now=new Date();return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth();};
export default function MarketplaceBankTransferApprovals() {
 const {isDark} = useTheme();
 const {i18n} = useTranslation();
 const lang = String(i18n.resolvedLanguage || i18n.language || 'en').slice(0,2);
 const tr = {...(copy[lang] || copy.en),...(more[lang] || more.en)};
 const locale = lang==='es'?'es-EC':lang==='pt'?'pt-BR':'en-US';
 const date = d => d ? new Date(d).toLocaleString(locale) : '—';
 const colors = isDark ? {bg:'#151d2b',text:'#f2f6fc',muted:'#a7b6ce',border:'#334258',input:'#202c40',sub:'#26344b'} : {bg:'#fff',text:'#13254b',muted:'#7586a7',border:'#d5e1f3',input:'#fff',sub:'#f5f8fd'};
 const [allRows,setAllRows] = useState([]);
 const [status,setStatus] = useState('pending_review');
 const [search,setSearch] = useState('');
 const [from,setFrom] = useState('');
 const [to,setTo] = useState('');
 const [period,setPeriod] = useState('month');
 const [busy,setBusy] = useState(false);
 const [reviewing,setReviewing] = useState(null);
 const [note,setNote] = useState('');
 const [verified,setVerified] = useState(false);
 const [error,setError] = useState('');
 const [message,setMessage] = useState('');
 const [sortAsc,setSortAsc] = useState(false);
 const load = useCallback(async () => {
  setBusy(true);setError('');
  try {setAllRows(rowsOf(await apiClient.request(endpoint)));}
  catch(err){setError(err?.message || 'Unable to load bank transfers.');}
  finally {setBusy(false);}
 },[]);
 useEffect(()=>{load();},[load]);
 const filtered = allRows.filter(r => {
  if(status && r.status!==status)return false;
  if(from && formatDateOnly(r.created_at)<from)return false;
  if(to && formatDateOnly(r.created_at)>to)return false;
  const q=search.trim().toLowerCase();
  return !q || [r.customer_email,r.customer_name,r.user_id,reference(r),r.plan_key].some(v=>String(v||'').toLowerCase().includes(q));
 }).sort((a,b)=>sortAsc ? new Date(a.created_at)-new Date(b.created_at) : new Date(b.created_at)-new Date(a.created_at));
 const periodRows=allRows.filter(r=>period==='all' || isThisMonth(r.reviewed_at || r.created_at));
 const approvedRows=periodRows.filter(r=>r.status==='approved');
 const pendingCount=allRows.filter(r=>r.status==='pending_review').length;
 const approvedTotal=approvedRows.reduce((sum,r)=>sum+amount(r),0);
 const panel={background:colors.bg,color:colors.text,border:`1px solid ${colors.border}`,borderRadius:12};
 const field={background:colors.input,color:colors.text,border:`1px solid ${colors.border}`,borderRadius:8,padding:'5px 12px',minWidth:0,font:'inherit',colorScheme:isDark?'dark':'light'};
 const btn={...field,cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8};
 const badge=(value)=>{const good=value==='approved',bad=value==='rejected';return <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'5px 12px',borderRadius:999,background:good?'#e5f8ec':bad?'#fee8e9':'#fff1d6',color:good?'#087d40':bad?'#ba1e2b':'#995300',fontWeight:600,whiteSpace:'nowrap'}}>{good?<CheckCircle2 size={15}/>:bad?<XCircle size={15}/>:<Clock3 size={15}/>} {good?tr.approved:bad?tr.rejected:tr.pending}</span>};
 async function review(approve){
  if(!reviewing || !note.trim()){setError(tr.noteRequired);return;}
  if(approve&&!verified){setError(tr.verifyNeeded);return;}
  if(!window.confirm(approve?tr.confirmApprove:tr.confirmReject))return;
  setBusy(true);setError('');setMessage('');
  try {
   await apiClient.request(`${endpoint}/${encodeURIComponent(reviewing.id)}/review`,{method:'POST',body:JSON.stringify({approve,note:note.trim()})});
   setMessage(approve?tr.successApprove:tr.successReject);setReviewing(null);setNote('');setVerified(false);await load();
  }catch(err){setError(err?.message || tr.reviewError);}
  finally{setBusy(false);}
 }
 const close=()=>{setReviewing(null);setNote('');setVerified(false);setError('');};
 const statCards=[
  {label:tr.pending,count:pendingCount,desc:tr.pendingQueue,Icon:Clock3,color:'#1681ef',bg:'#e7f1ff'},
  {label:tr.approved,count:approvedRows.length,desc:period==='month'?tr.thisMonth:tr.allTime,Icon:CheckCircle2,color:'#0b9a50',bg:'#e6f8ed'},
  {label:tr.rejected,count:periodRows.filter(r=>r.status==='rejected').length,desc:period==='month'?tr.thisMonth:tr.allTime,Icon:XCircle,color:'#d92535',bg:'#fee8eb'},
  {label:tr.approvedAmount,count:money(approvedTotal,'USD',locale),desc:period==='month'?tr.thisMonth:tr.allTime,Icon:DollarSign,color:'#1681ef',bg:'#e7f1ff'}
 ];
 return <div style={{maxWidth:1900,margin:'0 auto',color:colors.text}}>
  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16,marginBottom:24}}>
   <div><h1 style={{fontSize:'26px',fontWeight:700}}>{tr.title}</h1><p style={{fontSize:'14px',margin:0,color:colors.muted}}>{tr.subtitle}</p></div>
   <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
    <label style={{...field,display:'flex',alignItems:'center',gap:9}}><CalendarDays size={18}/>{tr.period}: <select value={period} onChange={e=>setPeriod(e.target.value)} style={{background:'transparent',color:'inherit',border:0,font:'inherit'}}><option value="month" style={{color:'#14233d'}}>{tr.thisMonth}</option><option value="all" style={{color:'#14233d'}}>{tr.allTime}</option></select></label>
    <button style={btn} disabled={busy} onClick={load}><RefreshCw size={17}/>{tr.refresh}</button>
   </div>
  </div>
  {error&&!reviewing&&<p role="alert" style={{color:'#dc3545'}}>{error}</p>}
  {message&&<p role="status" style={{color:'#16a34a'}}>{message}</p>}
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(215px,1fr))',gap:12,marginBottom:20}}>
   {statCards.map(({label,count,desc,Icon,color,bg})=><div key={label} style={{...panel,padding:'18px 10px',display:'flex',alignItems:'center',gap:10}}>
    <span style={{width:60,height:60,borderRadius:'50%',background:bg,color,display:'grid',placeItems:'center',flexShrink:0}}><Icon size={30}/></span><div><div style={{fontWeight:600,fontSize:17}}>{label}</div><div style={{fontSize:22,fontWeight:700,margin:'4px 0'}}>{count}</div><div style={{fontSize:14,color:colors.muted}}>{desc}</div></div>
   </div>)}
  </div>
  <div style={{...panel,padding:18,display:'flex',alignItems:'center',gap:16,flexWrap:'wrap',marginBottom:20}}>
   <label style={{...field,display:'flex',alignItems:'center',gap:9,flex:'2 1 300px'}}><Search size={19} color={colors.muted}/><input aria-label={tr.search} placeholder={tr.search} value={search} onChange={e=>setSearch(e.target.value)} style={{border:0,outline:0,background:'transparent',color:'inherit',font:'inherit',width:'100%'}}/></label>
   <label style={{display:'flex',alignItems:'center',gap:8,flex:'1 1 210px'}}>{tr.status}<select style={{...field,flex:1}} value={status} onChange={e=>setStatus(e.target.value)}><option value="">{tr.all}</option><option value="pending_review">{tr.pending}</option><option value="approved">{tr.approved}</option><option value="rejected">{tr.rejected}</option></select></label>
   <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}><span>{tr.dateFilter}</span><input aria-label={tr.start} title={tr.start} type="date" style={{...field,flex:'1 1 125px',width:125}} value={from} max={to||undefined} onChange={e=>setFrom(e.target.value)}/><span>–</span><input aria-label={tr.end} title={tr.end} type="date" style={{...field,flex:'1 1 125px',width:125}} value={to} min={from||undefined} onChange={e=>setTo(e.target.value)}/></div>
  </div>
  <div style={{...panel,overflowX:'auto'}}>
   <table style={{width:'100%',borderCollapse:'collapse',minWidth:980,textAlign:'left',fontSize:12}}>
    <thead><tr style={{background:colors.sub}}>{[tr.submitted,tr.customer,tr.plan,`${tr.amount} (USD)`,tr.reference,tr.status,tr.reviewer,tr.actions].map((h,i)=><th key={i} style={{padding:'17px 14px',borderBottom:`1px solid ${colors.border}`,fontWeight:700}}>{i===0?<button style={{background:'none',border:0,color:'inherit',font:'inherit',fontWeight:700,cursor:'pointer'}} onClick={()=>setSortAsc(v=>!v)}>{h} {sortAsc?'▴':'▾'}</button>:h}</th>)}</tr></thead>
    <tbody>{filtered.map(r=><tr key={r.id} style={{borderBottom:`1px solid ${colors.border}`}}>
     <td style={{padding:14,whiteSpace:'nowrap'}}>{date(r.created_at)}</td><td style={{padding:14,overflowWrap:'anywhere'}}>{r.customer_email||r.user_id||'—'}</td>
     <td style={{padding:14}}>{planName(r.plan_key)}<div style={{color:colors.muted,marginTop:4}}>{(r.billing_period||r.billing_cycle) ? (String(r.billing_period||r.billing_cycle).toLowerCase().startsWith('year')?tr.yearly:tr.monthly) : '—'}</div></td>
     <td style={{padding:14,whiteSpace:'nowrap'}}>{money(amount(r),r.currency,locale)}</td><td style={{padding:14,overflowWrap:'anywhere'}}>{reference(r)}</td><td style={{padding:14}}>{badge(r.status)}</td>
     <td style={{padding:14}}>{r.reviewed_by? <>{r.reviewer_email||r.reviewed_by}<div style={{color:colors.muted}}>{date(r.reviewed_at)}</div></>:'—'}</td>
     <td style={{padding:14}}>{r.status==='pending_review'?<button style={{...btn,color:'#1674ee',borderColor:'#2585ff'}} disabled={busy} onClick={()=>{setReviewing(r);setNote('');setVerified(false);setError('');}}>{tr.review}</button>:<button style={btn} onClick={()=>{setReviewing(r);setNote(r.review_note||'');setVerified(false);setError('');}}>{tr.history}</button>}</td>
    </tr>)}
    {!busy&&!filtered.length&&<tr><td colSpan={8} style={{padding:35,textAlign:'center',color:colors.muted}}>{tr.noResults}</td></tr>}</tbody>
   </table>
   <div style={{padding:'15px 20px',color:colors.muted}}>{busy?tr.loading:`${tr.showing} ${filtered.length} ${tr.requests}`}</div>
  </div>
  {reviewing&&<div role="presentation" style={{position:'fixed',inset:0,zIndex:10000,background:'rgba(9,17,30,.68)',display:'grid',placeItems:'center',padding:16}} onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)close();}}>
   <div role="dialog" aria-modal="true" aria-label={tr.reviewTitle} style={{...panel,fontSize:'13px',width:'min(100%,780px)',maxHeight:'calc(100dvh - 32px)',overflowY:'auto',padding:'14px',boxShadow:'0 18px 55px #0004'}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}><h2 style={{margin:0,fontSize:21}}>{tr.reviewTitle}</h2><button aria-label={tr.cancel} onClick={close} style={{...btn,border:0}}><X size={22}/></button></div>
    <div style={{margin:'0 0 8px'}}>{badge(reviewing.status)}</div>
    <div style={{borderTop:`1px solid ${colors.border}`,paddingTop:16,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'8px 24px'}}>
     {[[tr.name,reviewing.customer_name||tr.notProvided],[tr.email,reviewing.customer_email||'—'],[tr.plan,planName(reviewing.plan_key)],[tr.billing,(reviewing.billing_period||reviewing.billing_cycle) ? (String(reviewing.billing_period||reviewing.billing_cycle).toLowerCase().startsWith('year')?tr.yearly:tr.monthly) : '—'],[tr.amount,money(amount(reviewing),reviewing.currency,locale)],[tr.submitted,date(reviewing.created_at)],[tr.reference,reference(reviewing)]].map(([label,value])=><div key={label} style={{display:'grid',gridTemplateColumns:'125px minmax(0,1fr)',gap:10}}><span style={{color:colors.muted,fontWeight:600}}>{label}</span><span style={{overflowWrap:'anywhere'}}>{value}</span></div>)}
    </div>
    <div style={{...panel,background:colors.sub,padding:'8px 15px',marginTop:20,display:'flex',gap:15,alignItems:'center'}}><FileText size={26} color="#287af0"/><div><strong>{tr.receipt}</strong><div style={{color:colors.muted,marginTop:4}}>{tr.noReceipt}</div></div></div>
    <div style={{...panel,background:colors.sub,padding:'8px 15px',marginTop:14,display:'flex',gap:15,alignItems:'flex-start'}}><History size={26} color="#287af0"/><div><strong>{tr.reviewHistory}</strong><div style={{color:colors.muted,marginTop:5}}>{reviewing.reviewed_at?<>{badge(reviewing.status)} · {reviewing.reviewer_email||reviewing.reviewed_by||'—'} · {date(reviewing.reviewed_at)}{reviewing.review_note&&<div style={{marginTop:7}}>{reviewing.review_note}</div>}</>:tr.noHistory}</div></div></div>
    {reviewing.status==='pending_review'&&<>
     <div style={{fontSize:'13px',display:'flex',alignItems:'center',gap:10,background:isDark?'#453519':'#fff5e5',color:isDark?'#ffca78':'#a85d00',border:'1px solid #f8d99b',borderRadius:9,padding:"5px 12px",marginTop:14}}><AlertTriangle size={21}/>{tr.verifyWarning}</div>
     <label style={{display:'flex',alignItems:'center',gap:10,marginTop:12,cursor:'pointer'}}><input type="checkbox" checked={verified} onChange={e=>setVerified(e.target.checked)}/>{tr.verify} <span style={{color:'#e11d48'}}>*</span></label>
     <label htmlFor="bank-review-note" style={{display:'block',fontWeight:600,margin:'12px 0 7px'}}>{tr.notes} <span style={{color:'#e11d48'}}>*</span></label>
     <textarea id="bank-review-note" placeholder={tr.reviewNote} value={note} maxLength={1000} onChange={e=>setNote(e.target.value)} style={{...field,width:'100%',boxSizing:'border-box',minHeight:65,resize:'vertical'}}/>
     {error&&<p role="alert" style={{color:'#dc3545'}}>{error}</p>}
    </>}
    <div style={{borderTop:`1px solid ${colors.border}`,marginTop:11,paddingTop:12,display:'flex',justifyContent:'flex-end',gap:10,flexWrap:'wrap'}}>
     <button style={btn} disabled={busy} onClick={close}>{tr.cancel}</button>
     {reviewing.status==='pending_review'&&<><button style={{...btn,background:'#df2b34',borderColor:'#df2b34',color:'#fff'}} disabled={busy||!note.trim()} onClick={()=>review(false)}><XCircle size={17}/>{tr.rejectPayment}</button><button style={{...btn,background:'#16a05b',borderColor:'#16a05b',color:'#fff',opacity:busy||!note.trim()||!verified ? .55 : 1}} disabled={busy||!note.trim()||!verified} onClick={()=>review(true)}><CheckCircle2 size={17}/>{tr.approveActivate}</button></>}
    </div><div style={{textAlign:'right',fontSize:12,color:colors.muted,marginTop:7}}>{tr.footnote}</div>
   </div>
  </div>}
 </div>;
}
