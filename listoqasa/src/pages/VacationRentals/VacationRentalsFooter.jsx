import WebAppBadge from "../../components/layout/WebAppBadge";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const groups = [
  { title: "Explore", links: [["Beachfront Stays", "/vacation-rentals?collection=beachfront"], ["City Stays", "/vacation-rentals?collection=city"], ["Luxury Stays", "/vacation-rentals?collection=luxury"], ["Weekend Getaways", "/vacation-rentals?collection=weekend"]] },
  { title: "Hosting", links: [["List Your Property", "/vacation-rental-plans"], ["Why Host With Us", "/vacation-rentals/host"]] },
  { title: "Support", links: [["Help Center", "/help"], ["Contact Us", "/contact"]] },
  { title: "Legal", links: [["Terms and Conditions", "/terms"], ["Privacy Policy", "/privacy"], ["Cancellation and Refund Policy", "/cancellation-policy"]] },
];

const footerTranslations = {
  es: { "Hosting": "Anfitriones", "Support": "Soporte", "Legal": "Legal", "List Your Property": "Publica tu propiedad", "Why Host With Us": "Por qué alojar con nosotros", "Help Center": "Centro de ayuda", "Contact Us": "Contáctanos", "Terms and Conditions": "Términos y condiciones", "Privacy Policy": "Política de privacidad", "Cancellation and Refund Policy": "Política de cancelación y reembolso" },
  pt: { "Hosting": "Anfitriões", "Support": "Suporte", "Legal": "Legal", "List Your Property": "Anuncie seu imóvel", "Why Host With Us": "Por que hospedar conosco", "Help Center": "Central de ajuda", "Contact Us": "Fale conosco", "Terms and Conditions": "Termos e condições", "Privacy Policy": "Política de privacidade", "Cancellation and Refund Policy": "Política de cancelamento e reembolso" },
};

export default function VacationRentalsFooter() {
  const { i18n } = useTranslation();
  const currentLanguage = (i18n.resolvedLanguage || i18n.language || "en").split("-")[0].toLowerCase();
  const footerLabel = (label) => footerTranslations[currentLanguage]?.[label] || label;
  const changeLanguage = async (language) => {
    await i18n.changeLanguage(language);
    localStorage.setItem("listoqasa_language", language);
    document.documentElement.lang = language;
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
              <nav className="lq-vacation-footer-desktop-links" aria-label={footerLabel(title)}><h3>{footerLabel(title)}</h3>{links.map(([label, path]) => <Link key={label} to={path} onClick={() => window.scrollTo(0, 0)}>{footerLabel(label)}</Link>)}</nav>
              <details className="lq-footer-accordion lq-vacation-footer-mobile-links">
                <summary><h3>{footerLabel(title)}</h3><span className="lq-footer-chevron" aria-hidden="true" /></summary>
                <div className="lq-footer-accordion-links">{links.map(([label, path]) => <Link key={label} to={path} onClick={() => window.scrollTo(0, 0)}>{footerLabel(label)}</Link>)}</div>
              </details>
            </div>
          ))}
        </div>
        <WebAppBadge vacation />
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
