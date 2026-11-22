import React, { useEffect, useRef, useState } from 'react';
import './demo-welcome-popup.css';

/** A visit is one mounted demo session; refresh starts a new visit. */
export default function DemoWelcomePopup({ realEstate = false, signupUrl }) {
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
  const destination = signupUrl || (realEstate
    ? 'https://listoqasa.com/marketplace/signup?audience=agent'
    : 'https://www.cortexaaicrm.com/es-ec/trial?flow=free-access&plan=free');
  return <div className="demo-welcome-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false); }}>
    <section className="demo-welcome-dialog" role="dialog" aria-modal="true" aria-labelledby="demo-welcome-title">
      <button type="button" className="demo-welcome-close" aria-label="Close popup" onClick={() => setOpen(false)}>×</button>
      <h2 id="demo-welcome-title">Connected intelligence. Simplified workflows.</h2>
      <p>{realEstate
        ? 'Properties, buyers, sellers, showings, offers, and documents—your entire real estate workflow in one workspace.'
        : 'Policies, clients, quotes, renewals, claims, and documents—your entire workflow in one workspace.'}</p>
      <div className="demo-welcome-example">{realEstate
        ? '“Find properties matching Maya’s budget and draft a follow-up message to schedule a showing.”'
        : '“Find María’s file and draft an email confirming her appointment tomorrow.”'}</div>
      <p>Ask your AI agent to find information, prepare messages, and automate connected tasks in seconds.</p>
      <p><strong>Connect WhatsApp.</strong> Your AI agent understands incoming messages and responds with personalized answers.</p>
      <div className="demo-welcome-divider" />
      <h3>Our team is here for you, 24/7.</h3>
      <p>Your plan includes setup and workspace configuration—what you want to add, change, or leave out—at no extra setup cost.</p>
      <div className="demo-welcome-footer"><a href={destination} className="demo-welcome-start">Get Started</a></div>
    </section>
  </div>;
}
