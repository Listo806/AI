import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  CheckCircle,
  Bot,
  Zap,
  BarChart3,
  Sparkles,
  MessageSquare,
  Layers,
  ArrowUpRight,
  Users,
  Target,
  Brain,
  TrendingUp,
  Menu, X,
} from "lucide-react";
import { HashLink } from "react-router-hash-link";
import headlogoImg from "../../assets/cortexa/headlogo.png"; 
import headlogoM from "../../assets/cortexa/headlogotran.png";
import styles from "./FeaturesPage.module.css"; 

const t = {
  en: {
    nav: { features: "Features", aiAssistant: "AI Assistant", automations: "Automations", integrations: "Integrations", analytics: "Analytics", login: "Log In", trial: "Start Free Trial" },
    hero: { badge: "Product Overview", title: "CORTEXA Features", line1: "Everything real estate agents need to ", line2: "capture, manage, and close", line3: " more deals.", desc: "CORTEXA brings leads, WhatsApp conversations, AI follow-up, pipeline intelligence, automations, analytics, and team workflows into one clean real estate CRM.", btnTrial: "Start Free Trial", btnIntegrations: "View Integrations" },
    coreSection: { title: "Complete Real Estate Pipeline Control", desc: "Every tool your brokerage needs to convert raw traffic into closed commissions." },
    coreFeatures: [
      { title: "AI Lead Capture", text: "Automatically pull leads from Meta, Google, forms, and listings instantly into your pipeline." },
      { title: "WhatsApp AI Follow-Up", text: "Engage instantly with smart auto-responses, scheduling assist, and continuous structured chat." },
      { title: "Pipeline Intelligence", text: "Track deal visual cards, contact velocity, transaction records, and real estate interaction logs." },
      { title: "Smart CRM Automation", text: "Eliminate administrative bottlenecks. Route leads, assign team members, and trigger updates." },
      { title: "Team Workspace", text: "Manage multiple agents, permissions, shared calendars, and performance reports smoothly." },
      { title: "Analytics & Forecasting", text: "Deep analytical dashboard covering revenue, agent activity, and source conversions." }
    ],
    aiSection: { marker: "AI Engine", title: "24/7 AI Assistant Inside Your CRM", desc: "The AI Assistant helps agents respond faster, qualify leads, suggest next actions, summarize conversations, and support follow-up.", bullets: ["Helps qualify leads based on intent, budget, and timeline.", "Suggests next-best actions to guide buyers closer to an offer.", "Supports natural WhatsApp-style conversational responses.", "Helps agents avoid missed opportunities during off-hours.", "Works as a non-stop assistant integrated directly into your workflow."], chatTitle: "CORTEXA AI Agent", chatStatus: "Online", msgLeft: "Is this property still available for viewing this Saturday?", msgRight: "Yes! I can lock in 2:00 PM for you, or would you prefer a morning slots?", suggested: "Suggested Next Action: Send calendar link" },
    autoSection: { marker: "Operations", title: "Smart Workflows, Zero Redundant Work", desc: "CORTEXA automates repetitive work so agents can focus on closing deals.", bullets: ["Automated lead routing based on zip codes, value, or round-robin rules.", "Automated follow-up reminders so hot opportunities never turn cold.", "Instant pipeline stage updates when a client takes an action.", "Team assignment workflows to balance workloads effortlessly.", "Multi-channel WhatsApp/email-style follow-up flows."], node1: "New Lead Arrived ➔ Meta Ads", node2: "AI Assigned & Route ➔ Area Agent", node3: "Instant WhatsApp Campaign Dispatched" },
    analyticsSection: { marker: "Intelligence", title: "Data-Driven Pipeline Analytics", desc: "CORTEXA gives agents visibility into leads, deals, pipeline, activity, and revenue forecasting.", bullets: ["Detailed lead performance tracking across all digital sources.", "Real-time pipeline value visibility to monitor potential commissions.", "Conversion tracking pinpointing leaky steps in sales funnels.", "Predictive revenue forecasting metrics using performance history.", "Team performance and actionable activity insights."], pipeValue: "Pipeline GCV Value", convRate: "Conversion Rate: +4.2%" },
    ctaSection: { title: "Ready to organize your real estate business with CORTEXA?", btnTrial: "Start Free Trial", btnSupport: "Contact Support" },
    footer: { brandDesc: "The AI-powered CRM that helps you capture leads, automate follow-ups, and close more deals faster.", col1: "PRODUCT", col2: "RESOURCES", col3: "COMPANY", col4: "LEGAL", col1_items: ["Features", "AI Assistant", "Automations", "Integrations", "Analytics"], col2_items: ["Setup Guide", "Help Center", "Community", "API Docs"], col3_items: ["About Us", "Blog", "Careers", "Contact"], col4_items: ["Terms of Service", "Privacy Policy", "Refund Policy", "Cancellation Policy"] }
  },
  es: {
    nav: { features: "Características", aiAssistant: "Asistente IA", automations: "Automatizaciones", integrations: "Integraciones", analytics: "Análisis", login: "Iniciar Sesión", trial: "Prueba Gratis" },
    hero: { badge: "Descripción del Producto", title: "Características de CORTEXA", line1: "Todo lo que los agentes inmobiliarios necesitan para ", line2: "captar, gestionar y cerrar", line3: " más tratos.", desc: "CORTEXA reúne clientes potenciales, conversaciones de WhatsApp, seguimiento de IA, inteligencia de pipeline, automatizaciones, análisis y flujos de trabajo de equipo en un CRM inmobiliario limpio.", btnTrial: "Prueba Gratis", btnIntegrations: "Ver Integraciones" },
    coreSection: { title: "Control Completo del Pipeline Inmobiliario", desc: "Cada herramienta que su agencia necesita para convertir el tráfico bruto en comisiones cerradas." },
    coreFeatures: [
      { title: "Captura de Leads con IA", text: "Extraiga automáticamente clientes potenciales de Meta, Google, formularios y listados al instante en su pipeline." },
      { title: "Seguimiento de IA en WhatsApp", text: "Interactúe instantáneamente con respuestas automáticas inteligentes, asistencia de programación y chat estructurado continuo." },
      { title: "Inteligencia de Pipeline", text: "Realice un seguimiento de tarjetas visuales de ofertas, velocidad de contacto, registros de transacciones e historial de interacciones inmobiliarias." },
      { title: "Automatización Inteligente de CRM", text: "Elimine los cuellos de botella administrativos. Enrute leads, asigne miembros del equipo y active actualizaciones." },
      { title: "Espacio de Trabajo del Equipo", text: "Gestione múltiples agentes, permisos, calendarios compartidos e informes de rendimiento de manera fluida." },
      { title: "Análisis y Previsión", text: "Panel analítico profundo que cubre ingresos, actividad de los agentes y conversiones de origen." }
    ],
    aiSection: { marker: "Motor de IA", title: "Asistente de IA 24/7 Dentro de su CRM", desc: "El Asistente de IA ayuda a los agentes a responder más rápido, calificar clientes potenciales, sugerir próximas acciones, resumir conversaciones y apoyar el seguimiento.", bullets: ["Ayuda a calificar leads según intención, presupuesto y cronograma.", "Sugiere las mejores acciones a seguir para acercar a los compradores a una oferta.", "Admite respuestas conversacionales naturales al estilo de WhatsApp.", "Ayuda a los agentes a evitar oportunidades perdidas fuera del horario laboral.", "Funciona como un asistente continuo integrado directamente en su flujo de trabajo."], chatTitle: "Agente IA de CORTEXA", chatStatus: "En línea", msgLeft: "¿Esta propiedad sigue disponible para verla este sábado?", msgRight: "¡Sí! Puedo reservar las 2:00 PM para usted, ¿o prefiere un horario por la mañana?", suggested: "Próxima acción sugerida: Enviar enlace de calendario" },
    autoSection: { marker: "Operaciones", title: "Flujos de Trabajo Inteligentes, Cero Trabajo Redundante", desc: "CORTEXA automatiza el trabajo repetitivo para que los agentes puedan concentrarse en cerrar tratos.", bullets: ["Enrutamiento automatizado de leads según códigos postales, valor o reglas de distribución equitativa.", "Recordatorios de seguimiento automatizados para que las oportunidades calientes nunca se enfríen.", "Actualizaciones instantáneas de la etapa del pipeline cuando un cliente realiza una acción.", "Flujos de trabajo de asignación de equipos para equilibrar las cargas de trabajo sin esfuerzo.", "Flujos de seguimiento multicanal estilo WhatsApp/correo electrónico."], node1: "Nuevo Lead Recibido ➔ Meta Ads", node2: "IA Asignada y Enrutada ➔ Agente de Zona", node3: "Campaña Instantánea de WhatsApp Enviada" },
    analyticsSection: { marker: "Inteligencia", title: "Análisis de Pipeline Impulsado por Datos", desc: "CORTEXA brinda a los agentes visibilidad sobre leads, ofertas, pipeline, actividad y pronósticos de ingresos.", bullets: ["Seguimiento detallado del rendimiento de leads en todas las fuentes digitales.", "Visibilidad del valor del pipeline en tiempo real para monitorear posibles comisiones.", "Seguimiento de conversión identificando pasos con fugas en los embudos de ventas.", "Métricas predictivas de previsión de ingresos utilizando el historial de rendimiento.", "Rendimiento del equipo e información de actividad procesable."], pipeValue: "Valor GCV del Pipeline", convRate: "Tasa de conversión: +4.2%" },
    ctaSection: { title: "¿Listo para organizar su negocio inmobiliario con CORTEXA?", btnTrial: "Prueba Gratis", btnSupport: "Soporte de Contacto" },
    footer: { brandDesc: "El CRM potenciado por IA que lo ayuda a captar leads, automatizar seguimientos y cerrar más acuerdos más rápido.", col1: "PRODUCTO", col2: "RECURSOS", col3: "COMPAÑÍA", col4: "LEGAL", col1_items: ["Características", "Asistente IA", "Automatizaciones", "Integraciones", "Análisis"], col2_items: ["Guía de Configuración", "Centro de Ayuda", "Comunidad", "Docs de API"], col3_items: ["Sobre Nosotros", "Blog", "Carreras", "Contacto"], col4_items: ["Términos de Servicio", "Política de Privacidad", "Política de Reembolso", "Política de Cancelación"] }
  },
  pt: {
    nav: { features: "Recursos", aiAssistant: "Assistente IA", automations: "Automações", integrations: "Integrações", analytics: "Análise", login: "Entrar", trial: "Teste Grátis" },
    hero: { badge: "Visão Geral do Produto", title: "Recursos da CORTEXA", line1: "Tudo o que os corretores de imóveis precisam para ", line2: "capturar, gerenciar e fechar", line3: " mais negócios.", desc: "A CORTEXA traz leads, conversas de WhatsApp, acompanhamento de IA, inteligência de pipeline, automações, análises e fluxos de trabalho de equipe em um CRM imobiliário limpo.", btnTrial: "Teste Grátis", btnIntegrations: "Ver Integrações" },
    coreSection: { title: "Controle Total do Pipeline Imobiliário", desc: "Todas as ferramentas que sua imobiliária precisa para converter tráfego bruto em comissões fechadas." },
    coreFeatures: [
      { title: "Captura de Leads com IA", text: "Puxe leads automaticamente do Meta, Google, formulários e anúncios instantaneamente para seu pipeline." },
      { title: "Acompanhamento com IA no WhatsApp", text: "Engaje instantaneamente com respostas automáticas inteligentes, assistente de agendamento e chat estruturado contínuo." },
      { title: "Inteligência de Pipeline", text: "Monitore cartões visuais de negócios, velocidade de contato, registros de transações e histórico de interações imobiliárias." },
      { title: "Automação Inteligente de CRM", text: "Elimine gargalos administrativos. Direcione leads, atribua membros da equipe e dispare atualizações." },
      { title: "Espaço de Trabalho em Equipe", text: "Gerencie múltiplos corretores, permissões, calendários compartilhados e relatórios de desempenho perfeitamente." },
      { title: "Análise e Previsão", text: "Painel analítico profundo que cobre receita, atividade de corretores e conversões de origem." }
    ],
    aiSection: { marker: "Motor de IA", title: "Assistente de IA 24/7 Dentro do seu CRM", desc: "O Assistente de IA ajuda os corretores a responder mais rápido, qualificar leads, sugerir próximas ações, resumir conversas e apoiar o acompanhamento.", bullets: ["Ajuda a qualificar leads com base na intenção, orçamento e prazo.", "Sugere as próximas melhores ações para guiar os compradores rumo a uma proposta.", "Suporta respostas conversacionais naturais no estilo WhatsApp.", "Ajuda os corretores a evitar oportunidades perdidas fora do horário comercial.", "Funciona como um assistente ininterrupto integrado diretamente ao seu fluxo de trabalho."], chatTitle: "Agente de IA CORTEXA", chatStatus: "Online", msgLeft: "Este imóvel ainda está disponível para visitação neste sábado?", msgRight: "Sim! Posso agendar para as 14h para você, ou prefere um horário pela manhã?", suggested: "Próxima ação sugerida: Enviar link do calendário" },
    autoSection: { marker: "Operações", title: "Fluxos de Trabalho Inteligentes, Zero Trabalho Redundante", desc: "A CORTEXA automatiza o trabalho repetitivo para que os corretores possam focar no fechamento de negócios.", bullets: ["Roteamento automatizado de leads com base em CEPs, valor ou regras de rodízio.", "Lembretes automatizados de acompanhamento para que as oportunidades quentes nunca esfriem.", "Atualizações instantâneas de estágio do pipeline quando um cliente realiza uma ação.", "Fluxos de trabalho de atribuição de equipe para equilibrar as cargas de trabalho sem esforço.", "Fluxos de acompanhamento multicanais estilo WhatsApp/e-mail."], node1: "Novo Lead Recebido ➔ Meta Ads", node2: "IA Atribuída e Roteada ➔ Corretor da Região", node3: "Campanha Instantânea de WhatsApp Disparada" },
    analyticsSection: { marker: "Inteligência", title: "Análise de Pipeline Baseada em Dados", desc: "A CORTEXA oferece aos corretores visibilidade de leads, negócios, pipeline, atividade e previsão de receita.", bullets: ["Rastreamento detalhado do desempenho de leads em todas as fontes digitais.", "Visibilidade do valor do pipeline em tempo real para monitorar possíveis comissões.", "Rastreamento de conversão identificando etapas com gargalos nos funis de vendas.", "Métricas preditivas de previsão de receita usando o histórico de desempenho.", "Desempenho da equipe e insights de atividades acionáveis."], pipeValue: "Valor GCV do Pipeline", convRate: "Taxa de Conversão: +4.2%" },
    ctaSection: { title: "Pronto para organizar seu negócio imobiliário com a CORTEXA?", btnTrial: "Teste Grátis", btnSupport: "Suporte de Contato" },
    footer: { brandDesc: "O CRM alimentado por IA que ajuda você a capturar leads, automatizar acompanhamentos e fechar mais negócios mais rápido.", col1: "PRODUTO", col2: "RECURSOS", col3: "EMPRESA", col4: "LEGAL", col1_items: ["Recursos", "Assistente IA", "Automações", "Integrações", "Análise"], col2_items: ["Guia de Configuração", "Central de Ajuda", "Comunidade", "Docs da API"], col3_items: ["Sobre Nós", "Blog", "Carreiras", "Contato"], col4_items: ["Termos de Serviço", "Política de Privacidade", "Política de Reembolso", "Política de Cancelamento"] }
  }
};

