import React, { useEffect, useMemo, useState } from "react";
import { Check, Mail, ShieldCheck } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import apiClient from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import { trackEventOnce } from "../../utils/track";
import "./EmailVerificationPage.css";

const COPY = {
  en: {
    account:"Account", plan:"Plan", payment:"Payment", verify:"Verify", verified:"Verified",
    received:"Payment received.", pending:"Verify your email to activate your account.",
    sent:(e)=>`A verification link has been sent to ${e}. Check your inbox and click the link to activate your Cortexa account.`,
    resend:"Resend verification email", change:"Change email address", expires:"Verification link expires in 60 minutes.",
    help:"Can’t find the email? Check your spam folder or contact Cortexa Support.", paymentComplete:"Payment complete", pendingLabel:"Email verification pending",
    newSent:"A new verification email was sent.", newEmail:"New email address", save:"Update email and send link", cancel:"Cancel",
    verifiedTitle:"Email verified.", active:"Your Cortexa account is active.",
    activeBody:"Your payment and email have been confirmed. We’re taking you to workspace selection so you can begin setting up Cortexa for your business.",
    redirect:"Redirecting to workspace selection in 3 seconds…", continue:"Continue to Workspace Selection",
    expired:"This verification link has expired.", invalid:"This verification link is invalid.", sendNew:"Send New Verification Email",
  },
  es: {
    account:"Cuenta", plan:"Plan", payment:"Pago", verify:"Verificar", verified:"Verificado",
    received:"Pago recibido.", pending:"Verifica tu correo electrónico para activar tu cuenta.",
    sent:(e)=>`Se envió un enlace de verificación a ${e}. Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta de Cortexa.`,
    resend:"Reenviar correo de verificación", change:"Cambiar dirección de correo", expires:"El enlace de verificación vence en 60 minutos.",
    help:"¿No encuentras el correo? Revisa tu carpeta de spam o contacta al Soporte de Cortexa.", paymentComplete:"Pago completado", pendingLabel:"Verificación de correo pendiente",
    newSent:"Se envió un nuevo correo de verificación.", newEmail:"Nueva dirección de correo", save:"Actualizar correo y enviar enlace", cancel:"Cancelar",
    verifiedTitle:"Correo verificado.", active:"Tu cuenta de Cortexa está activa.",
    activeBody:"Tu pago y correo han sido confirmados. Te llevaremos a la selección de espacio de trabajo para comenzar a configurar Cortexa para tu negocio.",
    redirect:"Redirigiendo a la selección de espacio de trabajo en 3 segundos…", continue:"Continuar a selección de espacio de trabajo",
    expired:"Este enlace de verificación ha vencido.", invalid:"Este enlace de verificación no es válido.", sendNew:"Enviar nuevo correo de verificación",
  },
  pt: {
    account:"Conta", plan:"Plano", payment:"Pagamento", verify:"Verificar", verified:"Verificado",
    received:"Pagamento recebido.", pending:"Verifique seu e-mail para ativar sua conta.",
    sent:(e)=>`Um link de verificação foi enviado para ${e}. Verifique sua caixa de entrada e clique no link para ativar sua conta Cortexa.`,
    resend:"Reenviar e-mail de verificação", change:"Alterar endereço de e-mail", expires:"O link de verificação expira em 60 minutos.",
    help:"Não encontrou o e-mail? Verifique a pasta de spam ou contate o Suporte Cortexa.", paymentComplete:"Pagamento concluído", pendingLabel:"Verificação de e-mail pendente",
    newSent:"Um novo e-mail de verificação foi enviado.", newEmail:"Novo endereço de e-mail", save:"Atualizar e-mail e enviar link", cancel:"Cancelar",
    verifiedTitle:"E-mail verificado.", active:"Sua conta Cortexa está ativa.",
    activeBody:"Seu pagamento e e-mail foram confirmados. Estamos levando você à seleção do espaço de trabalho para começar a configurar a Cortexa para sua empresa.",
    redirect:"Redirecionando para a seleção do espaço de trabalho em 3 segundos…", continue:"Continuar para seleção do espaço de trabalho",
    expired:"Este link de verificação expirou.", invalid:"Este link de verificação é inválido.", sendNew:"Enviar novo e-mail de verificação",
  }
};

function langFromPath(path) { return path.startsWith('/pt/') ? 'pt' : (path.startsWith('/es/') || path.startsWith('/es-ec/')) ? 'es' : 'en'; }
function workspacePath() { return '/onboarding'; }

