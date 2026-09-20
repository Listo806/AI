import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, BarChart3, Bot, Box, Check, Code2, FileSearch, Gift,
  Globe2, Menu, Monitor, Network, Pencil, RefreshCw, Rocket, Settings,
  Shield, SlidersHorizontal, Target, UsersRound, X,
} from "lucide-react";
import headlogoImg from "../../assets/cortexa/headlogo.png";
import footdarklogoImg from "../../assets/cortexa/headlogotran.png";
import { useAuth } from "../../context/AuthContext";
import "./WebSolutions.css";

const REVIEW_PATH = "/web-solutions/free-review";
const HREFS = ["/#features","/#ai-assistant","/#automation","/#pipeline","/#analytics","/pricing","/editorial/the-end-of-legacy-crm","/web-solutions","/trial?flow=free-access&plan=free"];

const COPY = {
  en: {
    nav:["Features","AI Assistant","AI Workflows","Pipeline","Analytics","Pricing","Cost Calculator","Web & Software Development|Systems Integration","Get Started"],
    hero:{eyebrow:"CORTEXA WEB & SOFTWARE DEVELOPMENT",title1:"SOFTWARE DEVELOPMENT +",title2:"SYSTEMS INTEGRATION",gradient:"Design. Develop. Modernize. Connect.",desc:"We build and improve websites, digital products, customer portals, and business software—then connect them to your CRM, AI agent, payments, appointments, communications, automation, and data.",lead:"Start with a free professional evaluation.",button:"Request Your Free Evaluation",note:"No payment. No obligation."},
    trust:[["Website + technology assessment","We start with your website to understand your goals, audience, and current setup."],["Built around your business","Recommendations are tailored to your industry, tools, and growth goals."],["Clear scope before development","You’ll know exactly what we’ll build, why it matters, and what it will cost."]],
    design:{title:"What We Design, Develop, and Connect.",lead:"From a professional website to a connected business platform, every solution is designed around how your company operates and grows.",items:[["Web Development","Professional websites, landing pages, e-commerce experiences, and responsive web platforms."],["Custom Software Development","Business applications, customer portals, dashboards, and purpose-built internal systems."],["Digital Product Engineering","Product strategy, UX/UI, prototypes, MVPs, frontend, backend, testing, and deployment."],["Redesign + Modernization","Improve outdated websites and platforms for better design, mobile usability, speed, and conversion."],["CRM, AI + Systems Integration","Connect customer records, AI agents, payments, scheduling, communications, analytics, and existing tools."],["APIs + Automation","Connect systems and automate lead routing, follow-ups, notifications, tasks, and customer journeys."]]},
    build:{title:"Build New—or Modernize What You Already Have.",leftTitle:"Build Something New",left:["Business websites","Web applications","Customer portals","Internal platforms","MVPs and digital products","E-commerce systems"],rightTitle:"Modernize What Exists",right:["Website redesign","Platform restructuring","Mobile optimization","Performance improvements","New functionality","CRM, AI, payment, and scheduling integrations"],note:"We build, rebuild, improve, and connect—according to what your business actually needs."},
    outcomes:{eyebrow:"BUILT FOR BUSINESS OUTCOMES",title:"Technology Should Do More Than Look Impressive.",lead:"Every solution should improve how customers experience your business and how your team operates behind the scenes. We connect strategy, design, software, and automation around measurable business needs.",items:[["Create Better Customer Experiences","Build clear, intuitive journeys that help people understand your value, find what they need, and take the next step."],["Improve Operational Efficiency","Connect systems, reduce repetitive work, and give your team better visibility across customers, tasks, communications, and results."],["Prepare for Sustainable Growth","Develop flexible digital foundations that can support new services, integrations, users, locations, and customer demand."]],note:"Built around the way your business works—not around a generic template."},
    lifecycle:{eyebrow:"BUILT DIRECTION TO DELIVERY",title:"A Development Partner for the Complete Lifecycle.",lead:"We help define what should be built, choose the right approach, execute the work, connect the required systems, and support the solution as your business evolves.",items:[["Strategy + Discovery","Understand the business, audience, existing technology, operational challenges, and strongest opportunities before development begins."],["Experience + Product Design","Translate requirements into clear customer journeys, thoughtful interfaces, practical functionality, and a cohesive digital experience."],["Engineering + Integration","Develop the frontend, backend, APIs, automation, and system connections required to make the solution work as one."],["Launch + Continued Improvement","Test, deploy, monitor, maintain, and expand the solution as new needs, integrations, and opportunities emerge."]],strip:[["Designed around your operation","Solutions that fit how your business works."],["Clear deliverables and project scope","You’ll know what’s included before we build."],["Built to connect, evolve, and scale","A stronger foundation for long-term growth."]]},
    review:{title:"Start with a free professional review.",lead:"Send us your website URL or tell us what you want to build. Our team will review your current experience, technology, missing functionality, integrations, and conversion opportunities.",free:"Your professional review is free.",price:"If you choose to proceed, professional development services start at",button:"Request Your Free Review",items:[["Website + Technology Assessment","A review of your current website and technology setup."],["Problems and Opportunities","Key issues, gaps, and areas for improvement."],["Recommended Improvements","Practical suggestions tailored to your business goals."],["Proposed Scope and Quotation","A clear plan with deliverables and a fixed cost."]]},
    footer:["© 2026 Cortexa. All rights reserved.","Privacy","Terms","Contact","Dashboard","Log in"]
  },
  es: null,
  pt: null,
};
COPY.es = {...COPY.en, nav:["Funciones","Asistente IA","Flujos de IA","Pipeline","Analítica","Precios","Calculadora de Costes","Desarrollo Web y de Software|Integración de Sistemas","Comenzar"], footer:["© 2026 Cortexa. Todos los derechos reservados.","Privacidad","Términos","Contacto","Panel","Iniciar sesión"]};
COPY.pt = {...COPY.en, nav:["Recursos","Assistente IA","Fluxos de IA","Pipeline","Análises","Preços","Calculadora de Custos","Desenvolvimento Web e de Software|Integração de Sistemas","Começar"], footer:["© 2026 Cortexa. Todos os direitos reservados.","Privacidade","Termos","Contato","Painel","Entrar"]};

