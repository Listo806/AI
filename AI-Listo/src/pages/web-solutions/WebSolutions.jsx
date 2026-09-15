import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, BarChart3, Bot, CalendarDays, ChevronDown, FileSearch, Gift,
  Globe2, MessageCircle, Monitor, Settings, Shield, SlidersHorizontal, UsersRound,
} from "lucide-react";
import headlogoImg from "../../assets/cortexa/headlogo.png";
import { useAuth } from "../../context/AuthContext";
import "./WebSolutions.css";

const REVIEW_PATH="/web-solutions/free-review";
const COPY={
en:{
nav:["Features","AI Assistant","AI Workflows","Pipeline","Analytics","Pricing","Cost Calculator","Web Solutions","Get Started"],
hero:["CORTEXA WEB SOLUTIONS","Turn your website into a","connected business system.","Your website is often where customer interest begins. We help you connect your website to your CRM, AI agents, lead capture, communications, appointments, checkout, analytics, and workflows — so every visitor can become a customer, and no opportunity is lost.","Request a Website Review"],
trust:[["Website-first assessment","We start with your website to understand your goals, audience, and current setup."],["Built around your business","Recommendations are tailored to your industry, tools, and growth goals."],["Clear scope before development","You’ll know exactly what we’ll build, why it matters, and what it will cost."]],
improveTitle:"What we can improve.",improveLead:"We connect your website to the right systems and add the functionality your business needs to capture, convert, and serve more customers.",
improvements:[["Website experience","Improve your design, content, and structure to create a clearer path to conversion."],["CRM integration","Connect your website directly to your Cortexa CRM so every lead is captured, organized, and routed correctly."],["AI agent integration","Connect your website to Cortexa AI agents for instant responses, lead qualification, and support."],["Lead capture","Capture and qualify leads through forms, chat, and AI-powered tools."],["Communications","Integrate WhatsApp, phone, email, and SMS to keep conversations in one place."],["Appointments","Enable customers to book meetings, service calls, or consultations directly from your website."],["Checkout and payments","Integrate secure checkout and payment solutions for products, services, or bookings."],["Automation","Automate follow-ups, task creation, lead routing, and more."],["Analytics and tracking","Set up proper tracking so you can see what’s working and make data-driven decisions."]],
professional:["CORTEXA WEB SOLUTIONS","Professional web solutions built around what you need.","Whether you need a new website, integrations with your existing tools, or a complete conversion-focused redesign, we’ll create a solution that fits your website, your systems, your goals, and your technical needs.","A solution designed for you.","No two businesses are the same. We tailor every project to your website, your tools, your goals, and your technical requirements."],
review:["Start with a free website review.","Send us your website URL and tell us what you want to improve. Our team will review your current experience, identify missing functionality and conversion opportunities, and recommend what should be improved, connected, or rebuilt.","Your website review is free.","If you choose to proceed, professional development services start at","Request Your Free Review"],
reviewItems:[["Website assessment","A review of your current website and technology setup."],["Problems and opportunities","Key issues, gaps, and areas for improvement."],["Recommended improvements","Practical suggestions tailored to your business goals."],["Proposed scope and quotation","A clear plan with deliverables and a fixed cost."]],
bottom:["Let us review your website — free.","Send us your website URL. There’s no payment required to submit your website, and no obligation to move forward. Just a clear, expert review of how to make it work harder for your business."],
footer:["© 2024 Cortexa. All rights reserved.","Privacy","Terms","Contact","Dashboard","Log in"]
},
es:{
nav:["Funciones","Asistente IA","Flujos de IA","Pipeline","Analítica","Precios","Calculadora de Costes","Soluciones Web","Comenzar"],
hero:["SOLUCIONES WEB CORTEXA","Convierte tu sitio web en un","sistema empresarial conectado.","Tu sitio web suele ser donde comienza el interés del cliente. Te ayudamos a conectar tu sitio con tu CRM, agentes de IA, captura de leads, comunicaciones, citas, checkout, analítica y flujos de trabajo, para que cada visitante pueda convertirse en cliente y no se pierda ninguna oportunidad.","Solicitar una revisión del sitio web"],
trust:[["Evaluación centrada en tu sitio web","Comenzamos con tu sitio web para entender tus objetivos, audiencia y configuración actual."],["Creado alrededor de tu negocio","Las recomendaciones se adaptan a tu industria, herramientas y objetivos de crecimiento."],["Alcance claro antes del desarrollo","Sabrás exactamente qué construiremos, por qué importa y cuánto costará."]],
improveTitle:"Lo que podemos mejorar.",improveLead:"Conectamos tu sitio web con los sistemas adecuados y añadimos la funcionalidad que tu negocio necesita para captar, convertir y atender a más clientes.",
improvements:[["Experiencia del sitio web","Mejora el diseño, el contenido y la estructura para crear un camino más claro hacia la conversión."],["Integración con CRM","Conecta tu sitio directamente con Cortexa CRM para que cada lead sea capturado, organizado y dirigido correctamente."],["Integración con agentes de IA","Conecta tu sitio con los agentes de IA de Cortexa para respuestas instantáneas, calificación de leads y soporte."],["Captura de leads","Captura y califica leads mediante formularios, chat y herramientas con IA."],["Comunicaciones","Integra WhatsApp, teléfono, email y SMS para mantener las conversaciones en un solo lugar."],["Citas","Permite a los clientes reservar reuniones, llamadas de servicio o consultas directamente desde tu sitio."],["Checkout y pagos","Integra checkout y pagos seguros para productos, servicios o reservas."],["Automatización","Automatiza seguimientos, creación de tareas, enrutamiento de leads y más."],["Analítica y seguimiento","Configura un seguimiento adecuado para saber qué funciona y tomar decisiones basadas en datos."]],
professional:["SOLUCIONES WEB CORTEXA","Soluciones web profesionales creadas según lo que necesitas.","Ya sea que necesites un nuevo sitio web, integraciones con tus herramientas actuales o un rediseño completo enfocado en conversión, crearemos una solución adaptada a tu sitio, sistemas, objetivos y necesidades técnicas.","Una solución diseñada para ti.","No hay dos negocios iguales. Adaptamos cada proyecto a tu sitio web, herramientas, objetivos y requisitos técnicos."],
review:["Comienza con una revisión gratuita de tu sitio web.","Envíanos la URL de tu sitio y cuéntanos qué quieres mejorar. Nuestro equipo revisará tu experiencia actual, identificará funcionalidades faltantes y oportunidades de conversión, y recomendará qué debe mejorarse, conectarse o reconstruirse.","La revisión de tu sitio web es gratuita.","Si decides continuar, los servicios profesionales de desarrollo comienzan desde","Solicita tu revisión gratuita"],
reviewItems:[["Evaluación del sitio web","Una revisión de tu sitio web actual y de su configuración tecnológica."],["Problemas y oportunidades","Problemas clave, brechas y áreas de mejora."],["Mejoras recomendadas","Sugerencias prácticas adaptadas a los objetivos de tu negocio."],["Alcance y cotización propuestos","Un plan claro con entregables y un coste fijo."]],
bottom:["Revisemos tu sitio web — gratis.","Envíanos la URL de tu sitio web. No se requiere ningún pago para enviarlo y no existe obligación de continuar. Solo recibirás una revisión clara y experta sobre cómo hacer que tu sitio trabaje mejor para tu negocio."],
footer:["© 2024 Cortexa. Todos los derechos reservados.","Privacidad","Términos","Contacto","Panel","Iniciar sesión"]
},
pt:{
nav:["Recursos","Assistente IA","Fluxos de IA","Pipeline","Análises","Preços","Calculadora de Custos","Soluções Web","Começar"],
hero:["SOLUÇÕES WEB CORTEXA","Transforme seu site em um","sistema de negócios conectado.","Seu site costuma ser onde o interesse do cliente começa. Ajudamos você a conectar seu site ao CRM, agentes de IA, captura de leads, comunicações, agendamentos, checkout, análises e fluxos de trabalho — para que cada visitante possa se tornar cliente e nenhuma oportunidade seja perdida.","Solicitar uma análise do site"],
trust:[["Avaliação focada no site","Começamos pelo seu site para entender seus objetivos, público e configuração atual."],["Criado em torno do seu negócio","As recomendações são adaptadas ao seu setor, ferramentas e objetivos de crescimento."],["Escopo claro antes do desenvolvimento","Você saberá exatamente o que construiremos, por que isso importa e quanto custará."]],
improveTitle:"O que podemos melhorar.",improveLead:"Conectamos seu site aos sistemas certos e adicionamos a funcionalidade que sua empresa precisa para captar, converter e atender mais clientes.",
improvements:[["Experiência do site","Melhore design, conteúdo e estrutura para criar um caminho mais claro para a conversão."],["Integração com CRM","Conecte seu site diretamente ao Cortexa CRM para que cada lead seja capturado, organizado e encaminhado corretamente."],["Integração com agentes de IA","Conecte seu site aos agentes de IA da Cortexa para respostas instantâneas, qualificação de leads e suporte."],["Captura de leads","Capture e qualifique leads por formulários, chat e ferramentas com IA."],["Comunicações","Integre WhatsApp, telefone, e-mail e SMS para manter as conversas em um só lugar."],["Agendamentos","Permita que clientes agendem reuniões, chamadas de serviço ou consultas diretamente pelo site."],["Checkout e pagamentos","Integre checkout e pagamentos seguros para produtos, serviços ou reservas."],["Automação","Automatize acompanhamentos, criação de tarefas, roteamento de leads e muito mais."],["Análises e rastreamento","Configure o rastreamento correto para entender o que funciona e tomar decisões baseadas em dados."]],
professional:["SOLUÇÕES WEB CORTEXA","Soluções web profissionais criadas de acordo com o que você precisa.","Se você precisa de um novo site, integrações com suas ferramentas atuais ou um redesign completo focado em conversão, criaremos uma solução adequada ao seu site, sistemas, objetivos e necessidades técnicas.","Uma solução feita para você.","Nenhum negócio é igual ao outro. Adaptamos cada projeto ao seu site, ferramentas, objetivos e requisitos técnicos."],
review:["Comece com uma análise gratuita do seu site.","Envie a URL do seu site e conte o que deseja melhorar. Nossa equipe analisará sua experiência atual, identificará funcionalidades ausentes e oportunidades de conversão e recomendará o que deve ser melhorado, conectado ou reconstruído.","A análise do seu site é gratuita.","Se você decidir prosseguir, os serviços profissionais de desenvolvimento começam em","Solicite sua análise gratuita"],
reviewItems:[["Avaliação do site","Uma análise do seu site atual e da configuração tecnológica."],["Problemas e oportunidades","Principais problemas, lacunas e áreas de melhoria."],["Melhorias recomendadas","Sugestões práticas adaptadas aos objetivos do seu negócio."],["Escopo e orçamento propostos","Um plano claro com entregas e custo fixo."]],
bottom:["Vamos analisar seu site — grátis.","Envie a URL do seu site. Não é necessário pagamento para enviar e não há obrigação de prosseguir. Apenas uma análise clara e especializada de como fazer seu site trabalhar melhor para o seu negócio."],
footer:["© 2024 Cortexa. Todos os direitos reservados.","Privacidade","Termos","Contato","Painel","Entrar"]
}};

