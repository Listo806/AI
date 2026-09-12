import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Globe2, Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function VacationRentalsHeader() {
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const currentLanguage = (
    i18n.resolvedLanguage ||
    i18n.language ||
    "en"
  )
    .split("-")[0]
    .toLowerCase();

  const changeLanguage = async (language) => {
    await i18n.changeLanguage(language);

    localStorage.setItem(
      "listoqasa_language",
      language
    );

    document.documentElement.lang = language;

    const url = new URL(window.location.href);
    url.searchParams.set("lang", language);
    window.history.replaceState({}, "", url);
  };

  useEffect(() => {
    const onDocumentClick = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      onDocumentClick
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        onDocumentClick
      );
  }, []);

  return (
    <header className="lq-vacation-header">
      <div className="lq-vacation-header-inner">
        <Link
          to="/vacation-rentals"
          className="lq-vacation-header-brand"
        >
          ListoStays
        </Link>

        <nav className="lq-vacation-header-actions">
          <Link
            to="/vacation-rental-plans"
            className="lq-vacation-header-list-property"
          >
            {t("vacationHeader.listProperty", {
              defaultValue: "List Property",
            })}
          </Link>

          <div className="lq-vacation-language">
            <button
              type="button"
              className="lq-vacation-icon-button"
              aria-label={t(
                "vacationHeader.language",
                {
                  defaultValue:
                    "Change language",
                }
              )}
            >
              <Globe2 size={22} />
            </button>

            <div className="lq-vacation-language-menu">
              {[
                ["en", "English", "EN"],
                ["es", "Español", "ES"],
                ["pt", "Português", "PT"],
              ].map(
                ([code, name, short]) => (
                  <button
                    key={code}
                    type="button"
                    className={
                      currentLanguage === code
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      changeLanguage(code)
                    }
                  >
                    <span>{name}</span>
                    <strong>{short}</strong>
                  </button>
                )
              )}
            </div>
          </div>

          <div
            className="lq-vacation-menu-wrap"
            ref={menuRef}
          >
            <button
              type="button"
              className="lq-vacation-menu-button"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() =>
                setMenuOpen((value) => !value)
              }
            >
              {menuOpen ? (
                <X size={25} />
              ) : (
                <Menu size={27} />
              )}
            </button>

            {menuOpen && (
              <div className="lq-vacation-menu-dropdown">
                <Link
                  to="/"
                  onClick={() =>
                    setMenuOpen(false)
                  }
                >
                  {t(
                    "vacationHeader.home",
                    {
                      defaultValue: "Home",
                    }
                  )}
                </Link>

                <Link
                  to="/find-agent"
                  onClick={() =>
                    setMenuOpen(false)
                  }
                >
                  {t(
                    "vacationHeader.findAgent",
                    {
                      defaultValue:
                        "Find Agent",
                    }
                  )}
                </Link>

                <a
                  href="https://www.cortexaaicrm.com"
                  onClick={() =>
                    setMenuOpen(false)
                  }
                >
                  {t(
                    "vacationHeader.aiCrm",
                    {
                      defaultValue: "AI CRM",
                    }
                  )}
                </a>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
