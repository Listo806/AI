import React, { useState } from "react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import "./AiHelpPricingPage.css";

const FEATURES = [
  ["Full CRM & Contact Management", "Lead & Pipeline Management", "Advanced Dashboard, Reports & Analytics", "Team Workspace with Advanced Permissions & Roles", "Custom Dashboards, Objects & Fields", "Premium AI Chat", "Unlimited AI Usage & Conversations", "Advanced Workflow Builder", "Advanced Automations (Unlimited)", "Calendar & Scheduling", "Documents, File Storage & eSignatures", "Forms & Surveys", "Web Forms", "Integrations (Core, Zapier, Make & Custom)"],
  ["Advanced API Access", "Mobile App Access", "Lead Scoring & Qualification (Advanced)", "Smart Segmentation", "Multi-Pipeline Management (Advanced)", "Advanced Search & Filters", "Predictive Analytics", "White Label (Your Brand)", "Custom Domain", "SLA & Uptime Guarantee", "Priority Support (Email, Chat, Phone & 24/7)", "Dedicated Account Manager", "Onboarding & Implementation"]
];
const COPY = {
  en: { title: "Agentic CRM", monthly: "Billed monthly", annual: "Billed annually", save: "Save 20%", heading: "All the Tools You Need", perMonth: "/month", year: "billed annually", cta: "Get Started", features: "FEATURES INCLUDED:" },
  es: { title: "CRM Agéntico", monthly: "Facturación mensual", annual: "Facturación anual", save: "Ahorra 20%", heading: "Todas las herramientas que necesitas", perMonth: "/mes", year: "facturado anualmente", cta: "Comenzar", features: "FUNCIONES INCLUIDAS:" },
  pt: { title: "CRM Agêntico", monthly: "Cobrança mensal", annual: "Cobrança anual", save: "Economize 20%", heading: "Todas as ferramentas de que você precisa", perMonth: "/mês", year: "cobrado anualmente", cta: "Começar", features: "RECURSOS INCLUÍDOS:" }
};
const formatPrice = value => Number(value).toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 });
export default function AiHelpPricingPage() {
  const { i18n } = useTranslation();
  const [billing, setBilling] = useState("monthly");
  const lang = (i18n.resolvedLanguage || i18n.language || "en").split("-")[0].toLowerCase();
  const c = COPY[lang] || COPY.en;
  const annual = billing === "annual";
  const price = annual ? 101.60 : 127;
  const href = `https://www.cortexaaicrm.com/trial?plan=solo&billing=${annual ? "annual" : "monthly"}`;
  return (
    <>
      <main className="lq-ai-pricing-page">
        <div className="lq-ai-pricing-shell">
          <header className="lq-ai-pricing-header">
            <h1>{c.title}</h1>
            <div className="lq-ai-pricing-toggle">
              <span className={!annual ? "selected" : ""}>{c.monthly}</span>
              <button type="button" className={`lq-ai-pricing-switch ${annual ? "annual" : ""}`} role="switch" aria-checked={annual} aria-label={c.annual} onClick={() => setBilling(v => v === "monthly" ? "annual" : "monthly")}><i /></button>
              <span className={annual ? "selected" : ""}>{c.annual}</span>
              <strong>{c.save}</strong>
            </div>
          </header>
          <section className="lq-ai-single-card" aria-label={c.title}>
            <h2>{c.heading}</h2>
            <div className="lq-ai-single-price"><strong>${formatPrice(price)}</strong><span>{c.perMonth}</span></div>
            {annual && <p className="lq-ai-single-year">${formatPrice(1219.20)} {c.year}</p>}
            <a className="lq-ai-single-cta" href={href}>{c.cta}</a>
            <div className="lq-ai-single-divider" />
            <h3>{c.features}</h3>
            <div className="lq-ai-feature-columns">
              {FEATURES.map((column, index) => (
                <ul key={index}>{column.map(feature => <li key={feature}><Check size={19} aria-hidden="true" /><span>{feature}</span></li>)}</ul>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