const HREFS=["/#features","/#ai-assistant","/#automation","/#pipeline","/#analytics","/pricing","/editorial/the-end-of-legacy-crm","/web-solutions","/trial?flow=free-access&plan=free"];
const IMP_ICONS=[Monitor,SlidersHorizontal,Bot,UsersRound,MessageCircle,CalendarDays,Settings,Settings,BarChart3];
const REVIEW_ICONS=[FileSearch,FileSearch,Bot,FileSearch];

function Language({lang,setLang,footer=false}){
 const [open,setOpen]=useState(false);
 return <div className={`ws-language ${footer?"ws-language-footer":""}`}>
   <button type="button" className="ws-language-button" onClick={()=>setOpen(v=>!v)} aria-label="Language"><Globe2 size={18}/></button>
   {open&&<div className="ws-language-menu">{[["en","English"],["es","Español"],["pt","Português"]].map(([v,l])=><button key={v} className={lang===v?"active":""} onClick={()=>{setLang(v);setOpen(false)}}>{l}</button>)}</div>}
 </div>
}
function Header({tr,lang,setLang}){
 const {isAuthenticated}=useAuth();
 return <header className="ws-header"><div className="ws-header-inner">
  <Link to="/" className="ws-brand"><img src={headlogoImg} alt="CORTEXA"/></Link>
  <nav className="ws-nav">{tr.nav.map((l,i)=><a key={i} href={HREFS[i]} className={i===7?"active":""}>{l}</a>)}</nav>
  <div className="ws-header-actions"><Language lang={lang} setLang={setLang}/><a href={isAuthenticated?"/dashboard/home":"/sign-in"}>{isAuthenticated?tr.footer[4]:tr.footer[5]}</a></div>
 </div></header>
}
function Footer({tr,lang,setLang}){
 const {isAuthenticated}=useAuth();
 return <footer className="ws-footer"><div className="ws-container ws-footer-inner">
  <Link to="/" className="ws-footer-brand"><img src={headlogoImg} alt="CORTEXA"/></Link>
  <nav>{tr.nav.map((l,i)=><a key={i} href={HREFS[i]}>{l}</a>)}</nav>
  <div className="ws-footer-actions"><Language lang={lang} setLang={setLang} footer/><a href={isAuthenticated?"/dashboard/home":"/sign-in"}>{isAuthenticated?tr.footer[4]:tr.footer[5]}</a></div>
 </div><div className="ws-container ws-footer-bottom"><span>{tr.footer[0]}</span><div><a href="/privacy">{tr.footer[1]}</a><a href="/terms">{tr.footer[2]}</a><a href="mailto:support@cortexaaicrm.com">{tr.footer[3]}</a></div></div></footer>
}
function ReviewButton({children}){return <Link className="ws-review-btn" to={REVIEW_PATH}><span>{children}</span><ArrowRight size={19}/></Link>}
export default function WebSolutions(){
 const [lang,setLangState]=useState(()=>localStorage.getItem("cortexa_lang")||"en");
 const setLang=(v)=>{setLangState(v);localStorage.setItem("cortexa_lang",v);localStorage.setItem("cortexa_locale",v);document.documentElement.lang=v==="pt"?"pt-BR":v};
 useEffect(()=>{document.documentElement.lang=lang==="pt"?"pt-BR":lang},[lang]);
 const tr=COPY[lang]||COPY.en;
 return <div className="ws-page"><Header tr={tr} lang={lang} setLang={setLang}/><main>
  <section className="ws-new-hero"><div className="ws-container"><div className="ws-eyebrow">{tr.hero[0]}</div><h1>{tr.hero[1]}<br/>{tr.hero[2]}</h1><p>{tr.hero[3]}</p><ReviewButton>{tr.hero[4]}</ReviewButton></div></section>
  <section className="ws-trust-strip"><div className="ws-container ws-trust-grid">{tr.trust.map(([t,p],i)=>{const I=[FileSearch,Settings,Shield][i];return <article key={t}><I/><div><b>{t}</b><p>{p}</p></div></article>})}</div></section>
  <section className="ws-improve"><div className="ws-container"><h2>{tr.improveTitle}</h2><p className="ws-section-lead">{tr.improveLead}</p><div className="ws-improve-grid">{tr.improvements.map(([t,p],i)=>{const I=IMP_ICONS[i];return <article key={t}><I size={31}/><div><h3>{t}</h3><p>{p}</p></div></article>})}</div></div></section>
  <section className="ws-professional"><div className="ws-container ws-professional-card"><div><div className="ws-eyebrow">{tr.professional[0]}</div><h2>{tr.professional[1]}</h2><p>{tr.professional[2]}</p></div><div className="ws-tailored"><Monitor size={42}/><h3>{tr.professional[3]}</h3><p>{tr.professional[4]}</p></div></div></section>
  <section className="ws-dark-review"><div className="ws-container"><div className="ws-dark-top"><div><h2>{tr.review[0]}</h2><p>{tr.review[1]}</p></div><aside><Gift size={45}/><div><h3>{tr.review[2]}</h3><p>{tr.review[3]} <strong>$147.</strong></p></div></aside></div><div className="ws-review-items">{tr.reviewItems.map(([t,p],i)=>{const I=REVIEW_ICONS[i];return <article key={t}><I size={32}/><h3>{t}</h3><p>{p}</p></article>})}</div><ReviewButton>{tr.review[4]}</ReviewButton></div></section>
  <section className="ws-bottom-cta"><div className="ws-container"><h2>{tr.bottom[0]}</h2><p>{tr.bottom[1]}</p><ReviewButton>{tr.review[4]}</ReviewButton></div></section>
 </main><Footer tr={tr} lang={lang} setLang={setLang}/></div>
}
