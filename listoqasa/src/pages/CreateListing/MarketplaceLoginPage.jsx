import React, {useState} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {Eye, EyeOff, ArrowRight} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {marketplaceLogin} from '../../api/marketplaceApi';
import './CreateListingPage.css';
import './MarketplaceLoginPage.css';

const copy = {
  en: {title:'Marketplace Sign In',subtitle:'Sign in to create and manage your listings.',email:'Email',password:'Password',show:'Show password',hide:'Hide password',submit:'Sign In',busy:'Signing in...',expired:'Your session has expired. Please sign in again.',crm:'Have a Cortexa CRM account?',open:'Open Cortexa CRM'},
  es: {title:'Iniciar sesión en Marketplace',subtitle:'Inicia sesión para crear y administrar tus propiedades.',email:'Correo electrónico',password:'Contraseña',show:'Mostrar contraseña',hide:'Ocultar contraseña',submit:'Iniciar sesión',busy:'Iniciando sesión...',expired:'Tu sesión ha caducado. Inicia sesión de nuevo.',crm:'¿Tienes una cuenta de Cortexa CRM?',open:'Abrir Cortexa CRM'},
  pt: {title:'Entrar no Marketplace',subtitle:'Entre para criar e gerenciar seus imóveis.',email:'E-mail',password:'Senha',show:'Mostrar senha',hide:'Ocultar senha',submit:'Entrar',busy:'Entrando...',expired:'Sua sessão expirou. Entre novamente.',crm:'Tem uma conta Cortexa CRM?',open:'Abrir Cortexa CRM'}
};

export default function MarketplaceLoginPage() {
  const {i18n} = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];
  const t = copy[lang] || copy.en;
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [visible,setVisible] = useState(false);
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const navigate = useNavigate();
  const [query] = useSearchParams();
  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await marketplaceLogin(email,password);
      const next = query.get('next');
      navigate(next?.startsWith('/') && !next.startsWith('//') ? next : '/my-listings',{replace:true});
    } catch (err) {
      setError(err?.message || 'Sign in failed');
    } finally {
      setBusy(false);
    }
  };
  return <div className="cl-page marketplace-login-page">
    <header className="cl-top"><Link className="cl-logo" to="/">ListoQasa</Link></header>
    <main className="cl-main marketplace-login-main"><section className="cl-panel marketplace-login-panel">
      <h1>{t.title}</h1><p className="marketplace-login-subtitle">{t.subtitle}</p>
      <form onSubmit={submit}>
        <label className="cl-field"><span>{t.email}</span><input type="email" autoComplete="email" required value={email} onChange={event=>setEmail(event.target.value)}/></label>
        <label className="cl-field"><span>{t.password}</span><span className="marketplace-login-password">
          <input type={visible?'text':'password'} autoComplete="current-password" required value={password} onChange={event=>setPassword(event.target.value)}/>
          <button type="button" className="marketplace-login-eye" onClick={()=>setVisible(v=>!v)} aria-label={visible?t.hide:t.show} title={visible?t.hide:t.show} aria-pressed={visible}>
            {visible?<Eye size={19}/>:<EyeOff size={19}/>}
          </button>
        </span></label>
        {query.get('reason')==='expired' && <p className="marketplace-login-notice" role="status">{t.expired}</p>}
        {error && <p className="marketplace-login-error" role="alert">{error}</p>}
        <button type="submit" className="cl-primary marketplace-login-submit" disabled={busy}>{busy?t.busy:t.submit}<ArrowRight size={18}/></button>
      </form>
      <p className="marketplace-login-crm">{t.crm} <a href="https://www.cortexaaicrm.com/login">{t.open}</a></p>
    </section></main>
  </div>;
}
