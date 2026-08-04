import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  Calculator,
  LineChart,
  Menu,
  MessageSquareText,
  ShieldCheck,
  Users,
  X,
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
import why6Img from "../../assets/cortexa/why5.jpg";
import CostComparison from "./CostComparison";
import "./Editorial.css";

const ARTICLE_SECTIONS = [
  { id: "legacy-crm", label: "¿El fin del CRM tradicional?" },
  {
    id: "revenue-operations",
    label:
      "De la gestión de relaciones con clientes a las operaciones de ingresos",
  },
  { id: "legacy-crm-tax", label: "El costo oculto del CRM tradicional" },
  {
    id: "different-question",
    label: "Las empresas están haciendo una pregunta diferente",
  },
  { id: "transparent-setup", label: "Implementación transparente" },
  { id: "business-value", label: "Alcanzar valor empresarial más rápido" },
  {
    id: "one-platform",
    label: "Una plataforma frente a un conjunto de herramientas desconectadas",
  },
  {
    id: "crm-cost",
    label: "¿Cuánto te cuesta realmente tu CRM?",
  },
  { id: "migration", label: "Cambiar no tiene por qué ser difícil" },
  { id: "forward-momentum", label: "Del seguimiento al impulso continuo" },
  {
    id: "team-workspace",
    label: "Tu equipo, conectado alrededor de los ingresos",
  },
  { id: "reporting", label: "Informes que se convierten en ingresos" },
  {
    id: "businesses",
    label: "Diseñado para empresas de todos los tamaños e industrias",
  },
  { id: "dont-get-left-behind", label: "No te quedes atrás" },
  {
    id: "next-generation",
    label: "La próxima generación de operaciones de ingresos",
  },
];

