import React from "react";

import { Link } from "react-router-dom";

import {
  ArrowRight,
  Users,
  Crosshair,
  ChartNoAxesCombined,
  ShieldCheck,
  FileText,
  Search,
  UserRound,
  Eye,
  TrendingUp,
  CircleCheck,
  House,
  Check,
} from "lucide-react";

import { useTranslation } from "react-i18next";

import SiteLayout from "../../components/layout/SiteLayout";

import ownerHeroImage from "../../assets/public/images/listoqasa/owners/owner-hero.jpg";
import ownerCtaImage from "../../assets/public/images/listoqasa/owners/owner-cta.jpg";
import quitoImage from "../../assets/public/images/listoqasa/owners/quito.jpg";
import guayaquilImage from "../../assets/public/images/listoqasa/owners/guayaquil.jpg";
import cuencaImage from "../../assets/public/images/listoqasa/owners/cuenca.jpg";
import mantaImage from "../../assets/public/images/listoqasa/owners/manta.jpg";
import cumbayaImage from "../../assets/public/images/listoqasa/owners/cumbaya.jpg";
import samborondonImage from "../../assets/public/images/listoqasa/owners/samborondon.jpg";
import "./OwnersPage.css";

const locations = [
  {
    name: "Quito",
    image: quitoImage,
  },
  {
    name: "Guayaquil",
    image: guayaquilImage,
  },
  {
    name: "Cuenca",
    image: cuencaImage,
  },
  {
    name: "Manta",
    image: mantaImage,
  },
  {
    name: "Cumbayá",
    image: cumbayaImage,
  },
  {
    name: "Samborondón",
    image: samborondonImage,
  },
];