const DESIGN_ICONS=[Monitor,Code2,Box,RefreshCw,Network,Settings];
const OUTCOME_ICONS=[UsersRound,BarChart3,ArrowRight];
const LIFE_ICONS=[FileSearch,Pencil,Code2,Settings];
const STRIP_ICONS=[Target,FileSearch,BarChart3];
const REVIEW_ICONS=[FileSearch,FileSearch,Bot,FileSearch];

function Language({lang,setLang,footer=false}){
  const [open,setOpen]=useState(false);
  return <div className={`ws-language ${footer?"ws-language-footer":""}`}>
    <button type="button" className="ws-language-button" onClick={()=>setOpen(v=>!v)} aria-label="Language"><Globe2 size={18}/></button>
    {open&&<div className="ws-language-menu">{[["en","English"],["es","Español"],["pt","Português"]].map(([v,l])=><button key={v} className={lang===v?"active":""} onClick={()=>{setLang(v);setOpen(false)}}>{l}</button>)}</div>}
  </div>;
}

function NavLabel({label,desktop=false}){
  const parts=String(label).split("|");
  if(parts.length===1) return label;
  return desktop ? <span className="ws-nav-development-label"><span>{parts[0]}</span><span>{parts[1]}</span></span> : parts.join(" ");
}

function Header({tr,lang,setLang}){
  const {isAuthenticated}=useAuth();
  const [mobileOpen,setMobileOpen]=useState(false);
  return <header className="ws-header">
    <div className="ws-header-inner">
      <Link to="/" className="ws-brand"><img src={headlogoImg} alt="CORTEXA"/></Link>
      <nav className="ws-nav">{tr.nav.map((l,i)=><a key={i} href={HREFS[i]} className={`${i===7?"ws-nav-development active":""}`}><NavLabel label={l} desktop/></a>)}</nav>
      <div className="ws-header-actions"><Language lang={lang} setLang={setLang}/><a href={isAuthenticated?"/dashboard/home":"/sign-in"}>{isAuthenticated?tr.footer[4]:tr.footer[5]}</a></div>
      <button className="ws-menu-btn" type="button" onClick={()=>setMobileOpen(v=>!v)} aria-label="Menu">{mobileOpen?<X/>:<Menu/>}</button>
    </div>
    {mobileOpen&&<div className="ws-mobile-menu">{tr.nav.map((l,i)=><a key={i} href={HREFS[i]} className={i===7?"active":""}><NavLabel label={l}/></a>)}<div className="ws-mobile-menu-bottom"><Language lang={lang} setLang={setLang}/><a href={isAuthenticated?"/dashboard/home":"/sign-in"}>{isAuthenticated?tr.footer[4]:tr.footer[5]}</a></div></div>}
  </header>;
}

function Footer({tr,lang,setLang}){
  const {isAuthenticated}=useAuth();
  return <footer className="ws-footer"><div className="ws-container ws-footer-inner">
    <Link to="/" className="ws-footer-brand"><picture><source media="(max-width: 900px)" srcSet={footdarklogoImg}/><img src={headlogoImg} alt="CORTEXA"/></picture></Link>
    <nav>{tr.nav.map((l,i)=><a key={i} href={HREFS[i]}>{String(l).replace("|"," ")}</a>)}</nav>
    <div className="ws-footer-actions"><Language lang={lang} setLang={setLang} footer/><a href={isAuthenticated?"/dashboard/home":"/sign-in"}>{isAuthenticated?tr.footer[4]:tr.footer[5]}</a></div>
  </div><div className="ws-container ws-footer-bottom"><span>{tr.footer[0]}</span><div><a href="/privacy">{tr.footer[1]}</a><a href="/terms">{tr.footer[2]}</a><a href="mailto:support@cortexaaicrm.com">{tr.footer[3]}</a></div></div></footer>;
}

