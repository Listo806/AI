import { useEffect, useState } from 'react';
import i18n from '../i18n/i18n';
import { updateGoogleAdsConsent } from '../api/googleAdsTracking';
import './CookieConsentBanner.css';

const KEY = 'listoqasa_cookie_preferences_v1';
const words = {
  en: { title: 'Your privacy choices', body: 'We use optional analytics and advertising cookies to understand website usage and measure our campaigns. You can accept, reject, or customize these cookies. Essential site functions remain available.', accept: 'Accept all', reject: 'Reject optional', customize: 'Customize', save: 'Save preferences', analytics: 'Analytics cookies', ads: 'Advertising cookies', settings: 'Cookie settings', close: 'Close' },
  es: { title: 'Tus opciones de privacidad', body: 'Usamos cookies opcionales de análisis y publicidad para comprender el uso del sitio y medir nuestras campañas. Puedes aceptarlas, rechazarlas o personalizarlas. Las funciones esenciales siguen disponibles.', accept: 'Aceptar todas', reject: 'Rechazar opcionales', customize: 'Personalizar', save: 'Guardar preferencias', analytics: 'Cookies de análisis', ads: 'Cookies publicitarias', settings: 'Configuración de cookies', close: 'Cerrar' },
  pt: { title: 'Suas opções de privacidade', body: 'Usamos cookies opcionais de análise e publicidade para entender o uso do site e medir nossas campanhas. Você pode aceitar, rejeitar ou personalizar. As funções essenciais continuam disponíveis.', accept: 'Aceitar todas', reject: 'Rejeitar opcionais', customize: 'Personalizar', save: 'Salvar preferências', analytics: 'Cookies de análise', ads: 'Cookies de publicidade', settings: 'Configurações de cookies', close: 'Fechar' },
};
function stored() {
  try { const value = JSON.parse(localStorage.getItem(KEY)); return value && typeof value.ads === 'boolean' && typeof value.analytics === 'boolean' ? value : null; } catch { return null; }
}
function apply(value) {
  updateGoogleAdsConsent(value.ads);
  window.gtag?.('consent', 'update', { analytics_storage: value.analytics ? 'granted' : 'denied' });
}
export default function CookieConsentBanner() {
  const [prefs, setPrefs] = useState(() => stored());
  const [visible, setVisible] = useState(() => !stored());
  const [custom, setCustom] = useState(false);
  const [ads, setAds] = useState(() => stored()?.ads ?? false);
  const [analytics, setAnalytics] = useState(() => stored()?.analytics ?? false);
  const [language, setLanguage] = useState(i18n.resolvedLanguage || i18n.language || 'en');
  useEffect(() => {
    const onLanguage = lang => setLanguage(lang);
    i18n.on('languageChanged', onLanguage);
    const existing = stored();
    if (existing) apply(existing);
    return () => i18n.off('languageChanged', onLanguage);
  }, []);
  const t = words[language.split('-')[0]] || words.en;
  const save = value => {
    try { localStorage.setItem(KEY, JSON.stringify(value)); } catch { /* private browsing */ }
    apply(value); setPrefs(value); setAds(value.ads); setAnalytics(value.analytics); setVisible(false); setCustom(false);
  };
  return <>
    {!visible && <button type="button" className="lq-cookie-settings" onClick={() => { setAds(prefs?.ads ?? false); setAnalytics(prefs?.analytics ?? false); setCustom(true); setVisible(true); }}>{t.settings}</button>}
    {visible && <section className="lq-cookie-banner" role="dialog" aria-modal="false" aria-label={t.title}>
      <div className="lq-cookie-heading"><strong>{t.title}</strong>{prefs && <button type="button" onClick={() => setVisible(false)} aria-label={t.close}>×</button>}</div>
      <p>{t.body}</p>
      {custom && <div className="lq-cookie-options">
        <label><input type="checkbox" checked={analytics} onChange={e => setAnalytics(e.target.checked)} /> {t.analytics}</label>
        <label><input type="checkbox" checked={ads} onChange={e => setAds(e.target.checked)} /> {t.ads}</label>
      </div>}
      <div className="lq-cookie-actions">
        <button type="button" onClick={() => save({ads:false,analytics:false})}>{t.reject}</button>
        {custom ? <button type="button" onClick={() => save({ads,analytics})}>{t.save}</button> : <button type="button" onClick={() => setCustom(true)}>{t.customize}</button>}
        <button type="button" className="lq-cookie-primary" onClick={() => save({ads:true,analytics:true})}>{t.accept}</button>
      </div>
    </section>}
  </>;
}
