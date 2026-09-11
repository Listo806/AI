import React, { useState } from "react";

import {
  Link,
  NavLink,
} from "react-router-dom";

import {
  Menu,
  X,
  Bot,
  Globe2,
  Check,
  Home,
  CalendarDays,
  UserRound,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
} from "lucide-react";

import { useTranslation } from "react-i18next";
import "./HeaderListProperty.css";

export default function Header({
  variant = "light",
}) {
  const { t, i18n } = useTranslation();
  const currentLanguage = (
    i18n.resolvedLanguage ||
    i18n.language ||
    "en"
  )
    .split("-")[0]
    .toLowerCase();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [listPropertyOpen, setListPropertyOpen] =
    useState(false);

  const isDark = variant === "dark";

  const navItems = [
    {
      label: t("header.buy"),
      to: "/buy",
    },
    {
      label: t("header.rent"),
      to: "/rent",
    },
    {
      label: t("header.sell"),
      to: "/owners",
    },
  ];

  const listPropertyItems = [
    {
      icon: Home,
      label: t("header.listPropertyMenu.rentals"),
      description: t("header.listPropertyMenu.rentalsDesc"),
      to: "/owner-plans",
    },
    {
      icon: CalendarDays,
      label: t("header.listPropertyMenu.vacationRentals"),
      description: t("header.listPropertyMenu.vacationRentalsDesc"),
      to: "/vacation-rental-plans",
    },
    {
      icon: UserRound,
      label: t("header.listPropertyMenu.owners"),
      description: t("header.listPropertyMenu.ownersDesc"),
      to: "/owners",
    },
    {
      icon: BriefcaseBusiness,
      label: t("header.listPropertyMenu.agents"),
      description: t("header.listPropertyMenu.agentsDesc"),
      to: "/agents",
    },
    {
      icon: Building2,
      label: t("header.listPropertyMenu.developers"),
      description: t("header.listPropertyMenu.developersDesc"),
      to: "/developers",
    },
  ];

  const languages = [
    {
      code: "en",
      name: "English",
      short: "EN",
    },

    {
      code: "es",
      name: "Español",
      short: "ES",
    },

    {
      code: "pt",
      name: "Português",
      short: "PT",
    },
  ];

  const changeLanguage = async (code) => {
    await i18n.changeLanguage(code);

    localStorage.setItem(
        "listoqasa_language",
        code
    );

    document.documentElement.lang = code;
    };

  const handleMenuButtonClick = () => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 900px)").matches
    ) {
      setMobileOpen(true);
    }
  };

  return (
    <>
      <header
        className={`lq-header ${
          isDark
            ? "lq-header-dark"
            : "lq-header-light"
        }`}
      >
        <div className="lq-header-inner">
          <Link
            to="/"
            className="lq-logo"
          >
            <span className="lq-logo-mark">
              <span className="lq-logo-roof" />

              <span className="lq-logo-box">
                <span>LQ</span>
              </span>
            </span>

            <span className="lq-logo-text">
              ListoQasa
            </span>
          </Link>

          <nav className="lq-main-nav">
            <div
              className={`lq-list-property-nav ${
                listPropertyOpen ? "is-open" : ""
              }`}
              onMouseEnter={() => setListPropertyOpen(true)}
              onMouseLeave={() => setListPropertyOpen(false)}
            >
              <button
                type="button"
                className="lq-nav-link lq-list-property-trigger"
                onClick={() => setListPropertyOpen((value) => !value)}
                aria-expanded={listPropertyOpen}
              >
                {t("header.listProperty")}
                <ChevronDown size={15} strokeWidth={2} />
              </button>

              <div className="lq-list-property-dropdown">
                {listPropertyItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="lq-list-property-item"
                      onClick={() => setListPropertyOpen(false)}
                    >
                      <span className="lq-list-property-icon">
                        <Icon size={18} strokeWidth={1.9} />
                      </span>

                      <span className="lq-list-property-copy">
                        <strong>{item.label}</strong>
                        <small>{item.description}</small>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `lq-nav-link ${isActive ? "active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="lq-header-actions">
            <Link
              to="/find-agent"
              className="lq-header-action-link"
            >
              {t("header.findAgent")}
            </Link>

            <Link
              to="/ai-help"
              className="lq-header-action-link lq-ai-help"
            >
              <span>
                {t("header.aiCrm")}
              </span>

              <Bot
                size={18}
                strokeWidth={1.8}
              />
            </Link>

            {/* LANGUAGE */}
            <div className="lq-language">
              <button
                type="button"
                className="lq-language-trigger"
                aria-label="Change language"
              >
                <Globe2
                  size={22}
                  strokeWidth={1.8}
                />
              </button>

              <div className="lq-language-dropdown">
                {languages.map(
                  (language) => (
                    <button
                      key={language.code}
                      type="button"
                      className={`lq-language-option ${
                        currentLanguage ===
                        language.code
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        changeLanguage(
                          language.code
                        )
                      }
                    >
                      <span>
                        {language.name}
                      </span>

                      <span className="lq-language-short">
                        {language.short}
                      </span>

                      {currentLanguage ===
                        language.code && (
                        <Check
                          size={14}
                          className="lq-language-check"
                        />
                      )}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="lq-account-menu">
              <button
                type="button"
                className="lq-menu-button"
                onClick={handleMenuButtonClick}
                aria-label="Account menu"
              >
                <Menu
                  size={24}
                  strokeWidth={2.2}
                />
              </button>

              <div className="lq-account-dropdown">
                <div className="lq-account-dropdown-section">
                  <span className="lq-account-dropdown-eyebrow">
                    {t("header.accountMenu.marketplace", {
                      defaultValue: "MARKETPLACE",
                    })}
                  </span>

                  <Link
                    to="/sign-in"
                    className="lq-account-dropdown-link"
                  >
                    {t("header.accountMenu.marketplaceSignIn", {
                      defaultValue: "Marketplace Sign In",
                    })}
                  </Link>
                </div>

                <div className="lq-account-dropdown-divider" />

                <div className="lq-account-dropdown-section">
                  <span className="lq-account-dropdown-eyebrow">
                    {t("header.accountMenu.aiCrm", {
                      defaultValue: "AI CRM",
                    })}
                  </span>

                  <a
                    href="https://www.cortexaaicrm.com/sign-in"
                    className="lq-account-dropdown-link"
                  >
                    {t("header.accountMenu.crmSignIn", {
                      defaultValue: "CRM Sign In",
                    })}
                  </a>

                  <a
                    href="https://www.cortexaaicrm.com/sign-up"
                    className="lq-account-dropdown-cta"
                  >
                    {t("header.accountMenu.createCrm", {
                      defaultValue: "Create CRM Account",
                    })}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div
        className={`lq-mobile-menu-overlay ${
          mobileOpen
            ? "is-open"
            : ""
        }`}
        onClick={() =>
          setMobileOpen(false)
        }
      />

      <aside
        className={`lq-mobile-menu ${
          mobileOpen
            ? "is-open"
            : ""
        }`}
      >
        <div className="lq-mobile-menu-header">
          <Link
            to="/"
            className="lq-logo lq-logo-mobile"
            onClick={() =>
              setMobileOpen(false)
            }
          >
            <span className="lq-logo-mark">
              <span className="lq-logo-roof" />

              <span className="lq-logo-box">
                <span>LQ</span>
              </span>
            </span>

            <span className="lq-logo-text">
              ListoQasa
            </span>
          </Link>

          <button
            type="button"
            className="lq-mobile-close"
            onClick={() =>
              setMobileOpen(false)
            }
          >
            <X size={24} />
          </button>
        </div>

        <nav className="lq-mobile-nav">
          <div className="lq-mobile-list-property">
            <span className="lq-mobile-list-property-title">
              {t("header.listProperty")}
            </span>

            {listPropertyItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="lq-mobile-list-property-item"
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon size={17} />
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </span>
                </Link>
              );
            })}
          </div>

          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() =>
                setMobileOpen(false)
              }
            >
              {item.label}
            </Link>
          ))}

          <Link
            to="/find-agent"
            onClick={() =>
              setMobileOpen(false)
            }
          >
            {t("header.findAgent")}
          </Link>

          <Link
            to="/ai-help"
            onClick={() =>
              setMobileOpen(false)
            }
          >
            {t("header.aiCrm")}
          </Link>
        </nav>

        <div className="lq-mobile-language">
          {languages.map(
            (language) => (
              <button
                key={language.code}
                type="button"
                className={
                  currentLanguage ===
                  language.code
                    ? "active"
                    : ""
                }
                onClick={() =>
                  changeLanguage(
                    language.code
                  )
                }
              >
                {language.name}

                <span>
                  {language.short}
                </span>
              </button>
            )
          )}
        </div>
      </aside>
    </>
  );
}