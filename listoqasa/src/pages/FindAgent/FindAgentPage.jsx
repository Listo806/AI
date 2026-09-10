import React, { useState } from "react";

import { Link } from "react-router-dom";

import {
  ArrowRight,
  Search,
  MapPin,
  ChevronDown,
  ShieldCheck,
  Star,
  Handshake,
  MessagesSquare,
  Bot,
  MessageCircle,
  PanelsTopLeft,
  Users,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { useTranslation } from "react-i18next";

import SiteLayout from "../../components/layout/SiteLayout";

import findAgentHeroImage from "../../assets/public/images/listoqasa/find-agent/agent-hero.jpg";
import azTeamImage from "../../assets/public/images/listoqasa/find-agent/az-team.jpg";
import andresImage from "../../assets/public/images/listoqasa/find-agent/andres.jpg";
import blueOfficeImage from "../../assets/public/images/listoqasa/find-agent/blue-office.jpg";
import mariaImage from "../../assets/public/images/listoqasa/find-agent/maria.jpg";
import "./FindAgentPage.css";

const professionals = [
  {
    id: 1,
    name: "AZ Inmobiliaria",
    type: "agency",
    location: "Quito, Ecuador",
    specialties: "Residential • Luxury • Rentals",
    rating: "4.8",
    reviews: 128,
    image: azTeamImage,
    avatar: "AZ",
  },

  {
    id: 2,
    name: "Andrés Montoya",
    type: "agent",
    location: "Cumbayá, Ecuador",
    specialties: "Residential • Investment",
    rating: "4.9",
    reviews: 64,
    image: andresImage,
  },

  {
    id: 3,
    name: "Blue RE Group",
    type: "agency",
    location: "Guayaquil, Ecuador",
    specialties: "Residential • Commercial • Land",
    rating: "4.7",
    reviews: 93,
    image: blueOfficeImage,
    avatar: "BR",
  },

  {
    id: 4,
    name: "María Belén R.",
    type: "agent",
    location: "Cuenca, Ecuador",
    specialties: "Residential • Luxury • Rentals",
    rating: "4.9",
    reviews: 51,
    image: mariaImage,
  },
];

export default function FindAgentPage() {
  const { t } = useTranslation();

  const [professionalType, setProfessionalType] = useState("all");

  return (
    <SiteLayout headerVariant="dark">
      {/* HERO */}
      <section
        className="lq-find-hero"
        style={{ "--lq-find-hero-image": `url(${findAgentHeroImage})` }}
      >
        <div className="lq-container lq-find-hero-inner">
          <div className="lq-find-hero-copy">
            <span className="lq-find-eyebrow">{t("findAgent.eyebrow")}</span>

            <h1>
              {t("findAgent.heroTitle1")}
              <br />
              {t("findAgent.heroTitle2")}{" "}
              <strong>{t("findAgent.heroTitleHighlight")}</strong>
            </h1>

            <p>{t("findAgent.heroDescription")}</p>

            <a href="#find-professional" className="lq-find-main-btn">
              {t("findAgent.findProfessional")}

              <ArrowRight size={17} />
            </a>

            <div className="lq-find-hero-benefits">
              <div>
                <ShieldCheck />

                <strong>{t("findAgent.verified")}</strong>

                <span>{t("findAgent.verifiedDesc")}</span>
              </div>

              <div>
                <Star />

                <strong>{t("findAgent.localExpertise")}</strong>

                <span>{t("findAgent.localExpertiseDesc")}</span>
              </div>

              <div>
                <Handshake />

                <strong>{t("findAgent.moreOpportunities")}</strong>

                <span>{t("findAgent.moreOpportunitiesDesc")}</span>
              </div>

              <div>
                <MessagesSquare />

                <strong>{t("findAgent.directContact")}</strong>

                <span>{t("findAgent.directContactDesc")}</span>
              </div>
            </div>
          </div>

          <div className="lq-find-tools-bar">
            <div>
              <Bot />

              <span>
                <strong>{t("findAgent.aiAgent")}</strong>

                {t("findAgent.connected247")}
              </span>
            </div>

            <div>
              <MessageCircle />

              <span>
                <strong>{t("findAgent.whatsapp")}</strong>

                {t("findAgent.connected")}
              </span>
            </div>

            <div>
              <PanelsTopLeft />

              <span>
                <strong>{t("findAgent.workspace")}</strong>

                {t("findAgent.workspaceDesc")}
              </span>
            </div>

            <div>
              <ShieldCheck />

              <span>
                <strong>{t("findAgent.secure")}</strong>

                {t("findAgent.reliable")}
              </span>
            </div>
          </div>
        </div>
      </section>

      <main className="lq-find-page">
        <div className="lq-container">
          {/* SEARCH */}
          <section id="find-professional" className="lq-find-search-panel">
            <div className="lq-find-search-heading">
              <h2>{t("findAgent.searchTitle")}</h2>

              <p>{t("findAgent.searchSubtitle")}</p>
            </div>

            <div className="lq-find-search-fields">
              <label className="lq-find-search-field">
                <Search />

                <input
                  type="text"
                  placeholder={t("findAgent.searchPlaceholder")}
                />
              </label>

              <button type="button" className="lq-find-select">
                <MapPin />

                <span>{t("findAgent.allCities")}</span>

                <ChevronDown />
              </button>

              <button type="button" className="lq-find-select">
                <span>{t("findAgent.allSpecialties")}</span>

                <ChevronDown />
              </button>

              <button type="button" className="lq-find-search-btn">
                <Search />

                {t("findAgent.search")}
              </button>
            </div>

            <div className="lq-find-type-row">
              <span>{t("findAgent.lookingFor")}</span>

              <button
                type="button"
                className={professionalType === "all" ? "active" : ""}
                onClick={() => setProfessionalType("all")}
              >
                {t("findAgent.allProfessionals")}
              </button>

              <button
                type="button"
                className={professionalType === "agents" ? "active" : ""}
                onClick={() => setProfessionalType("agents")}
              >
                {t("findAgent.independentAgents")}
              </button>

              <button
                type="button"
                className={professionalType === "agencies" ? "active" : ""}
                onClick={() => setProfessionalType("agencies")}
              >
                {t("findAgent.realEstateAgencies")}
              </button>
            </div>
          </section>

          {/* FEATURED */}
          <section className="lq-find-featured">
            <div className="lq-find-section-head">
              <div>
                <h2>{t("findAgent.featuredTitle")}</h2>

                <p>{t("findAgent.featuredDescription")}</p>
              </div>

              <Link to="/agents">
                {t("findAgent.viewAllProfessionals")}

                <ArrowRight />
              </Link>
            </div>

            <div className="lq-find-professionals-wrap">
              <button
                type="button"
                className="lq-find-slider-arrow lq-find-slider-left"
              >
                <ChevronLeft />
              </button>

              <div className="lq-find-professional-grid">
                {professionals.map((item) => (
                  <ProfessionalCard key={item.id} item={item} t={t} />
                ))}
              </div>

              <button
                type="button"
                className="lq-find-slider-arrow lq-find-slider-right"
              >
                <ChevronRight />
              </button>
            </div>
          </section>

          {/* WHY */}
          <section className="lq-find-why">
            <h2>{t("findAgent.whyTitle")}</h2>

            <div className="lq-find-why-grid">
              <WhyItem
                icon={Users}
                title={t("findAgent.trustedNetwork")}
                description={t("findAgent.trustedNetworkDesc")}
              />

              <WhyItem
                icon={ChartIcon}
                title={t("findAgent.localKnowledge")}
                description={t("findAgent.localKnowledgeDesc")}
              />

              <WhyItem
                icon={ShieldCheck}
                title={t("findAgent.betterResults")}
                description={t("findAgent.betterResultsDesc")}
              />

              <WhyItem
                icon={MessagesSquare}
                title={t("findAgent.directCommunication")}
                description={t("findAgent.directCommunicationDesc")}
              />
            </div>
          </section>

          {/* CTA */}
          <section className="lq-find-cta">
            <div>
              <h2>{t("findAgent.ctaTitle")}</h2>

              <p>{t("findAgent.ctaDescription")}</p>
            </div>

            <a href="#find-professional" className="lq-find-cta-btn">
              {t("findAgent.findProfessional")}

              <ArrowRight />
            </a>
          </section>
        </div>
      </main>
    </SiteLayout>
  );
}

function ProfessionalCard({ item, t }) {
  return (
    <article className="lq-prof-card">
      {item.image ? (
        <div className="lq-prof-cover">
          <img src={item.image} alt="" />
        </div>
      ) : (
        <div className="lq-prof-cover lq-prof-cover-empty" />
      )}

      <div className="lq-prof-avatar">
        <img src={item.avatar} alt={item.name} />
      </div>

      <div className="lq-prof-content">
        <h3>
          {item.name}

          <span className="lq-prof-verified">✓</span>
        </h3>

        <span className="lq-prof-type">
          {item.type === "agency"
            ? t("findAgent.agency")
            : t("findAgent.independentAgent")}
        </span>

        <span className="lq-prof-location">{item.location}</span>

        <span className="lq-prof-specialties">{item.specialties}</span>

        <div className="lq-prof-rating">
          <Star />

          <strong>{item.rating}</strong>

          <span>({item.reviews} reviews)</span>
        </div>

        <Link to={`/professional/${item.id}`}>
          {item.type === "agency"
            ? t("findAgent.viewAgencyProfile")
            : t("findAgent.viewAgentProfile")}
        </Link>
      </div>
    </article>
  );
}

function WhyItem({ icon: Icon, title, description }) {
  return (
    <article className="lq-find-why-item">
      <Icon />

      <h3>{title}</h3>

      <p>{description}</p>
    </article>
  );
}

function ChartIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
    >
      <path d="M4 19V13" />
      <path d="M10 19V9" />
      <path d="M16 19V5" />
      <path d="M3 19h18" />
      <path d="m4 10 5-4 4 2 6-6" />
    </svg>
  );
}
