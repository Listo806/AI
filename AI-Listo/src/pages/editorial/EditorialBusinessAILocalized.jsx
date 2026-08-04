import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  LineChart,
  Menu,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { trackEvent } from "../../utils/track";
import headlogo from "../../assets/cortexa/headlogo.png";
import footlogo from "../../assets/cortexa/p-flogo.png";
import whyImg from "../../assets/cortexa/why.jpg";
import why1Img from "../../assets/cortexa/why1.jpg";
import why2Img from "../../assets/cortexa/why2.jpg";
import why3Img from "../../assets/cortexa/why3.jpg";
import why4Img from "../../assets/cortexa/why4.jpg";
import why5Img from "../../assets/cortexa/why5.jpg";
import "./Editorial.css";

const COPY = {
  es: {
    code: "es",
    home: "/es",
    trial: "/es/trial",
    pricing: "/es/pricing",
    features: "/es/features",
    terms: "/es/terms",
    privacy: "/es/privacy-policy",
    title: "Cómo la IA está transformando todas las empresas",
    subtitle: "Por qué el futuro pertenece a los Sistemas Operativos de Ingresos con IA",
    metaTitle: "Cómo la IA está transformando todas las empresas | Cortexa AI CRM",
    metaDescription:
      "Descubre cómo los Sistemas Operativos de Ingresos con IA están transformando la interacción con clientes, las operaciones y el crecimiento empresarial en todas las industrias.",
    pageEvent: "how_ai_is_transforming_every_business_es",
    byline: "3 de agosto de 2026 por",
    author: "Equipo Editorial de Cortexa",
    reviewed: "Última revisión: 3 de agosto de 2026",
    breadcrumb: "Crecimiento empresarial con IA",
    heroKicker: "Transformación empresarial con IA",
    coverLabel: "El próximo modelo operativo",
    coverText:
      "Las empresas están pasando de procesos manuales y herramientas desconectadas a sistemas inteligentes que responden, automatizan y crecen.",
    nav: {
      platform: "Plataforma",
      solutions: "Soluciones",
      resources: "Recursos",
      company: "Empresa",
      start: "Comenzar",
      trial: "Comenzar prueba gratuita",
    },
    contentsTitle: "[ Contenido ]",
    ariaContents: "Contenido del artículo",
    ariaNav: "Navegación editorial",
    ariaOpen: "Abrir navegación",
    ariaHome: "Inicio de Cortexa",
    sections: [
      ["new-era", "Hemos entrado en una nueva era"],
      ["old-way", "El costo de hacer negocios a la antigua"],
      ["missed-leads", "Cada lead perdido representa ingresos perdidos"],
      ["ai-rules", "La inteligencia artificial cambia las reglas"],
      ["revenue-os", "Del CRM al Sistema Operativo de Ingresos con IA"],
      ["every-industry", "Todas las industrias pueden beneficiarse de la IA"],
      ["competitive-advantage", "Las empresas que adopten IA crearán ventajas competitivas"],
      ["introducing-cortexa", "Presentamos Cortexa AI CRM"],
      ["move-first", "El futuro pertenece a las empresas que actúan primero"],
      ["transform-business", "¿Listo para transformar tu negocio?"],
    ],
    cta: {
      eyebrow: "¿Listo para crecer con IA?",
      heading: "Descubre cómo Cortexa ayuda a tu empresa a operar de forma más inteligente y responder más rápido.",
      primary: "Comienza tu prueba gratuita",
      secondary: "Ver planes",
      benefits: [
        ["Interacción instantánea", "Responde a leads y clientes las 24 horas."],
        ["Automatización inteligente", "Mantén el seguimiento y los flujos de trabajo en movimiento automáticamente."],
        ["Visibilidad de ingresos", "Comprende el rendimiento y actúa más rápido sobre las oportunidades."],
        ["Diseñado para cualquier empresa", "Apoya a tu equipo sin añadir complejidad operativa."],
      ],
    },
    article: {
      newEraKicker: "Una nueva era empresarial",
      newEra: [
        "Durante décadas, las empresas dependieron de la misma fórmula para crecer: contratar más empleados, invertir más en publicidad, generar más leads y esperar que los equipos de ventas pudieran seguir el ritmo de la demanda. Aunque ese modelo funcionó durante muchos años, las expectativas de los clientes han cambiado por completo.",
        "Los clientes de hoy esperan respuestas inmediatas. Esperan que las empresas estén disponibles las 24 horas, respondan preguntas al instante, hagan seguimiento de forma constante y ofrezcan una experiencia de compra fluida. Cuando esas expectativas no se cumplen, los clientes rara vez esperan: simplemente eligen a un competidor.",
        "La inteligencia artificial está cambiando esa ecuación. En lugar de limitarse a ayudar a las empresas a trabajar más, la IA les permite trabajar de forma más inteligente, automatizando tareas repetitivas, acelerando la interacción con los clientes y creando oportunidades que los sistemas tradicionales suelen perder.",
      ],
      newEraQuote:
        "Las empresas que adoptan IA hoy no solo están siendo más eficientes: están redefiniendo cómo funciona una empresa moderna.",
      oldWayIntro: "Muchas empresas siguen operando con sistemas desconectados y procesos manuales.",
      oldWaySteps: [
        "Un lead envía un formulario.",
        "Pasan horas antes de que alguien responda.",
        "Las llamadas se pierden fuera del horario laboral.",
        "Los representantes de ventas envían correos de seguimiento manualmente.",
        "La información del cliente está dispersa entre hojas de cálculo, bandejas de entrada, calendarios y varias plataformas.",
      ],
      oldWayBody: [
        "Ninguno de estos problemas parece catastrófico por separado.",
        "Pero, en conjunto, generan ingresos perdidos todos los días.",
        "Los estudios muestran de forma constante que las empresas que responden rápidamente a los leads aumentan de manera significativa sus posibilidades de convertir prospectos en clientes. Sin embargo, muchas organizaciones todavía dependen de procesos diseñados mucho antes de que los clientes esperaran comunicación instantánea.",
      ],
      oldWayQuote: "En el entorno competitivo actual, la velocidad se ha convertido en una ventaja competitiva.",
      missedIntro: "Cada consulta representa una oportunidad.",
      missedItems: [
        "Alguien visita tu sitio web.",
        "Alguien envía un formulario de contacto.",
        "Alguien llama a tu oficina.",
        "Alguien hace una pregunta en redes sociales.",
      ],
      missedBody: [
        "Esas interacciones representan clientes potenciales que ya han mostrado interés.",
        "La pregunta es sencilla:",
      ],
      missedQuote: "¿Qué tan rápido puede responder tu empresa?",
      missedAfter: [
        "Si la respuesta es horas, o peor aún, el siguiente día laborable, es posible que tus competidores ya hayan ganado a ese cliente.",
        "Las empresas suelen invertir mucho en marketing para generar leads y, sin darse cuenta, pierden esos mismos leads porque el seguimiento ocurre demasiado tarde.",
        "Los ingresos no solo se generan consiguiendo más tráfico.",
      ],
      missedStrong: "Los ingresos se generan convirtiendo mejor las oportunidades que ya tienes.",
      aiKicker: "Automatización inteligente",
      aiIntro: [
        "La inteligencia artificial permite a las empresas automatizar muchas tareas repetitivas que tradicionalmente exigían atención manual constante.",
        "En lugar de esperar a que un empleado responda, la IA puede interactuar con los prospectos de inmediato.",
      ],
      aiCapabilities: [
        "Responder preguntas frecuentes",
        "Calificar clientes potenciales",
        "Programar citas",
        "Organizar información de clientes",
        "Activar secuencias de seguimiento",
        "Notificar al equipo sobre oportunidades de alto valor",
      ],
      aiAfter:
        "En lugar de reemplazar a los empleados, la IA les permite dedicar más tiempo a construir relaciones y resolver problemas complejos, mientras la automatización se encarga del trabajo rutinario.",
      aiQuote:
        "El resultado son tiempos de respuesta más rápidos, experiencias de cliente más consistentes y una mayor eficiencia operativa.",
      revenueBody: [
        "El software CRM tradicional fue diseñado originalmente para organizar información de clientes.",
        "Eso fue una innovación importante.",
        "Pero organizar información por sí solo ya no genera una ventaja competitiva.",
        "Las empresas modernas necesitan cada vez más sistemas que contribuyan activamente al crecimiento de los ingresos.",
        "Un Sistema Operativo de Ingresos con IA va más allá de almacenar registros de clientes.",
        "Ayuda a las empresas a interactuar automáticamente con los clientes, gestionar la comunicación, optimizar las operaciones y apoyar a los equipos de ventas con automatización inteligente que funciona de manera continua.",
      ],
      revenueQuote:
        "En lugar de convertirse en otra base de datos, se convierte en un participante activo del crecimiento empresarial.",
      industryIntro: [
        "La inteligencia artificial ya no está limitada a las empresas tecnológicas.",
        "Empresas de casi todas las industrias están adoptando automatización para mejorar la experiencia del cliente y el rendimiento operativo.",
      ],
      industries: [
        ["Bienes raíces", "Responder consultas al instante."],
        ["Bufetes jurídicos", "Automatizar la incorporación de clientes."],
        ["Salud", "Optimizar la programación de citas."],
        ["Agencias de marketing", "Automatizar la calificación de leads."],
        ["Servicios para el hogar", "Responder solicitudes las 24 horas."],
        ["Servicios financieros", "Organizar la comunicación con clientes de forma eficiente."],
        ["Comercio minorista", "Mejorar el soporte y la interacción con clientes."],
      ],
      industryBefore: "Sin importar la industria, el desafío principal sigue siendo el mismo:",
      industryQuote:
        "Las empresas necesitan responder más rápido, operar con mayor eficiencia y crear mejores experiencias para sus clientes.",
      industryAfter: "La IA ayuda a lograr las tres cosas.",
      competitiveIntro: "Cada gran cambio tecnológico crea dos grupos.",
      path1: "Empresas que se adaptan temprano.",
      path2: "Empresas que terminan poniéndose al día.",
      competitiveBody: [
        "La inteligencia artificial representa uno de los cambios más importantes en las operaciones empresariales desde la computación en la nube.",
        "Las organizaciones que implementan IA hoy están mejorando la productividad, aumentando la capacidad de respuesta, reduciendo las cargas manuales y creando mejores experiencias para sus clientes.",
        "La ventaja competitiva no consiste simplemente en usar IA.",
      ],
      competitiveQuote: "La ventaja surge de integrar la IA en todo el recorrido del cliente.",
      cortexaKicker: "Una plataforma conectada",
      cortexaIntro: "Cortexa AI CRM fue creado alrededor de una idea sencilla:",
      cortexaQuote:
        "Las empresas deberían dedicar menos tiempo a gestionar software y más tiempo a aumentar sus ingresos.",
      cortexaBody: [
        "En lugar de exigir varias plataformas desconectadas, Cortexa reúne la gestión de clientes, la automatización con IA, la comunicación, la gestión del pipeline, la analítica y la inteligencia empresarial en una única plataforma.",
        "En lugar de limitarse a registrar la actividad del cliente, la plataforma ayuda a las empresas a interactuar, organizarse y crecer con mayor eficacia.",
        "Ya seas una pequeña empresa, una compañía en crecimiento o una organización establecida, la IA puede ayudarte a responder más rápido, operar con mayor eficiencia y crear relaciones más sólidas con tus clientes.",
      ],
      moveBody: [
        "La inteligencia artificial ya no es una tendencia emergente.",
        "Se está convirtiendo en un componente esencial de las operaciones empresariales modernas.",
        "La pregunta ya no es si la IA cambiará la forma en que crecen las empresas.",
        "La pregunta es si las empresas adoptarán ese cambio antes que sus competidores.",
        "Las compañías que adoptan automatización inteligente hoy se posicionan para atender mejor a sus clientes, mejorar la eficiencia operativa y crear un crecimiento sostenible a largo plazo.",
        "El futuro de los negocios no pertenecerá simplemente a las empresas que trabajan más.",
      ],
      moveQuote: "Pertenecerá a las empresas que trabajan de forma más inteligente.",
      finalKicker: "Tu próximo paso",
      finalBody: [
        "Ya sea que tu objetivo sea generar más leads, responder más rápido, automatizar tareas repetitivas o construir una organización más eficiente, un Sistema Operativo de Ingresos con IA puede ayudarte a posicionar tu empresa para un crecimiento sostenible.",
        "Descubre cómo Cortexa AI CRM puede ayudar a tu empresa a operar de forma más inteligente, responder más rápido y crecer con IA.",
      ],
      finalStrong: "Comienza hoy tu prueba gratuita.",
      finalText:
        "Activa conversaciones con IA, automatización e inteligencia de ingresos para tu empresa.",
    },
    captions: {
      dashboard: "Una vista conectada de la actividad de clientes, automatización, pipeline y rendimiento de ingresos.",
      conversation: "La IA puede responder, calificar y guiar a los prospectos interesados hacia el siguiente paso.",
      platform: "Comunicación con clientes, automatización con IA, flujos de trabajo y actividad de ingresos conectados en un solo sistema.",
      workflow: "Un camino guiado desde la configuración hasta operaciones activas asistidas por IA.",
      cortexa: "Cortexa conecta conversaciones con IA, flujos de trabajo, pipeline, equipos y analítica.",
      team: "Los equipos respaldados por IA pueden trabajar desde una vista compartida de conversaciones, tareas, pipeline y rendimiento.",
    },
    footer: {
      pricing: "Precios",
      features: "Funciones",
      terms: "Términos",
      privacy: "Privacidad",
      note: "Crecimiento impulsado por IA para empresas modernas.",
    },
  },
  pt: {
    code: "pt",
    home: "/pt",
    trial: "/pt/trial",
    pricing: "/pt/pricing",
    features: "/pt/features",
    terms: "/pt/terms",
    privacy: "/pt/privacy-policy",
    title: "Como a IA está transformando todas as empresas",
    subtitle: "Por que o futuro pertence aos Sistemas Operacionais de Receita com IA",
    metaTitle: "Como a IA está transformando todas as empresas | Cortexa AI CRM",
    metaDescription:
      "Descubra como os Sistemas Operacionais de Receita com IA estão transformando o engajamento com clientes, as operações e o crescimento empresarial em todos os setores.",
    pageEvent: "how_ai_is_transforming_every_business_pt",
    byline: "3 de agosto de 2026 por",
    author: "Equipe Editorial da Cortexa",
    reviewed: "Última revisão: 3 de agosto de 2026",
    breadcrumb: "Crescimento empresarial com IA",
    heroKicker: "Transformação empresarial com IA",
    coverLabel: "O próximo modelo operacional",
    coverText:
      "As empresas estão migrando de processos manuais e ferramentas desconectadas para sistemas inteligentes que respondem, automatizam e crescem.",
    nav: {
      platform: "Plataforma",
      solutions: "Soluções",
      resources: "Recursos",
      company: "Empresa",
      start: "Começar",
      trial: "Começar teste grátis",
    },
    contentsTitle: "[ Conteúdo ]",
    ariaContents: "Conteúdo do artigo",
    ariaNav: "Navegação editorial",
    ariaOpen: "Abrir navegação",
    ariaHome: "Página inicial da Cortexa",
    sections: [
      ["new-era", "Entramos em uma nova era"],
      ["old-way", "O custo de fazer negócios do jeito antigo"],
      ["missed-leads", "Cada lead perdido representa receita perdida"],
      ["ai-rules", "A inteligência artificial muda as regras"],
      ["revenue-os", "Do CRM ao Sistema Operacional de Receita com IA"],
      ["every-industry", "Todos os setores podem se beneficiar da IA"],
      ["competitive-advantage", "Empresas que adotam IA constroem vantagens competitivas"],
      ["introducing-cortexa", "Apresentando o Cortexa AI CRM"],
      ["move-first", "O futuro pertence às empresas que agem primeiro"],
      ["transform-business", "Pronto para transformar sua empresa?"],
    ],
    cta: {
      eyebrow: "Pronto para crescer com IA?",
      heading: "Veja como a Cortexa ajuda sua empresa a operar de forma mais inteligente e responder mais rápido.",
      primary: "Comece seu teste grátis",
      secondary: "Ver planos",
      benefits: [
        ["Engajamento instantâneo", "Responda a leads e clientes 24 horas por dia."],
        ["Automação inteligente", "Mantenha acompanhamentos e fluxos de trabalho avançando automaticamente."],
        ["Visibilidade de receita", "Entenda o desempenho e aja mais rápido sobre as oportunidades."],
        ["Feito para qualquer empresa", "Apoie sua equipe sem adicionar complexidade operacional."],
      ],
    },
    article: {
      newEraKicker: "Uma nova era empresarial",
      newEra: [
        "Durante décadas, as empresas dependeram da mesma fórmula para crescer: contratar mais funcionários, investir mais em publicidade, gerar mais leads e esperar que as equipes de vendas acompanhassem a demanda. Embora esse modelo tenha funcionado por muitos anos, as expectativas dos clientes mudaram completamente.",
        "Os clientes de hoje esperam respostas imediatas. Esperam que as empresas estejam disponíveis 24 horas por dia, respondam perguntas instantaneamente, façam acompanhamentos consistentes e ofereçam uma experiência de compra fluida. Quando essas expectativas não são atendidas, os clientes raramente esperam: simplesmente escolhem um concorrente.",
        "A inteligência artificial está mudando essa equação. Em vez de apenas ajudar as empresas a trabalhar mais, a IA permite trabalhar de forma mais inteligente, automatizando tarefas repetitivas, acelerando o engajamento com clientes e criando oportunidades que sistemas tradicionais muitas vezes deixam passar.",
      ],
      newEraQuote:
        "As empresas que adotam IA hoje não estão apenas se tornando mais eficientes: estão redefinindo como uma empresa moderna funciona.",
      oldWayIntro: "Muitas empresas ainda operam com sistemas desconectados e processos manuais.",
      oldWaySteps: [
        "Um lead envia um formulário.",
        "Horas se passam antes que alguém responda.",
        "Chamadas são perdidas fora do horário comercial.",
        "Representantes de vendas enviam e-mails de acompanhamento manualmente.",
        "As informações dos clientes ficam espalhadas entre planilhas, caixas de entrada, calendários e várias plataformas.",
      ],
      oldWayBody: [
        "Nenhum desses problemas parece catastrófico isoladamente.",
        "Mas, juntos, eles geram receita perdida todos os dias.",
        "Estudos mostram de forma consistente que empresas que respondem rapidamente aos leads aumentam significativamente as chances de converter prospects em clientes. Mesmo assim, muitas organizações ainda dependem de processos criados muito antes de os clientes esperarem comunicação instantânea.",
      ],
      oldWayQuote: "No ambiente competitivo atual, a velocidade se tornou uma vantagem competitiva.",
      missedIntro: "Cada contato representa uma oportunidade.",
      missedItems: [
        "Alguém visita seu site.",
        "Alguém envia um formulário de contato.",
        "Alguém liga para sua empresa.",
        "Alguém faz uma pergunta nas redes sociais.",
      ],
      missedBody: [
        "Essas interações representam clientes em potencial que já demonstraram interesse.",
        "A pergunta é simples:",
      ],
      missedQuote: "Com que rapidez sua empresa consegue responder?",
      missedAfter: [
        "Se a resposta for horas, ou pior, o próximo dia útil, seus concorrentes talvez já tenham conquistado esse cliente.",
        "As empresas frequentemente investem muito em marketing para gerar leads e, sem perceber, perdem esses mesmos leads porque o acompanhamento acontece tarde demais.",
        "A receita não é gerada apenas ao conseguir mais tráfego.",
      ],
      missedStrong: "A receita é gerada convertendo melhor as oportunidades que você já possui.",
      aiKicker: "Automação inteligente",
      aiIntro: [
        "A inteligência artificial permite que as empresas automatizem muitas tarefas repetitivas que tradicionalmente exigiam atenção manual constante.",
        "Em vez de esperar por um funcionário, a IA pode interagir com prospects imediatamente.",
      ],
      aiCapabilities: [
        "Responder perguntas frequentes",
        "Qualificar clientes em potencial",
        "Agendar compromissos",
        "Organizar informações de clientes",
        "Acionar sequências de acompanhamento",
        "Notificar a equipe sobre oportunidades de alto valor",
      ],
      aiAfter:
        "Em vez de substituir funcionários, a IA permite que eles dediquem mais tempo a construir relacionamentos e resolver problemas complexos, enquanto a automação cuida do trabalho rotineiro.",
      aiQuote:
        "O resultado são tempos de resposta mais rápidos, experiências mais consistentes para os clientes e maior eficiência operacional.",
      revenueBody: [
        "O software CRM tradicional foi originalmente criado para organizar informações de clientes.",
        "Essa foi uma inovação importante.",
        "Mas organizar informações por si só já não cria vantagem competitiva.",
        "As empresas modernas precisam cada vez mais de sistemas que contribuam ativamente para o crescimento da receita.",
        "Um Sistema Operacional de Receita com IA vai além de armazenar registros de clientes.",
        "Ele ajuda as empresas a interagir automaticamente com clientes, gerenciar a comunicação, otimizar operações e apoiar equipes de vendas com automação inteligente que funciona continuamente.",
      ],
      revenueQuote:
        "Em vez de se tornar apenas mais um banco de dados, ele se torna um participante ativo no crescimento do negócio.",
      industryIntro: [
        "A inteligência artificial não está mais limitada a empresas de tecnologia.",
        "Empresas de quase todos os setores estão adotando automação para melhorar a experiência do cliente e o desempenho operacional.",
      ],
      industries: [
        ["Imobiliário", "Responder consultas instantaneamente."],
        ["Escritórios de advocacia", "Automatizar a entrada de clientes."],
        ["Saúde", "Otimizar o agendamento."],
        ["Agências de marketing", "Automatizar a qualificação de leads."],
        ["Serviços residenciais", "Responder solicitações 24 horas por dia."],
        ["Serviços financeiros", "Organizar a comunicação com clientes de forma eficiente."],
        ["Varejo", "Melhorar o suporte e o engajamento com clientes."],
      ],
      industryBefore: "Independentemente do setor, o desafio principal continua o mesmo:",
      industryQuote:
        "As empresas precisam responder mais rápido, operar com mais eficiência e criar melhores experiências para seus clientes.",
      industryAfter: "A IA ajuda a alcançar os três objetivos.",
      competitiveIntro: "Toda grande mudança tecnológica cria dois grupos.",
      path1: "Empresas que se adaptam cedo.",
      path2: "Empresas que acabam correndo atrás.",
      competitiveBody: [
        "A inteligência artificial representa uma das mudanças mais importantes nas operações empresariais desde a computação em nuvem.",
        "As organizações que implementam IA hoje estão melhorando a produtividade, aumentando a capacidade de resposta, reduzindo cargas manuais e criando melhores experiências para os clientes.",
        "A vantagem competitiva não está simplesmente em usar IA.",
      ],
      competitiveQuote: "A vantagem vem de integrar a IA em toda a jornada do cliente.",
      cortexaKicker: "Uma plataforma conectada",
      cortexaIntro: "O Cortexa AI CRM foi criado em torno de uma ideia simples:",
      cortexaQuote:
        "As empresas deveriam gastar menos tempo gerenciando software e mais tempo aumentando a receita.",
      cortexaBody: [
        "Em vez de exigir várias plataformas desconectadas, a Cortexa reúne gestão de clientes, automação com IA, comunicação, gestão de pipeline, analytics e inteligência de negócios em uma única plataforma.",
        "Em vez de apenas registrar a atividade do cliente, a plataforma ajuda as empresas a interagir, se organizar e crescer com mais eficiência.",
        "Seja você uma pequena empresa, uma companhia em crescimento ou uma organização estabelecida, a IA pode ajudar a responder mais rápido, operar com mais eficiência e criar relacionamentos mais fortes com os clientes.",
      ],
      moveBody: [
        "A inteligência artificial não é mais uma tendência emergente.",
        "Ela está se tornando um componente essencial das operações empresariais modernas.",
        "A pergunta já não é se a IA mudará a forma como as empresas crescem.",
        "A pergunta é se as empresas adotarão essa mudança antes dos concorrentes.",
        "As empresas que adotam automação inteligente hoje se posicionam para atender melhor os clientes, melhorar a eficiência operacional e criar crescimento sustentável no longo prazo.",
        "O futuro dos negócios não pertencerá simplesmente às empresas que trabalham mais.",
      ],
      moveQuote: "Pertencerá às empresas que trabalham de forma mais inteligente.",
      finalKicker: "Seu próximo passo",
      finalBody: [
        "Seja seu objetivo gerar mais leads, responder mais rápido, automatizar tarefas repetitivas ou construir uma organização mais eficiente, um Sistema Operacional de Receita com IA pode ajudar a posicionar sua empresa para um crescimento sustentável.",
        "Veja como o Cortexa AI CRM pode ajudar sua empresa a operar de forma mais inteligente, responder mais rápido e crescer com IA.",
      ],
      finalStrong: "Comece hoje seu teste grátis.",
      finalText:
        "Coloque conversas com IA, automação e inteligência de receita para trabalhar na sua empresa.",
    },
    captions: {
      dashboard: "Uma visão conectada da atividade de clientes, automação, pipeline e desempenho de receita.",
      conversation: "A IA pode responder, qualificar e conduzir prospects interessados ao próximo passo.",
      platform: "Comunicação com clientes, automação com IA, fluxos de trabalho e atividade de receita conectados em um único sistema.",
      workflow: "Um caminho guiado da configuração até operações ativas assistidas por IA.",
      cortexa: "A Cortexa conecta conversas com IA, fluxos de trabalho, pipeline, equipes e analytics.",
      team: "Equipes apoiadas por IA podem trabalhar a partir de uma visão compartilhada de conversas, tarefas, pipeline e desempenho.",
    },
    footer: {
      pricing: "Preços",
      features: "Recursos",
      terms: "Termos",
      privacy: "Privacidade",
      note: "Crescimento impulsionado por IA para empresas modernas.",
    },
  },
};

