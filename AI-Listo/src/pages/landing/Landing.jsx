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
      stripBenefit2: "No credit card required",
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
      stripBenefit2: "No se requiere tarjeta de crédito",
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
      stripBenefit2: "Sem necessidade de cartão de crédito",
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

      <section id="pipeline" className="cx-hero pt-20">
        <img src={currentSec4} alt="" />
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
                  ✔ <span>{tr.stripBenefit2}</span>
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
        <img src={currenttestimonialsImg} alt="" />
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
      <section id="footer" className="cx-hero">
        <footer className="footer">
          <div className="footer-container">
            {/* Left */}
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