export default function FeaturesPage() {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("cortexa_lang") || "en";
  });
  const [langOpen, setLangOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleLangChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem("cortexa_lang", newLang);
    setLangOpen(false);
  };

  const cur = t[lang] || t.en;

  const footerProductLinks = [
    { label: cur.footer.col1_items[0], href: "/features" },
    { label: cur.footer.col1_items[1], href: "/features#ai-assistant" },
    { label: cur.footer.col1_items[2], href: "/features#automations" },
    { label: cur.footer.col1_items[3], href: "/integrations" },
    { label: cur.footer.col1_items[4], href: "/features#analytics" },
  ];

  const coreFeaturesIcons = [
    { icon: Target, color: "#2563EB", bg: "#EEF4FF" },
    { icon: MessageSquare, color: "#059669", bg: "#EAFBF2" },
    { icon: Layers, color: "#6D5BFF", bg: "#F0ECFF" },
    { icon: Zap, color: "#F97316", bg: "#FFF3EA" },
    { icon: Users, color: "#DB2777", bg: "#FCE7F3" },
    { icon: BarChart3, color: "#0891B2", bg: "#ECFEFF" },
  ];

  const currentCoreFeatures = cur.coreFeatures.map((item, idx) => ({
    ...item,
    ...coreFeaturesIcons[idx]
  }));

  return (
    <div className={styles.page}>
      {/* ================= PUBLIC NAVIGATION HEADER ================= */}
      {isMobile ? (
        <header className={styles.mHeader}>
          <div className={styles.mLogoBlock}>
            <a href="/"><img src={headlogoM} alt="Cortexa" className="cx-logo-img" /></a>
          </div>
          
          <div className={styles.mHeaderRight}>
            <div className="m-lang-wrapper">
              <button
                type="button"
                className="m-lang-btn"
                onClick={() => setLangOpen(!langOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  textTransform: "uppercase",
                }}
              >
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
              </button>

              {langOpen && (
                <div className="m-lang-dropdown">
                  <button type="button" onClick={() => handleLangChange("en")}>
                    English
                  </button>
                  <button type="button" onClick={() => handleLangChange("es")}>
                    Español
                  </button>
                  <button type="button" onClick={() => handleLangChange("pt")}>
                    Português
                  </button>
                </div>
              )}
            </div>
            <button className={styles.mMenuBtn} onClick={() => setMenuOpen(true)}>
              <Menu size={26} color="#ffffff" />
            </button>
          </div>
        </header>
      ) : (
        /* Desktop Header  */
        <header className={styles.header}>
          <a href="/" className={styles.logoWrap}>
            <img src={headlogoImg} className="cx-logo-img" alt="CORTEXA Logo" />
          </a>

          <nav className={styles.nav}>
            <HashLink smooth to="/features" className={`${styles.navLink} ${styles.activeNav}`}>
              {cur.nav.features}
            </HashLink>
            <HashLink smooth to="/features#ai-assistant" className={styles.navLink}>
              {cur.nav.aiAssistant}
            </HashLink>
            <HashLink smooth to="/features#automations" className={styles.navLink}>
              {cur.nav.automations}
            </HashLink>
            <a href="/integrations" className={styles.navLink}>
              {cur.nav.integrations}
            </a>
            <HashLink smooth to="/features#analytics" className={styles.navLink}>
              {cur.nav.analytics}
            </HashLink>
          </nav>

          <div className={styles.headerActions}>
            <a href="/sign-in" className={styles.loginBtn}>{cur.nav.login}</a>
            <div className="lang-wrapper">
              <div
                className="lang-toggle"
                onClick={() => setLangOpen(!langOpen)}
                style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
              >
                <span data-lang={lang} style={{ display: "flex", alignItems: "center", gap: "4px", textTransform: "uppercase" }}>
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
                  <div className="lang-item" onClick={() => handleLangChange("en")}>
                    English
                  </div>
                  <div className="lang-item" onClick={() => handleLangChange("es")}>
                    Español
                  </div>
                  <div className="lang-item" onClick={() => handleLangChange("pt")}>
                    Português
                  </div>
                </div>
              )}
            </div>
            <a href="/trial" className={styles.primaryBtn}>{cur.nav.trial}</a>
          </div>
        </header>
      )}

      {/* ================= MOBILE NAVIGATION DRAWER ================= */}
      {isMobile && (
        <div className={`${styles.mDrawer} ${menuOpen ? styles.open : ""}`}>
          <div className={styles.mDrawerTop}>
            <div className={styles.mLogoBlock}>
              <a href="/"><img src={headlogoM} alt="Cortexa" className="cx-logo-img" /></a>
            </div>
            <button className={styles.mClose} onClick={() => setMenuOpen(false)}>
              <X size={24} color="#ffffff" />
            </button>
          </div>
          
          <div className={styles.mDrawerNav} onClick={() => setMenuOpen(false)}>
            <HashLink className={styles.navMenu} smooth to="/features">{cur.nav.features}</HashLink>
            <HashLink className={styles.navMenu} smooth to="/features#ai-assistant">{cur.nav.aiAssistant}</HashLink>
            <HashLink className={styles.navMenu} smooth to="/features#automations">{cur.nav.automations}</HashLink>
            <a href="/integrations" className={styles.navMenu}>{cur.nav.integrations}</a>
            <HashLink className={styles.navMenu} smooth to="/features#analytics">{cur.nav.analytics}</HashLink>
          </div>
          
          <div className={styles.mDrawerActions}>
            <a href="/trial" className={styles.mDrawerTrialBtn}>{cur.nav.trial}</a>
            <a className={styles.mDrawerLoginBtn} href="/sign-in">{cur.nav.login}</a>
          </div>
        </div>
      )}

      <main>
        {/* ================= 1. HERO SECTION ================= */}
        <section className={styles.heroSection}>
          <div className={styles.badge}>
            <Sparkles size={14} /> {cur.hero.badge}
          </div>
          <h1 className={styles.heroTitle}>{cur.hero.title}</h1>
          <h2 className={styles.heroHeadline}>
            {cur.hero.line1} <br />
            <span className={styles.gradientText}>{cur.hero.line2}</span>{cur.hero.line3}
          </h2>
          <p className={styles.heroDescription}>
            {cur.hero.desc}
          </p>
          <div className={styles.heroButtons}>
            <a href="/trial" className={styles.bigPrimaryBtn}>
              {cur.hero.btnTrial} <ArrowRight size={18} />
            </a>
            <a href="/integrations" className={styles.outlineBtn}>
              {cur.hero.btnIntegrations} <ArrowUpRight size={18} />
            </a>
          </div>
        </section>

        {/* ================= 2. CORE FEATURES SECTION ================= */}
        <section className={styles.coreSection}>
          <div className={styles.sectionHeader}>
            <h2>{cur.coreSection.title}</h2>
            <p>{cur.coreSection.desc}</p>
          </div>
          <div className={styles.coreGrid}>
            {currentCoreFeatures.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <div key={idx} className={styles.coreCard}>
                  <div className={styles.iconWrap} style={{ backgroundColor: item.bg, color: item.color }}>
                    <IconComponent size={24} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= 3. AI ASSISTANT SECTION ================= */}
        <section id="ai-assistant" className={styles.detailSection}>
          <div className={styles.detailGrid}>
            <div className={styles.detailText}>
              <div className={styles.sectionMarker} style={{ color: "#2563EB", background: "#EEF4FF" }}>
                <Brain size={16} /> {cur.aiSection.marker}
              </div>
              <h2>{cur.aiSection.title}</h2>
              <p className={styles.sectionPurpose}>
                {cur.aiSection.desc}
              </p>
              
              <div className={styles.bulletList}>
                {cur.aiSection.bullets.map((bullet, index) => (
                  <div key={index} className={styles.bulletItem}>
                    <CheckCircle size={18} className={styles.checkIcon} />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.visualPanel}>
              <div className={styles.mockChatBox}>
                <div className={styles.chatHeader}>
                  <Bot size={18} color="#2563EB" /> <span>{cur.aiSection.chatTitle}</span>
                  <span className={styles.statusDot}>{cur.aiSection.chatStatus}</span>
                </div>
                <div className={styles.chatBody}>
                  <div className={styles.msgLeft}>{cur.aiSection.msgLeft}</div>
                  <div className={styles.msgRight}>{cur.aiSection.msgRight}</div>
                  <div className={styles.aiTag}>{cur.aiSection.suggested}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 4. AUTOMATIONS SECTION ================= */}
        <section id="automations" className={styles.detailSection} style={{ backgroundColor: "#F8FAFC" }}>
          <div className={styles.detailGrid} style={{ direction: "rtl" }}>
            <div className={styles.detailText} style={{ direction: "ltr" }}>
              <div className={styles.sectionMarker} style={{ color: "#F97316", background: "#FFF3EA" }}>
                <Zap size={16} /> {cur.autoSection.marker}
              </div>
              <h2>{cur.autoSection.title}</h2>
              <p className={styles.sectionPurpose}>
                {cur.autoSection.desc}
              </p>

              <div className={styles.bulletList}>
                {cur.autoSection.bullets.map((bullet, index) => (
                  <div key={index} className={styles.bulletItem}>
                    <CheckCircle size={18} className={styles.checkIcon} />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.visualPanel} style={{ direction: "ltr" }}>
              <div className={styles.mockWorkflow}>
                <div className={styles.flowNode}>{cur.autoSection.node1}</div>
                <div className={styles.flowLine}>↓</div>
                <div className={styles.flowNodeActive}>{cur.autoSection.node2}</div>
                <div className={styles.flowLine}>↓</div>
                <div className={styles.flowNode}>{cur.autoSection.node3}</div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 5. ANALYTICS SECTION ================= */}
        <section id="analytics" className={styles.detailSection}>
          <div className={styles.detailGrid}>
            <div className={styles.detailText}>
              <div className={styles.sectionMarker} style={{ color: "#0891B2", background: "#ECFEFF" }}>
                <BarChart3 size={16} /> {cur.analyticsSection.marker}
              </div>
              <h2>{cur.analyticsSection.title}</h2>
              <p className={styles.sectionPurpose}>
                {cur.analyticsSection.desc}
              </p>

              <div className={styles.bulletList}>
                {cur.analyticsSection.bullets.map((bullet, index) => (
                  <div key={index} className={styles.bulletItem}>
                    <CheckCircle size={18} className={styles.checkIcon} />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.visualPanel}>
              <div className={styles.mockAnalyticsBox}>
                <div className={styles.analyticsRow}>
                  <span>{cur.analyticsSection.pipeValue}</span>
                  <strong>$2,450,000</strong>
                </div>
                <div className={styles.chartBarWrap}>
                  <div className={styles.chartBar} style={{ width: "85%", backgroundColor: "#0891B2" }}></div>
                  <div className={styles.chartBar} style={{ width: "45%", backgroundColor: "#38BDF8" }}></div>
                </div>
                <div className={styles.analyticsMini}><TrendingUp size={14} /> {cur.analyticsSection.convRate}</div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 6. FINAL CTA SECTION ================= */}
        <section className={styles.ctaSection}>
          <h2 className={styles.ctaTitle}>{cur.ctaSection.title}</h2>
          <div className={styles.ctaButtons}>
            <a href="/trial" className={styles.bigPrimaryBtn}>
              {cur.ctaSection.btnTrial} <ArrowRight size={18} />
            </a>
            <a href="/support" className={styles.outlineCtaBtn}>
              {cur.ctaSection.btnSupport}
            </a>
          </div>
        </section>
      </main>

      {/* ================= PUBLIC FOOTER CONTAINS ALL COLUMNS ================= */}
      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div className={styles.brandColumn}>
            <img src={headlogoImg} className="cx-logo-img" alt="CORTEXA Logo" />
            <p>{cur.footer.brandDesc}</p>
          </div>

          <div className={styles.footerColumn}>
            <h4>{cur.footer.col1}</h4>
            {footerProductLinks.map((link, idx) => (
              <HashLink smooth key={idx} to={link.href}>
                {link.label}
              </HashLink>
            ))}
          </div>

          <div className={styles.footerColumn}>
            <h4>{cur.footer.col2}</h4>
            <a href="/setup-guide">{cur.footer.col2_items[0]}</a>
            <a href="/help">{cur.footer.col2_items[1]}</a>
            <a href="/contact">{cur.footer.col2_items[2]}</a>
            <a href="/help/api">{cur.footer.col2_items[3]}</a>
          </div>

          <div className={styles.footerColumn}>
            <h4>{cur.footer.col3}</h4>
            <a href="/about">{cur.footer.col3_items[0]}</a>
            <a href="/">{cur.footer.col3_items[1]}</a>
            <a href="/">{cur.footer.col3_items[2]}</a>
            <a href="/contact">{cur.footer.col3_items[3]}</a>
          </div>

          <div className={styles.footerColumn}>
            <h4>{cur.footer.col4}</h4>
            <a href="/terms">{cur.footer.col4_items[0]}</a>
            <a href="/privacy-policy">{cur.footer.col4_items[1]}</a>
            <a href="/refund-policy">{cur.footer.col4_items[2]}</a>
            <a href="/cancellation">{cur.footer.col4_items[3]}</a>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} CORTEXA. All rights reserved. Public Pre-auth Information Layout.</p>
        </div>
      </footer>
    </div>
  );
}