import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const groups = [
  { title: "Explore", links: [["Beachfront Stays", "/vacation-rentals?collection=beachfront"], ["City Stays", "/vacation-rentals?collection=city"], ["Luxury Stays", "/vacation-rentals?collection=luxury"], ["Weekend Getaways", "/vacation-rentals?collection=weekend"]] },
  { title: "Hosting", links: [["List Your Property", "/owners"], ["Why Host With Us", "/owners"], ["Vacation Rental Plans", "/vacation-rental-plans"]] },
  { title: "Support", links: [["Help Center", "/help"], ["Contact Support", "/contact"], ["Cancellation Options", "/cancellation-policy"], ["Safety Information", "/safety"]] },
  { title: "Legal", links: [["Terms and Conditions", "/terms"], ["Privacy Policy", "/privacy"], ["Refund Policy", "/refund-policy"], ["Cookies Policy", "/cookies"]] },
];

export default function VacationRentalsFooter() {
  const { i18n } = useTranslation();
  const currentLanguage = (i18n.resolvedLanguage || i18n.language || "en").split("-")[0].toLowerCase();
  const changeLanguage = async (language) => {
    await i18n.changeLanguage(language);
    localStorage.setItem("listoqasa_language", language);
    document.documentElement.lang = language;
    const url = new URL(window.location.href);
    url.searchParams.set("lang", language);
    window.history.replaceState({}, "", url);
  };
  return (
    <footer className="lq-vacation-footer lq-vacation-footer-reference">
      <div className="lq-vacation-footer-inner">
        <div className="lq-vacation-footer-grid">
          <div className="lq-vacation-footer-brand">
            <Link to="/" className="lq-vacation-footer-logo" aria-label="Go to ListoQasa marketplace">
              <span className="lq-vacation-footer-mark">LQ</span>
              <span>Listo<span className="lq-vacation-footer-blue">Qasa</span></span>
            </Link>
            <p>Discover and book vacation stays across Latin America.</p>
          </div>
          {groups.map(({ title, links }) => (
            <div className="lq-vacation-footer-column" key={title}>
              <h3>{title}</h3>
              {links.map(([label, path]) => <Link key={label} to={path}>{label}</Link>)}
            </div>
          ))}
        </div>
        <div className="lq-vacation-footer-bottom">
          <span>© 2026 ListoQasa. All rights reserved.</span>
          <div className="lq-vacation-footer-languages" aria-label="Languages">
            {["en", "es", "pt"].map(language => <button key={language} type="button" className={currentLanguage === language ? "active" : ""} onClick={() => changeLanguage(language)}>{language.toUpperCase()}</button>)}
          </div>
        </div>
      </div>
    </footer>
  );
}
