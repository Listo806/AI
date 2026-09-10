import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  MessageCircle,
  PanelsTopLeft,
  Home,
  MapPin,
  ShieldCheck,
  Users,
  ContactRound,
  Funnel,
  CalendarDays,
  BarChart3,
  CheckCircle2,
  Boxes,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import SiteLayout from "../../components/layout/SiteLayout";
import aiCrmDashboardImage from "../../assets/public/images/listoqasa/ai-crm/ai-crm-dashboard.png";
import aiChatCardImage from "../../assets/public/images/listoqasa/ai-crm/ai-chat-card.png";
import propertiesScreenImage from "../../assets/public/images/listoqasa/ai-crm/properties-screen.png";
import aiCrmCtaImage from "../../assets/public/images/listoqasa/ai-crm/ai-crm-cta.jpg";
import "./AiCrmPage.css";

export default function AiCrmPage() {
  const { t } = useTranslation();

  const connectedSystem = [
    { icon: MessageCircle, title: t("aiCrm.whatsapp"), desc: t("aiCrm.whatsappDesc") },
    { icon: Bot, title: t("aiCrm.aiAgent"), desc: t("aiCrm.aiAgentSystemDesc") },
    { icon: Users, title: t("aiCrm.leads"), desc: t("aiCrm.leadsDesc") },
    { icon: ContactRound, title: t("aiCrm.contacts"), desc: t("aiCrm.contactsDesc") },
    { icon: Funnel, title: t("aiCrm.pipeline"), desc: t("aiCrm.pipelineDesc") },
    { icon: CalendarDays, title: t("aiCrm.appointments"), desc: t("aiCrm.appointmentsDesc") },
    { icon: CalendarDays, title: t("aiCrm.calendar"), desc: t("aiCrm.calendarDesc") },
    { icon: BarChart3, title: t("aiCrm.analytics"), desc: t("aiCrm.analyticsDesc") },
  ];

  const completeSystem = [
    { icon: Bot, title: t("aiCrm.aiAgent") },
    { icon: MessageCircle, title: t("aiCrm.whatsapp") },
    { icon: Users, title: t("aiCrm.leads") },
    { icon: ContactRound, title: t("aiCrm.contacts") },
    { icon: Funnel, title: t("aiCrm.pipeline") },
    { icon: CalendarDays, title: t("aiCrm.calendar") },
    { icon: BarChart3, title: t("aiCrm.analytics") },
    { icon: Home, title: t("aiCrm.realEstateWorkspace") },
    { icon: Boxes, title: t("aiCrm.appsIntegrations") },
  ];

  return (
    <SiteLayout headerVariant="dark">
      <main className="lq-ai-page">
        <section className="lq-ai-hero">
          <div className="lq-container lq-ai-hero-inner">
            <div className="lq-ai-hero-copy">
              <span className="lq-ai-eyebrow">
                {t("aiCrm.heroEyebrow")}
              </span>

              <h1>
                {t("aiCrm.heroTitle1")}
                <br />
                {t("aiCrm.heroTitle2")}
                <br />
                <strong>{t("aiCrm.heroTitleHighlight")}</strong>
              </h1>

              <p>{t("aiCrm.heroDescription")}</p>

              <Link to="/dashboard/home" className="lq-ai-primary-btn">
                {t("aiCrm.exploreCrm")}
                <ArrowRight size={17} />
              </Link>

              <div className="lq-ai-hero-features">
                <HeroFeature icon={Bot} title={t("aiCrm.aiAgent")} text="24/7" />
                <HeroFeature icon={MessageCircle} title={t("aiCrm.whatsapp")} text={t("aiCrm.connected")} />
                <HeroFeature icon={PanelsTopLeft} title={t("aiCrm.allInOne")} text={t("aiCrm.workspace")} />
                <HeroFeature icon={Home} title={t("aiCrm.realEstate")} text={t("aiCrm.focused")} />
                <HeroFeature icon={MapPin} title={t("aiCrm.secure")} text={t("aiCrm.reliable")} />
              </div>
            </div>

            <div className="lq-ai-hero-visual">
              <img
                src={aiCrmDashboardImage}
                alt="Cortexa AI CRM dashboard"
              />

              <img
                className="lq-ai-chat-float"
                src={aiChatCardImage}
                alt=""
              />
            </div>
          </div>
        </section>

        <section className="lq-ai-connected">
          <div className="lq-container">
            <div className="lq-ai-section-heading">
              <span className="lq-ai-eyebrow">
                {t("aiCrm.oneConnectedSystem")}
              </span>

              <h2>{t("aiCrm.connectedTitle")}</h2>
            </div>

            <div className="lq-ai-flow">
              {connectedSystem.map(({ icon: Icon, title, desc }, index) => (
                <React.Fragment key={title}>
                  <article>
                    <div className="lq-ai-flow-icon">
                      <Icon />
                    </div>
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </article>

                  {index < connectedSystem.length - 1 && (
                    <div className="lq-ai-flow-arrow">→</div>
                  )}
                </React.Fragment>
              ))}
            </div>

            <p className="lq-ai-flow-description">
              {t("aiCrm.connectedDescription")}
            </p>
          </div>
        </section>

        <section className="lq-ai-agent-section">
          <div className="lq-container lq-ai-agent-grid">
            <div className="lq-ai-phone-card">
              <img
                src={aiChatCardImage}
                alt=""
              />
            </div>

            <div className="lq-ai-agent-copy">
              <span className="lq-ai-eyebrow">{t("aiCrm.aiAgent")}</span>
              <h2>{t("aiCrm.aiAgentTitle")}</h2>
              <p>{t("aiCrm.aiAgentDescription")}</p>

              <div className="lq-ai-agent-features">
                <Feature icon={MessageCircle} title={t("aiCrm.responds247")} text={t("aiCrm.responds247Desc")} />
                <Feature icon={Bot} title={t("aiCrm.qualifiesLeads")} text={t("aiCrm.qualifiesLeadsDesc")} />
                <Feature icon={CalendarDays} title={t("aiCrm.booksAppointments")} text={t("aiCrm.booksAppointmentsDesc")} />
              </div>
            </div>
          </div>
        </section>

        <section className="lq-ai-property-section">
          <div className="lq-container lq-ai-property-grid">
            <div className="lq-ai-property-copy">
              <span className="lq-ai-eyebrow">
                {t("aiCrm.realEstateWorkspaceEyebrow")}
              </span>

              <h2>
                {t("aiCrm.propertiesTitle1")}
                <br />
                {t("aiCrm.propertiesTitle2")}
              </h2>

              <p>{t("aiCrm.propertiesDescription")}</p>

              <ul>
                <li><CheckCircle2 />{t("aiCrm.property1")}</li>
                <li><CheckCircle2 />{t("aiCrm.property2")}</li>
                <li><CheckCircle2 />{t("aiCrm.property3")}</li>
                <li><CheckCircle2 />{t("aiCrm.property4")}</li>
              </ul>
            </div>

            <div className="lq-ai-property-visual">
              <img
                src={propertiesScreenImage}
                alt=""
              />
            </div>
          </div>
        </section>

        <section className="lq-ai-complete">
          <div className="lq-container">
            <div className="lq-ai-section-heading">
              <span className="lq-ai-eyebrow">
                {t("aiCrm.completeSystem")}
              </span>

              <h2>{t("aiCrm.completeTitle")}</h2>
            </div>

            <div className="lq-ai-complete-grid">
              {completeSystem.map(({ icon: Icon, title }) => (
                <article key={title}>
                  <div className="lq-ai-complete-icon">
                    <Icon />
                  </div>
                  <h3>{title}</h3>
                </article>
              ))}
            </div>

            <p className="lq-ai-complete-caption">
              {t("aiCrm.completeCaption")}
            </p>
          </div>
        </section>

        <section
          className="lq-ai-bottom-cta"
          style={{ "--lq-ai-cta-image": `url(${aiCrmCtaImage})` }}
        >
          <div className="lq-container lq-ai-bottom-cta-inner">
            <div>
              <h2>{t("aiCrm.ctaTitle")}</h2>
              <p>{t("aiCrm.ctaDescription")}</p>

              <Link to="/dashboard/home" className="lq-ai-white-btn">
                {t("aiCrm.exploreCortexa")}
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}

function HeroFeature({ icon: Icon, title, text }) {
  return (
    <div className="lq-ai-hero-feature">
      <Icon />
      <span>
        <strong>{title}</strong>
        {text}
      </span>
    </div>
  );
}

function Feature({ icon: Icon, title, text }) {
  return (
    <article className="lq-ai-feature">
      <Icon />
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}
