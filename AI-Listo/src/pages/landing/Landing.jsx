import { useState, useEffect } from "react";
import "./Landing.css";

import headlogoImg from "../../assets/cortexa/headlogo.png";
import logoImg from "../../assets/cortexa/logo.png";
import heroImg from "../../assets/cortexa/Cortexa Hero 1.png";
import heroImgES from "../../assets/cortexa/hero-es.png";
import heroImgPT from "../../assets/cortexa/hero-pt.png";

import sec2Img from "../../assets/cortexa/Cortexa sec 2.png";
import sec2ImgES from "../../assets/cortexa/sec2ES.png";
import sec2ImgPT from "../../assets/cortexa/sec2PT.png";


import sec3Img from "../../assets/cortexa/Cortexa sec 3.png";
import sec3ImgES from "../../assets/cortexa/sec3ES.png";
import sec3ImgPT from "../../assets/cortexa/sec3PT.png";

import sec4Img from "../../assets/cortexa/Cortexa sec 4.png";
import sec4ImgES from "../../assets/cortexa/sec4ES.png";
import sec4ImgPT from "../../assets/cortexa/sec4PT.png";

import whatsappImg from "../../assets/cortexa/whatsapp.png";
import feaImg1 from "../../assets/cortexa/featured1.png";
import feaImg2 from "../../assets/cortexa/featured2.png";
import feaImg3 from "../../assets/cortexa/featured3.png";
import feaImg4 from "../../assets/cortexa/featured4.png";
import finalImg from "../../assets/cortexa/final.png";

import aiSetterImg from "../../assets/cortexa/aiSetter.png";
import aiSetterImgES from "../../assets/cortexa/aiSetterES.png";
import aiSetterImgPT from "../../assets/cortexa/aiSetterPT.png";

import beitem1 from "../../assets/cortexa/beitem1.png";
import beitem2 from "../../assets/cortexa/beitem2.png";
import beitem3 from "../../assets/cortexa/beitem3.png";
import beitem4 from "../../assets/cortexa/beitem4.png";

import testimonialsImg from "../../assets/cortexa/testimonials.png";
import testimonialsImgES from "../../assets/cortexa/testimonialsES.png";
import testimonialsImgPT from "../../assets/cortexa/testimonialsPT.png";

