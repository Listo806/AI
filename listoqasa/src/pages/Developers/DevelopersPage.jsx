import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Users,
  ChartNoAxesCombined,
  CheckCircle2,
  PenSquare,
  Construction,
  Megaphone,
  MessageSquare,
  Bot,
  Zap,
  Search,
  Eye,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import SiteLayout from "../../components/layout/SiteLayout";
import developersHeroImage from "../../assets/public/images/listoqasa/developers/developers-hero.jpg";
import developerDemandCityImage from "../../assets/public/images/listoqasa/developers/developer-demand-city.jpg";
import developerBottomCtaImage from "../../assets/public/images/listoqasa/developers/developer-bottom-cta.jpg";
import "./DevelopersPage.css";

export default function DevelopersPage() {
  const { t } = useTranslation();

  const topBenefits = [
    {
      icon: Building2,
      title: t("developers.unlimitedProjects"),
      description: t("developers.unlimitedProjectsDesc"),
    },
    {
      icon: Users,
      title: t("developers.moreBuyers"),
      description: t("developers.moreBuyersDesc"),
    },
    {
      icon: ChartNoAxesCombined,
      title: t("developers.fasterSales"),
      description: t("developers.fasterSalesDesc"),
    },
  ];

  const journey = [
    {
      icon: PenSquare,
      title: t("developers.preLaunch"),
      description: t("developers.preLaunchDesc"),
    },
    {
      icon: Construction,
      title: t("developers.underConstruction"),
      description: t("developers.underConstructionDesc"),
    },
    {
      icon: Megaphone,
      title: t("developers.preSales"),
      description: t("developers.preSalesDesc"),
    },
    {
      icon: Building2,
      title: t("developers.projectCompletion"),
      description: t("developers.projectCompletionDesc"),
    },
  ];

  const stats = [
    {
      icon: Eye,
      value: "11M+",
      label: t("developers.uniqueVisitors"),
    },
    {
      icon: Search,
      value: "68K+",
      label: t("developers.activeSearches"),
    },
    {
      icon: Eye,
      value: "4.2M+",
      label: t("developers.monthlyImpressions"),
    },
  ];

  return (
    <SiteLayout headerVariant="light">
      <section
        className="lq-dev-hero"
        style={{ "--lq-dev-hero-image": `url(${developersHeroImage})` }}
      >
        <div className="lq-container lq-dev-hero-inner">
          <div className="lq-dev-hero-copy">
            <h1>
              {t("developers.heroTitle1")}
              <br />
              {t("developers.heroTitle2")}
            </h1>

            <p>
              {t("developers.heroDescription1")}
              <br />
              {t("developers.heroDescription2")}
            </p>

            <Link to="/developer-plans" className="lq-dev-primary-btn">
              {t("developers.launchProject")}
              <ArrowRight size={17} />
            </Link>

            <div className="lq-dev-hero-note">
              {t("developers.heroNote")}
            </div>
          </div>
        </div>
      </section>

      <main className="lq-dev-page">
        <div className="lq-container">
          <section className="lq-dev-intro">
            <span className="lq-dev-eyebrow">
              {t("developers.builtForDevelopers")}
            </span>

            <h2>{t("developers.constructionToClosings")}</h2>

            <p>
              {t("developers.introDescription1")}
              <br />
              {t("developers.introDescription2")}
            </p>

            <div className="lq-dev-benefit-grid">
              {topBenefits.map(({ icon: Icon, title, description }) => (
                <article className="lq-dev-benefit" key={title}>
                  <Icon />
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="lq-dev-marketing-card">
            <div className="lq-dev-marketing-copy">
              <span>{t("developers.marketingEngine")}</span>

              <h2>{t("developers.qualifiedDemandTitle")}</h2>

              <p>{t("developers.qualifiedDemandDescription")}</p>

              <ul>
                <li>
                  <CheckCircle2 />
                  {t("developers.marketing1")}
                </li>
                <li>
                  <CheckCircle2 />
                  {t("developers.marketing2")}
                </li>
                <li>
                  <CheckCircle2 />
                  {t("developers.marketing3")}
                </li>
                <li>
                  <CheckCircle2 />
                  {t("developers.marketing4")}
                </li>
              </ul>
            </div>

            <div className="lq-dev-marketing-visual">
              <img
                src={developerDemandCityImage}
                alt=""
              />

              <div className="lq-dev-channel lq-dev-google">
                <span className="lq-dev-google-letter">G</span>
                {t("developers.googleAds")}
              </div>

              <div className="lq-dev-channel lq-dev-social">
                <Megaphone />
                {t("developers.socialMedia")}
              </div>

              <div className="lq-dev-channel lq-dev-marketplace">
                <span className="lq-dev-mini-logo">LQ</span>
                {t("developers.marketplace")}
              </div>

              <div className="lq-dev-channel lq-dev-email">
                <MessageSquare />
                {t("developers.emailCampaigns")}
              </div>

              <div className="lq-dev-channel lq-dev-partners">
                <Users />
                {t("developers.strategicPartnerships")}
              </div>
            </div>
          </section>

          <section className="lq-dev-journey-section">
            <span className="lq-dev-eyebrow">
              {t("developers.builtForEveryStage")}
            </span>

            <h2>{t("developers.journeyTitle")}</h2>

            <div className="lq-dev-journey">
              {journey.map(({ icon: Icon, title, description }, index) => (
                <React.Fragment key={title}>
                  <article className="lq-dev-journey-step">
                    <div className="lq-dev-journey-icon">
                      <Icon />
                    </div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </article>

                  {index < journey.length - 1 && (
                    <div className="lq-dev-journey-line" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </section>

          <section className="lq-dev-portfolio">
            <span className="lq-dev-eyebrow">
              {t("developers.builtForPortfolio")}
            </span>

            <h2>{t("developers.reachMillions")}</h2>

            <div className="lq-dev-stats">
              {stats.map(({ icon: Icon, value, label }) => (
                <article key={value}>
                  <Icon />
                  <strong>{value}</strong>
                  <p>{label}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="lq-dev-ai-tools">
            <span className="lq-dev-eyebrow">
              {t("developers.poweredByAi")}
            </span>

            <h2>{t("developers.aiToolsTitle")}</h2>

            <p className="lq-dev-ai-subtitle">
              {t("developers.aiToolsSubtitle")}
            </p>

            <div className="lq-dev-ai-grid">
              <article>
                <div className="lq-dev-ai-icon">
                  <MessageSquare />
                </div>
                <div>
                  <h3>{t("developers.aiAgent")}</h3>
                  <p>{t("developers.aiAgentDesc")}</p>
                </div>
              </article>

              <article>
                <div className="lq-dev-ai-icon">
                  <Users />
                </div>
                <div>
                  <h3>{t("developers.smartCrm")}</h3>
                  <p>{t("developers.smartCrmDesc")}</p>
                </div>
              </article>

              <article>
                <div className="lq-dev-ai-icon">
                  <Zap />
                </div>
                <div>
                  <h3>{t("developers.automatedFollowups")}</h3>
                  <p>{t("developers.automatedFollowupsDesc")}</p>
                </div>
              </article>
            </div>
          </section>
        </div>

        <section
          className="lq-dev-bottom-cta"
          style={{ "--lq-dev-bottom-cta-image": `url(${developerBottomCtaImage})` }}
        >
          <div className="lq-container lq-dev-bottom-cta-inner">
            <div>
              <h2>{t("developers.ctaTitle")}</h2>
              <p>
                {t("developers.ctaDescription1")}
                <br />
                {t("developers.ctaDescription2")}
              </p>

              <Link to="/developer-plans" className="lq-dev-white-btn">
                {t("developers.viewPlans")}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}