const ICONS = [MessageSquareText, Sparkles, CalendarDays, Users, Workflow, Zap];

function CtaCard({ copy, where, bottom = false }) {
  const benefitIcons = [MessageSquareText, Workflow, LineChart, Users];
  return (
    <div className={`ed-cta-card ed-ai-cta-card${bottom ? " is-bottom" : ""}`}>
      <span className="ed-cta-eyebrow">{copy.cta.eyebrow}</span>
      <h3>{copy.cta.heading}</h3>
      <div className="ed-cta-rule" />
      <ul className="ed-cta-benefits">
        {copy.cta.benefits.map(([title, text], index) => {
          const Icon = benefitIcons[index];
          return (
            <li key={title}>
              <Icon size={21} />
              <span><strong>{title}</strong>{text}</span>
            </li>
          );
        })}
      </ul>
      <Link
        to={copy.trial}
        className="ed-cta-primary ed-cta-primary-blue"
        onClick={() => trackEvent("editorial_cta_click", { page: copy.pageEvent, where, cta: "trial" })}
      >
        {copy.cta.primary}
      </Link>
      <a
        href="/pricing"
        className="ed-cta-secondary"
        onClick={() => trackEvent("editorial_cta_click", { page: copy.pageEvent, where, cta: "learn_more" })}
      >
        {copy.cta.secondary} <ArrowRight size={17} />
      </a>
    </div>
  );
}