function ReviewButton({children}){return <Link className="ws-review-btn" to={REVIEW_PATH}><span>{children}</span><ArrowRight size={18}/></Link>}
function CheckList({items}){return <ul>{items.map(x=><li key={x}><Check size={16}/><span>{x}</span></li>)}</ul>}

export default function WebSolutions(){
  const [lang,setLangState]=useState(()=>localStorage.getItem("cortexa_lang")||"en");
  const setLang=(v)=>{setLangState(v);localStorage.setItem("cortexa_lang",v);localStorage.setItem("cortexa_locale",v);document.documentElement.lang=v==="pt"?"pt-BR":v};
  useEffect(()=>{document.documentElement.lang=lang==="pt"?"pt-BR":lang},[lang]);
  const tr=COPY[lang]||COPY.en;
  return <div className="ws-page"><Header tr={tr} lang={lang} setLang={setLang}/><main>
    <section className="ws-hero"><div className="ws-container">
      <div className="ws-eyebrow">{tr.hero.eyebrow}</div>
      <h1>{tr.hero.title1}<br/>{tr.hero.title2}</h1>
      <h2>{tr.hero.gradient}</h2>
      <p>{tr.hero.desc}</p><strong className="ws-hero-lead">{tr.hero.lead}</strong>
      <ReviewButton>{tr.hero.button}</ReviewButton><small>{tr.hero.note}</small>
    </div></section>

    <section className="ws-trust-strip"><div className="ws-container ws-trust-grid">{tr.trust.map(([t,p],i)=>{const I=[FileSearch,Settings,Shield][i];return <article key={t}><I/><div><b>{t}</b><p>{p}</p></div></article>})}</div></section>

    <section className="ws-section ws-design"><div className="ws-container"><h2>{tr.design.title}</h2><p className="ws-section-lead">{tr.design.lead}</p><div className="ws-design-grid">{tr.design.items.map(([t,p],i)=>{const I=DESIGN_ICONS[i];return <article key={t}><I/><div><h3>{t}</h3><p>{p}</p></div></article>})}</div></div></section>

    <section className="ws-section ws-build"><div className="ws-container"><h2>{tr.build.title}</h2><div className="ws-build-grid"><article><Rocket/><div><h3>{tr.build.leftTitle}</h3><CheckList items={tr.build.left}/></div></article><article><Box/><div><h3>{tr.build.rightTitle}</h3><CheckList items={tr.build.right}/></div></article></div><p className="ws-build-note">{tr.build.note}</p></div></section>

    <section className="ws-section ws-outcomes"><div className="ws-container"><div className="ws-eyebrow">{tr.outcomes.eyebrow}</div><h2>{tr.outcomes.title}</h2><p className="ws-section-lead">{tr.outcomes.lead}</p><div className="ws-outcome-grid">{tr.outcomes.items.map(([t,p],i)=>{const I=OUTCOME_ICONS[i];return <article key={t}><I/><h3>{t}</h3><p>{p}</p></article>})}</div><strong className="ws-outcome-note">{tr.outcomes.note}</strong></div></section>

    <section className="ws-lifecycle"><div className="ws-container ws-life-main"><div className="ws-life-intro"><div className="ws-eyebrow">{tr.lifecycle.eyebrow}</div><h2>{tr.lifecycle.title}</h2><p>{tr.lifecycle.lead}</p></div><div className="ws-life-grid">{tr.lifecycle.items.map(([t,p],i)=>{const I=LIFE_ICONS[i];return <article key={t}><I/><div><h3>{t}</h3><p>{p}</p></div></article>})}</div></div><div className="ws-container ws-life-strip">{tr.lifecycle.strip.map(([t,p],i)=>{const I=STRIP_ICONS[i];return <article key={t}><I/><div><h3>{t}</h3><p>{p}</p></div></article>})}</div></section>

    <section className="ws-dark-review"><div className="ws-container"><div className="ws-dark-top"><div><h2>{tr.review.title}</h2><p>{tr.review.lead}</p></div><aside><Gift/><div><h3>{tr.review.free}</h3><p>{tr.review.price} <strong>$147.</strong></p></div></aside></div><div className="ws-review-items">{tr.review.items.map(([t,p],i)=>{const I=REVIEW_ICONS[i];return <article key={t}><I/><h3>{t}</h3><p>{p}</p></article>})}</div><ReviewButton>{tr.review.button}</ReviewButton></div></section>
  </main><Footer tr={tr} lang={lang} setLang={setLang}/></div>;
}