export default function Landing() {

  /* ================= LANG ================= */
  const [lang, setLang] = useState("en");
  const [langOpen, setLangOpen] = useState(false);
  const [activeFAQ, setActiveFAQ] = useState(0);

  const switchLang = (l) => {
    setLang(l);
    setLangOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".lang-wrapper")) {
        setLangOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  /* ================= TRANSLATIONS ================= */
  const t = {
    en: {
      top: "Meet Your AI CRM. Maximize human productivity with your custom AI teammates.",

      nav: ["Features", "AI Assistant", "Automation", "Pipeline", "Analytics", "Testimonials"],

      trial: "Start Free Trial",
      login: "Log in",

      dashboardTitle: "Dashboards you work from, not just look at",

      without: "Without CORTEXA",
      with: "With CORTEXA",

      withoutList: [
        "Leads scattered across apps and spreadsheets",
        "Slow manual follow-ups and missed messages",
        "No real-time visibility into your pipeline",
        "Hard to know what your team is doing"
      ],

      withList: [
        "Everything in one powerful dashboard",
        "Instant WhatsApp replies and AI automation",
        "Live pipeline updates and performance tracking",
        "Know exactly what’s happening and what to do next"
      ],

      stripTitle: "Your CRM shouldn’t slow you down.",
      stripSub: "Join teams using CORTEXA...",

      featuresTitle: "Turn your data into decisions",

      cards: [
        {
          eyebrow: "AI Assistant",
          title: "Instant answers from your dashboard",
          desc: "Get insights, summaries, and recommendations in seconds. Ask anything about your leads, pipeline, properties, or team performance."
        },
        {
          eyebrow: "Analytics",
          title: "Track performance in real time",
          desc: "Monitor conversion rates, response times, and activity across your business. Know what’s working and where to improve instantly."
        },
        {
          eyebrow: "AI Auto Reply",
          title: "Automate your follow-ups",
          desc: "Never miss a lead. Send instant, personalized replies across your channels and nurture opportunities automatically."
        },
        {
          eyebrow: "AI Setter",
          title: "Close deals faster with AI",
          desc: "AI qualifies leads, books appointments, and moves opportunities forward while your team focuses on closing."
        }
      ],

      trustTitle: "Built to operate with confidence",
      trust: ["Secure workflows", "Live performance visibility", "Scalable system", "AI-driven efficiency"],

      faqTitle: "FAQs",

      faq: [
        {
          q: "What does CORTEXA actually do?",
          a: "CORTEXA automates your lead follow-ups, conversations, pipeline updates, and appointment scheduling — all in one system."
        },
        {
          q: "How does the AI Assistant work?",
          a: "The AI responds instantly to leads, qualifies them, books appointments, and keeps every conversation moving automatically."
        },
        {
          q: "Can I manage all my leads in one place?",
          a: "Yes. All your leads, messages, and deal stages are centralized in one dashboard so nothing gets lost."
        },
        {
          q: "Does it update my pipeline automatically?",
          a: "Yes. As leads interact, the system moves them through your pipeline without manual input."
        },
        {
          q: "Will I still need to follow up manually?",
          a: "No. CORTEXA is designed to handle follow-ups automatically while keeping leads engaged."
        },
        {
          q: "Can my team use this together?",
          a: "Yes. You can add team members, assign leads, and manage deals collaboratively."
        },
        {
          q: "What kind of businesses is this for?",
          a: "CORTEXA is built for real estate agents, teams, and any business that relies on lead generation and closing deals."
        },
        {
          q: "What happens after a lead comes in?",
          a: "The system responds instantly, qualifies the lead, and pushes them toward booking or closing — automatically."
        }
      ],

      finalTitle: "Start closing more deals with CORTEXA",
      finalDesc: "One powerful AI CRM for leads, WhatsApp, automation...",
      footer: {
          desc: "The AI-powered CRM that helps teams close more deals, faster.",
          btn: "Start Your Free Trial →",
          product: "Product",
          solutions: "Solutions",
          resources: "Resources",
          company: "Company",
          newsletter: "Stay updated",
          newsletterDesc: "Get the latest updates, CRM tips, and product news.",
          privacy: "We respect your privacy. Unsubscribe anytime.",
          status: "All systems operational"
        },
       strip: {
          title: "Your CRM shouldn’t slow you down.",
          sub: "Join teams using CORTEXA...",
          btn: "Start Free Trial"
        },
       aiTitle: "AI Setter — Your 24/7 Appointment Engine",
       aisubTitle: "Responds instantly, qualifies buyers, and books appointments — automatically.",
       aipointTitle1: "Instant Responses",
       aipointText1: "Every message answered in seconds.",
       aipointTitle2: "Smart Qualification",
       aipointText2: "Filters serious buyers automatically.",
       aipointTitle3: "Automatic Booking",
       aipointText3: "Appointments scheduled without back-and-forth.",
       ailine: "No missed messages. No slow follow-ups. No lost deals.",
       aialt: "AI Setter handling conversations and booking appointments",
       reinforcement: "No missed messages. No slow follow-ups. No lost deals.",
    },

    es: {
      top: "Conoce tu CRM con IA. Maximiza la productividad con asistentes inteligentes.",
      nav: ["Características", "Asistente de IA", "Automatización", "Pipeline", "Análisis", "Testimonios"],
      trial: "Prueba gratis",
      login: "Iniciar sesión",

      dashboardTitle: "Paneles que usas, no solo miras",

      without: "Sin CORTEXA",
      with: "Con CORTEXA",

      withoutList: [
        "Leads dispersos en apps y hojas de cálculo",
        "Seguimientos manuales lentos y mensajes perdidos",
        "Sin visibilidad en tiempo real del pipeline",
        "Difícil saber qué hace tu equipo"
      ],

      withList: [
        "Todo en un panel potente",
        "Respuestas instantáneas por WhatsApp y automatización IA",
        "Actualizaciones en vivo del pipeline",
        "Saber exactamente qué pasa y qué hacer"
      ],

      stripTitle: "Tu CRM no debería ralentizarte.",
      stripSub: "Únete a equipos que usan CORTEXA...",

      featuresTitle: "Convierte tus datos en decisiones",

      cards: [
        {
          eyebrow: "Asistente de IA",
          title: "Respuestas instantáneas desde tu panel",
          desc: "Obtén insights y recomendaciones en segundos sobre leads, pipeline y rendimiento."
        },
        {
          eyebrow: "Análisis",
          title: "Rendimiento en tiempo real",
          desc: "Monitorea conversiones, respuestas y actividad de tu negocio."
        },
        {
          eyebrow: "Respuesta automática con IA",
          title: "Automatiza seguimientos",
          desc: "Nunca pierdas un lead. Responde automáticamente en todos tus canales."
        },
        {
          eyebrow: "Configurador de IA",
          title: "Cierra más rápido con IA",
          desc: "La IA califica leads, agenda citas y avanza oportunidades."
        }
      ],

      trustTitle: "Construido para operar con confianza",
      trust: ["Flujos seguros", "Visibilidad en tiempo real", "Sistema escalable", "Eficiencia con IA"],

      faqTitle: "Preguntas frecuentes",

      faq: [
        {
          q: "¿Qué hace exactamente CORTEXA?",
          a: "CORTEXA automatiza el seguimiento de clientes potenciales, las conversaciones, las actualizaciones del embudo de ventas y la programación de citas, todo en un solo sistema."
        },
        {
          q: "¿Cómo funciona el Asistente de IA?",
          a: "La IA responde instantáneamente a los clientes potenciales, los califica, agenda citas y mantiene la conversación en marcha automáticamente."
        },
        {
          q: "¿Puedo gestionar todos mis clientes potenciales en un solo lugar?",
          a: "Sí. Todos tus clientes potenciales, mensajes y etapas del pipeline están centralizados en un panel para que no se pierda nada."
        },
        {
          q: "¿Actualiza mi pipeline automáticamente?",
          a: "Sí. A medida que los clientes potenciales interactúan, el sistema los mueve a través de tu pipeline sin intervención manual."
        },
        {
          q: "¿Aún tendré que hacer seguimiento manualmente?",
          a: "No. CORTEXA está diseñado para gestionar el seguimiento automáticamente y mantener a los clientes potenciales comprometidos."
        },
        {
          q: "¿Puede mi equipo usarlo en conjunto?",
          a: "Sí. Puedes agregar miembros del equipo, asignar clientes potenciales y gestionar acuerdos de forma colaborativa."
        },
        {
          q: "¿Para qué tipo de negocios es esto?",
          a: "CORTEXA está diseñado para agentes inmobiliarios, equipos y cualquier negocio que dependa de generación de leads y cierre de ventas."
        },
        {
          q: "¿Qué sucede después de que llega un cliente potencial?",
          a: "El sistema responde al instante, califica al cliente potencial y lo impulsa hacia la reserva o el cierre automáticamente."
        }
        ],

      finalTitle: "Empieza a cerrar más ventas con CORTEXA",
      finalDesc: "Un CRM con IA para leads y automatización...",
      footer: {
          desc: "El CRM con IA que ayuda a los equipos a cerrar más ventas más rápido.",
          btn: "Empieza tu prueba gratuita →",
          product: "Producto",
          solutions: "Soluciones",
          resources: "Recursos",
          company: "Empresa",
          newsletter: "Mantente actualizado",
          newsletterDesc: "Recibe novedades, consejos y noticias del producto.",
          privacy: "Respetamos tu privacidad. Puedes darte de baja en cualquier momento.",
          status: "Todos los sistemas operativos"
        },
      strip: {
          title: "Tu CRM no debería ralentizarte.",
          sub: "Únete a equipos que usan CORTEXA...",
          btn: "Prueba gratis"
        },
      aiTitle: "AI Setter: tu motor de citas disponible las 24 horas, los 7 días de la semana.",
      aisubTitle: "Responde al instante, califica a los compradores y programa citas automáticamente.",

        aipointTitle1: "Respuestas instantáneas",
        aipointText1: "Cada mensaje se responde en segundos.",

        aipointTitle2: "Calificación inteligente",
        aipointText2: "Filtra automáticamente a los compradores serios.",

        aipointTitle3: "Reserva automática",
        aipointText3: "Citas programadas sin idas y venidas.",

        ailine: "Sin mensajes perdidos. Sin seguimientos lentos. Sin oportunidades perdidas.",

        aialt: "IA que gestiona conversaciones y agenda citas automáticamente",
        reinforcement: "Sin mensajes perdidos. Sin seguimientos lentos. Sin negocios perdidos.",
    },

    pt: {
      top: "Conheça seu CRM com IA. Maximize a produtividade com assistentes inteligentes.",
      nav: ["Recursos", "Assistente de IA", "Automação", "Pipeline", "Análises", "Testemunhos"],
      trial: "Teste grátis",
      login: "Entrar",

      dashboardTitle: "Painéis para trabalhar, não apenas visualizar",

      without: "Sem CORTEXA",
      with: "Com CORTEXA",

      withoutList: [
        "Leads espalhados em apps e planilhas",
        "Follow-ups manuais lentos e mensagens perdidas",
        "Sem visão em tempo real do pipeline",
        "Difícil saber o que o time faz"
      ],

      withList: [
        "Tudo em um painel poderoso",
        "Respostas instantâneas no WhatsApp com IA",
        "Atualizações em tempo real do pipeline",
        "Saber exatamente o que está acontecendo"
      ],

      stripTitle: "Seu CRM não deve te atrasar.",
      stripSub: "Junte-se a equipes usando CORTEXA...",

      featuresTitle: "Transforme dados em decisões",

      cards: [
        {
          eyebrow: "Assistente de IA",
          title: "Respostas instantâneas no painel",
          desc: "Insights e recomendações em segundos sobre leads e performance."
        },
        {
          eyebrow: "Análises",
          title: "Performance em tempo real",
          desc: "Monitore conversões, respostas e atividades do negócio."
        },
        {
          eyebrow: "Resposta Automática com IA",
          title: "Automação de follow-ups",
          desc: "Nunca perca leads. Respostas automáticas em todos canais."
        },
        {
          eyebrow: "Agendador de IA",
          title: "Feche mais rápido com IA",
          desc: "IA qualifica leads e agenda reuniões automaticamente."
        }
      ],

      trustTitle: "Construído para operar com confiança",
      trust: ["Fluxos seguros", "Visibilidade em tempo real", "Sistema escalável", "Eficiência com IA"],

      faqTitle: "Perguntas frequentes",
        faq: [
            {
              q: "O que exatamente o CORTEXA faz?",
              a: "O CORTEXA automatiza o acompanhamento de leads, conversas, atualizações do pipeline e agendamento de compromissos, tudo em um único sistema."
            },
            {
              q: "Como funciona o Assistente de IA?",
              a: "A IA responde instantaneamente aos leads, faz a qualificação, agenda compromissos e mantém a conversa fluindo automaticamente."
            },
            {
              q: "Posso gerenciar todos os meus leads em um só lugar?",
              a: "Sim. Todos os seus leads, mensagens e etapas do pipeline ficam centralizados em um único painel para que nada se perca."
            },
            {
              q: "Ele atualiza meu pipeline automaticamente?",
              a: "Sim. À medida que os leads interagem, o sistema os move pelo seu pipeline sem necessidade de intervenção manual."
            },
            {
              q: "Ainda preciso fazer follow-up manualmente?",
              a: "Não. O CORTEXA foi projetado para gerenciar o follow-up automaticamente e manter os leads engajados."
            },
            {
              q: "Minha equipe pode usar em conjunto?",
              a: "Sim. Você pode adicionar membros da equipe, atribuir leads e gerenciar negociações de forma colaborativa."
            },
            {
              q: "Para que tipo de negócio isso serve?",
              a: "O CORTEXA é ideal para corretores imobiliários, equipes e qualquer negócio que dependa de geração de leads e fechamento de vendas."
            },
            {
              q: "O que acontece depois que um lead chega?",
              a: "O sistema responde instantaneamente, qualifica o lead e o conduz automaticamente para o agendamento ou fechamento."
            }
        ],

      finalTitle: "Comece a fechar mais negócios com CORTEXA",
      finalDesc: "CRM com IA para leads e automação...",
      footer: {
          desc: "O CRM com IA que ajuda equipes a fechar mais negócios rapidamente.",
          btn: "Comece seu teste gratuito →",
          product: "Produto",
          solutions: "Soluções",
          resources: "Recursos",
          company: "Empresa",
          newsletter: "Fique atualizado",
          newsletterDesc: "Receba atualizações, dicas e novidades do produto.",
          privacy: "Respeitamos sua privacidade. Cancele a qualquer momento.",
          status: "Todos os sistemas operacionais"
        },
      strip: {
          title: "Seu CRM não deve te atrasar.",
          sub: "Junte-se a equipes usando CORTEXA...",
          btn: "Teste grátis"
        },
      aiTitle: "AI Setter: tu motor de citas disponible las 24 horas, los 7 días de la semana.",
      aisubTitle: "Responde instantaneamente, qualifica os compradores e agenda compromissos automaticamente.",

        aipointTitle1: "Respostas instantâneas",
        aipointText1: "Cada mensagem é respondida em segundos.",

        aipointTitle2: "Qualificação inteligente",
        aipointText2: "Filtra automaticamente os compradores sérios.",

        aipointTitle3: "Agendamento automático",
        aipointText3: "Compromissos agendados sem idas e vindas.",

        ailine: "Sem mensagens perdidas. Sem follow-ups lentos. Sem negócios perdidos.",

        aialt: "IA que gerencia conversas e agenda compromissos automaticamente",
        reinforcement: "Sem mensagens perdidas. Sem atrasos no acompanhamento. Sem negócios perdidos.",
    }
  };

  const tr = t[lang];

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const currentHero =
  lang === "es"
    ? heroImgES
    : lang === "pt"
    ? heroImgPT
    : heroImg;
    
  const currentSec2 =
  lang === "es"
    ? sec2ImgES
    : lang === "pt"
    ? sec2ImgPT
    : sec2Img;
    
  const currentSec3=
  lang === "es"
    ? sec3ImgES
    : lang === "pt"
    ? sec3ImgPT
    : sec3Img;
    
  const currentSec4=
  lang === "es"
    ? sec4ImgES
    : lang === "pt"
    ? sec4ImgPT
    : sec4Img;
   
  const currentaiSetterImg=
  lang === "es"
    ? aiSetterImgES
    : lang === "pt"
    ? aiSetterImgPT
    : aiSetterImg;
    
  const currenttestimonialsImg=
  lang === "es"
    ? testimonialsImgES
    : lang === "pt"
    ? testimonialsImgPT
    : testimonialsImg;

  return (
    <div id="cortexa-ai-crm-landing">

      <p className="top-head">{tr.top}</p>

      <header className="cx-header">
        <div className="cx-header-inner">

          <div className="cx-left">
            <img src={headlogoImg} className="cx-logo-img" />
          </div>

          <nav className="cx-nav">
              {tr.nav.map((n, i) => {
                const ids = [
                  "features",
                  "ai-assistant",
                  "automation",
                  "pipeline",
                  "analytics",
                  "testimonials"
                ];

                return (
                  <button key={i} onClick={() => scrollTo(ids[i])}>
                    {n}
                  </button>
                );
              })}
            </nav>

          <div className="cx-actions">

            <a href="#trial" className="cx-btn cx-btn-primary- small">
              {tr.trial}
            </a>

            <div className="lang-wrapper">
              
              <div
                className="lang-toggle"
                onClick={() => setLangOpen(!langOpen)}
              >
                <span data-lang={lang}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="100%"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="img-local"
                  >
                    <path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 12H22M12 2C9.43223 4.69615 8 8.27674 8 12C8 15.7233 9.43223 19.3038 12 22C14.5678 19.3038 16 15.7233 16 12C16 8.27674 14.5678 4.69615 12 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>  
              {langOpen && (
                <div className="lang-dropdown">
                  <div className="lang-item" onClick={() => switchLang("en")}>English</div>
                  <div className="lang-item" onClick={() => switchLang("es")}>Español</div>
                  <div className="lang-item" onClick={() => switchLang("pt")}>Português</div>
                </div>
              )}
            </div>

            <a href="/sign-in" className="cx-login">{tr.login}</a>

          </div>

        </div>
      </header>

      {/* HERO */}
      <section className="cx-hero">
        <img src={currentHero} />
      </section>

      {/* COMPARE */}
      <section id="features" className="cx-comp cx-center pt-50">
        <h2 className="cx-title-md">{tr.dashboardTitle}</h2>

        <div className="cx-comp-grid">

          <div className="cx-comp-col">
            <h4>{tr.without}</h4>
            <ul className="cx-list neg">
              {tr.withoutList.map((i, idx) => <li key={idx}>{i}</li>)}
            </ul>
          </div>

          <div className="cx-comp-col">
            <h4>{tr.with}</h4>
            <ul className="cx-list pos">
              {tr.withList.map((i, idx) => <li key={idx}>{i}</li>)}
            </ul>
          </div>

        </div>
      </section>
        <section id="analytics" className="cx-hero pt-50">
            <img src={currentSec2} alt="" />
        </section>
        <section className="benefits-section pt-50">
              <div className="benefits-container">

                <h2 className="cx-title-lg">
                  What This Actually Does For You
                </h2>

                <p className="benefits-sub">
                  Automation handles the work. Communication never stops. Every lead keeps moving forward — without you chasing it.
                </p>

                <div className="benefits-grid">

                  <div className="benefits-item">
                    <div className="benefits-icon"><img src={beitem1} /></div>
                    <h3>Work Happens Automatically</h3>
                    <p>Follow-ups, tracking, and organization run in the background.</p>
                  </div>

                  <div className="benefits-item">
                    <div className="benefits-icon"><img src={beitem2} /></div>
                    <h3>Conversations Stay Active</h3>
                    <p>Leads get responses, reminders, and engagement 24/7.</p>
                  </div>

                  <div className="benefits-item">
                    <div className="benefits-icon"><img src={beitem3} /></div>
                    <h3>Clarity Without Guesswork</h3>
                    <p>You always know who to focus on and what to do next.</p>
                  </div>

                  <div className="benefits-item">
                    <div className="benefits-icon"><img src={beitem4} /></div>
                    <h3>More Deals, Less Effort</h3>
                    <p>Less manual work, faster movement, better outcomes.</p>
                  </div>

                </div>

                <p className="benefits-bottom">
                  Everything keeps moving — even when you’re not.
                </p>

              </div>
            </section>
        <section id="whatsapp" className="cx-hero pt-50">
            <img src={currentSec3} alt="" />
        </section>
        <section id="pipeline" className="cx-hero pt-20">
            <img src={currentSec4} alt="" />
        </section>
      <section className="cx-strip pt-50">
          <div className="cx-strip-inner">

            <div>
              <h2 className="cx-title-md" style={{ color: "#fff" }}>
                {tr.strip.title}
              </h2>

              <p className="cx-sub">
                {tr.strip.sub}
              </p>

              <div className="cx-btns">
                <a href="#trial" className="cx-btn cx-btn-primary">
                  {tr.strip.btn}
                </a>
              </div>
            </div>

            <div className="cx-phone">
              <img src={whatsappImg} alt="" />
            </div>

          </div>
        </section>
      {/* FEATURES */}
      <section id="automation" className="cx-section pt-50">
        <div className="cx-center cx-grid-intro">
            <h2 className="cx-title-lg">{tr.featuresTitle}</h2>
          </div>
        <div className="cx-grid4">
          {[feaImg1, feaImg2, feaImg3, feaImg4].map((img, i) => (
            <div className="cx-card" key={i}>
              
              <div>
                <span className="cx-eyebrow">{tr.cards[i].eyebrow}</span>
                <h3>{tr.cards[i].title}</h3>
                <p>{tr.cards[i].desc}</p>
              </div>
              <div className="cx-shot">
                <img src={img} />
              </div>
            </div>
          ))}
        </div>
      </section>
      <section id="ai-assistant" className="cx-hero pt-20">
            <img src={currentaiSetterImg} alt="" />
        </section>
        {/*<section className="ai-setter-section pt-50">
          <div className="container ai-setter-wrapper">

            <div className="ai-setter-text">
              <h2>{tr.aiTitle}</h2>

              <p>
                {tr.aisubTitle}
              </p>

              <div className="ai-setter-points">

                <div className="point">
                  <h4>{tr.aipointTitle1}</h4>
                  <p>{tr.aipointText1}</p>
                </div>

                <div className="point">
                  <h4>{tr.aipointTitle2}</h4>
                  <p>{tr.aipointText2}</p>
                </div>

                <div className="point">
                  <h4>{tr.aipointTitle3}</h4>
                  <p>{tr.aipointText3}</p>
                </div>

              </div>

              <p className="ai-setter-reinforcement">
                {tr.ailine}
              </p>
            </div>

            <div className="ai-setter-image">
              <img
                src={aiSetterImg}
                alt={tr.aialt}
              />
            </div>

          </div>
        </section>*/}

      {/* TRUST */}
      <section className="cx-trust cx-center pt-50">
        <h2 className="cx-title-md">{tr.trustTitle}</h2>

        <div className="cx-trust-grid">
          {tr.trust.map((t, i) => (
            <div className="cx-trust-item" key={i}>
              <h4>{t}</h4>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="cx-faq cx-center pt-50">
        <h2 className="cx-title-lg">{tr.faqTitle}</h2>

        <div className="cx-faq-list">
          {tr.faq.map((item, index) => (
            <div className={`cx-faq-item ${activeFAQ === index ? "active" : ""}`} key={index}>
              <button className="cx-faq-q" onClick={() => setActiveFAQ(index)}>
                {item.q}
              </button>

              {activeFAQ === index && (
                <div className="cx-faq-a">{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>
        <section id="testimonials" className="cx-hero pt-50">
            <img src={currenttestimonialsImg} alt="" />
        </section>
      {/* FINAL */}
      <section className="cx-final pt-50" id="trial">
          <div className="cx-final-box">

            <h2 className="cx-title-lg" style={{ color: "#fff" }}>
              {tr.finalTitle}
            </h2>

            <p className="cx-sub">
              {tr.finalDesc}
            </p>

            <a className="cx-btn cx-btn-secondary">
              {tr.trial}
            </a>
            <p className="final-reinforcement">
                {tr.reinforcement}
            </p>
            <div className="cx-final-shot">
              <img src={finalImg} alt="" />
            </div>
          </div>
        </section>
      <section id="footer" className="cx-hero">
            <footer className="footer">
              <div className="footer-container">

                {/* Left */}
                <div className="footer-col">
                  <div className="logo">
                    <img src={logoImg} alt="Cortexa" className="cx-logo-img" />
                  </div>

                  <p className="desc">
                    {tr.footer.desc}
                  </p>

                  <button className="btn">
                    {tr.footer.btn}
                  </button>

                  <ul className="features">
                    <li>✨ AI-Powered</li>
                    <li>🛡 Secure by Design</li>
                    <li>⚡ Automate Workflows</li>
                    <li>📊 Real-Time Insights</li>
                  </ul>
                </div>

                {/* Product */}
                <div className="footer-col">
                  <h4>{tr.footer.product}</h4>
                  <ul>
                    <li>Features</li>
                    <li>AI Assistant</li>
                    <li>Analytics</li>
                    <li>Automations</li>
                    <li>Integrations</li>
                    <li>Pricing</li>
                  </ul>
                </div>

                {/* Solutions */}
                <div className="footer-col">
                  <h4>{tr.footer.solutions}</h4>
                  <ul>
                    <li>Sales Teams</li>
                    <li>Real Estate</li>
                    <li>Agencies</li>
                    <li>Startups</li>
                  </ul>
                </div>

                {/* Resources */}
                <div className="footer-col">
                  <h4>{tr.footer.resources}</h4>
                  <ul>
                    <li>Help Center</li>
                    <li>Guides</li>
                    <li>Templates</li>
                    <li>Blog</li>
                  </ul>
                </div>

                {/* Company */}
                <div className="footer-col">
                  <h4>{tr.footer.company}</h4>
                  <ul>
                    <li>About Us</li>
                    <li>Careers</li>
                    <li><a href="/privacy-policy">Privacy Policy</a></li>
                    <li><a href="/refund-policy">Refund Policy</a></li>
                    <li><a href="/terms">Terms</a></li>
                  </ul>
                </div>

                {/* Newsletter */}
                <div className="footer-col newsletter">
                  <h4>{tr.footer.newsletter}</h4>

                  <p>{tr.footer.newsletterDesc}</p>

                  <div className="email-box">
                    <input type="email" placeholder="Email" />
                    <button>→</button>
                  </div>

                  <p>{tr.footer.privacy}</p>
                </div>

              </div>

              {/* Bottom */}
              <div className="footer-bottom">
                <p>© 2025 Cortexa AI CRM</p>

                <div className="status">
                  <span className="dot"></span> {tr.footer.status}
                </div>

                <div className="social">
                  <span>in</span>
                  <span>t</span>
                  <span>▶</span>
                  <span>◎</span>
                </div>
              </div>
            </footer>
        </section>
    </div>
  );
}