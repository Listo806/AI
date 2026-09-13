import React, { useMemo, useState } from "react";
import { Check, UserRound, UsersRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import SiteLayout from "../../components/layout/SiteLayout";
import "./AiHelpPricingPage.css";

const COPY = {
  en:{title:"Transparent pricing for every team.",monthly:"Billed monthly",annually:"Billed annually",save20:"Save 20%",trialNote:"Solo, Business, and Scale plans include a 14-day trial.",toStart:"to start",oneTime:"one-time activation",perMonth:"/month",billedAnnually:"billed annually",perYear:"/year",startTrial:"Start Free Trial",features:"FEATURES:",workspace:"1 Workspace Included",user:"User Included",users:"Users Included",solo:{name:"Solo Plan",desc:"Everything you need to start getting started."},business:{name:"Business Plan",desc:"More tools. Smarter workflows. More power."},scale:{name:"Scale Plan",desc:"All the power you need to grow without limits."}},
  es:{title:"Precios transparentes para cada equipo.",monthly:"Facturación mensual",annually:"Facturación anual",save20:"Ahorra 20%",trialNote:"Los planes Solo, Business y Scale incluyen una prueba de 14 días.",toStart:"para empezar",oneTime:"activación única",perMonth:"/mes",billedAnnually:"facturado anualmente",perYear:"/año",startTrial:"Iniciar prueba gratis",features:"FUNCIONES:",workspace:"1 espacio de trabajo incluido",user:"Usuario incluido",users:"Usuarios incluidos",solo:{name:"Plan Solo",desc:"Todo lo que necesitas para comenzar."},business:{name:"Plan Business",desc:"Más herramientas. Flujos más inteligentes. Más potencia."},scale:{name:"Plan Scale",desc:"Todo el poder que necesitas para crecer sin límites."}},
  pt:{title:"Preços transparentes para cada equipe.",monthly:"Cobrança mensal",annually:"Cobrança anual",save20:"Economize 20%",trialNote:"Os planos Solo, Business e Scale incluem teste gratuito de 14 dias.",toStart:"para começar",oneTime:"ativação única",perMonth:"/mês",billedAnnually:"cobrado anualmente",perYear:"/ano",startTrial:"Iniciar teste grátis",features:"RECURSOS:",workspace:"1 workspace incluído",user:"Usuário incluído",users:"Usuários incluídos",solo:{name:"Plano Solo",desc:"Tudo o que você precisa para começar."},business:{name:"Plano Business",desc:"Mais ferramentas. Fluxos mais inteligentes. Mais potência."},scale:{name:"Plano Scale",desc:"Todo o poder que você precisa para crescer sem limites."}}
};

const PLANS = [
 {key:"solo",activation:11,monthly:127,users:1,features:["Full CRM & Contact Management","Lead & Pipeline Management","Advanced Dashboard & Insights","AI Chat (Standard)","AI Conversations (250/mo)","Workflow Builder (25/mo)","Advanced Automations","Calendar & Scheduling","Documents & File Storage","Custom Fields (Standard)","Forms & Surveys","Web Forms","Integrations (Core)","API Access (Limited)","Mobile App Access","Priority Support (Email)"]},
 {key:"business",activation:22,monthly:297,users:3,featured:true,features:["Team Workspace (3 Users)","Advanced Permissions & Roles","Advanced Reports & Analytics","Custom Dashboards","Custom Objects & Fields","Advanced Workflow Builder","Multi-Pipeline Management","AI Chat (Advanced)","AI Conversations (1,000/mo)","Lead Scoring & Qualification","Smart Segmentation","Documents & eSignatures","Integrations (Zapier, Make, etc.)","API Access (Standard)","Advanced Search & Filters","Priority Support (Email & Chat)"]},
 {key:"scale",activation:33,monthly:397,users:5,features:["Team Workspace (5 Users)","Unlimited AI Usage","AI Chat (Premium)","AI Conversations (Unlimited)","Advanced Automations (Unlimited)","Multi-Pipeline Management (Advanced)","Advanced Lead Scoring","Predictive Analytics","Custom Integrations","API Access (Advanced)","White Label (Your Brand)","Custom Domain","SLA & Uptime Guarantee","Priority Phone Support","Dedicated Account Manager","Onboarding & Implementation","Premium Support (24/7)"]}
];

const money=(v)=>Number(v).toLocaleString("en-US",{minimumFractionDigits:Number(v)%1===0?0:2,maximumFractionDigits:2});

export default function AiHelpPricingPage(){
  const { i18n } = useTranslation();
  const [billing,setBilling]=useState("monthly");
  const lang=(i18n.resolvedLanguage||i18n.language||"en").split("-")[0].toLowerCase();
  const c=COPY[lang]||COPY.en;

  const plans=useMemo(()=>PLANS.map(p=>{
    const annualMonthly=Number((p.monthly*.8).toFixed(2));
    return {...p,annualMonthly,annualTotal:Number((annualMonthly*12).toFixed(2))};
  }),[]);

  return (
    <SiteLayout headerVariant="dark">
      <main className="lq-ai-pricing-page">
        <div className="lq-ai-pricing-shell">
          <header className="lq-ai-pricing-header">
            <h1>{c.title}</h1>
            <div className="lq-ai-pricing-toggle">
              <span>{c.monthly}</span>
              <button type="button" className={`lq-ai-pricing-switch ${billing==="annual"?"annual":""}`} onClick={()=>setBilling(v=>v==="monthly"?"annual":"monthly")}><i/></button>
              <span>{c.annually}</span>
              <strong>{c.save20}</strong>
            </div>
          </header>

          <section className="lq-ai-pricing-grid">
            {plans.map(plan=>{
              const pc=c[plan.key];
              const recurring=billing==="monthly"?plan.monthly:plan.annualMonthly;
              return (
                <article key={plan.key} className={`lq-ai-price-card ${plan.featured?"featured":""}`}>
                  <h2>{pc.name}</h2>
                  <p className="lq-ai-price-card-desc">{pc.desc}</p>
                  <div className="lq-ai-activation-price"><strong>${money(plan.activation)}</strong><span>{c.toStart}</span></div>
                  <div className="lq-ai-included-row">
                    <span><Check size={15}/>{c.workspace}</span>
                    <span>{plan.users===1?<UserRound size={15}/>:<UsersRound size={15}/>} {plan.users} {plan.users===1?c.user:c.users}</span>
                  </div>
                  <div className="lq-ai-activation-note">${money(plan.activation)} {c.oneTime}</div>
                  <div className="lq-ai-card-divider"/>
                  <div className="lq-ai-recurring-price"><strong>${money(recurring)}</strong><span>{c.perMonth}</span></div>
                  {billing==="annual" && <div className="lq-ai-year-total">${money(plan.annualTotal)} {c.perYear} · {c.billedAnnually}</div>}
                  <a className="lq-ai-trial-btn" href={`https://www.cortexaaicrm.com/trial?plan=${plan.key}&billing=${billing}`}>{c.startTrial}</a>
                  <div className="lq-ai-card-divider"/>
                  <h3>{c.features}</h3>
                  <ul>{plan.features.map(f=><li key={f}><Check size={17}/><span>{f}</span></li>)}</ul>
                </article>
              );
            })}
          </section>
          <p className="lq-ai-pricing-trial-note">{c.trialNote}</p>
        </div>
      </main>
    </SiteLayout>
  );
}
