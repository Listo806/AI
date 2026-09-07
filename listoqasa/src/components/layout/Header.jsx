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
} from "lucide-react";

import { useTranslation } from "react-i18next";

export default function Header({
  variant = "light",
}) {
  const { t, i18n } = useTranslation();
  const currentLanguage =
  (
    i18n.resolvedLanguage ||
    currentLanguage ||
    "en"
  )
    .split("-")[0]
    .toLowerCase();
  const [mobileOpen, setMobileOpen] =
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
      label: t("header.vacationRentals"),
      to: "/vacation-rentals",
    },
    {
      label: t("header.sell"),
      to: "/owners",
    },
    {
      label: t("header.land"),
      to: "/land",
    },
    {
      label: t("header.agents"),
      to: "/agents",
    },
    {
      label: t("header.developers"),
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
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `lq-nav-link ${
                    isActive ? "active" : ""
                  }`
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
                {t("header.aiHelp")}
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

            <button
              type="button"
              className="lq-menu-button"
              onClick={() =>
                setMobileOpen(true)
              }
              aria-label="Open menu"
            >
              <Menu
                size={24}
                strokeWidth={2.2}
              />
            </button>
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
            {t("header.aiHelp")}
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