export default function EmailVerificationPage() {
  const location = useLocation(); const navigate = useNavigate(); const [params] = useSearchParams();
  const { user, refreshUser } = useAuth(); const lang = langFromPath(location.pathname); const tr = COPY[lang];
  const token = params.get('token'); const [state,setState]=useState(token?'verifying':'pending'); const [info,setInfo]=useState(null);
  const [msg,setMsg]=useState(''); const [err,setErr]=useState(''); const [editing,setEditing]=useState(false); const [email,setEmail]=useState('');
  const prefix = location.pathname.startsWith('/es-ec/') ? '/es-ec' : location.pathname.startsWith('/es/') ? '/es' : location.pathname.startsWith('/pt/') ? '/pt' : '';
  const nextPath = `${prefix}${workspacePath()}`;

  useEffect(()=>{ let dead=false; (async()=>{
    try {
      if (token) {
        const r=await apiClient.request('/email-verification/verify',{method:'POST',body:JSON.stringify({token})});
        if(dead)return; setInfo(r); setState(r?.verified || r?.alreadyVerified ? 'verified' : 'invalid');
        // email_verified: once, only for the request that actually verified the
        // address (a re-run / reload of the same link answers alreadyVerified).
        if (r?.verified && !r?.alreadyVerified) {
          trackEventOnce(`email_verified:${String(token).slice(0, 24)}`, 'email_verified', { language: lang }, 'local');
        }
        try { await refreshUser(); } catch(e){}
      } else if (user) {
        const r=await apiClient.request('/email-verification/status'); if(dead)return; setInfo(r); setEmail(r?.email || '');
        if(r?.verified){setState('verified');} else setState('pending');
      }
    } catch(e){ if(dead)return; const m=String(e?.message||''); setState(/expired/i.test(m)?'expired':'invalid'); setErr(m); }
  })(); return()=>{dead=true}; },[token,user]);

  useEffect(()=>{ if(state!=='verified')return; const id=setTimeout(()=>navigate(nextPath,{replace:true}),3000); return()=>clearTimeout(id); },[state,nextPath]);
  const masked=useMemo(()=>info?.maskedEmail || info?.email || user?.email || '',[info,user]);
  const resend=async()=>{setErr('');try{const r=await apiClient.request('/email-verification/resend',{method:'POST'});setMsg(r?.message||tr.newSent);}catch(e){setErr(e.message)}};
  const saveEmail=async()=>{setErr('');try{const r=await apiClient.request('/email-verification/email',{method:'PATCH',body:JSON.stringify({email})});setInfo(r);setEditing(false);setMsg(tr.newSent);}catch(e){setErr(e.message)}};

  if(state==='verified') return <main className="ev-page"><Top prefix={prefix} tr={tr} verified/><section className="ev-center"><div className="ev-success"><Check/></div><h1>{tr.verifiedTitle}</h1><h2>{tr.active}</h2><p>{tr.activeBody}</p><div className="ev-redirect">{tr.redirect}</div><button className="ev-primary" onClick={()=>navigate(nextPath)}>{tr.continue}</button><div className="ev-bottom"><Check/> {tr.paymentComplete} <b>•</b> <Check/> {tr.verified} <b>•</b> <Check/> {tr.active}</div></section></main>;
  if(state==='expired'||state==='invalid') return <main className="ev-page"><Top prefix={prefix} tr={tr}/><section className="ev-center"><div className="ev-mail"><Mail/></div><h1>{state==='expired'?tr.expired:tr.invalid}</h1>{err&&<p>{err}</p>}{user&&<button className="ev-primary" onClick={resend}>{tr.sendNew}</button>}{msg&&<div className="ev-notice">{msg}</div>}</section></main>;
  return <main className="ev-page"><Top prefix={prefix} tr={tr}/><section className="ev-center"><div className="ev-mail"><Mail/><i><Check/></i></div><h1>{tr.received}</h1><h2>{tr.pending}</h2><p>{tr.sent(masked)}</p><div className="ev-actions"><button onClick={resend}>{tr.resend}</button><span/><button onClick={()=>setEditing(true)}>{tr.change}</button></div>{editing&&<div className="ev-edit"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder={tr.newEmail}/><button className="ev-primary" onClick={saveEmail}>{tr.save}</button><button className="ev-link" onClick={()=>setEditing(false)}>{tr.cancel}</button></div>}{msg&&<div className="ev-notice">{msg}</div>}{err&&<div className="ev-error">{err}</div>}<div className="ev-expire">{tr.expires}</div><div className="ev-help">{tr.help}</div><div className="ev-bottom">{tr.paymentComplete} <b>•</b> {tr.pendingLabel}</div></section></main>;
}

function Top({tr,verified}) { return <header className="ev-top"><div className="ev-brand"><span/><strong>Cortexa</strong></div><div className="ev-steps"><span>{tr.account}</span><b>•</b><span>{tr.plan}</span><b>•</b><span>{tr.payment}</span><b>•</b><strong>{verified?tr.verified:tr.verify}</strong></div></header>; }
