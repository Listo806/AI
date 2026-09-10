import React from "react";

import { Link } from "react-router-dom";

import {
  ArrowRight,
  Infinity as InfinityIcon,
  Users,
  ChartNoAxesCombined,
  CheckCircle2,
  Bot,
  MessagesSquare,
  Zap,
  Megaphone,
  Mail,
} from "lucide-react";

import { useTranslation } from "react-i18next";

import SiteLayout from "../../components/layout/SiteLayout";

import agentHeroImage from "../../assets/public/images/listoqasa/agents/agent-hero.jpg";
import agentMarketingCityImage from "../../assets/public/images/listoqasa/agents/agent-marketing-city.jpg";
import agentBottomCtaImage from "../../assets/public/images/listoqasa/agents/agent-bottom-cta.jpg";
import "./AgentsPage.css";

export default function AgentsPage() {
  const { t } = useTranslation();

  return (
    <SiteLayout headerVariant="light">
      {/* HERO */}
      <section
        className="lq-agent-hero"
        style={{ "--lq-agent-hero-image": `url(${agentHeroImage})` }}
      >
        <div className="lq-container lq-agent-hero-inner">
          <div className="lq-agent-hero-copy">
            <h1>
              {t("agent.heroTitle1")}

              <br />

              {t("agent.heroTitle2")}
            </h1>

            <p>{t("agent.heroDescription")}</p>

            <Link to="/agent-plans" className="lq-agent-primary-btn">
              {t("agent.viewPlans")}

              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <main className="lq-agent-page">
        <div className="lq-container">
          {/* INTRO */}
          <section className="lq-agent-intro">
            <h2>{t("agent.unlimitedTitle")}</h2>

            <p>
              {t("agent.unlimitedDescription1")}

              <br />

              {t("agent.unlimitedDescription2")}
            </p>

            <div className="lq-agent-benefits">
              <div className="lq-agent-benefit">
                <div className="lq-agent-benefit-icon">
                  <InfinityIcon />
                </div>

                <h3>{t("agent.unlimitedProperties")}</h3>

                <p>{t("agent.unlimitedPropertiesDesc")}</p>
              </div>

              <div className="lq-agent-benefit">
                <div className="lq-agent-benefit-icon">
                  <Users />
                </div>

                <h3>{t("agent.moreBuyers")}</h3>

                <p>{t("agent.moreBuyersDesc")}</p>
              </div>

              <div className="lq-agent-benefit">
                <div className="lq-agent-benefit-icon">
                  <ChartNoAxesCombined />
                </div>

                <h3>{t("agent.betterResults")}</h3>

                <p>{t("agent.betterResultsDesc")}</p>
              </div>
            </div>
          </section>

          {/* QUALITY LEADS */}
          <section className="lq-agent-quality-card">
            <div className="lq-agent-quality-copy">
              <span>{t("agent.focusEyebrow")}</span>

              <h2>{t("agent.qualityLeadsTitle")}</h2>

              <p>{t("agent.qualityLeadsDescription")}</p>

              <ul>
                <li>
                  <CheckCircle2 />

                  {t("agent.focus1")}
                </li>

                <li>
                  <CheckCircle2 />

                  {t("agent.focus2")}
                </li>

                <li>
                  <CheckCircle2 />

                  {t("agent.focus3")}
                </li>

                <li>
                  <CheckCircle2 />

                  {t("agent.focus4")}
                </li>
              </ul>
            </div>

            <div className="lq-agent-marketing-visual">
              <img
                src={agentMarketingCityImage}
                alt=""
              />

              <div className="lq-agent-channel lq-agent-channel-google">
                <span className="lq-agent-google">G</span>

                {t("agent.googleAds")}
              </div>

              <div className="lq-agent-channel lq-agent-channel-social">
                <Megaphone />

                {t("agent.socialMedia")}
              </div>

              <div className="lq-agent-channel lq-agent-channel-market">
                <span className="lq-agent-mini-logo">LQ</span>

                {t("agent.marketplace")}
              </div>

              <div className="lq-agent-channel lq-agent-channel-email">
                <Mail />

                {t("agent.emailCampaigns")}
              </div>

              <div className="lq-agent-channel lq-agent-channel-partner">
                <Users />

                {t("agent.strategicPartnerships")}
              </div>
            </div>
          </section>

          {/* TOOLS */}
          <section className="lq-agent-tools">
            <div className="lq-agent-tools-intro">
              <div className="lq-agent-tools-main-icon">
                <Bot />
              </div>

              <div>
                <h3>{t("agent.smartTools")}</h3>

                <p>{t("agent.smartToolsDesc")}</p>
              </div>
            </div>

            <div className="lq-agent-tool">
              <MessagesSquare />

              <strong>{t("agent.aiAgent")}</strong>

              <span>{t("agent.aiAgentDesc")}</span>
            </div>

            <div className="lq-agent-tool">
              <Users />

              <strong>{t("agent.smartCrm")}</strong>

              <span>{t("agent.smartCrmDesc")}</span>
            </div>

            <div className="lq-agent-tool">
              <Zap />

              <strong>{t("agent.automation")}</strong>

              <span>{t("agent.automationDesc")}</span>
            </div>
          </section>
        </div>

        {/* CTA */}
        <section
          className="lq-agent-bottom-cta"
          style={{ "--lq-agent-bottom-cta-image": `url(${agentBottomCtaImage})` }}
        >
          <div className="lq-container">
            <div className="lq-agent-bottom-copy">
              <h2>{t("agent.growTitle")}</h2>

              <p>
                {t("agent.growDescription1")}

                <br />

                {t("agent.growDescription2")}
              </p>

              <Link to="/agent-plans" className="lq-agent-primary-btn">
                {t("agent.viewPlans")}

                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}
