import React,{useEffect,useState} from "react";
import {Link} from "react-router-dom";
import {Check,ChevronDown,Globe2} from "lucide-react";
import headlogoImg from "../../assets/cortexa/headlogo.png";
import {useAuth} from "../../context/AuthContext";
import {trackEvent} from "../../utils/track";
import "./FreeWebsiteReview.css";

const API_BASE="https://backend.cortexaaicrm.com";
const HREFS=["/#features","/#ai-assistant","/#automation","/#pipeline","/#analytics","/pricing","/editorial/the-end-of-legacy-crm","/web-solutions","/trial?flow=free-access&plan=free"];
const COPY={
en:{
nav:["Features","AI Assistant","AI Workflows","Pipeline","Analytics","Pricing","Cost Calculator","Web Solutions","Get Started"],
hero:["FREE PROJECT EVALUATION","Tell us what you need to build, connect, or manage.","Share your business goals. We’ll review your requirements and recommend the next steps."],
fields:["Full name","Business name","Business email","Phone number with country code","optional","Business type","Select your business type","Website URL","I need a new website","What do you need help with?","Select all that apply.","Tell us about your project and what you want to achieve.","Systems or tools you need to connect","Preferred contact method"],
opts:["New website or website improvements","Subscriptions & recurring billing","Custom software or customer portal","Telehealth website & integrations","CRM setup or connection","Lead capture, appointments & communications","AI agents and assistants","Analytics & tracking","AI automation and workflows","Brand & digital operations management","Systems integration, APIs & webhooks","Ongoing website & software support","Payments, merchant accounts & gateways","Other / Help me decide"],
businessTypes:["Professional Services","Healthcare / Medical","Real Estate","E-Commerce","Financial Services","Insurance","Technology / SaaS","Retail","Education","Other"],
place:["John Smith","Your business name","you@yourbusiness.com","+1 (555) 123-4567","https://www.yourwebsite.com","Describe what you need built, improved, connected, or managed...","CRM, payment provider, healthcare provider, business apps..."],
contact:["Email","Phone","WhatsApp"],
auth:"I authorize Cortexa to contact me regarding this request.",
submit:"Request Your Free Evaluation",submitting:"Submitting...",
next:["What happens next",["We review your requirements","We assess your goals, existing systems, and project needs."],["We recommend the right setup","We outline the website, CRM, AI, or integrations your business needs."],["We send your proposal","You receive a clear scope, pricing, and next steps."]],
success:["Your project evaluation request has been submitted.","Our team will review your requirements and contact you with the next steps.","Back to Web Solutions"],
errors:["Please complete all required fields.","Unable to submit your project evaluation request."],
footer:["© 2026 Cortexa. All rights reserved.","Privacy","Terms","Contact","Dashboard","Log in"]
},
es:{
nav:["Funciones","Asistente IA","Flujos de IA","Pipeline","Analítica","Precios","Calculadora de Costes","Soluciones Web","Comenzar"],
hero:["EVALUACIÓN GRATUITA DEL PROYECTO","Cuéntanos qué necesitas crear, conectar o gestionar.","Comparte los objetivos de tu negocio. Revisaremos tus requisitos y te recomendaremos los próximos pasos."],
fields:["Nombre completo","Nombre de la empresa","Email empresarial","Número de teléfono con código de país","opcional","Tipo de negocio","Selecciona tu tipo de negocio","URL del sitio web","Necesito un sitio web nuevo","¿Con qué necesitas ayuda?","Selecciona todas las opciones que correspondan.","Cuéntanos sobre tu proyecto y lo que quieres lograr.","Sistemas o herramientas que necesitas conectar","Método de contacto preferido"],
opts:["Sitio web nuevo o mejoras del sitio web","Suscripciones y facturación recurrente","Software personalizado o portal de clientes","Sitio web de telesalud e integraciones","Configuración o conexión de CRM","Captación de leads, citas y comunicaciones","Agentes y asistentes de IA","Analítica y seguimiento","Automatización y flujos de trabajo con IA","Gestión de marca y operaciones digitales","Integración de sistemas, APIs y webhooks","Soporte continuo de sitio web y software","Pagos, cuentas comerciales y pasarelas","Otro / Ayúdame a decidir"],
businessTypes:["Servicios profesionales","Salud / Medicina","Bienes raíces","Comercio electrónico","Servicios financieros","Seguros","Tecnología / SaaS","Retail","Educación","Otro"],
place:["John Smith","Nombre de tu empresa","tu@empresa.com","+1 (555) 123-4567","https://www.tusitioweb.com","Describe lo que necesitas crear, mejorar, conectar o gestionar...","CRM, proveedor de pagos, proveedor de salud, aplicaciones empresariales..."],
contact:["Email","Teléfono","WhatsApp"],
auth:"Autorizo a Cortexa a contactarme en relación con esta solicitud.",
submit:"Solicitar mi evaluación gratuita",submitting:"Enviando...",
next:["Qué sucede después",["Revisamos tus requisitos","Evaluamos tus objetivos, sistemas existentes y necesidades del proyecto."],["Recomendamos la configuración adecuada","Definimos el sitio web, CRM, IA o integraciones que necesita tu negocio."],["Enviamos tu propuesta","Recibes un alcance claro, precios y próximos pasos."]],
success:["Tu solicitud de evaluación del proyecto ha sido enviada.","Nuestro equipo revisará tus requisitos y te contactará con los próximos pasos.","Volver a Soluciones Web"],
errors:["Completa todos los campos obligatorios.","No se pudo enviar tu solicitud de evaluación."],
footer:["© 2026 Cortexa. Todos los derechos reservados.","Privacidad","Términos","Contacto","Panel","Iniciar sesión"]
},
pt:{
nav:["Recursos","Assistente IA","Fluxos de IA","Pipeline","Análises","Preços","Calculadora de Custos","Soluções Web","Começar"],
hero:["AVALIAÇÃO GRATUITA DO PROJETO","Conte-nos o que você precisa criar, conectar ou gerenciar.","Compartilhe os objetivos do seu negócio. Analisaremos seus requisitos e recomendaremos os próximos passos."],
fields:["Nome completo","Nome da empresa","E-mail comercial","Número de telefone com código do país","opcional","Tipo de negócio","Selecione o tipo do seu negócio","URL do site","Preciso de um novo site","Com o que você precisa de ajuda?","Selecione todas as opções aplicáveis.","Conte-nos sobre seu projeto e o que você deseja alcançar.","Sistemas ou ferramentas que você precisa conectar","Método de contato preferido"],
opts:["Novo site ou melhorias no site","Assinaturas e cobrança recorrente","Software personalizado ou portal do cliente","Site de telessaúde e integrações","Configuração ou conexão de CRM","Captação de leads, agendamentos e comunicações","Agentes e assistentes de IA","Análises e rastreamento","Automação e fluxos de trabalho com IA","Gestão de marca e operações digitais","Integração de sistemas, APIs e webhooks","Suporte contínuo de site e software","Pagamentos, contas comerciais e gateways","Outro / Ajude-me a decidir"],
businessTypes:["Serviços profissionais","Saúde / Medicina","Imóveis","E-Commerce","Serviços financeiros","Seguros","Tecnologia / SaaS","Varejo","Educação","Outro"],
place:["John Smith","Nome da sua empresa","voce@suaempresa.com","+1 (555) 123-4567","https://www.seusite.com","Descreva o que você precisa criar, melhorar, conectar ou gerenciar...","CRM, provedor de pagamentos, provedor de saúde, aplicativos empresariais..."],
contact:["E-mail","Telefone","WhatsApp"],
auth:"Autorizo a Cortexa a entrar em contato comigo sobre esta solicitação.",
submit:"Solicitar minha avaliação gratuita",submitting:"Enviando...",
next:["O que acontece depois",["Analisamos seus requisitos","Avaliamos seus objetivos, sistemas existentes e necessidades do projeto."],["Recomendamos a configuração certa","Definimos o site, CRM, IA ou integrações de que sua empresa precisa."],["Enviamos sua proposta","Você recebe um escopo claro, preços e próximos passos."]],
success:["Sua solicitação de avaliação do projeto foi enviada.","Nossa equipe analisará seus requisitos e entrará em contato com os próximos passos.","Voltar para Soluções Web"],
errors:["Preencha todos os campos obrigatórios.","Não foi possível enviar sua solicitação de avaliação."],
footer:["© 2026 Cortexa. Todos os direitos reservados.","Privacidade","Termos","Contato","Painel","Entrar"]
}
};
function Language({lang,setLang,footer=false}){const[open,setOpen]=useState(false);return <div className={`fwr-language ${footer?"fwr-language-footer":""}`}><button type="button" className="fwr-language-button" onClick={()=>setOpen(v=>!v)}><Globe2 size={18}/></button>{open&&<div className="fwr-language-menu">{[["en","English"],["es","Español"],["pt","Português"]].map(([v,l])=><button key={v} className={lang===v?"active":""} onClick={()=>{setLang(v);setOpen(false)}}>{l}</button>)}</div>}</div>}
function HeaderFooter({tr,lang,setLang,footer=false}){const{isAuthenticated}=useAuth();if(!footer)return <header className="fwr-header"><div className="fwr-header-inner"><Link to="/" className="fwr-brand"><img src={headlogoImg} alt="Cortexa Agentic CRM"/></Link><nav>{tr.nav.map((l,i)=><a key={i} href={HREFS[i]} className={i===7?"active":""}>{l}</a>)}</nav><div className="fwr-actions"><Language lang={lang} setLang={setLang}/><a href={isAuthenticated?"/dashboard/home":"/sign-in"}>{isAuthenticated?tr.footer[4]:tr.footer[5]}</a></div></div></header>;return <footer className="fwr-footer"><div className="fwr-container fwr-footer-main"><Link to="/" className="fwr-brand"><img src={headlogoImg} alt="Cortexa Agentic CRM"/></Link><nav>{tr.nav.map((l,i)=><a key={i} href={HREFS[i]}>{l}</a>)}</nav><div className="fwr-actions"><Language lang={lang} setLang={setLang} footer/><a href={isAuthenticated?"/dashboard/home":"/sign-in"}>{isAuthenticated?tr.footer[4]:tr.footer[5]}</a></div></div><div className="fwr-container fwr-footer-bottom"><span>{tr.footer[0]}</span><div><a href="/privacy-policy">{tr.footer[1]}</a><a href="/terms">{tr.footer[2]}</a><a href="mailto:support@cortexaaicrm.com">{tr.footer[3]}</a></div></div></footer>}
export default function FreeWebsiteReview(){
 const initial=(()=>{const v=localStorage.getItem("cortexa_lang")||localStorage.getItem("cortexa_locale")||"en";return ["en","es","pt"].includes(v)?v:"en"})();
 const[lang,setLangState]=useState(initial);const tr=COPY[lang];
 const[form,setForm]=useState({fullName:"",businessName:"",email:"",phone:"",websiteUrl:"",platform:"",improvements:[],limitations:"",goal:"",systems:"",contactMethod:"email",authorized:false,needsNewWebsite:false});
 const[loading,setLoading]=useState(false),[error,setError]=useState(""),[success,setSuccess]=useState(false);
 const setLang=(v)=>{setLangState(v);localStorage.setItem("cortexa_lang",v);localStorage.setItem("cortexa_locale",v);document.documentElement.lang=v==="pt"?"pt-BR":v};
 useEffect(()=>{document.documentElement.lang=lang==="pt"?"pt-BR":lang},[lang]);
 const update=k=>e=>setForm(p=>({...p,[k]:e.target.type==="checkbox"?e.target.checked:e.target.value}));
 const toggle=v=>setForm(p=>({...p,improvements:p.improvements.includes(v)?p.improvements.filter(x=>x!==v):[...p.improvements,v]}));
 const submit=async e=>{
   e.preventDefault();setError("");
   if(!form.fullName.trim()||!form.businessName.trim()||!form.email.trim()||!form.platform||!form.improvements.length||!form.limitations.trim()||!form.authorized){setError(tr.errors[0]);return}
   setLoading(true);
   try{
     const payload={...form,goal:form.limitations};
     const r=await fetch(`${API_BASE}/api/web-solutions/free-review`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
     const d=await r.json().catch(()=>({}));
     if(!r.ok||!d?.success)throw new Error(d?.message||tr.errors[1]);
     trackEvent("free_professional_review_request",{page_path:window.location.pathname,language:lang,has_website:Boolean(form.websiteUrl.trim())});
     setSuccess(true);window.scrollTo({top:0,behavior:"smooth"});
   }catch(e){setError(e?.message||tr.errors[1])}finally{setLoading(false)}
 };
 return <div className="fwr-page"><HeaderFooter tr={tr} lang={lang} setLang={setLang}/><main>
 <section className="fwr-hero"><div className="fwr-eyebrow">{tr.hero[0]}</div><h1>{tr.hero[1]}</h1><p>{tr.hero[2]}</p></section>
 <div className="fwr-container">
 {success?<section className="fwr-success"><span><Check size={30}/></span><h2>{tr.success[0]}</h2><p>{tr.success[1]}</p><Link to="/web-solutions">{tr.success[2]}</Link></section>:
 <section className="fwr-panel">
 <form onSubmit={submit} className="fwr-form">
   <div className="fwr-two">
     <label>{tr.fields[0]} <em>*</em><input value={form.fullName} onChange={update("fullName")} placeholder={tr.place[0]}/></label>
     <label>{tr.fields[1]} <em>*</em><input value={form.businessName} onChange={update("businessName")} placeholder={tr.place[1]}/></label>
     <label>{tr.fields[2]} <em>*</em><input type="email" value={form.email} onChange={update("email")} placeholder={tr.place[2]}/></label>
     <label>{tr.fields[3]} <small>({tr.fields[4]})</small><input value={form.phone} onChange={update("phone")} placeholder={tr.place[3]}/></label>
     <label>{tr.fields[5]} <em>*</em><select value={form.platform} onChange={update("platform")}><option value="">{tr.fields[6]}</option>{tr.businessTypes.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
     <label>{tr.fields[7]} <small>({tr.fields[4]})</small><input value={form.websiteUrl} onChange={update("websiteUrl")} placeholder={tr.place[4]}/><span className="fwr-new-site"><input type="checkbox" checked={form.needsNewWebsite} onChange={update("needsNewWebsite")}/><span>{tr.fields[8]}</span></span></label>
   </div>
   <fieldset className="fwr-checks"><legend>{tr.fields[9]} <small>{tr.fields[10]}</small> <em>*</em></legend><div>{tr.opts.map(item=><label key={item}><input type="checkbox" checked={form.improvements.includes(item)} onChange={()=>toggle(item)}/><span>{item}</span></label>)}</div></fieldset>
   <label>{tr.fields[11]} <em>*</em><textarea value={form.limitations} onChange={update("limitations")} placeholder={tr.place[5]}/></label>
   <div className="fwr-bottom-fields">
     <label>{tr.fields[12]} <small>({tr.fields[4]})</small><input value={form.systems} onChange={update("systems")} placeholder={tr.place[6]}/></label>
     <fieldset><legend>{tr.fields[13]}</legend><div className="fwr-radios">{["email","phone","whatsapp"].map((v,i)=><label key={v}><input type="radio" name="contactMethod" value={v} checked={form.contactMethod===v} onChange={update("contactMethod")}/><span>{tr.contact[i]}</span></label>)}</div></fieldset>
   </div>
   <label className="fwr-authorize"><input type="checkbox" checked={form.authorized} onChange={update("authorized")}/><span>{tr.auth} <em>*</em></span></label>
   {error&&<div className="fwr-error">{error}</div>}
   <button className="fwr-submit" disabled={loading}>{loading?tr.submitting:tr.submit}<span>→</span></button>
 </form>
 <aside className="fwr-next"><h2>{tr.next[0]}</h2>{tr.next.slice(1).map(([t,p],i)=><article key={t}><span>{i+1}</span><div><h3>{t}</h3><p>{p}</p></div></article>)}</aside>
 </section>}
 </div></main><HeaderFooter tr={tr} lang={lang} setLang={setLang} footer/></div>
}
