import React from "react";
import { Link } from "react-router-dom";

const groups = [
  { title: "Explore", links: [["Buy", "/buy"], ["Rent", "/rent"], ["Vacation Rentals", "/vacation-rentals"], ["Land", "/land"], ["Commercial", "/commercial"], ["New Projects", "/new-projects"]] },
  { title: "For Professionals", links: [["List a Property", "/create-listing"], ["Join as an Agent", "/agents"]] },
  { title: "Company", links: [["About Us", "/about"]] },
  { title: "Support", links: [["Help Center", "/help"], ["Contact Us", "/contact"]] },
  { title: "Legal", links: [["Terms and Conditions", "/terms"], ["Privacy Policy", "/privacy"], ["Cancellation and Refund Policy", "/cancellation-policy"]] },
];

export default function Footer() {
  return (
    <footer className="lq-footer lq-footer-reference">
      <div className="lq-footer-inner">
        <div className="lq-footer-top">
          <div className="lq-footer-brand-column">
            <Link to="/" className="lq-footer-reference-logo" aria-label="ListoQasa marketplace home">
              <span className="lq-footer-reference-mark">LQ</span>
              <span>Listo<span className="lq-footer-reference-blue">Qasa</span></span>
            </Link>
            <p className="lq-footer-description">Find your next place with confidence.</p>
          </div>
          {groups.map(({ title, links }) => (
            <div className="lq-footer-column" key={title}>
              <h4>{title}</h4>
              {links.map(([label, path]) => <Link key={label} to={path}>{label}</Link>)}
            </div>
          ))}
        </div>
        <div className="lq-footer-bottom">© 2026 ListoQasa. All rights reserved.</div>
      </div>
    </footer>
  );
}
