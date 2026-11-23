import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './demo-welcome-popup.css';

/** A visit is one mounted demo session; refresh starts a new visit. */
export default function DemoWelcomePopup({ realEstate = false, signupUrl }) {
  const { i18n } = useTranslation();
  const language = (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase().startsWith('es') ? 'es' : 'en';
  const es = language === 'es';
  const signup = (realEstate ? `https://www.cortexaaicrm.com/${es ? 'es-ec/' : ''}trial?from=pricing&plan=solo&billing=monthly&workspace=real-estate&source=listoqasa` : `https://www.cortexaaicrm.com/${es ? 'es-ec/' : ''}trial?flow=free-access&plan=free`);
  const [open, setOpen] = useState(false);
  const shown = useRef(false);
  const timer = useRef(null);
  useEffect(() => {
    const reveal = () => {
      if (shown.current) return;
      shown.current = true;
      window.clearTimeout(timer.current);
      setOpen(true);
    };
    timer.current = window.setTimeout(reveal, 5000);
    const onFirstClick = (event) => {
      if (event.target.closest('.demo-welcome-overlay')) return;
      if (event.target.closest('.demo-ribbon')) return;
      reveal();
    };
    const root = document.querySelector('.demo-root');
    root?.addEventListener('click', onFirstClick, true);
    return () => {
      window.clearTimeout(timer.current);
      root?.removeEventListener('click', onFirstClick, true);
    };
  }, []);
  if (!open) return null;
  const destination = signupUrl || signup;
  return <div className="demo-welcome-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false); }}>
    <section className="demo-welcome-dialog" role="dialog" aria-modal="true" aria-labelledby="demo-welcome-title">
      <button type="button" className="demo-welcome-close" aria-label={es ? "Cerrar ventana" : "Close popup"} onClick={() => setOpen(false)}>×</button>
      <h2 id="demo-welcome-title">{es ? 'Inteligencia conectada. Flujos de trabajo simplificados.' : 'Connected intelligence. Simplified workflows.'}</h2>
      <p>{realEstate ? (es ? 'Propiedades, compradores, vendedores, visitas, ofertas y documentos: todo tu flujo inmobiliario en un solo espacio de trabajo.' : 'Properties, buyers, sellers, showings, offers, and documents—your entire real estate workflow in one workspace.') : (es ? 'Pólizas, clientes, cotizaciones, renovaciones, reclamaciones y documentos en un solo espacio de trabajo.' : 'Policies, clients, quotes, renewals, claims, and documents—your entire workflow in one workspace.')}</p>
      <div className="demo-welcome-example">{realEstate ? (es ? '“Encuentra propiedades que se ajusten al presupuesto de Maya y redacta un mensaje para programar una visita.”' : '“Find properties matching Maya’s budget and draft a follow-up message to schedule a showing.”') : (es ? '“Busca el expediente de María y redacta un correo para confirmar su cita de mañana.”' : '“Find María’s file and draft an email confirming her appointment tomorrow.”')}</div>
      <p>{es ? 'Pide a tu agente de IA que busque información, prepare mensajes y automatice tareas conectadas en segundos.' : 'Ask your AI agent to find information, prepare messages, and automate connected tasks in seconds.'}</p>
      <p><strong>{es ? 'Conecta WhatsApp.' : 'Connect WhatsApp.'}</strong> {es ? 'Tu agente de IA comprende los mensajes entrantes y responde con respuestas personalizadas.' : 'Your AI agent understands incoming messages and responds with personalized answers.'}</p>
      <div className="demo-welcome-divider" />
      <h3>{es ? 'Nuestro equipo está aquí para ayudarte, las 24 horas.' : 'Our team is here for you, 24/7.'}</h3>
      <p>{es ? 'Tu plan incluye la configuración inicial y del espacio de trabajo, sin costo adicional de configuración.' : 'Your plan includes setup and workspace configuration—what you want to add, change, or leave out—at no extra setup cost.'}</p>
      <div className="demo-welcome-footer"><a href={destination} className="demo-welcome-start">{es ? "Comenzar" : "Get Started"}</a></div>
    </section>
  </div>;
}
