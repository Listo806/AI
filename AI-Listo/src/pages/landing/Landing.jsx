import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    UserPlus,
    RefreshCcw,
    DollarSign,
    BarChart3,
    Brain,
    Plug,
    ArrowRight 
  } from "lucide-react";
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

  const t = {
    en: {
      top: "Meet Your AI CRM. Maximize human productivity with your custom AI teammates.",

      nav: [
        "Features",
        "AI Assistant",
        "Automation",
        "Pipeline",
        "Analytics",
        "Testimonials",
      ],

      trial: "Start Free Trial",
      login: "Log in",

      dashboardTitle: "Dashboards you work from, not just look at",

      without: "Without CORTEXA",
      with: "With CORTEXA",

      withoutList: [
        "Leads scattered across apps and spreadsheets",
        "Slow manual follow-ups and missed messages",
        "No real-time visibility into your pipeline",
        "Hard to know what your team is doing",
      ],

      withList: [
        "Everything in one powerful dashboard",
        "Instant WhatsApp replies and AI automation",
        "Live pipeline updates and performance tracking",
        "Know exactly what’s happening and what to do next",
      ],

      stripTitle: "Your CRM shouldn’t slow you down.",
      stripSub: "Join teams using CORTEXA...",

      featuresTitle: "Turn your data into decisions",

      cards: [
        {
          eyebrow: "AI Assistant",
          title: "Instant answers from your dashboard",
          desc: "Get insights, summaries, and recommendations in seconds. Ask anything about your leads, pipeline, properties, or team performance.",
        },
        {
          eyebrow: "Analytics",
          title: "Track performance in real time",
          desc: "Monitor conversion rates, response times, and activity across your business. Know what’s working and where to improve instantly.",
        },
        {
          eyebrow: "AI Auto Reply",
          title: "Automate your follow-ups",
          desc: "Never miss a lead. Send instant, personalized replies across your channels and nurture opportunities automatically.",
        },
        {
          eyebrow: "AI Setter",
          title: "Close deals faster with AI",
          desc: "AI qualifies leads, books appointments, and moves opportunities forward while your team focuses on closing.",
        },
      ],

      trustTitle: "Built to operate with confidence",
      trust: [
        "Secure workflows",
        "Live performance visibility",
        "Scalable system",
        "AI-driven efficiency",
      ],

      faqTitle: "FAQs",

      faq: [
        {
          q: "What does CORTEXA actually do?",
          a: "CORTEXA automates your lead follow-ups, conversations, pipeline updates, and appointment scheduling — all in one system.",
        },
        {
          q: "How does the AI Assistant work?",
          a: "The AI responds instantly to leads, qualifies them, books appointments, and keeps every conversation moving automatically.",
        },
        {
          q: "Can I manage all my leads in one place?",
          a: "Yes. All your leads, messages, and deal stages are centralized in one dashboard so nothing gets lost.",
        },
        {
          q: "Does it update my pipeline automatically?",
          a: "Yes. As leads interact, the system moves them through your pipeline without manual input.",
        },
        {
          q: "Will I still need to follow up manually?",
          a: "No. CORTEXA is designed to handle follow-ups automatically while keeping leads engaged.",
        },
        {
          q: "Can my team use this together?",
          a: "Yes. You can add team members, assign leads, and manage deals collaboratively.",
        },
        {
          q: "What kind of businesses is this for?",
          a: "CORTEXA is built for real estate agents, teams, and any business that relies on lead generation and closing deals.",
        },
        {
          q: "What happens after a lead comes in?",
          a: "The system responds instantly, qualifies the lead, and pushes them toward booking or closing — automatically.",
        },
      ],

      finalTitle: "Replace the work of multiple agents — with one AI system",
      finalDesc: "Capture, follow up, and move every lead forward automatically — without adding payroll.",
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
        status: "All systems operational",
      },
      strip: {
        title: "Your CRM shouldn’t slow you down.",
        sub: "Join teams using CORTEXA...",
        btn: "Start Free Trial",
      },
      aiTitle: "AI Setter — Your 24/7 Appointment Engine",
      aisubTitle:
        "Responds instantly, qualifies buyers, and books appointments — automatically.",
      aipointTitle1: "Instant Responses",
      aipointText1: "Every message answered in seconds.",
      aipointTitle2: "Smart Qualification",
      aipointText2: "Filters serious buyers automatically.",
      aipointTitle3: "Automatic Booking",
      aipointText3: "Appointments scheduled without back-and-forth.",
      aialt: "AI Setter handling conversations and booking appointments",
      reinforcement: "Run your entire pipeline with AI — no extra hires, no missed opportunities.",
      beTitle: "What This Actually Does For You",
      besubTitle:
        "Automation handles the work. Communication never stops. Every lead keeps moving forward — without you chasing it.",
      beitem1: "Work Happens Automatically",
      beitem2: "Conversations Stay Active",
      beitem3: "Clarity Without Guesswork",
      beitem4: "More Deals, Less Effort",
      beitemtext1:
        "Follow-ups, tracking, and organization run in the background.",
      beitemtext2: "Leads get responses, reminders, and engagement 24/7.",
      beitemtext3: "You always know who to focus on and what to do next.",
      beitemtext4: "Less manual work, faster movement, better outcomes.",
      bebottom: "Everything keeps moving — even when you’re not.",
      stripLabel: "Ready to grow?",
      stripTitle: "Start closing more deals — with AI working for you 24/7.",
      stripSub:
        "No extra hires. No missed leads. Just a smarter way to run your pipeline.",
      stripBtn: "Start Your Free Trial →",
      stripTrust: "No risk. Cancel anytime.",
      stripBenefit1: "Get started in minutes",
      stripBenefit3: "Cancel anytime",
      stripCardTitle: "Pipeline Overview",
      stripCardPeriod: "This Month",
      stripRevenueGrowth: "▲ 28% vs last month",
      stripLeads: "Leads",
      stripDeals: "Deals",
      stripRevenue: "Revenue",
      stripAI: "AI Summary: You're on track to beat your monthly goal by 24%",

      roiTitle: "Replace 3–5 agents. Pay for one system. Close more deals.",
      roiSub: "CORTEXA runs your lead flow, follow-ups, and pipeline automatically — capturing every opportunity and turning missed leads into closed revenue 24/7.",
      roiBtn: "Start Free Trial",
      roiStat1Number: "+312%",
      roiStat1Label: "ROI",
      roiStat1Desc: "CORTEXA transforms your lead handling into a revenue engine — automating follow-ups and deal flow to generate more closed deals.",
      roiStat2Number: "+$2.4M+",
      roiStat2Label: "Revenue Increase",
      roiStat2Desc: "More conversations. Faster responses. Zero missed leads — turning your pipeline into predictable revenue.",
      roiStat3Number: "80,000+",
      roiStat3Label: "Hours Saved",
      roiStat3Desc: "AI replaces manual outreach, follow-ups, and admin work — freeing your time while your business keeps moving.",
      roiStat4Number: "< 30 Days",
      roiStat4Label: "Payback",
      roiStat4Desc: "Most users recover their investment within the first month from deals that would have otherwise been lost.",

      aiCrmBadge: "AI-Powered CRM",
      aiCrmTitle1: "Meet Your",
      aiCrmTitleHighlight: "AI CRM",
      aiCrmSub: "Your 24/7 AI team that captures, follows up, and closes — while you focus on what matters.",
      aiCrmSupport: "Capture more leads. Close more deals. Never miss an opportunity.",
      aiCrmF1Title: "Fills Your Pipeline",
      aiCrmF1Desc: "AI finds, qualifies, and engages new leads for you.",
      aiCrmF2Title: "Chats & Closes",
      aiCrmF2Desc: "AI handles conversations, answers questions, and closes deals.",
      aiCrmF3Title: "Shows You the Money",
      aiCrmF3Desc: "Real-time insights, revenue tracking, and growth visibility.",
      aiCrmF4Title: "Works 24/7",
      aiCrmF4Desc: "Always on. Always working. Never misses a lead or opportunity.",
      aiCrmF5Title: "Keeps Customers Happy",
      aiCrmF5Desc: "AI nurtures relationships and delivers instant support.",

      heroTitleLine1: "Get Instant Leads —",
      heroTitleLine2: "Close More Deals 24/7",
      heroSubtitle:
        "Capture, follow up, and close — all in one system. Connect all your apps so your listings, leads, and data flow into one place automatically.",
      heroCheck1: "Replace multiple agents with one AI system",
      heroCheck2: "Save thousands per month on staffing & missed opportunities",
      heroCheck3: "Works 24/7 — never misses a lead or opportunity",
      heroCheck4: "Close more deals with zero manual follow-up",
      heroCheck5: "Your AI Agent finds & qualifies leads automatically",
      heroCheck6: "Capture every lead from ads, listings & funnels — in one place",
      heroCheck7: "No missed opportunities — everything flows in instantly",
      heroCheck8: "Start getting leads without lifting a finger",
      heroCheck9: "Your AI Agent follows up instantly via calls, texts & WhatsApp",
      heroCheck10: "Handles conversations, qualifies, and nurtures every lead",
      heroCheck11: "Books appointments directly on your calendar",
      heroCheck12: "See every lead, deal & opportunity in one dashboard",
      heroCTA: "Start Your Free Trial",
      heroUnlock: "Unlock potential today!",
      heroTag1: "Get Leads",
      heroTag2: "Automate Follow-Up",
      heroTag3: "Close Deals",
      heroTag4: "Track Everything",
      heroTag5: "AI Engine",
      heroTag6: "Connect Your Apps",
      heroHead: "Real Estate Agents & Teams",

      dominantTitleLine1: "A Real Estate Platform",
      dominantTitleLine2: "Built for Real Estate",
      dominantSubtitle:
        "Everything you need is already here. Bring your workflow into one system built to handle your leads, listings, deals, analytics, and AI — all working together.",
      dominantItem1Title: "Built for Your Business",
      dominantItem1Desc:
        "Manage listings, track leads, and move deals — all in one place.",
      dominantItem2Title: "Everything Connected — Automatically",
      dominantItem2Desc:
        "Your pipeline, analytics, and AI all communicate together. Nothing is separate. Nothing is missing.",
      dominantItem3Title: "Ready to Go",
      dominantItem3Desc:
        "No guessing what you need. No building systems. It’s already built for you.",
      dominantPowerLine1: "Bring your workflow here —",
      dominantPowerLine2: "and let the system run it the right way.",
      dominantCTA: "Start Your Free Trial",
      dominantHowTitle: "How It Works",
      dominantHowSubtitle:
        "Bring your workflow in — and the system takes over.",
      dominantStep1Title: "Bring Your Workflow",
      dominantStep1Desc:
        "Import your leads, listings, and deals into the system.",
      dominantStep2Title: "AI Activates",
      dominantStep2Desc:
        "AI captures, responds, and follows up instantly.",
      dominantStep3Title: "Pipeline Moves",
      dominantStep3Desc:
        "Leads move through your pipeline automatically.",
      dominantBottom1Title: "Deals Close",
      dominantBottom1Desc:
        "Your system keeps momentum until deals are closed.",
      dominantBottom2Title: "Analytics Track Everything",
      dominantBottom2Desc:
        "See exactly where your business stands in real time.",
      dominantBottom3Title: "You Stay in Control",
      dominantBottom3Desc:
        "Clear visibility, better decisions, stronger performance.",
      dominantFinal:
        "From first lead to closing — everything is handled inside one system.",

      smartEyebrow: "Intelligent Integrations",
      smartTitle: "Turn your entire real estate business into an automated revenue machine",
      smartSubtitle: "Bring your listings, leads, messages, and funnels into one place. Cortexa connects everything, organizes everything, and uses AI to track, analyze, and move every deal forward — automatically.",
      smartFlow: "Flow",
      smartAutomated: "Automated",
      smartOptimized: "Optimized",
      smartFlow1Label: "Lead Capture & Follow-Up",
      smartFlow1Title: "Ads → CRM → WhatsApp → AI",
      smartFlow1Desc: "Every lead is captured instantly, qualified, and followed up automatically — so you never miss another opportunity.",
      smartFlow2Label: "Listings, Funnels & Automation",
      smartFlow2Title: "Website + Listings → CRM → Smart Sequences",
      smartFlow2Desc: "Your properties, landing pages, and funnels feed into one system — triggering intelligent follow-ups until leads are ready to buy.",
      smartFlow3Label: "Deals, Data & Analytics",
      smartFlow3Title: "Pipeline → AI Tracking → Performance Insights",
      smartFlow3Desc: "Every deal is tracked, every action is analyzed, and your performance is organized into clear insights you can act on.",
      smartBottom: "Your entire operation — connected, automated, and optimized in one intelligent system.",
      smartCTA: "Turn your business into an automated machine",

      topLine1: "Meet Your AI CRM.",
      topLine2: "Powered by",
      topHighlight: "AI Agents",
      topLine3: "that capture, follow up, and close your leads automatically."

    },

    es: {
      top: "Conoce tu CRM con IA. Maximiza la productividad con asistentes inteligentes.",
      nav: [
        "Características",
        "Asistente de IA",
        "Automatización",
        "Pipeline",
        "Análisis",
        "Testimonios",
      ],
      trial: "Prueba gratis",
      login: "Iniciar sesión",

      dashboardTitle: "Paneles que usas, no solo miras",

      without: "Sin CORTEXA",
      with: "Con CORTEXA",

      withoutList: [
        "Leads dispersos en apps y hojas de cálculo",
        "Seguimientos manuales lentos y mensajes perdidos",
        "Sin visibilidad en tiempo real del pipeline",
        "Difícil saber qué hace tu equipo",
      ],

      withList: [
        "Todo en un panel potente",
        "Respuestas instantáneas por WhatsApp y automatización IA",
        "Actualizaciones en vivo del pipeline",
        "Saber exactamente qué pasa y qué hacer",
      ],

      stripTitle: "Tu CRM no debería ralentizarte.",
      stripSub: "Únete a equipos que usan CORTEXA...",

      featuresTitle: "Convierte tus datos en decisiones",

      cards: [
        {
          eyebrow: "Asistente de IA",
          title: "Respuestas instantáneas desde tu panel",
          desc: "Obtén insights y recomendaciones en segundos sobre leads, pipeline y rendimiento.",
        },
        {
          eyebrow: "Análisis",
          title: "Rendimiento en tiempo real",
          desc: "Monitorea conversiones, respuestas y actividad de tu negocio.",
        },
        {
          eyebrow: "Respuesta automática con IA",
          title: "Automatiza seguimientos",
          desc: "Nunca pierdas un lead. Responde automáticamente en todos tus canales.",
        },
        {
          eyebrow: "Configurador de IA",
          title: "Cierra más rápido con IA",
          desc: "La IA califica leads, agenda citas y avanza oportunidades.",
        },
      ],

      trustTitle: "Construido para operar con confianza",
      trust: [
        "Flujos seguros",
        "Visibilidad en tiempo real",
        "Sistema escalable",
        "Eficiencia con IA",
      ],

      faqTitle: "Preguntas frecuentes",

      faq: [
        {
          q: "¿Qué hace exactamente CORTEXA?",
          a: "CORTEXA automatiza el seguimiento de clientes potenciales, las conversaciones, las actualizaciones del embudo de ventas y la programación de citas, todo en un solo sistema.",
        },
        {
          q: "¿Cómo funciona el Asistente de IA?",
          a: "La IA responde instantáneamente a los clientes potenciales, los califica, agenda citas y mantiene la conversación en marcha automáticamente.",
        },
        {
          q: "¿Puedo gestionar todos mis clientes potenciales en un solo lugar?",
          a: "Sí. Todos tus clientes potenciales, mensajes y etapas del pipeline están centralizados en un panel para que no se pierda nada.",
        },
        {
          q: "¿Actualiza mi pipeline automáticamente?",
          a: "Sí. A medida que los clientes potenciales interactúan, el sistema los mueve a través de tu pipeline sin intervención manual.",
        },
        {
          q: "¿Aún tendré que hacer seguimiento manualmente?",
          a: "No. CORTEXA está diseñado para gestionar el seguimiento automáticamente y mantener a los clientes potenciales comprometidos.",
        },
        {
          q: "¿Puede mi equipo usarlo en conjunto?",
          a: "Sí. Puedes agregar miembros del equipo, asignar clientes potenciales y gestionar acuerdos de forma colaborativa.",
        },
        {
          q: "¿Para qué tipo de negocios es esto?",
          a: "CORTEXA está diseñado para agentes inmobiliarios, equipos y cualquier negocio que dependa de generación de leads y cierre de ventas.",
        },
        {
          q: "¿Qué sucede después de que llega un cliente potencial?",
          a: "El sistema responde al instante, califica al cliente potencial y lo impulsa hacia la reserva o el cierre automáticamente.",
        },
      ],

      finalTitle: "Reemplaza el trabajo de múltiples agentes — con un solo sistema de IA",
      finalDesc: "Captura, da seguimiento y avanza cada lead automáticamente — sin aumentar la nómina.",
      footer: {
        desc: "El CRM con IA que ayuda a los equipos a cerrar más ventas más rápido.",
        btn: "Empieza tu prueba gratuita →",
        product: "Producto",
        solutions: "Soluciones",
        resources: "Recursos",
        company: "Empresa",
        newsletter: "Mantente actualizado",
        newsletterDesc: "Recibe novedades, consejos y noticias del producto.",
        privacy:
          "Respetamos tu privacidad. Puedes darte de baja en cualquier momento.",
        status: "Todos los sistemas operativos",
      },
      strip: {
        title: "Tu CRM no debería ralentizarte.",
        sub: "Únete a equipos que usan CORTEXA...",
        btn: "Prueba gratis",
      },
      aiTitle:
        "AI Setter: tu motor de citas disponible las 24 horas, los 7 días de la semana.",
      aisubTitle:
        "Responde al instante, califica a los compradores y programa citas automáticamente.",

      aipointTitle1: "Respuestas instantáneas",
      aipointText1: "Cada mensaje se responde en segundos.",

      aipointTitle2: "Calificación inteligente",
      aipointText2: "Filtra automáticamente a los compradores serios.",

      aipointTitle3: "Reserva automática",
      aipointText3: "Citas programadas sin idas y venidas.",
      aialt: "IA que gestiona conversaciones y agenda citas automáticamente",
      reinforcement:
        "Gestiona todo tu pipeline con IA — sin contratar más personal y sin perder oportunidades.",
      beTitle: "Lo que esto realmente hace por ti",
      besubTitle:
        "La automatización hace el trabajo. La comunicación nunca se detiene. Cada lead sigue avanzando — sin que tengas que perseguirlo.",
      beitem1: "El trabajo sucede automáticamente",
      beitem2: "Las conversaciones se mantienen activas",
      beitem3: "Claridad sin suposiciones",
      beitem4: "Más ventas, menos esfuerzo",

      beitemtext1:
        "Los seguimientos, el control y la organización funcionan en segundo plano.",
      beitemtext2:
        "Los leads reciben respuestas, recordatorios e interacción 24/7.",
      beitemtext3: "Siempre sabes en quién enfocarte y qué hacer después.",
      beitemtext4:
        "Menos trabajo manual, mayor velocidad y mejores resultados.",
      bebottom: "Todo sigue avanzando — incluso cuando tú no estás.",

      stripLabel: "¿Listo para crecer?",
      stripTitle:
        "Empieza a cerrar más ventas — con IA trabajando para ti 24/7.",
      stripSub:
        "Sin contratar más personal. Sin perder leads. Solo una forma más inteligente de gestionar tu pipeline.",
      stripBtn: "Empieza tu prueba gratis →",
      stripTrust: "Sin riesgo. Cancela en cualquier momento.",
      stripBenefit1: "Empieza en minutos",
      stripBenefit3: "Cancela en cualquier momento",
      stripCardTitle: "Resumen del pipeline",
      stripCardPeriod: "Este mes",
      stripRevenueGrowth: "▲ 28% vs el mes pasado",
      stripLeads: "Leads",
      stripDeals: "Ventas",
      stripRevenue: "Ingresos",
      stripAI: "Resumen IA: Estás en camino de superar tu objetivo mensual en un 24%",

      roiTitle: "Reemplaza de 3 a 5 agentes. Paga por un solo sistema. Cierra más ventas.",
      roiSub: "CORTEXA gestiona automáticamente tus leads, seguimientos y pipeline — capturando cada oportunidad y convirtiendo leads perdidos en ingresos cerrados 24/7.",
      roiBtn: "Prueba gratis",
      roiStat1Number: "+312%",
      roiStat1Label: "ROI",
      roiStat1Desc: "CORTEXA transforma la gestión de tus leads en un motor de ingresos — automatizando seguimientos y el flujo de ventas para generar más cierres.",
      roiStat2Number: "+$2.4M+",
      roiStat2Label: "Incremento de ingresos",
      roiStat2Desc: "Más conversaciones. Respuestas más rápidas. Cero leads perdidos — convirtiendo tu pipeline en ingresos predecibles.",
      roiStat3Number: "80,000+",
      roiStat3Label: "Horas ahorradas",
      roiStat3Desc: "La IA reemplaza el trabajo manual, seguimientos y tareas administrativas — liberando tu tiempo mientras tu negocio sigue avanzando.",
      roiStat4Number: "< 30 días",
      roiStat4Label: "Recuperación",
      roiStat4Desc: "La mayoría de los usuarios recuperan su inversión en el primer mes gracias a acuerdos que antes se habrían perdido.",

      aiCrmBadge: "CRM con IA",
      aiCrmTitle1: "Conoce tu",
      aiCrmTitleHighlight: "CRM con IA",
      aiCrmSub: "Tu equipo de IA 24/7 que captura, da seguimiento y cierra — mientras tú te enfocas en lo importante.",
      aiCrmSupport: "Captura más leads. Cierra más ventas. Nunca pierdas una oportunidad.",
      aiCrmF1Title: "Llena tu pipeline",
      aiCrmF1Desc: "La IA encuentra, califica y conecta nuevos leads por ti.",
      aiCrmF2Title: "Chatea y cierra",
      aiCrmF2Desc: "La IA gestiona conversaciones, responde preguntas y cierra ventas.",
      aiCrmF3Title: "Te muestra el dinero",
      aiCrmF3Desc: "Insights en tiempo real, seguimiento de ingresos y crecimiento.",
      aiCrmF4Title: "Funciona 24/7",
      aiCrmF4Desc: "Siempre activo. Nunca pierde un lead ni una oportunidad.",
      aiCrmF5Title: "Clientes felices",
      aiCrmF5Desc: "La IA cuida relaciones y ofrece soporte instantáneo.",

      heroTitleLine1: "Obtén leads al instante —",
      heroTitleLine2: "Cierra más ventas 24/7",
      heroSubtitle:
        "Captura, da seguimiento y cierra — todo en un solo sistema. Conecta todas tus aplicaciones para que tus propiedades, leads y datos fluyan automáticamente en un solo lugar.",
      heroCheck1: "Reemplaza múltiples agentes con un solo sistema de IA",
      heroCheck2: "Ahorra miles al mes en personal y oportunidades perdidas",
      heroCheck3: "Funciona 24/7 — nunca pierde un lead u oportunidad",
      heroCheck4: "Cierra más ventas sin seguimiento manual",
      heroCheck5: "Tu agente de IA encuentra y califica leads automáticamente",
      heroCheck6: "Captura cada lead de anuncios, listados y embudos — en un solo lugar",
      heroCheck7: "Sin oportunidades perdidas — todo fluye instantáneamente",
      heroCheck8: "Empieza a recibir leads sin mover un dedo",
      heroCheck9: "Tu agente de IA hace seguimiento instantáneo vía llamadas, mensajes y WhatsApp",
      heroCheck10: "Gestiona conversaciones, califica y nutre cada lead",
      heroCheck11: "Agenda citas directamente en tu calendario",
      heroCheck12: "Ve cada lead, venta y oportunidad en un solo panel",
      heroCTA: "Comienza tu prueba gratuita",
      heroUnlock: "¡Desbloquea tu potencial hoy!",
      heroTag1: "Generar Leads",
      heroTag2: "Automatizar Seguimiento",
      heroTag3: "Cerrar Ventas",
      heroTag4: "Seguimiento Total",
      heroTag5: "Motor de IA",
      heroTag6: "Conecta tus Apps",
      heroHead: "Agentes y equipos inmobiliarios",

      dominantTitleLine1: "Una plataforma inmobiliaria",
      dominantTitleLine2: "Diseñada para el sector inmobiliario",
      dominantSubtitle:
        "Todo lo que necesitas ya está aquí. Lleva tu flujo de trabajo a un solo sistema diseñado para gestionar tus leads, propiedades, negocios, analíticas e IA — todo funcionando en conjunto.",
      dominantItem1Title: "Diseñado para tu negocio",
      dominantItem1Desc:
        "Gestiona propiedades, sigue leads y avanza operaciones — todo en un solo lugar.",
      dominantItem2Title: "Todo conectado — automáticamente",
      dominantItem2Desc:
        "Tu pipeline, analíticas e IA trabajan juntos. Nada está separado. Nada falta.",
      dominantItem3Title: "Listo para usar",
      dominantItem3Desc:
        "Sin adivinar qué necesitas. Sin construir sistemas. Ya está listo para ti.",
      dominantPowerLine1: "Trae tu flujo de trabajo aquí —",
      dominantPowerLine2: "y deja que el sistema lo ejecute correctamente.",
      dominantCTA: "Comienza tu prueba gratuita",
      dominantHowTitle: "Cómo funciona",
      dominantHowSubtitle:
        "Trae tu flujo de trabajo — y el sistema se encarga del resto.",
      dominantStep1Title: "Trae tu flujo de trabajo",
      dominantStep1Desc:
        "Importa tus leads, propiedades y operaciones al sistema.",
      dominantStep2Title: "La IA se activa",
      dominantStep2Desc:
        "La IA captura, responde y da seguimiento al instante.",
      dominantStep3Title: "El pipeline avanza",
      dominantStep3Desc:
        "Los leads avanzan automáticamente en tu pipeline.",
      dominantBottom1Title: "Las ventas se cierran",
      dominantBottom1Desc:
        "Tu sistema mantiene el impulso hasta cerrar las operaciones.",
      dominantBottom2Title: "Analíticas en tiempo real",
      dominantBottom2Desc:
        "Visualiza exactamente cómo está tu negocio en tiempo real.",
      dominantBottom3Title: "Tú mantienes el control",
      dominantBottom3Desc:
        "Visibilidad clara, mejores decisiones y mayor rendimiento.",
      dominantFinal:
        "Desde el primer lead hasta el cierre — todo se gestiona dentro de un solo sistema.",
      
      smartEyebrow: "Integraciones Inteligentes",
      smartTitle: "Convierte todo tu negocio inmobiliario en una máquina de ingresos automatizada",
      smartSubtitle: "Lleva tus propiedades, leads, mensajes y embudos a un solo lugar. Cortexa conecta todo, organiza todo y utiliza IA para rastrear, analizar y avanzar cada oportunidad automáticamente.",
      smartFlow: "Flujo",
      smartAutomated: "Automatizado",
      smartOptimized: "Optimizado",
      smartFlow1Label: "Captación de Leads y Seguimiento",
      smartFlow1Title: "Anuncios → CRM → WhatsApp → IA",
      smartFlow1Desc: "Cada lead se captura al instante, se califica y se sigue automáticamente — para que nunca pierdas otra oportunidad.",
      smartFlow2Label: "Propiedades, Funnels y Automatización",
      smartFlow2Title: "Sitio Web + Propiedades → CRM → Secuencias Inteligentes",
      smartFlow2Desc: "Tus propiedades, páginas de aterrizaje y embudos se integran en un solo sistema — activando seguimientos inteligentes hasta que los leads estén listos para comprar.",
      smartFlow3Label: "Ventas, Datos y Analítica",
      smartFlow3Title: "Pipeline → Seguimiento con IA → Insights de Rendimiento",
      smartFlow3Desc: "Cada operación se rastrea, cada acción se analiza y tu rendimiento se organiza en insights claros que puedes usar.",
      smartBottom: "Toda tu operación — conectada, automatizada y optimizada en un solo sistema inteligente.",
      smartCTA: "Convierte tu negocio en una máquina automatizada",

      topLine1: "Conoce tu CRM con IA.",
      topLine2: "Impulsado por",
      topHighlight: "Agentes de IA",
      topLine3: "que capturan, dan seguimiento y cierran tus leads automáticamente."
    },

    pt: {
      top: "Conheça seu CRM com IA. Maximize a produtividade com assistentes inteligentes.",
      nav: [
        "Recursos",
        "Assistente de IA",
        "Automação",
        "Pipeline",
        "Análises",
        "Testemunhos",
      ],
      trial: "Teste grátis",
      login: "Entrar",
      dashboardTitle: "Painéis para trabalhar, não apenas visualizar",
      without: "Sem CORTEXA",
      with: "Com CORTEXA",
      withoutList: [
        "Leads espalhados em apps e planilhas",
        "Follow-ups manuais lentos e mensagens perdidas",
        "Sem visão em tempo real do pipeline",
        "Difícil saber o que o time faz",
      ],
      withList: [
        "Tudo em um painel poderoso",
        "Respostas instantâneas no WhatsApp com IA",
        "Atualizações em tempo real do pipeline",
        "Saber exatamente o que está acontecendo",
      ],
      stripTitle: "Seu CRM não deve te atrasar.",
      stripSub: "Junte-se a equipes usando CORTEXA...",
      featuresTitle: "Transforme dados em decisões",
      cards: [
        {
          eyebrow: "Assistente de IA",
          title: "Respostas instantâneas no painel",
          desc: "Insights e recomendações em segundos sobre leads e performance.",
        },
        {
          eyebrow: "Análises",
          title: "Performance em tempo real",
          desc: "Monitore conversões, respostas e atividades do negócio.",
        },
        {
          eyebrow: "Resposta Automática com IA",
          title: "Automação de follow-ups",
          desc: "Nunca perca leads. Respostas automáticas em todos canais.",
        },
        {
          eyebrow: "Agendador de IA",
          title: "Feche mais rápido com IA",
          desc: "IA qualifica leads e agenda reuniões automaticamente.",
        },
      ],

      trustTitle: "Construído para operar com confiança",
      trust: [
        "Fluxos seguros",
        "Visibilidade em tempo real",
        "Sistema escalável",
        "Eficiência com IA",
      ],

      faqTitle: "Perguntas frequentes",
      faq: [
        {
          q: "O que exatamente o CORTEXA faz?",
          a: "O CORTEXA automatiza o acompanhamento de leads, conversas, atualizações do pipeline e agendamento de compromissos, tudo em um único sistema.",
        },
        {
          q: "Como funciona o Assistente de IA?",
          a: "A IA responde instantaneamente aos leads, faz a qualificação, agenda compromissos e mantém a conversa fluindo automaticamente.",
        },
        {
          q: "Posso gerenciar todos os meus leads em um só lugar?",
          a: "Sim. Todos os seus leads, mensagens e etapas do pipeline ficam centralizados em um único painel para que nada se perca.",
        },
        {
          q: "Ele atualiza meu pipeline automaticamente?",
          a: "Sim. À medida que os leads interagem, o sistema os move pelo seu pipeline sem necessidade de intervenção manual.",
        },
        {
          q: "Ainda preciso fazer follow-up manualmente?",
          a: "Não. O CORTEXA foi projetado para gerenciar o follow-up automaticamente e manter os leads engajados.",
        },
        {
          q: "Minha equipe pode usar em conjunto?",
          a: "Sim. Você pode adicionar membros da equipe, atribuir leads e gerenciar negociações de forma colaborativa.",
        },
        {
          q: "Para que tipo de negócio isso serve?",
          a: "O CORTEXA é ideal para corretores imobiliários, equipes e qualquer negócio que dependa de geração de leads e fechamento de vendas.",
        },
        {
          q: "O que acontece depois que um lead chega?",
          a: "O sistema responde instantaneamente, qualifica o lead e o conduz automaticamente para o agendamento ou fechamento.",
        },
      ],

      finalTitle: "Substitua o trabalho de vários agentes — com um único sistema de IA",
      finalDesc: "Capture, faça o acompanhamento e avance cada lead automaticamente — sem aumentar a folha de pagamento.",
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
        status: "Todos os sistemas operacionais",
      },
      strip: {
        title: "Seu CRM não deve te atrasar.",
        sub: "Junte-se a equipes usando CORTEXA...",
        btn: "Teste grátis",
      },
      aiTitle:
        "AI Setter: tu motor de citas disponible las 24 horas, los 7 días de la semana.",
      aisubTitle:
        "Responde instantaneamente, qualifica os compradores e agenda compromissos automaticamente.",
      aipointTitle1: "Respostas instantâneas",
      aipointText1: "Cada mensagem é respondida em segundos.",
      aipointTitle2: "Qualificação inteligente",
      aipointText2: "Filtra automaticamente os compradores sérios.",
      aipointTitle3: "Agendamento automático",
      aipointText3: "Compromissos agendados sem idas e vindas.",
      aialt: "IA que gerencia conversas e agenda compromissos automaticamente",
      reinforcement:
        "Gerencie todo o seu pipeline com IA — sem contratar mais pessoas e sem perder oportunidades.",
      beTitle: "O que isso realmente faz por você",
      besubTitle:
        "A automação faz o trabalho. A comunicação nunca para. Cada lead continua avançando — sem que você precise correr atrás.",
      beitem1: "O trabalho acontece automaticamente",
      beitem2: "As conversas continuam ativas",
      beitem3: "Clareza sem achismos",
      beitem4: "Mais vendas, menos esforço",
      beitemtext1:
        "Follow-ups, controle e organização funcionam em segundo plano.",
      beitemtext2: "Os leads recebem respostas, lembretes e interação 24/7.",
      beitemtext3: "Você sempre sabe em quem focar e o que fazer em seguida.",
      beitemtext4:
        "Menos trabalho manual, mais velocidade e melhores resultados.",
      bebottom: "Tudo continua avançando — mesmo quando você não está.",
      stripLabel: "Pronto para crescer?",
      stripTitle:
        "Comece a fechar mais negócios — com IA trabalhando para você 24/7.",
      stripSub:
        "Sem contratar mais pessoas. Sem perder leads. Apenas uma forma mais inteligente de gerenciar seu pipeline.",
      stripBtn: "Comece seu teste grátis →",
      stripTrust: "Sem risco. Cancele a qualquer momento.",
      stripBenefit1: "Comece em minutos",
      stripBenefit3: "Cancele a qualquer momento",
      stripCardTitle: "Visão geral do pipeline",
      stripCardPeriod: "Este mês",
      stripRevenueGrowth: "▲ 28% em relação ao mês passado",
      stripLeads: "Leads",
      stripDeals: "Negócios",
      stripRevenue: "Receita",
      stripAI: "Resumo da IA: Você está no caminho para superar sua meta mensal em 24%",

      roiTitle: "Substitua de 3 a 5 agentes. Pague por um único sistema. Feche mais negócios.",
      roiSub: "O CORTEXA gerencia automaticamente seus leads, follow-ups e pipeline — capturando todas as oportunidades e transformando leads perdidos em receita 24/7.",
      roiBtn: "Teste grátis",
      roiStat1Number: "+312%",
      roiStat1Label: "ROI",
      roiStat1Desc: "O CORTEXA transforma a gestão de leads em um motor de receita — automatizando follow-ups e o fluxo de vendas para gerar mais fechamentos.",
      roiStat2Number: "+$2.4M+",
      roiStat2Label: "Aumento de receita",
      roiStat2Desc: "Mais conversas. Respostas mais rápidas. Zero leads perdidos — transformando seu pipeline em receita previsível.",
      roiStat3Number: "80,000+",
      roiStat3Label: "Horas economizadas",
      roiStat3Desc: "A IA substitui tarefas manuais, follow-ups e trabalho administrativo — liberando seu tempo enquanto o negócio continua avançando.",
      roiStat4Number: "< 30 dias",
      roiStat4Label: "Retorno",
      roiStat4Desc: "A maioria dos usuários recupera o investimento no primeiro mês com negócios que antes seriam perdidos.",  

      aiCrmBadge: "CRM com IA",
      aiCrmTitle1: "Conheça seu",
      aiCrmTitleHighlight: "CRM com IA",
      aiCrmSub: "Sua equipe de IA 24/7 que captura, acompanha e fecha negócios — enquanto você foca no que importa.",
      aiCrmSupport: "Capture mais leads. Feche mais negócios. Nunca perca oportunidades.",
      aiCrmF1Title: "Enche seu pipeline",
      aiCrmF1Desc: "A IA encontra, qualifica e engaja novos leads para você.",
      aiCrmF2Title: "Conversa e fecha",
      aiCrmF2Desc: "A IA gerencia conversas, responde dúvidas e fecha negócios.",
      aiCrmF3Title: "Mostra o dinheiro",
      aiCrmF3Desc: "Insights em tempo real, acompanhamento de receita e crescimento.",
      aiCrmF4Title: "Funciona 24/7",
      aiCrmF4Desc: "Sempre ativo. Nunca perde leads ou oportunidades.",
      aiCrmF5Title: "Clientes felizes",
      aiCrmF5Desc: "A IA cuida do relacionamento e oferece suporte instantâneo.",

      heroTitleLine1: "Gere leads instantaneamente —",
      heroTitleLine2: "Feche mais negócios 24/7",
      heroSubtitle:
        "Capture, acompanhe e feche — tudo em um único sistema. Conecte todos os seus aplicativos para que seus imóveis, leads e dados fluam automaticamente em um só lugar.",
      heroCheck1: "Substitua vários agentes por um único sistema de IA",
      heroCheck2: "Economize milhares por mês com equipe e oportunidades perdidas",
      heroCheck3: "Funciona 24/7 — nunca perde um lead ou oportunidade",
      heroCheck4: "Feche mais negócios sem acompanhamento manual",
      heroCheck5: "Seu agente de IA encontra e qualifica leads automaticamente",
      heroCheck6: "Capture todos os leads de anúncios, listagens e funis — em um só lugar",
      heroCheck7: "Sem oportunidades perdidas — tudo flui instantaneamente",
      heroCheck8: "Comece a gerar leads sem esforço",
      heroCheck9: "Seu agente de IA faz follow-up instantâneo via chamadas, mensagens e WhatsApp",
      heroCheck10: "Gerencia conversas, qualifica e nutre cada lead",
      heroCheck11: "Agenda compromissos diretamente no seu calendário",
      heroCheck12: "Veja todos os leads, negócios e oportunidades em um único painel",
      heroCTA: "Inicie seu teste gratuito",
      heroUnlock: "Desbloqueie seu potencial hoje!",
      heroTag1: "Gerar Leads",
      heroTag2: "Automatizar Follow-up",
      heroTag3: "Fechar Negócios",
      heroTag4: "Acompanhar Tudo",
      heroTag5: "Motor de IA",
      heroTag6: "Conecte seus Apps",
      heroHead: "Agentes e equipes imobiliárias",

      dominantTitleLine1: "Uma plataforma imobiliária",
      dominantTitleLine2: "Construída para o mercado imobiliário",
      dominantSubtitle:
        "Tudo o que você precisa já está aqui. Traga seu fluxo de trabalho para um único sistema criado para gerenciar seus leads, imóveis, negociações, análises e IA — tudo funcionando junto.",
      dominantItem1Title: "Feito para o seu negócio",
      dominantItem1Desc:
        "Gerencie imóveis, acompanhe leads e avance negociações — tudo em um só lugar.",
      dominantItem2Title: "Tudo conectado — automaticamente",
      dominantItem2Desc:
        "Seu pipeline, análises e IA trabalham juntos. Nada fica separado. Nada está faltando.",
      dominantItem3Title: "Pronto para usar",
      dominantItem3Desc:
        "Sem precisar adivinhar o que você precisa. Sem construir sistemas. Já está pronto para você.",
      dominantPowerLine1: "Traga seu fluxo de trabalho para cá —",
      dominantPowerLine2: "e deixe o sistema rodar da forma correta.",
      dominantCTA: "Comece seu teste gratuito",
      dominantHowTitle: "Como funciona",
      dominantHowSubtitle:
        "Traga seu fluxo de trabalho — e o sistema assume a partir daí.",
      dominantStep1Title: "Traga seu fluxo de trabalho",
      dominantStep1Desc:
        "Importe seus leads, imóveis e negociações para o sistema.",
      dominantStep2Title: "A IA é ativada",
      dominantStep2Desc:
        "A IA captura, responde e faz follow-up instantaneamente.",
      dominantStep3Title: "O pipeline avança",
      dominantStep3Desc:
        "Os leads avançam automaticamente no seu pipeline.",
      dominantBottom1Title: "Negócios são fechados",
      dominantBottom1Desc:
        "Seu sistema mantém o ritmo até fechar as negociações.",
      dominantBottom2Title: "Análises em tempo real",
      dominantBottom2Desc:
        "Veja exatamente como está o seu negócio em tempo real.",
      dominantBottom3Title: "Você mantém o controle",
      dominantBottom3Desc:
        "Visibilidade clara, melhores decisões e desempenho mais forte.",
      dominantFinal:
        "Do primeiro lead ao fechamento — tudo é gerenciado dentro de um único sistema.",

      smartEyebrow: "Integrações Inteligentes",
      smartTitle: "Transforme todo o seu negócio imobiliário em uma máquina de receita automatizada",
      smartSubtitle: "Traga seus imóveis, leads, mensagens e funis para um só lugar. O Cortexa conecta tudo, organiza tudo e usa IA para rastrear, analisar e impulsionar cada oportunidade automaticamente.",
      smartFlow: "Fluxo",
      smartAutomated: "Automatizado",
      smartOptimized: "Otimizado",
      smartFlow1Label: "Captação de Leads e Follow-up",
      smartFlow1Title: "Anúncios → CRM → WhatsApp → IA",
      smartFlow1Desc: "Cada lead é capturado instantaneamente, qualificado e acompanhado automaticamente — para que você nunca perca outra oportunidade.",
      smartFlow2Label: "Imóveis, Funis e Automação",
      smartFlow2Title: "Website + Imóveis → CRM → Sequências Inteligentes",
      smartFlow2Desc: "Seus imóveis, páginas e funis alimentam um único sistema — ativando follow-ups inteligentes até que os leads estejam prontos para comprar.",
      smartFlow3Label: "Vendas, Dados e Análises",
      smartFlow3Title: "Pipeline → Monitoramento com IA → Insights de Performance",
      smartFlow3Desc: "Cada negócio é monitorado, cada ação é analisada e sua performance é organizada em insights claros para tomada de decisão.",
      smartBottom: "Toda a sua operação — conectada, automatizada e otimizada em um único sistema inteligente.",
      smartCTA: "Transforme seu negócio em uma máquina automatizada",

      topLine1: "Conheça o seu CRM com IA.",
      topLine2: "Impulsionado por",
      topHighlight: "Agentes de IA",
      topLine3: "que capturam, fazem follow-up e fecham seus leads automaticamente."
    },
  };

  const tr = t[lang];

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const currentHero =
    lang === "es" ? heroImgES : lang === "pt" ? heroImgPT : heroImg;

  const currentSec2 =
    lang === "es" ? sec2ImgES : lang === "pt" ? sec2ImgPT : sec2Img;

  const currentSec3 =
    lang === "es" ? sec3ImgES : lang === "pt" ? sec3ImgPT : sec3Img;

  const currentSec4 =
    lang === "es" ? sec4ImgES : lang === "pt" ? sec4ImgPT : sec4Img;

  const currentaiSetterImg =
    lang === "es" ? aiSetterImgES : lang === "pt" ? aiSetterImgPT : aiSetterImg;

  const currenttestimonialsImg =
    lang === "es"
      ? testimonialsImgES
      : lang === "pt"
        ? testimonialsImgPT
        : testimonialsImg;
  const flows = [
    {
      label: tr.smartFlow1Label,
      title: tr.smartFlow1Title,
      text: tr.smartFlow1Desc,
    },
    {
      label: tr.smartFlow2Label,
      title: tr.smartFlow2Title,
      text: tr.smartFlow2Desc,
    },
    {
      label: tr.smartFlow3Label,
      title: tr.smartFlow3Title,
      text: tr.smartFlow3Desc,
    },
  ];
  return (
    <div id="cortexa-ai-crm-landing">
      <div className="hero-text">
        <h2 className="hero-title">
          {tr.topLine1}
          {tr.topLine2}{" "}
          <span className="highlight">{tr.topHighlight}</span>{" "}
          {tr.topLine3}
        </h2>
      </div>
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
                "testimonials",
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
                  <div className="lang-item" onClick={() => switchLang("en")}>
                    English
                  </div>
                  <div className="lang-item" onClick={() => switchLang("es")}>
                    Español
                  </div>
                  <div className="lang-item" onClick={() => switchLang("pt")}>
                    Português
                  </div>
                </div>
              )}
            </div>

            <a href="/sign-in" className="cx-login">
              {tr.login}
            </a>
          </div>
        </div>
      </header>

      <section className="hero mt-50">
        <div className="hero-container">

          <div className="hero-left">
            <div className="hero-left-in">
              <p class="hero-head">{tr.heroHead}</p>
              <h1 className="hero-title">
                {tr.heroTitleLine1} <br /> {tr.heroTitleLine2}
              </h1>
              <div className="hero-checks">
                {[
                  tr.heroCheck1,
                  tr.heroCheck2,
                  tr.heroCheck3,
                  tr.heroCheck4,
                ].map((item, index) => (
                  <div className="check-item" key={index}>
                    <span className="check">✔</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="hero-inline">
                <button className="hero-btn">
                  {tr.heroCTA}
                </button>  
                <p>{tr.heroUnlock}</p>
              </div>
              
              <div className="hero-checks">
                {[
                  tr.heroCheck5,
                  tr.heroCheck6,
                  tr.heroCheck7,
                  tr.heroCheck8,
                  tr.heroCheck9,
                  tr.heroCheck10,
                  tr.heroCheck11,
                  tr.heroCheck12,
                ].map((item, index) => (
                  <div className="check-item" key={index}>
                    <span className="check">✔</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>    
            
          </div>

          <div className="hero-right">
            <div className="hero-image">
              <img src={heroImg} />
            </div>
          </div>
                
        </div>
        <div className="hero-tags">
              <UserPlus className="icon blue" />
              <span>{tr.heroTag1}</span>
              <RefreshCcw className="icon purple" />
              <span>{tr.heroTag2}</span>
              <DollarSign className="icon green" />
              <span>{tr.heroTag3}</span>
              <BarChart3 className="icon blue2" />
              <span>{tr.heroTag4}</span>
              <Brain className="icon indigo" />
              <span>{tr.heroTag5}</span>
              <Plug className="icon pink" />
              <span>{tr.heroTag6}</span>
            </div>
      </section>

      {/* COMPARE */}
      <section id="features" className="cx-comp cx-center pt-50">
        <h2 className="cx-title-md">{tr.dashboardTitle}</h2>

        <div className="cx-comp-grid">
          <div className="cx-comp-col">
            <h4>{tr.without}</h4>
            <ul className="cx-list neg">
              {tr.withoutList.map((i, idx) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>
          </div>

          <div className="cx-comp-col">
            <h4>{tr.with}</h4>
            <ul className="cx-list pos">
              {tr.withList.map((i, idx) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section id="analytics" className="cx-hero pt-50">
        <img src={currentSec2} alt="" />
      </section>
      <section className="benefits-section pt-50">
        <div className="benefits-container">
          <h2 className="cx-title-lg">{tr.beTitle}</h2>

          <p className="benefits-sub">{tr.besubTitle}</p>

          <div className="benefits-grid">
            <div className="benefits-item">
              <div className="benefits-icon">
                <img src={beitem1} />
              </div>
              <h3>{tr.beitem1}</h3>
              <p>{tr.beitemtext1}</p>
            </div>

            <div className="benefits-item">
              <div className="benefits-icon">
                <img src={beitem2} />
              </div>
              <h3>{tr.beitem2}</h3>
              <p>{tr.beitemtext2}</p>
            </div>

            <div className="benefits-item">
              <div className="benefits-icon">
                <img src={beitem3} />
              </div>
              <h3>{tr.beitem3}</h3>
              <p>{tr.beitemtext3}</p>
            </div>

            <div className="benefits-item">
              <div className="benefits-icon">
                <img src={beitem4} />
              </div>
              <h3>{tr.beitem4}</h3>
              <p>{tr.beitemtext4}</p>
            </div>
          </div>

          <p className="benefits-bottom">{tr.bebottom}</p>
        </div>
      </section>
      <section id="whatsapp" className="cx-hero pt-50">
        <img src={currentSec3} alt="" />
      </section>

      <section className="ai-crm-section pt-20">
        <div className="ai-crm-container">

          <div className="ai-crm-badge">
            {tr.aiCrmBadge}
          </div>

          {/* Title */}
          <h2 className="ai-crm-title">
            {tr.aiCrmTitle1}{" "}
            <span className="ai-crm-highlight">
              {tr.aiCrmTitleHighlight}
            </span>
          </h2>

          {/* Sub */}
          <p className="ai-crm-sub">
            {tr.aiCrmSub}
          </p>

          <p className="ai-crm-support">
            {tr.aiCrmSupport}
          </p>

          {/* Grid */}
          <div className="ai-crm-grid">

            <div className="ai-crm-card">
              <div className="ai-icon purple">⚡</div>
              <h3>{tr.aiCrmF1Title}</h3>
              <p>{tr.aiCrmF1Desc}</p>
            </div>

            <div className="ai-crm-card">
              <div className="ai-icon blue">💬</div>
              <h3>{tr.aiCrmF2Title}</h3>
              <p>{tr.aiCrmF2Desc}</p>
            </div>

            <div className="ai-crm-card">
              <div className="ai-icon green">💰</div>
              <h3>{tr.aiCrmF3Title}</h3>
              <p>{tr.aiCrmF3Desc}</p>
            </div>

            <div className="ai-crm-card">
              <div className="ai-icon yellow">⏱</div>
              <h3>{tr.aiCrmF4Title}</h3>
              <p>{tr.aiCrmF4Desc}</p>
            </div>

            <div className="ai-crm-card">
              <div className="ai-icon pink">❤️</div>
              <h3>{tr.aiCrmF5Title}</h3>
              <p>{tr.aiCrmF5Desc}</p>
            </div>

          </div>
        </div>
      </section>

      <section className="dominant section-dark pt-50">
        <div className="grid-bg"></div>
        <div className="glow-line">
          <div className="glow-bar"></div>
        </div>

        <div className="container center">
          <h2 className="heading">
            <span className="text-gradient-white">
              {tr.dominantTitleLine1}
            </span>
            <br />
            <span className="text-gradient-blue">
              {tr.dominantTitleLine2}
            </span>
          </h2>

          <p className="subline">
            {tr.dominantSubtitle}
          </p>
        </div>

        <div className="divider"></div>

        <div className="container grid-3">
          <div className="item">
            <h3>{tr.dominantItem1Title}</h3>
            <p>{tr.dominantItem1Desc}</p>
          </div>

          <div className="item highlight">
            <h3>{tr.dominantItem2Title}</h3>
            <p>{tr.dominantItem2Desc}</p>
          </div>

          <div className="item">
            <h3>{tr.dominantItem3Title}</h3>
            <p>{tr.dominantItem3Desc}</p>
          </div>
        </div>

        <div className="divider"></div>

        <div className="container center power">
          <p>
            {tr.dominantPowerLine1} <br />
            {tr.dominantPowerLine2}
          </p>

          <button className="btn-gradient">
            {tr.dominantCTA}
          </button>
        </div>
      </section>

      <section className="dominant section-light pt-50 mb-100">
        <div className="container center">
          <h2 className="heading-dark">{tr.dominantHowTitle}</h2>

          <p className="subline-dark">
            {tr.dominantHowSubtitle}
          </p>

          <div className="flow">
            <div className="step">
              <span>01</span>
              <h3>{tr.dominantStep1Title}</h3>
              <p>{tr.dominantStep1Desc}</p>
            </div>

            <div className="arrow">→</div>
            <div className="step">
              <span>02</span>
              <h3>{tr.dominantStep2Title}</h3>
              <p>{tr.dominantStep2Desc}</p>
            </div>

            <div className="arrow">→</div>
            <div className="step">
              <span>03</span>
              <h3>{tr.dominantStep3Title}</h3>
              <p>{tr.dominantStep3Desc}</p>
            </div>
          </div>

          <div className="grid-3 mt">
            <div>
              <h3>{tr.dominantBottom1Title}</h3>
              <p>{tr.dominantBottom1Desc}</p>
            </div>

            <div>
              <h3>{tr.dominantBottom2Title}</h3>
              <p>{tr.dominantBottom2Desc}</p>
            </div>

            <div>
              <h3>{tr.dominantBottom3Title}</h3>
              <p>{tr.dominantBottom3Desc}</p>
            </div>
          </div>
          <p className="final-line">
            {tr.dominantFinal}
          </p>
        </div>
      </section>

      <section className="smart">
        <div className="smart-container">
          <div className="smart-head">
            <p className="smart-eyebrow">{tr.smartEyebrow}</p>

            <h2 className="smart-title">
              {tr.smartTitle}
            </h2>

            <p className="smart-sub">
              {tr.smartSubtitle}
            </p>
          </div>

          <div className="smart-flow">

            <div className="smart-line"></div>

            {flows.map((flow, index) => (
              <div key={index} className="smart-item">

                {index !== 0 && <div className="smart-divider"></div>}

                <div className="smart-grid">

                  <div className="smart-left">
                    <p>{flow.label}</p>
                  </div>

                  <div className="smart-right">

                    <h3>{flow.title}</h3>

                    <div className="smart-arrow">
                      <span>{tr.smartFlow}</span>
                      <span>→</span>
                      <span>{tr.smartAutomated}</span>
                      <span>→</span>
                      <span>{tr.smartOptimized}</span>
                    </div>

                    <p className="smart-desc">
                      {flow.text}
                    </p>

                  </div>
                </div>

                {index !== flows.length - 1 && (
                  <div className="smart-connector">
                    <span>↓</span>
                    <div className="line"></div>
                  </div>
                )}

              </div>
            ))}

          </div>

          <div className="smart-bottom">
            <p>{tr.smartBottom}</p>
          </div>

          <div className="smart-cta">
            <button>
              {tr.smartCTA} →
            </button>
          </div>

        </div>
      </section>       

      <section id="pipeline" className="cx-hero pt-50">
        <img src={currentSec4} alt="" />
      </section>
      
      <section className="roi-section pt-50">
        <div className="roi-container">
          <h2 className="roi-title">
            {tr.roiTitle}
          </h2>
          <p className="roi-sub">
            {tr.roiSub}
          </p>
          <div className="roi-cta">
            <button className="roi-btn">
              {tr.roiBtn}
            </button>
          </div>
          <div className="roi-grid">
            <div className="roi-item">
              <p className="roi-number">{tr.roiStat1Number}</p>
              <p className="roi-label">{tr.roiStat1Label}</p>
              <p className="roi-desc">
                {tr.roiStat1Desc}
              </p>
            </div>
            <div className="roi-item">
              <p className="roi-number">{tr.roiStat2Number}</p>
              <p className="roi-label">{tr.roiStat2Label}</p>
              <p className="roi-desc">
                {tr.roiStat2Desc}
              </p>
            </div>
            <div className="roi-item">
              <p className="roi-number">{tr.roiStat3Number}</p>
              <p className="roi-label">{tr.roiStat3Label}</p>
              <p className="roi-desc">
                {tr.roiStat3Desc}
              </p>
            </div>
            <div className="roi-item">
              <p className="roi-number">{tr.roiStat4Number}</p>
              <p className="roi-label">{tr.roiStat4Label}</p>
              <p className="roi-desc">
                {tr.roiStat4Desc}
              </p>
            </div>
          </div>
        </div>
      </section>        
      <section className="cx-strip pt-50 cta-section">
        <div className="cta-container">
          <div className="cta-box">
            <div className="cta-left">
              <p className="cta-label">{tr.stripLabel}</p>
              <h2 className="cta-title">{tr.stripTitle}</h2>
              <p className="cta-sub">{tr.stripSub}</p>
              <div className="cta-actions">
                <button className="cta-btn">{tr.stripBtn}</button>
              </div>
              <p className="cta-trust">{tr.stripTrust}</p>
              <div className="cta-benefits">
                <div>
                  ⚡ <span>{tr.stripBenefit1}</span>
                </div>
                <div>
                  🔒 <span>{tr.stripBenefit3}</span>
                </div>
              </div>
            </div>
            <div className="cta-right">
              <div className="cta-card">
                <div className="cta-card-head">
                  <p>{tr.stripCardTitle}</p>
                  <span>{tr.stripCardPeriod}</span>
                </div>
                <div className="cta-revenue">
                  <p className="cta-money">$2,742,500</p>
                  <p className="cta-growth">{tr.stripRevenueGrowth}</p>
                </div>
                <div className="cta-graph"></div>
                <div className="cta-stats">
                  <div>
                    <p>{tr.stripLeads}</p>
                    <strong>1,293</strong>
                  </div>
                  <div>
                    <p>{tr.stripDeals}</p>
                    <strong>87</strong>
                  </div>
                  <div>
                    <p>{tr.stripRevenue}</p>
                    <strong>$893K</strong>
                  </div>
                </div>
                <div className="cta-ai">⚡ {tr.stripAI}</div>
              </div>
            </div>
            <div className="cta-glow"></div>
          </div>
        </div>
      </section>
      {/* FEATURES */}
      <section id="automation" className="cx-section pt-50">
        <div className="land-container">
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
        </div>
      </section>
      <section id="ai-assistant" className="cx-hero pt-50">
        <img src={currentaiSetterImg} alt="" />
      </section>
      {/* TRUST */}
      <section className="cx-trust cx-center pt-50">
        <div className="land-container">
          <h2 className="cx-title-md">{tr.trustTitle}</h2>
          <div className="cx-trust-grid">
            {tr.trust.map((t, i) => (
              <div className="cx-trust-item" key={i}>
                <h4>{t}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="cx-faq cx-center pt-50">
        <h2 className="cx-title-lg">{tr.faqTitle}</h2>

        <div className="cx-faq-list">
          {tr.faq.map((item, index) => (
            <div
              className={`cx-faq-item ${activeFAQ === index ? "active" : ""}`}
              key={index}
            >
              <button className="cx-faq-q" onClick={() => setActiveFAQ(index)}>
                {item.q}
              </button>

              {activeFAQ === index && <div className="cx-faq-a">{item.a}</div>}
            </div>
          ))}
        </div>
      </section>
      <section id="testimonials" className="cx-hero pt-50">
        <div className="img-container">
            <img src={currenttestimonialsImg} alt="" />
        </div>
        
      </section>
      {/* FINAL */}
      <section className="cx-final pt-50" id="trial">
        <div className="cx-final-box">
          <h2 className="cx-title-lg" style={{ color: "#fff" }}>
            {tr.finalTitle}
          </h2>

          <p className="cx-sub">{tr.finalDesc}</p>

          <a className="cx-btn cx-btn-secondary">{tr.trial}</a>
          <p className="final-reinforcement">{tr.reinforcement}</p>
          <div className="cx-final-shot">
            <img src={finalImg} alt="" />
          </div>
        </div>
      </section>
      {/*<section id="footer" className="cx-hero">
        <footer className="footer">
          <div className="footer-container">
            <div className="footer-col">
              <div className="logo">
                <img src={headlogoImg} alt="Cortexa" className="cx-logo-img" />
              </div>

              <p className="desc">{tr.footer.desc}</p>

              <button className="btn">{tr.footer.btn}</button>

              <ul className="features">
                <li>✨ AI-Powered</li>
                <li>🛡 Secure by Design</li>
                <li>⚡ Automate Workflows</li>
                <li>📊 Real-Time Insights</li>
              </ul>
            </div>

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

            <div className="footer-col">
              <h4>{tr.footer.solutions}</h4>
              <ul>
                <li>Sales Teams</li>
                <li>Real Estate</li>
                <li>Agencies</li>
                <li>Startups</li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>{tr.footer.resources}</h4>
              <ul>
                <li>Help Center</li>
                <li>Guides</li>
                <li>Templates</li>
                <li>Blog</li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>{tr.footer.company}</h4>
              <ul>
                <li>About Us</li>
                <li>Careers</li>
                <li>
                  <a href="/privacy-policy">Privacy Policy</a>
                </li>
                <li>
                  <a href="/refund-policy">Refund Policy</a>
                </li>
                <li>
                  <a href="/terms">Terms</a>
                </li>
              </ul>
            </div>

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
      </section>*/}

      <section>
          <footer class="footer-final">
            <div class="container">

              <div class="footer-grid">
                
                <div class="footer-brand">
                  <img src={headlogoImg} alt="Cortexa" className="cx-logo-img" />
                  <p>
                    The AI-powered CRM that helps you capture leads, automate follow-ups, 
                    and close more deals — faster.
                  </p>
                  <a href="/signup" class="btn-primary">Start Your Free Trial →</a>

                  <div class="footer-tags">
                    <span>✨ AI-Powered</span>
                    <span>🛡 Secure</span>
                    <span>⚡ Automation</span>
                    <span>📊 Insights</span>
                  </div>
                </div>

                <div class="footer-col">
                  <h3>Product</h3>
                  <ul>
                    <li><a href="/features">Features</a></li>
                    <li><a href="/ai-assistant">AI Assistant</a></li>
                    <li><a href="/automations">Automations</a></li>
                    <li><a href="/integrations">Integrations</a></li>
                    <li><a href="/analytics">Analytics</a></li>
                    <li><a href="/pricing">Pricing</a></li>
                  </ul>
                </div>

                <div class="footer-col">
                  <h3>Get Started</h3>
                  <ul>
                    <li><a href="/signup">Create Account</a></li>
                    <li><a href="/signin">Login</a></li>
                    <li><a href="/crm">Dashboard</a></li>
                    <li><a href="/setup">Setup Guide</a></li>
                  </ul>
                </div>

                <div class="footer-col">
                  <h3>Connect</h3>
                  <ul>
                    <li><a href="/integrations">Connect Your Apps</a></li>
                    <li><a href="/help/import-crm">Import Your CRM</a></li>
                    <li><a href="/help/import-csv">Import CSV / Excel</a></li>
                    <li><a href="/help/zapier">Zapier & Automations</a></li>
                    <li><a href="/help/api">API & Webhooks</a></li>
                  </ul>
                </div>

                <div class="footer-col">
                  <h3>Support</h3>
                  <ul>
                    <li><a href="/support">24-7 Support</a></li>
                    <li><a href="/help">Help Center</a></li>
                    <li><a href="/contact">Contact Us</a></li>
                    <li><a href="/about">About Us</a></li>
                  </ul>
                </div>

                <div class="footer-col">
                  <h3>Legal</h3>
                  <ul>
                    <li><a href="/terms">Terms & Conditions</a></li>
                    <li><a href="/privacy-policy">Privacy Policy</a></li>
                    <li><a href="/refund-policy">Refund Policy</a></li>
                    <li><a href="/cancellation">Cancellation Policy</a></li>
                  </ul>
                </div>

              </div>

              <div className="footer-location">
                <div>
                  <h3>🌎 Countries</h3>
                  <div className="grid-2">
                    <Link to="/brazil">Brazil</Link>
                    <Link to="/mexico">Mexico</Link>
                    <Link to="/argentina">Argentina</Link>
                    <Link to="/chile">Chile</Link>
                    <Link to="/peru">Peru</Link>
                    <Link to="/ecuador">Ecuador</Link>
                    <Link to="/colombia">Colombia</Link>
                  </div>
                </div>

                <div>
                  <h3>🏙 Popular Cities</h3>
                  <div className="grid-2">
                    <Link to="/brazil/sao-paulo">São Paulo</Link>
                    <Link to="/mexico/mexico-city">Mexico City</Link>
                    <Link to="/argentina/buenos-aires">Buenos Aires</Link>
                    <Link to="/chile/santiago">Santiago</Link>
                    <Link to="/peru/lima">Lima</Link>
                    <Link to="/ecuador/quito">Quito</Link>
                    <Link to="/colombia/bogota">Bogotá</Link>
                  </div>
                </div>
              </div>

              <div class="footer-newsletter">
                <h3>Stay updated</h3>
                <p>Get CRM updates, AI automation tips, and product news.</p>

                <div class="newsletter-form">
                  <input type="email" placeholder="Your email" />
                  <button>→</button>
                </div>

                <p class="small">
                  We respect your privacy. Unsubscribe anytime.
                </p>
              </div>

            </div>
          </footer>
      </section>
    </div>
  );
}