function EditorialVisual({ label, variant = "dashboard", children }) {
  return (
    <figure className={`ed-visual ed-visual-${variant}`}>
      <div className="ed-visual-inner">
        {children || (
          <>
            <span className="ed-visual-kicker">
              Visual editorial de Cortexa
            </span>
            <strong>{label}</strong>
            <span className="ed-visual-note">
              Reemplaza este bloque con la imagen aprobada de Cortexa.
            </span>
          </>
        )}
      </div>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

function CtaCard({ where }) {
  return (
    <div className="ed-cta-card">
      <span className="ed-cta-eyebrow">
        ¿Listo para dejar atrás el CRM tradicional?
      </span>
      <h3>
        Descubre cómo Cortexa ayuda a convertir conversaciones en ingresos.
      </h3>

      <div className="ed-cta-rule" />

      <ul className="ed-cta-benefits">
        <li>
          <MessageSquareText size={21} />
          <span>
            <strong>Conversaciones impulsadas por IA</strong>
            Conecta con los leads al instante en cualquier canal.
          </span>
        </li>
        <li>
          <CalendarDays size={21} />
          <span>
            <strong>Citas automatizadas</strong>
            Califica leads y agenda reuniones automáticamente.
          </span>
        </li>
        <li>
          <LineChart size={21} />
          <span>
            <strong>Inteligencia de ingresos</strong>
            Descubre qué funciona y dónde enfocarte después.
          </span>
        </li>
        <li>
          <Users size={21} />
          <span>
            <strong>Diseñado para crecer</strong>
            Escala tu equipo y tus ingresos sin caos.
          </span>
        </li>
      </ul>

      <Link
        to="/trial"
        className="ed-cta-primary"
        onClick={() =>
          trackEvent("editorial_cta_click", { where, cta: "trial" })
        }
      >
        Comienza tu prueba gratuita
      </Link>

      <Link
        to="/pricing"
        className="ed-cta-secondary ed-view-plans-btn"
        onClick={() =>
          trackEvent("editorial_cta_click", { where, cta: "plans" })
        }
      >
        Ver planes <ArrowRight size={17} />
      </Link>
    </div>
  );
}

function Contents({ activeId, onNavigate }) {
  return (
    <nav className="ed-contents" aria-label="Contenido del artículo">
      <span className="ed-contents-title">[ Contenido ]</span>
      <ol>
        {ARTICLE_SECTIONS.map((section, index) => (
          <li
            key={section.id}
            className={activeId === section.id ? "is-active" : ""}
          >
            <a href={`#${section.id}`} onClick={() => onNavigate(section.id)}>
              <span>{index + 1}.</span>
              {section.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default function EditorialFunnelEs() {
  const [activeId, setActiveId] = useState(ARTICLE_SECTIONS[0].id);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const sectionIds = useMemo(
    () => ARTICLE_SECTIONS.map((section) => section.id),
    [],
  );

  useEffect(() => {
    trackEvent("editorial_view", { page: "why_legacy_crm_es" });
  }, []);

  useEffect(() => {
    const nodes = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!nodes.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-18% 0px -68% 0px",
        threshold: [0, 0.15, 0.35, 0.65],
      },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [sectionIds]);

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="ed-page">
      <header className="ed-header">
        <div className="ed-header-inner">
          <Link to="/" className="ed-brand" aria-label="Inicio de Cortexa">
            
          </Link>

          <nav className="ed-main-nav" aria-label="Navegación editorial">
            <a href="#one-platform">Plataforma</a>
            <a href="#forward-momentum">Soluciones</a>
            <a href="#migration">Recursos</a>
            <a href="#businesses">Empresa</a>
            <a href="#crm-cost">Precios</a>
          </nav>

          <Link
            to="/trial"
            className="ed-header-cta"
            onClick={() =>
              trackEvent("editorial_cta_click", {
                where: "header",
                cta: "trial",
              })
            }
          >
            Comenzar prueba gratuita
          </Link>

          <button
            type="button"
            className="ed-menu-button"
            aria-label="Abrir navegación"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileNavOpen && (
          <div className="ed-mobile-nav">
            <a href="#one-platform" onClick={closeMobileNav}>
              Plataforma
            </a>
            <a href="#forward-momentum" onClick={closeMobileNav}>
              Soluciones
            </a>
            <a href="#migration" onClick={closeMobileNav}>
              Recursos
            </a>
            <a href="#businesses" onClick={closeMobileNav}>
              Empresa
            </a>
            <a href="#crm-cost" onClick={closeMobileNav}>
              Precios
            </a>
            <Link to="/trial" onClick={closeMobileNav}>
              Comenzar prueba gratuita
            </Link>
          </div>
        )}
      </header>

      <main>
        <div className="ed-breadcrumb-wrap">
          <div className="ed-breadcrumb">
            <span>Editorial</span>
            <b>/</b>
            <span>CRM tradicionales</span>
          </div>
        </div>

        <section className="ed-hero" id="legacy-crm">
          <div className="ed-hero-heading">
            <h1>¿El fin del CRM tradicional?</h1>

            <p className="ed-byline">
              24 de julio de 2026 por <strong>Julian S.</strong>
              <span>|</span>
              <a href="https://x.com" target="_blank" rel="noreferrer">
                X
              </a>
              <span>,</span>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer">
                LinkedIn
              </a>
              <span>|</span>
              Última revisión: 24 de julio de 2026
            </p>
          </div>

          <div className="ed-hero-divider" aria-hidden="true" />

          <div className="ed-hero-cover">
            <div className="ed-hero-cover-frame">
              <p>
                Por qué las empresas están reconsiderando Salesforce, HubSpot y
                el auge de los Sistemas Operativos de Ingresos con IA Agéntica
              </p>
            </div>
          </div>
        </section>

        <div className="ed-layout">
          <aside className="ed-contents-column">
            <div className="ed-sticky-column">
              <Contents
                activeId={activeId}
                onNavigate={(id) => setActiveId(id)}
              />
            </div>
          </aside>

          <article className="ed-article">
            <section className="ed-section ed-introduction">
              <p>
                Durante casi dos décadas, plataformas como Salesforce y HubSpot
                ayudaron a definir cómo debía ser la gestión de relaciones con
                clientes. Ofrecieron a las empresas un lugar para organizar
                contactos, gestionar pipelines y registrar las interacciones con
                los clientes. Se convirtieron en el estándar para organizaciones
                de ventas de todo el mundo.
              </p>
              <p>Pero los negocios han cambiado.</p>
              <p>
                Los clientes esperan respuestas instantáneas. Los equipos de ventas
                deben avanzar más rápido que nunca. La IA ha pasado de ser una
                novedad a convertirse en una herramienta empresarial práctica.
                Sin embargo, muchas organizaciones todavía dependen de sistemas
                diseñados originalmente para registrar actividad, en lugar de
                ayudar activamente a impulsar las oportunidades.
              </p>
              <p>
                Como resultado, más empresas se hacen una pregunta diferente:
              </p>
              <blockquote>
                ¿Nuestro CRM nos ayuda a crecer o estamos dedicando demasiado tiempo
                a gestionarlo?
              </blockquote>
              <p>
                Esa pregunta ha iniciado una conversación más amplia en toda la
                industria. Las empresas están evaluando si las plataformas CRM
                tradicionales siguen siendo la mejor opción para un entorno de
                ventas impulsado por IA, o si las nuevas plataformas nativas de
                IA pueden simplificar las operaciones y acelerar el crecimiento.
              </p>
              <p>
                No se trata de afirmar que Salesforce o HubSpot sean productos
                “malos”. Son plataformas maduras, con amplias capacidades y
                grandes ecosistemas. La pregunta es si todas las empresas
                necesitan ese nivel de complejidad o si un enfoque diferente se
                adapta mejor al ritmo actual de los negocios.
              </p>
              <p>
                La próxima generación no se centra únicamente en almacenar datos
                de clientes.
              </p>
              <p>
                <strong>
                  Se centra en ayudar a los equipos a generar ingresos.
                </strong>
              </p>
              <p>
                Ahí es donde entran en la conversación los Sistemas Operativos de
                Ingresos con IA Agéntica.
              </p>
              <p>
                En lugar de exigir que los equipos de ventas dediquen horas a
                actualizar registros, alternar entre varias herramientas y hacer
                seguimiento manual de cada lead, los sistemas nativos de IA están
                diseñados para automatizar el trabajo repetitivo, mantener las
                conversaciones activas y apoyar a los equipos durante todo el
                recorrido del cliente.
              </p>
              <p>
                El cambio no consiste en pasar de un proveedor de CRM a otro.
              </p>
              <blockquote>
                El cambio consiste en pasar de gestionar registros a operar los
                ingresos.
              </blockquote>

              <img src={whyImg} alt="CORTEXA" className="background" />
              <figcaption>
                Panel de inteligencia de ingresos de Cortexa
              </figcaption>
            </section>

            <section className="ed-section" id="revenue-operations">
              <h2>
                De la gestión de relaciones con clientes a las operaciones de
                ingresos
              </h2>
              <p>
                Las plataformas CRM tradicionales fueron creadas para organizar
                información.
              </p>
              <p>
                La próxima generación se está construyendo para ayudar a las
                empresas a generar ingresos.
              </p>
              <p>
                Los sistemas CRM tradicionales destacan por almacenar contactos,
                hacer seguimiento de oportunidades y documentar lo ocurrido
                ayer.
              </p>
              <p>
                Los Sistemas Operativos de Ingresos modernos y nativos de IA están
                diseñados para ayudar a las empresas a decidir qué debe ocurrir
                después.
              </p>
              <p>
                En lugar de limitarse a almacenar leads, las empresas preguntan:
              </p>
              <ul>
                <li>¿Puede la IA calificarlos?</li>
                <li>¿Puede la IA mantener las conversaciones en movimiento?</li>
                <li>¿Puede la IA automatizar el seguimiento?</li>
                <li>¿Puede la IA agendar citas?</li>
                <li>
                  ¿Puede la IA ayudar a generar más ingresos con menos trabajo
                  manual?
                </li>
              </ul>
              <p>
                La conversación ya no gira en torno a añadir funciones de IA a
                un CRM.
              </p>
              <p>
                Se trata de construir una empresa en torno a operaciones de ingresos
                asistidas por IA.
              </p>

              <img src={why1Img} alt="CORTEXA" className="background" />
              <figcaption>
                Calificación con agentes de IA y reserva automática de citas
              </figcaption>
            </section>

            <section className="ed-section" id="legacy-crm-tax">
              <h2>El costo oculto del CRM tradicional</h2>
              <p>
                Cuando las empresas evalúan software, suelen comparar los precios de
                las suscripciones mensuales.
              </p>
              <p>Pero la suscripción es solo una parte de la ecuación.</p>
              <p>La pregunta más importante es:</p>
              <blockquote>
                ¿Cuánto cuesta realmente implementar, mantener y operar el sistema a
                lo largo del tiempo?
              </blockquote>
              <p>
                Muchas empresas descubren que el costo total de propiedad incluye
                mucho más que la licencia mensual. Según la plataforma, la
                implementación y la operación continua pueden requerir trabajo de
                configuración, consultoría, integraciones, tiempo administrativo,
                capacitación del personal y mantenimiento constante.
              </p>
              <p>Piénsalo como el costo oculto del CRM tradicional.</p>
              <p>
                No porque todas las organizaciones afronten cada uno de estos costos,
                sino porque la inversión total suele ir mucho más allá de la
                propia suscripción al software.
              </p>
              <p>El costo real puede incluir:</p>
              <ul className="ed-two-column-list">
                <li>Implementación e incorporación</li>
                <li>Capacitación de empleados</li>
                <li>Integraciones personalizadas</li>
                <li>Carga administrativa</li>
                <li>Configuración continua</li>
                <li>Herramientas de terceros</li>
                <li>Mantenimiento de flujos de trabajo</li>
                <li>
                  Costos de oportunidad causados por procesos lentos o manuales
                </li>
              </ul>
              <p>
                Cada hora dedicada a mantener el software es una hora que no se dedica
                a atender clientes o cerrar negocios.
              </p>
            </section>

            <section className="ed-section" id="different-question">
              <h2>Las empresas están haciendo una pregunta diferente</h2>
              <p>
                Las empresas están comenzando a hacer una pregunta diferente.
              </p>
              <p>
                En lugar de pagar a empleados para que pasen horas manteniendo
                software...
              </p>
              <blockquote>
                ¿Puede el software ayudar a los empleados a generar más
                ingresos?
              </blockquote>
              <p>
                Ese cambio de enfoque es una de las principales razones por las que
                las plataformas nativas de IA están ganando atención en múltiples
                industrias.
              </p>
              <p>Las organizaciones no buscan simplemente otro CRM.</p>
              <p>Buscan un mejor modelo operativo.</p>
              <blockquote className="ed-pull-quote">
                Las empresas no buscan simplemente otro CRM. Buscan un mejor modelo
                operativo.
              </blockquote>

              <img src={why2Img} alt="CORTEXA" className="background" />
              <figcaption>
                WhatsApp con IA y conversaciones automatizadas con clientes
              </figcaption>
            </section>

            <section className="ed-section" id="transparent-setup">
              <h2>Implementación transparente</h2>
              <p>
                Los proyectos tradicionales de software empresarial pueden implicar
                costos iniciales de implementación importantes, según el tamaño
                de la organización, las personalizaciones y los requisitos de
                despliegue.
              </p>
              <p>Cortexa adopta un enfoque diferente.</p>

              <aside
                className="ed-editorial-callout"
                aria-label="Tarifa única de configuración"
              >
                <span className="ed-editorial-callout-label">
                  Tarifa única de configuración
                </span>
                <p>
                  Cortexa comienza con una sencilla{" "}
                  <strong>tarifa única de configuración de $97</strong>, ofreciendo a
                  las empresas un punto de partida transparente sin convertir la
                  incorporación en un gran proyecto de implementación.
                </p>
              </aside>

              <p>
                Un punto de partida sencillo y transparente, diseñado para reducir la
                fricción y ayudar a las empresas a comenzar a utilizar un Sistema
                Operativo de Ingresos nativo de IA sin comprometerse con un gran
                proyecto inicial de implementación.
              </p>
              <p>
                Los precios transparentes son solo una parte de la ecuación.
              </p>
              <p>Las empresas también quieren implementaciones predecibles.</p>
              <p>Expectativas claras.</p>
              <p>Mínimas sorpresas.</p>
              <p>
                Y la posibilidad de evaluar una nueva plataforma sin comprometerse con
                un gran proyecto de implementación antes de ver resultados.
              </p>
            </section>

            <section className="ed-section" id="business-value">
              <h2>Alcanzar valor empresarial más rápido</h2>
              <p>El objetivo no es solo implementar más rápido.</p>
              <p>Es alcanzar valor empresarial antes.</p>
              <p>
                Las empresas no compran software porque disfruten implementándolo.
              </p>
              <p>
                Invierten en tecnología porque buscan un mejor rendimiento de ventas,
                mejores experiencias para los clientes y una mayor eficiencia
                operativa.
              </p>
              <p>
                Cuanto antes comiencen esas mejoras, antes empezará la inversión a
                generar valor.
              </p>

              <img src={why3Img} alt="CORTEXA" className="background" />
              <figcaption>
                Incorporación rápida y conexión de WhatsApp mediante QR
              </figcaption>
            </section>

            <section className="ed-section" id="one-platform">
              <h2>
                Una plataforma frente a un conjunto de herramientas
                desconectadas
              </h2>
              <p>
                Los sistemas tradicionales suelen convertirse en una combinación de
                herramientas y complementos que las empresas deben mantener,
                conectar y pagar por separado.
              </p>
              <p>
                Cortexa reúne el flujo de trabajo esencial de ingresos en una sola
                plataforma conectada.
              </p>
            </section>

            <section className="ed-section ed-cost-section" id="crm-cost">
              <div className="ed-cost-intro">
                <span className="ed-cost-kicker">[ El costo real ]</span>

                <h2>¿Cuánto te cuesta realmente tu CRM?</h2>

                <div className="ed-cost-rule" aria-hidden="true" />

                <h3>Las suscripciones mensuales son solo el comienzo.</h3>

                <p>
                  Comparar únicamente las suscripciones de software solo cuenta una
                  parte de la historia. Descubre cómo se comparan Salesforce,
                  HubSpot y Cortexa en costos de implementación, capacidades de
                  IA, colaboración en equipo e inversión estimada del primer año.
                </p>

                <div className="ed-cost-note">
                  <span className="ed-cost-note-icon" aria-hidden="true">
                    <Calculator size={37} strokeWidth={1.8} />
                  </span>
                  <div>
                    <strong>
                      Las cifras a continuación reflejan la inversión total
                      estimada durante el primer año para un equipo de 5
                      usuarios.
                    </strong>
                    <span>Descubre cómo Cortexa ofrece más por menos.</span>
                  </div>
                </div>
              </div>

              <div className="ed-comparison-transition">
                <span>Comparación de costos</span>
                <h3>Los números cuentan la historia</h3>
                <p>
                  Ahora comparemos la inversión estimada del primer año, no solo la
                  suscripción mensual.
                </p>
              </div>

              <div className="ed-comparison-wrap">
                <CostComparison locale="es" />
              </div>

              <p>
                Antes de tomar cualquier decisión tecnológica, vale la pena
                mirar más allá de la suscripción mensual.
              </p>
              <p>
                Considerar únicamente el precio de la suscripción mensual rara
                vez cuenta toda la historia.
              </p>
              <p>
                La inversión real suele incluir la implementación, la
                consultoría, la administración, el mantenimiento, las
                integraciones y el esfuerzo continuo necesario para mantener el
                sistema funcionando de manera eficiente.
              </p>
              <p>
                Precisamente por eso las empresas necesitan comparar mucho más
                que el precio del software.
              </p>
              <p>No solo la suscripción mensual...</p>
              <p>Sino el costo total de operar el CRM.</p>
              <p>El costo más amplio puede incluir:</p>
              <ul className="ed-two-column-list">
                <li>Configuración inicial</li>
                <li>Consultoría e implementación</li>
                <li>Capacitación</li>
                <li>Administración</li>
                <li>Integraciones</li>
                <li>Mantenimiento continuo</li>
                <li>Complementos de IA</li>
                <li>Esfuerzo operativo</li>
              </ul>
              <p>A veces el mayor gasto no es el software en sí.</p>
              <blockquote>
                Es todo lo necesario para mantenerlo funcionando.
              </blockquote>
            </section>

            <section className="ed-section ed-migration-section" id="migration">
              <span className="ed-section-kicker">Migración guiada</span>
              <h2>Cambiar no tiene por qué ser difícil</h2>
              <p className="ed-section-intro">
                Migra desde Salesforce, HubSpot, Jira o ClickUp sin empezar desde
                cero. El proceso de migración guiada de Cortexa ayuda a trasladar
                tus contactos, pipelines, proyectos, tareas y flujos de trabajo a
                una única plataforma conectada e impulsada por IA.
              </p>

              <ul className="ed-migration-checklist">
                <li>Importar contactos y datos de clientes</li>
                <li>Importar pipelines y oportunidades</li>
                <li>Importar proyectos y tareas</li>
                <li>Configurar agentes de IA y flujos de trabajo</li>
                <li>Conectar tus integraciones</li>
                <li>Preparar a tu equipo para trabajar</li>
              </ul>
            </section>

            <section className="ed-section" id="forward-momentum">
              <h2>Del seguimiento al impulso continuo</h2>
              <p>
                El valor de un Sistema Operativo de Ingresos nativo con IA no
                consiste simplemente en almacenar la información de los
                clientes.
              </p>
              <p>Ayuda a mantener las oportunidades avanzando.</p>
              <p>
                La IA de Cortexa puede responder a nuevas conversaciones,
                calificar clientes potenciales, automatizar el seguimiento,
                gestionar la reserva de citas y transferir la conversación a un
                miembro del equipo cuando se necesita asistencia humana.
              </p>
              <p>
                En lugar de depender completamente de que los empleados
                recuerden cada seguimiento, el sistema ayuda a garantizar que
                las oportunidades continúen avanzando a lo largo del proceso de
                ingresos.
              </p>
              <p>La IA se encarga del trabajo repetitivo.</p>
              <p>
                Tu equipo puede centrarse en las conversaciones y decisiones que
                requieren atención humana.
              </p>

              <img src={why4Img} alt="CORTEXA" className="background" />
            </section>

            <section className="ed-section" id="team-workspace">
              <h2>Tu equipo, conectado alrededor de los ingresos</h2>
              <p>Los ingresos no avanzan a través de un solo departamento.</p>
              <p>
                Los equipos de ventas, atención al cliente, gestión, operaciones
                y soporte suelen necesitar visibilidad sobre las mismas
                conversaciones, citas, tareas, archivos y oportunidades.
              </p>
              <p>
                El Espacio de Trabajo de Ingresos para Equipos de Cortexa ofrece
                un entorno conectado donde los equipos pueden colaborar, asignar
                tareas, compartir información, supervisar la actividad y
                mantener los proyectos avanzando.
              </p>
              <p>
                El resultado es una menor fragmentación entre sistemas y una
                mayor visibilidad de todo el trabajo que impulsa los ingresos.
              </p>

              <img src={why5Img} alt="CORTEXA" className="background" />
              <figcaption>Espacio de trabajo de ingresos del equipo</figcaption>
            </section>

            <section className="ed-section" id="reporting">
              <h2>Informes que se convierten en ingresos</h2>
              <p>Las empresas no necesitan más informes desconectados.</p>
              <p>Necesitan visibilidad para tomar mejores decisiones.</p>
              <p>
                Cortexa reúne el rendimiento, la actividad del pipeline, la
                visibilidad del equipo, el movimiento de los clientes
                potenciales y los informes de ingresos para que las empresas
                puedan comprender lo que está ocurriendo y decidir cuál debe ser
                el siguiente paso.
              </p>
              <p>El objetivo no es generar informes por generar.</p>
              <p>
                Se trata de utilizar la información para identificar
                oportunidades, mejorar el rendimiento y mantener el crecimiento
                de los ingresos.
              </p>

              <img src={why6Img} alt="CORTEXA" className="background" />
              <figcaption>Informes que generan ingresos</figcaption>
            </section>

            <section className="ed-section" id="businesses">
              <h2>Diseñado para empresas de todos los tamaños e industrias</h2>
              <p>
                Ya sea que dirijas una empresa inmobiliaria, una tienda de
                comercio electrónico, una agencia, una consultora, una empresa
                de seguros, una empresa de servicios financieros u otra
                organización en crecimiento, el Sistema Operativo de Ingresos
                con IA Agéntica de Cortexa está diseñado para ayudar a convertir
                las conversaciones en ingresos.
              </p>
              <p>
                La plataforma principal está lista para apoyar a las empresas
                que dependen de la comunicación con los clientes, los clientes
                potenciales, las citas, los pipelines, los análisis y la
                colaboración en equipo.
              </p>
              <p>
                Se pueden añadir módulos específicos para cada industria cuando
                sea necesario, mientras que la mayoría de las empresas pueden
                comenzar a utilizar la plataforma principal de inmediato.
              </p>
            </section>

            <section className="ed-section" id="dont-get-left-behind">
              <h2>No te quedes atrás</h2>
              <p>
                Descubre cómo nuestro Sistema Operativo de Ingresos integrado
                ayuda a las empresas a automatizar más rápido, cerrar más
                oportunidades y aumentar sus ingresos.
              </p>
            </section>

            <section className="ed-section" id="next-generation">
              <h2>La próxima generación de operaciones de ingresos</h2>
              <p>
                Las empresas que buscan un CRM hoy en día no solo buscan otra
                base de datos.
              </p>
              <p>Están investigando.</p>
              <p>Están comparando.</p>
              <p>
                Están leyendo artículos especializados, guías de compra y
                análisis del sector antes de tomar una decisión.
              </p>
              <p>
                Y, lo más importante, están haciéndose una pregunta diferente a
                la de hace apenas unos años.
              </p>
              <p>Ya no preguntan:</p>
              <blockquote>«¿Qué CRM tiene más funciones?»</blockquote>
              <p>Preguntan:</p>
              <blockquote>
                «¿Qué plataforma nos ayudará a generar más ingresos con menos
                trabajo manual?»
              </blockquote>
              <p>
                Esa es la conversación que los Sistemas Operativos de Ingresos
                nativos con IA están empezando a transformar.
              </p>
              <p>
                El objetivo ya no es solo gestionar las relaciones con los
                clientes.
              </p>
              <p>
                El objetivo es ayudar a las empresas a calificar clientes
                potenciales, automatizar conversaciones, facilitar la reserva de
                citas, optimizar el seguimiento y gestionar los ingresos de
                forma más inteligente.
              </p>
              <p>
                Es posible que el futuro no pertenezca al CRM con la lista de
                funciones más extensa.
              </p>
              <p>
                Las plataformas tradicionales fueron creadas para una época en
                la que los equipos registraban las actividades después de que
                ocurrían. Las empresas de hoy necesitan sistemas capaces de
                participar en el trabajo en sí: responder más rápido, mantener
                el impulso, conectar equipos y ayudar a los líderes a actuar
                sobre las señales de ingresos mientras las oportunidades siguen
                activas.
              </p>
              <p>
                Por eso, el cambio hacia un Sistema Operativo de Ingresos con IA
                Agéntica es mucho más que una actualización de software.
                Representa el paso de un registro pasivo de información a un
                modelo operativo diseñado para la acción, la velocidad y un
                crecimiento medible.
              </p>
              <p>
                Las empresas que realizan esta transición no están abandonando
                las relaciones con sus clientes. Están proporcionando a sus
                equipos una forma más inteligente de gestionarlas y hacerlas
                crecer.
              </p>
              <blockquote className="ed-pull-quote">
                La próxima generación de tecnología para ingresos permitirá a
                las empresas dedicar menos tiempo a gestionar software y más
                tiempo a impulsar un crecimiento continuo.
              </blockquote>
            </section>

            <div className="ed-inline-cta">
              <CtaCard where="inline_mobile" />
            </div>
          </article>

          <aside className="ed-cta-column">
            <div className="ed-sticky-column">
              <CtaCard where="sidebar" />
            </div>
          </aside>
        </div>
      </main>

      <footer className="ed-footer">
        <div className="ed-footer-inner">
          <img src={footlogo} alt="Cortexa" className="ed-footlogo" />
          <div className="ed-footer-links">
            <Link to="/pricing">Precios</Link>
            <Link to="/features">Funciones</Link>
            <Link to="/terms">Términos</Link>
            <Link to="/privacy-policy">Privacidad</Link>
          </div>
          <span className="ed-footer-note">
            <ShieldCheck size={14} /> Las estimaciones son ilustrativas.
          </span>
        </div>
      </footer>
    </div>
  );
}