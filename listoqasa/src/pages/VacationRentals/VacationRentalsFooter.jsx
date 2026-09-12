import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function VacationRentalsFooter() {
  const { t, i18n } = useTranslation();

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

  return (
    <footer className="lq-vacation-footer">
      <div className="lq-vacation-footer-inner">
        <div className="lq-vacation-footer-grid">
          <div className="lq-vacation-footer-brand">
            <Link
              to="/vacation-rentals"
              className="lq-vacation-footer-logo"
            >
              Listo Qasa
            </Link>

            <p>
              {t("vacationFooter.description", {
                defaultValue:
                  "Discover and book vacation stays across Latin America. Beachfront, city, nature, and luxury — all in one place.",
              })}
            </p>
          </div>

          <div className="lq-vacation-footer-column">
            <h3>{t("vacationFooter.explore.title", { defaultValue: "Explore" })}</h3>
            <Link to="/vacation-rentals?collection=beachfront">
              {t("vacationFooter.explore.beachfront", { defaultValue: "Beachfront stays" })}
            </Link>
            <Link to="/vacation-rentals?collection=city">
              {t("vacationFooter.explore.city", { defaultValue: "City stays" })}
            </Link>
            <Link to="/vacation-rentals?collection=luxury">
              {t("vacationFooter.explore.luxury", { defaultValue: "Luxury homes" })}
            </Link>
            <Link to="/vacation-rentals?collection=weekend">
              {t("vacationFooter.explore.weekend", { defaultValue: "Weekend getaways" })}
            </Link>
            <Link to="/vacation-rentals?collection=trending">
              {t("vacationFooter.explore.trending", { defaultValue: "Trending destinations" })}
            </Link>
          </div>

          <div className="lq-vacation-footer-column">
            <h3>{t("vacationFooter.hosting.title", { defaultValue: "Hosting" })}</h3>
            <Link to="/owners">
              {t("vacationFooter.hosting.listProperty", { defaultValue: "List your property" })}
            </Link>
            <Link to="/owners">
              {t("vacationFooter.hosting.whyHost", { defaultValue: "Why host with us" })}
            </Link>
            <Link to="/vacation-rental-plans">
              {t("vacationFooter.hosting.plans", { defaultValue: "Vacation rental plans" })}
            </Link>
            <Link to="/owners">
              {t("vacationFooter.hosting.earnMore", { defaultValue: "Earn more with direct bookings" })}
            </Link>
          </div>

          <div className="lq-vacation-footer-column">
            <h3>{t("vacationFooter.support.title", { defaultValue: "Support" })}</h3>
            <Link to="/help">
              {t("vacationFooter.support.help", { defaultValue: "Help center" })}
            </Link>
            <Link to="/contact">
              {t("vacationFooter.support.contact", { defaultValue: "Contact support" })}
            </Link>
            <Link to="/cancellation-policy">
              {t("vacationFooter.support.cancellation", { defaultValue: "Cancellation options" })}
            </Link>
            <Link to="/safety">
              {t("vacationFooter.support.safety", { defaultValue: "Safety information" })}
            </Link>
          </div>

          <div className="lq-vacation-footer-column">
            <h3>{t("vacationFooter.legal.title", { defaultValue: "Legal" })}</h3>
            <Link to="/terms">
              {t("vacationFooter.legal.terms", { defaultValue: "Terms & Conditions" })}
            </Link>
            <Link to="/privacy">
              {t("vacationFooter.legal.privacy", { defaultValue: "Privacy Policy" })}
            </Link>
            <Link to="/refund-policy">
              {t("vacationFooter.legal.refund", { defaultValue: "Refund Policy" })}
            </Link>
            <Link to="/cookies">
              {t("vacationFooter.legal.cookies", { defaultValue: "Cookies Policy" })}
            </Link>
          </div>
        </div>

        <div className="lq-vacation-footer-bottom">
          <span>
            © 2026 Listo Qasa —{" "}
            {t("vacationFooter.rights", {
              defaultValue: "All rights reserved",
            })}
          </span>

          <div className="lq-vacation-footer-languages" aria-label="Languages">
            {["en", "es", "pt"].map((language) => (
              <button
                key={language}
                type="button"
                className={currentLanguage === language ? "active" : ""}
                onClick={() => changeLanguage(language)}
              >
                {language.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
