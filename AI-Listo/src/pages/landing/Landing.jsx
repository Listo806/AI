import { useState, useEffect } from "react";
import "./Landing.css";

import logoImg from "../../assets/cortexa/logo.png";
import heroImg from "../../assets/cortexa/Cortexa Hero 1.png";
import heroImgES from "../../assets/cortexa/hero-es.jpg";
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

      nav: ["Features", "AI", "Integrations", "Pricing", "Resources"],

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
          q: "Do I need a credit card to start?",
          a: "No. You can start your free trial without entering a credit card if you want to test the experience first."
        },
        {
          q: "Can I manage leads from multiple channels?",
          a: "Yes. CORTEXA centralizes WhatsApp, Instagram, website forms, and more."
        },
        {
          q: "Does CORTEXA help automate follow-ups?",
          a: "Yes. AI Auto Reply and AI Setter handle follow-ups and booking automatically."
        },
        {
          q: "Can teams use CORTEXA together?",
          a: "Yes. Teams can collaborate, assign tasks, and track everything in real time."
        },
        {
          q: "Is this only for real estate?",
          a: "No. It works best for real estate but also supports service and sales businesses."
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
        }
    },

    es: {
      top: "Conoce tu CRM con IA. Maximiza la productividad con asistentes inteligentes.",
      nav: ["Funciones", "IA", "Integraciones", "Precios", "Recursos"],
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
        { q: "¿Necesito tarjeta?", a: "No necesitas tarjeta." },
        { q: "¿Puedo gestionar leads?", a: "Sí, todos los canales." },
        { q: "¿Automatiza seguimientos?", a: "Sí, la IA lo hace." },
        { q: "¿Uso en equipo?", a: "Sí, multiusuario." },
        { q: "¿Solo inmobiliaria?", a: "Funciona en varios sectores." }
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
        }
    },

    pt: {
      top: "Conheça seu CRM com IA. Maximize a produtividade com assistentes inteligentes.",
      nav: ["Recursos", "IA", "Integrações", "Preços", "Recursos"],
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
        { q: "Preciso de cartão?", a: "Não precisa cartão." },
        { q: "Gerenciar leads?", a: "Sim, todos canais." },
        { q: "Automatiza follow-ups?", a: "Sim, com IA." },
        { q: "Uso em equipe?", a: "Sim, multiusuário." },
        { q: "Só imobiliário?", a: "Funciona em vários setores." }
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
        }
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

  return (
    <div id="cortexa-ai-crm-landing">

      <p className="top-head">{tr.top}</p>

      <header className="cx-header">
        <div className="cx-header-inner">

          <div className="cx-left">
            <img src={logoImg} className="cx-logo-img" />
          </div>

          <nav className="cx-nav">
            {tr.nav.map((n, i) => (
              <button key={i}>{n}</button>
            ))}
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
      <section id="features" className="cx-hero">
        <img src={currentHero} />
      </section>

      {/* COMPARE */}
      <section className="cx-comp cx-center pt-50">
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
        <section id="ai-setter" className="cx-hero pt-50">
            <img src={currentSec2} alt="" />
        </section>
        <section id="whatsapp" className="cx-hero pt-50">
            <img src={currentSec3} alt="" />
        </section>
        <section id="pricing" className="cx-hero pt-20">
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
      <section className="cx-section pt-50">
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