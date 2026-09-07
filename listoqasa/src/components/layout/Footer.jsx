import React from "react";

import { Link } from "react-router-dom";

import {
  MessageSquareMore,
  Camera,
  SquarePlay,
  Link2,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="lq-footer">
      <div className="lq-footer-inner">
        <div className="lq-footer-top">
          {/* BRAND */}
          <div className="lq-footer-brand-column">
            <Link to="/" className="lq-logo lq-footer-logo">
              <span className="lq-logo-mark">
                <span className="lq-logo-roof" />

                <span className="lq-logo-box">
                  <span>LQ</span>
                </span>
              </span>

              <span className="lq-logo-text">ListoQasa</span>
            </Link>

            <p className="lq-footer-description">{t("footer.description")}</p>

            <div className="lq-socials">
              <a href="#" aria-label="Facebook">
                <MessageSquareMore size={18} />
              </a>

              <a href="#" aria-label="Instagram">
                <Camera size={18} />
              </a>

              <a href="#" aria-label="YouTube">
                <SquarePlay size={18} />
              </a>

              <a href="#" aria-label="LinkedIn">
                <Link2 size={18} />
              </a>
            </div>
          </div>

          {/* BUY */}
          <div className="lq-footer-column">
            <h4>{t("footer.buy")}</h4>

            <Link to="/buy">{t("footer.homesForSale")}</Link>

            <Link to="/buy?category=luxury">{t("footer.luxuryHomes")}</Link>

            <Link to="/buy?category=apartments">{t("footer.apartments")}</Link>

            <Link to="/land">{t("footer.landLots")}</Link>

            <Link to="/new-projects">{t("footer.newProjects")}</Link>
          </div>

          {/* RENT */}
          <div className="lq-footer-column">
            <h4>{t("footer.rent")}</h4>

            <Link to="/rent">{t("footer.homesForRent")}</Link>

            <Link to="/rent?category=apartments">{t("footer.apartments")}</Link>

            <Link to="/vacation-rentals">{t("footer.vacationRentals")}</Link>

            <Link to="/rent?type=short-term">
              {t("footer.shortTermRentals")}
            </Link>
          </div>

          {/* TYPES */}
          <div className="lq-footer-column">
            <h4>{t("footer.propertyTypes")}</h4>

            <Link to="/buy?type=house">{t("footer.houses")}</Link>

            <Link to="/land">{t("footer.land")}</Link>

            <Link to="/commercial">{t("footer.commercial")}</Link>

            <Link to="/developments">{t("footer.developments")}</Link>
          </div>

          {/* COMPANY */}
          <div className="lq-footer-column">
            <h4>{t("footer.company")}</h4>

            <Link to="/about">{t("footer.aboutUs")}</Link>

            <Link to="/careers">{t("footer.careers")}</Link>

            <Link to="/contact">{t("footer.contactUs")}</Link>

            <Link to="/blog">{t("footer.blog")}</Link>
          </div>

          {/* SUPPORT */}
          <div className="lq-footer-column">
            <h4>{t("footer.support")}</h4>

            <Link to="/help">{t("footer.helpCenter")}</Link>

            <Link to="/terms">{t("footer.termsOfUse")}</Link>

            <Link to="/privacy">{t("footer.privacyPolicy")}</Link>

            <Link to="/sitemap">{t("footer.sitemap")}</Link>
          </div>

          {/* CONTACT */}
          <div className="lq-footer-column lq-footer-contact">
            <h4>{t("footer.stayConnected")}</h4>

            <a href="tel:+593981234567">
              <Phone size={17} />

              <span>+593 98 123 4567</span>
            </a>

            <a href="mailto:info@listoqasa.com">
              <Mail size={17} />

              <span>info@listoqasa.com</span>
            </a>

            <div>
              <MapPin size={17} />

              <span>Quito, Ecuador</span>
            </div>
          </div>
        </div>

        <div className="lq-footer-bottom">{t("footer.copyright")}</div>
      </div>
    </footer>
  );
}