export default function OwnersPage() {
  const { t } = useTranslation();

  const benefits = [
    {
      icon: Users,

      title: t("owners.hugeAudience"),

      description: t("owners.hugeAudienceDesc"),
    },

    {
      icon: Crosshair,

      title: t("owners.smartMatching"),

      description: t("owners.smartMatchingDesc"),
    },

    {
      icon: ChartNoAxesCombined,

      title: t("owners.moreVisibility"),

      description: t("owners.moreVisibilityDesc"),
    },

    {
      icon: ShieldCheck,

      title: t("owners.secureReliable"),

      description: t("owners.secureReliableDesc"),
    },
  ];

  const stats = [
    {
      icon: Eye,

      value: t("owners.exposure247"),

      label: t("owners.propertyExposure"),

      description: t("owners.alwaysVisible"),
    },

    {
      icon: Users,

      value: t("owners.thousands"),

      label: t("owners.activeBuyers"),

      description: t("owners.searchingDaily"),
    },

    {
      icon: TrendingUp,

      value: t("owners.moreInquiries"),

      label: "",

      description: t("owners.qualifiedLeads"),
    },

    {
      icon: CircleCheck,

      value: t("owners.betterResults"),

      label: "",

      description: t("owners.sellFaster"),
    },
  ];

  return (
    <SiteLayout headerVariant="light">
      {/* HERO */}
      <section
        className="lq-owner-hero"
        style={{ "--lq-owner-hero-image": `url(${ownerHeroImage})` }}
      >
        <div className="lq-container lq-owner-hero-inner">
          <div className="lq-owner-hero-content">
            <h1>
              {t("owners.heroTitle1")}

              <br />

              {t("owners.heroTitle2")}
            </h1>

            <div className="lq-owner-hero-accent" />

            <p>
              {t("owners.heroDescription1")}

              <br />

              {t("owners.heroDescription2")}
            </p>

            <Link to="/owners/create" className="lq-primary-button">
              {t("owners.listProperty")}

              <ArrowRight size={18} />
            </Link>

            <div className="lq-owner-secure">
              <ShieldCheck size={18} />

              {t("owners.secure")}
            </div>
          </div>
        </div>
      </section>

      <section className="lq-owner-main">
        <div className="lq-container">
          {/* EXPOSURE */}
          <div className="lq-owner-title-block">
            <span className="lq-eyebrow">{t("owners.exposureEyebrow")}</span>

            <h2>{t("owners.exposureTitle")}</h2>

            <p>
              {t("owners.exposureDescription1")}

              <br className="lq-desktop-break" />

              {t("owners.exposureDescription2")}
            </p>
          </div>

          {/* BENEFITS */}
          <div className="lq-benefit-grid">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <article className="lq-benefit-card" key={benefit.title}>
                  <Icon
                    className="lq-benefit-icon"
                    size={52}
                    strokeWidth={1.6}
                  />

                  <h3>{benefit.title}</h3>

                  <p>{benefit.description}</p>
                </article>
              );
            })}
          </div>

          {/* FLOW TITLE */}
          <div className="lq-owner-title-block lq-owner-flow-title">
            <span className="lq-eyebrow">{t("owners.oneListing")}</span>

            <h2>{t("owners.rightPeopleTitle")}</h2>
          </div>

          {/* FLOW */}
          <div className="lq-owner-flow">
            <div className="lq-flow-step">
              <FileText size={39} />

              <span>{t("owners.flowList")}</span>

              <strong>{t("owners.flowProperty")}</strong>
            </div>

            <div className="lq-flow-arrow">
              <ArrowRight />
            </div>

            <div className="lq-flow-step">
              <div className="lq-flow-logo">LQ</div>

              <span>{t("owners.listoQasa")}</span>

              <strong>{t("owners.marketplace")}</strong>
            </div>

            <div className="lq-flow-arrow">
              <ArrowRight />
            </div>

            <div className="lq-flow-step">
              <Search size={39} />

              <span>{t("owners.aiMatches")}</span>

              <strong>{t("owners.rightPeople")}</strong>
            </div>

            <div className="lq-flow-arrow">
              <ArrowRight />
            </div>

            <div className="lq-flow-step">
              <UserRound size={39} />

              <span>{t("owners.buyersRenters")}</span>

              <strong>{t("owners.findProperty")}</strong>
            </div>
          </div>

          {/* LOCATIONS */}
          <div className="lq-location-grid">
            {locations.map((location) => (
              <article key={location.name} className="lq-location-card">
                <img src={location.image} alt={location.name} />

                <div className="lq-location-overlay" />

                <h3>{location.name}</h3>
              </article>
            ))}
          </div>

          {/* STATS */}
          <section className="lq-owner-stats">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <article key={stat.value} className="lq-owner-stat">
                  <div className="lq-owner-stat-icon">
                    <Icon size={38} strokeWidth={1.55} />
                  </div>

                  <div>
                    <strong>{stat.value}</strong>

                    {stat.label && <span>{stat.label}</span>}

                    <p>{stat.description}</p>
                  </div>
                </article>
              );
            })}
          </section>

          {/* CTA */}
          <section
            className="lq-owner-cta"
            style={{ "--lq-owner-cta-image": `url(${ownerCtaImage})` }}
          >
            <div className="lq-owner-cta-overlay" />

            <div className="lq-owner-cta-content">
              <div className="lq-owner-cta-icon">
                <House size={48} strokeWidth={1.5} />
              </div>

              <div className="lq-owner-cta-main">
                <h2>{t("owners.ctaTitle")}</h2>

                <p>{t("owners.ctaDescription")}</p>

                <Link to="/owners/create" className="lq-primary-button">
                  {t("owners.listProperty")}

                  <ArrowRight size={18} />
                </Link>
              </div>

              <ul className="lq-owner-checklist">
                <li>
                  <Check />

                  {t("owners.easyCreate")}
                </li>

                <li>
                  <Check />

                  {t("owners.maximumExposure")}
                </li>

                <li>
                  <Check />

                  {t("owners.noHassle")}
                </li>

                <li>
                  <Check />

                  {t("owners.startToday")}
                </li>
              </ul>
            </div>
          </section>
        </div>
      </section>
    </SiteLayout>
  );
}