function Contents({ copy, activeId, onNavigate }) {
  return (
    <nav className="ed-contents" aria-label={copy.ariaContents}>
      <span className="ed-contents-title">{copy.contentsTitle}</span>
      <ol>
        {copy.sections.map(([id, label], index) => (
          <li key={id} className={activeId === id ? "is-active" : ""}>
            <a href={`#${id}`} onClick={() => onNavigate(id)}>
              <span>{index + 1}.</span>{label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function EditorialImage({ src, alt, caption, variant = "" }) {
  return (
    <figure className={`ed-ai-image ${variant}`}>
      <img src={src} alt={alt} />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

export default function EditorialBusinessAILocalized({ locale }) {
  const copy = COPY[locale] || COPY.es;
  const [activeId, setActiveId] = useState(copy.sections[0][0]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const sectionIds = useMemo(() => copy.sections.map(([id]) => id), [copy]);

  useEffect(() => {
    document.title = copy.metaTitle;
    let meta = document.querySelector('meta[name="description"]');
    const previousDescription = meta?.getAttribute("content") || "";
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", copy.metaDescription);
    trackEvent("editorial_view", { page: copy.pageEvent });
    return () => {
      if (meta) meta.setAttribute("content", previousDescription);
    };
  }, [copy]);

  useEffect(() => {
    const nodes = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
    if (!nodes.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: [0, 0.15, 0.35, 0.65] }
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [sectionIds]);

  const a = copy.article;
  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="ed-page ed-ai-page">
      <header className="ed-header">
        <div className="ed-header-inner">
          <Link to={copy.home} className="ed-brand" aria-label={copy.ariaHome}>
            
          </Link>
          <nav className="ed-main-nav" aria-label={copy.ariaNav}>
            <a href="#revenue-os">{copy.nav.platform}</a>
            <a href="#ai-rules">{copy.nav.solutions}</a>
            <a href="#every-industry">{copy.nav.resources}</a>
            <a href="#introducing-cortexa">{copy.nav.company}</a>
            <a href="#transform-business">{copy.nav.start}</a>
          </nav>
          <Link to={copy.trial} className="ed-header-cta">{copy.nav.trial}</Link>
          <button
            type="button"
            className="ed-menu-button"
            aria-label={copy.ariaOpen}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {mobileNavOpen && (
          <div className="ed-mobile-nav">
            <a href="#revenue-os" onClick={closeMobileNav}>{copy.nav.platform}</a>
            <a href="#ai-rules" onClick={closeMobileNav}>{copy.nav.solutions}</a>
            <a href="#every-industry" onClick={closeMobileNav}>{copy.nav.resources}</a>
            <a href="#introducing-cortexa" onClick={closeMobileNav}>{copy.nav.company}</a>
            <a href="#transform-business" onClick={closeMobileNav}>{copy.nav.start}</a>
            <Link to={copy.trial} onClick={closeMobileNav}>{copy.nav.trial}</Link>
          </div>
        )}
      </header>

      <main>
        <div className="ed-breadcrumb-wrap">
          <div className="ed-breadcrumb"><span>Editorial</span><b>/</b><span>{copy.breadcrumb}</span></div>
        </div>

        <section className="ed-hero ed-ai-hero">
          <div className="ed-hero-heading">
            <span className="ed-ai-hero-kicker">{copy.heroKicker}</span>
            <h1>{copy.title}</h1>
            <p className="ed-ai-hero-subtitle">{copy.subtitle}</p>
            <p className="ed-byline">{copy.byline} <strong>{copy.author}</strong><span>|</span>{copy.reviewed}</p>
          </div>
          <div className="ed-hero-divider" aria-hidden="true" />
          <div className="ed-hero-cover ed-ai-hero-cover">
            <div className="ed-hero-cover-frame">
              <span className="ed-ai-cover-label">{copy.coverLabel}</span>
              <p>{copy.coverText}</p>
            </div>
          </div>
        </section>

        <div className="ed-layout">
          <aside className="ed-contents-column">
            <div className="ed-sticky-column">
              <Contents copy={copy} activeId={activeId} onNavigate={setActiveId} />
            </div>
          </aside>

          <article className="ed-article">
            <section className="ed-section ed-introduction" id="new-era">
              <span className="ed-section-kicker">{a.newEraKicker}</span>
              <h2>{copy.sections[0][1]}</h2>
              {a.newEra.map((p) => <p key={p}>{p}</p>)}
              <blockquote className="ed-pull-quote">{a.newEraQuote}</blockquote>
              <EditorialImage src={whyImg} alt={copy.title} caption={copy.captions.dashboard} variant="is-dashboard" />
            </section>

            <section className="ed-section" id="old-way">
              <h2>{copy.sections[1][1]}</h2>
              <p>{a.oldWayIntro}</p>
              <div className="ed-ai-process-list">{a.oldWaySteps.map((s) => <span key={s}>{s}</span>)}</div>
              {a.oldWayBody.map((p) => <p key={p}>{p}</p>)}
              <blockquote>{a.oldWayQuote}</blockquote>
            </section>

            <section className="ed-section" id="missed-leads">
              <h2>{copy.sections[2][1]}</h2>
              <p>{a.missedIntro}</p>
              <ul className="ed-ai-opportunity-list">{a.missedItems.map((item) => <li key={item}>{item}</li>)}</ul>
              {a.missedBody.map((p) => <p key={p}>{p}</p>)}
              <blockquote>{a.missedQuote}</blockquote>
              {a.missedAfter.map((p) => <p key={p}>{p}</p>)}
              <p><strong>{a.missedStrong}</strong></p>
              <EditorialImage src={why1Img} alt={copy.sections[2][1]} caption={copy.captions.conversation} variant="is-conversation" />
            </section>

            <section className="ed-section" id="ai-rules">
              <span className="ed-section-kicker">{a.aiKicker}</span>
              <h2>{copy.sections[3][1]}</h2>
              {a.aiIntro.map((p) => <p key={p}>{p}</p>)}
              <div className="ed-ai-capability-grid">
                {a.aiCapabilities.map((label, index) => {
                  const Icon = ICONS[index];
                  return <div className="ed-ai-capability" key={label}><Icon size={22} /><span>{label}</span></div>;
                })}
              </div>
              <p>{a.aiAfter}</p>
              <blockquote>{a.aiQuote}</blockquote>
            </section>

            <section className="ed-section" id="revenue-os">
              <h2>{copy.sections[4][1]}</h2>
              {a.revenueBody.map((p) => <p key={p}>{p}</p>)}
              <blockquote className="ed-pull-quote">{a.revenueQuote}</blockquote>
              <EditorialImage src={why2Img} alt={copy.sections[4][1]} caption={copy.captions.platform} variant="is-platform" />
            </section>

            <section className="ed-section" id="every-industry">
              <h2>{copy.sections[5][1]}</h2>
              {a.industryIntro.map((p) => <p key={p}>{p}</p>)}
              <div className="ed-ai-industry-grid">
                {a.industries.map(([title, text]) => <article key={title}><strong>{title}</strong><span>{text}</span></article>)}
              </div>
              <p>{a.industryBefore}</p>
              <blockquote>{a.industryQuote}</blockquote>
              <p>{a.industryAfter}</p>
            </section>

            <section className="ed-section" id="competitive-advantage">
              <h2>{copy.sections[6][1]}</h2>
              <p>{a.competitiveIntro}</p>
              <div className="ed-ai-two-paths">
                <div><span>01</span><strong>{a.path1}</strong></div>
                <div><span>02</span><strong>{a.path2}</strong></div>
              </div>
              {a.competitiveBody.map((p) => <p key={p}>{p}</p>)}
              <blockquote>{a.competitiveQuote}</blockquote>
              <EditorialImage src={why3Img} alt={copy.sections[6][1]} caption={copy.captions.workflow} variant="is-workflow" />
            </section>

            <section className="ed-section ed-ai-intro-cortexa" id="introducing-cortexa">
              <span className="ed-section-kicker">{a.cortexaKicker}</span>
              <h2>{copy.sections[7][1]}</h2>
              <p>{a.cortexaIntro}</p>
              <blockquote className="ed-pull-quote">{a.cortexaQuote}</blockquote>
              {a.cortexaBody.map((p) => <p key={p}>{p}</p>)}
              <EditorialImage src={why4Img} alt={copy.sections[7][1]} caption={copy.captions.cortexa} variant="is-cortexa" />
              <div className="ed-ai-inline-cta"><CtaCard copy={copy} where="article_middle" /></div>
            </section>

            <section className="ed-section" id="move-first">
              <h2>{copy.sections[8][1]}</h2>
              {a.moveBody.map((p) => <p key={p}>{p}</p>)}
              <blockquote className="ed-pull-quote">{a.moveQuote}</blockquote>
              <EditorialImage src={why5Img} alt={copy.sections[8][1]} caption={copy.captions.team} variant="is-team" />
            </section>

            <section className="ed-section ed-ai-final-section" id="transform-business">
              <span className="ed-section-kicker">{a.finalKicker}</span>
              <h2>{copy.sections[9][1]}</h2>
              {a.finalBody.map((p) => <p key={p}>{p}</p>)}
              <div className="ed-ai-final-callout">
                <Bot size={32} />
                <div><strong>{a.finalStrong}</strong><span>{a.finalText}</span></div>
              </div>
              <CtaCard copy={copy} where="article_bottom" bottom />
            </section>
          </article>

          <aside className="ed-cta-column">
            <div className="ed-sticky-column"><CtaCard copy={copy} where="sidebar" /></div>
          </aside>
        </div>
      </main>

      <footer className="ed-footer">
        <div className="ed-footer-inner">
          <img src={footlogo} alt="Cortexa" className="ed-footlogo" />
          <div className="ed-footer-links">
            <Link to={copy.pricing}>{copy.footer.pricing}</Link>
            <Link to={copy.features}>{copy.footer.features}</Link>
            <Link to={copy.terms}>{copy.footer.terms}</Link>
            <Link to={copy.privacy}>{copy.footer.privacy}</Link>
          </div>
          <span className="ed-footer-note"><ShieldCheck size={14} /> {copy.footer.note}</span>
        </div>
      </footer>
    </div>
  );
}