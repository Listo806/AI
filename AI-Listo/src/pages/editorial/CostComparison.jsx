import React from "react";
import {
  BarChart3,
  Bot,
  CalendarDays,
  Check,
  CircleDollarSign,
  ContactRound,
  Info,
  Layers3,
  MessageCircle,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import headlogo from "../../assets/cortexa/logoicon.png";
const COPY = {
  en: {
    eyebrow: "CORTEXA VS. LEGACY PLATFORMS",
    title1: "Powerful infrastructure.",
    title2: "Built-in AI.",
    title3: "One connected platform.",
    feature: "Feature",
    salesforce: "Salesforce",
    hubspot: "HubSpot",
    cortexaSub: "AI REVENUE OS",
    rows: [
      ["Team Size", "5 Users", "5 Users", "5 Users"],
      ["Monthly Software", "$1,500/month", "$750/month", "$397/month"],
      ["One-Time Setup", "$4,000+", "$1,500+", "$0"],
      ["Annual Software", "$18,000", "$9,000", "$4,764"],
      ["Total Annual Platform Cost", "$22,000+", "$10,500+", "$4,764"],
      ["CRM", true, true, true],
      ["Agentic AI", "Add-on", "Limited", "Included"],
      ["AI Usage", "Add-on", "Add-on", "Unlimited"],
      ["Team Workspace", "Separate Tool", "Limited", "Included"],
      ["Revenue Intelligence", "Add-on", "Limited", "Included"],
      ["WhatsApp AI", "Third-Party", "Third-Party", "Native"],
      ["Industry Customization", "Consulting Project", "Consulting Project", "Custom Configuration"],
      ["Unified Platform", "No", "Partial", "Yes"],
    ],
    note:
      "Pricing shown is based on publicly available information and Cortexa pricing at the time of publication. Pricing, features, implementation requirements, and licensing may change. Please verify current pricing directly with each vendor.",
  },
  es: {
    eyebrow: "CORTEXA VS. PLATAFORMAS TRADICIONALES",
    title1: "Infraestructura potente.",
    title2: "IA integrada.",
    title3: "Una plataforma conectada.",
    feature: "Función",
    salesforce: "Salesforce",
    hubspot: "HubSpot",
    cortexaSub: "SISTEMA DE INGRESOS CON IA",
    rows: [
      ["Tamaño del equipo", "5 usuarios", "5 usuarios", "5 usuarios"],
      ["Software mensual", "$1,500/mes", "$750/mes", "$397/mes"],
      ["Configuración inicial", "$4,000+", "$1,500+", "$0"],
      ["Software anual", "$18,000", "$9,000", "$4,764"],
      ["Costo anual total de la plataforma", "$22,000+", "$10,500+", "$4,764"],
      ["CRM", true, true, true],
      ["IA agéntica", "Complemento", "Limitada", "Incluida"],
      ["Uso de IA", "Complemento", "Complemento", "Ilimitado"],
      ["Espacio de trabajo del equipo", "Herramienta separada", "Limitado", "Incluido"],
      ["Inteligencia de ingresos", "Complemento", "Limitada", "Incluida"],
      ["WhatsApp con IA", "Terceros", "Terceros", "Nativo"],
      ["Personalización por industria", "Proyecto de consultoría", "Proyecto de consultoría", "Configuración personalizada"],
      ["Plataforma unificada", "No", "Parcial", "Sí"],
    ],
    note:
      "Los precios mostrados se basan en información pública y en los precios de Cortexa disponibles en la fecha de publicación. Los precios, funciones, requisitos de implementación y licencias pueden cambiar. Verifica los precios actuales directamente con cada proveedor.",
  },
  pt: {
    eyebrow: "CORTEXA VS. PLATAFORMAS TRADICIONAIS",
    title1: "Infraestrutura poderosa.",
    title2: "IA integrada.",
    title3: "Uma plataforma conectada.",
    feature: "Recurso",
    salesforce: "Salesforce",
    hubspot: "HubSpot",
    cortexaSub: "SISTEMA DE RECEITA COM IA",
    rows: [
      ["Tamanho da equipe", "5 usuários", "5 usuários", "5 usuários"],
      ["Software mensal", "$1.500/mês", "$750/mês", "$397/mês"],
      ["Configuração inicial", "$4.000+", "$1.500+", "$0"],
      ["Software anual", "$18.000", "$9.000", "$5.964"],
      ["Custo anual total da plataforma", "$22.000+", "$10.500+", "$6.061"],
      ["CRM", true, true, true],
      ["IA agêntica", "Complemento", "Limitada", "Incluída"],
      ["Uso de IA", "Complemento", "Complemento", "Ilimitado"],
      ["Espaço de trabalho da equipe", "Ferramenta separada", "Limitado", "Incluído"],
      ["Inteligência de receita", "Complemento", "Limitada", "Incluída"],
      ["WhatsApp com IA", "Terceiros", "Terceiros", "Nativo"],
      ["Personalização por setor", "Projeto de consultoria", "Projeto de consultoria", "Configuração personalizada"],
      ["Plataforma unificada", "Não", "Parcial", "Sim"],
    ],
    note:
      "Os preços apresentados se baseiam em informações públicas e nos preços da Cortexa disponíveis na data de publicação. Preços, recursos, requisitos de implementação e licenciamento podem mudar. Verifique os preços atuais diretamente com cada fornecedor.",
  },
};

const ICONS = [
  Users,
  CircleDollarSign,
  Wrench,
  CalendarDays,
  CircleDollarSign,
  ContactRound,
  Sparkles,
  Bot,
  Users,
  BarChart3,
  MessageCircle,
  SlidersHorizontal,
  Layers3,
];

function BrandHeader({ type, copy }) {
  if (type === "salesforce") {
    return (
      <div className="cmp-brand cmp-brand-salesforce">
        <span className="cmp-brand-mark">salesforce</span>
        <strong>{copy.salesforce}</strong>
      </div>
    );
  }

  if (type === "hubspot") {
    return (
      <div className="cmp-brand cmp-brand-hubspot">
        <strong className="cmp-hubspot-word">HubSp<span>o</span>t</strong>
        <small>{copy.hubspot}</small>
      </div>
    );
  }

  return (
    <div className="cmp-brand cmp-brand-cortexa">
      <img src={headlogo} className="cx-logo-img" />
      <strong>CORTEXA</strong>
      <small>{copy.cortexaSub}</small>
    </div>
  );
}

function ValueCell({ value, cortexa = false }) {
  if (value === true) {
    return (
      <span className={`cmp-status cmp-status-yes${cortexa ? " is-cortexa" : ""}`}>
        <Check size={26} strokeWidth={2.2} />
      </span>
    );
  }

  return (
    <span className={cortexa ? "cmp-value-cortexa" : "cmp-value"}>
      {value}
    </span>
  );
}

export default function CostComparison({ locale = "en" }) {
  const copy = COPY[locale] || COPY.en;

  return (
    <section className="cmp cmp-clean" aria-labelledby={`comparison-title-${locale}`}>
      <div className="cmp-shell">
        <header className="cmp-heading cmp-clean-heading">
          <span>{copy.eyebrow}</span>
          <h3 id={`comparison-title-${locale}`}>
            {copy.title1}<br />
            {copy.title2}<br />
            <em>{copy.title3}</em>
          </h3>
        </header>

        <div className="cmp-table-card cmp-clean-table-card">
          <div className="cmp-scroll">
            <table className="cmp-table cmp-clean-table">
              <thead>
                <tr>
                  <th className="cmp-feature-col">{copy.feature}</th>
                  <th><BrandHeader type="salesforce" copy={copy} /></th>
                  <th><BrandHeader type="hubspot" copy={copy} /></th>
                  <th className="cmp-cortexa-col"><BrandHeader type="cortexa" copy={copy} /></th>
                </tr>
              </thead>

              <tbody>
                {copy.rows.map(([label, sf, hs, cx], index) => {
                  const Icon = ICONS[index] || Settings;
                  const isTotal = index === 4;

                  return (
                    <tr key={label} className={isTotal ? "cmp-total-row" : ""}>
                      <td className="cmp-feature-col">
                        <span className="cmp-feature-label">
                          <Icon size={23} strokeWidth={1.9} aria-hidden="true" />
                          <span>{label}</span>
                        </span>
                      </td>
                      <td><ValueCell value={sf} /></td>
                      <td><ValueCell value={hs} /></td>
                      <td className="cmp-cortexa-col"><ValueCell value={cx} cortexa /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="cmp-disclaimer">
          <Info size={26} strokeWidth={1.9} aria-hidden="true" />
          <p>{copy.note}</p>
        </div>
      </div>
    </section>
  );
}