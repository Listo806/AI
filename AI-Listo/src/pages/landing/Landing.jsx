import { useState } from "react";
import "./Landing.css";

import logoImg from "../../assets/cortexa/logo.png";
import heroImg from "../../assets/cortexa/Cortexa Hero 1.png";
import sec2Img from "../../assets/cortexa/Cortexa sec 2.png";
import sec3Img from "../../assets/cortexa/Cortexa sec 3.png";
import sec4Img from "../../assets/cortexa/Cortexa sec 4.png";
import bottomImg from "../../assets/cortexa/Cortexa sec bottom.png";
import footerImg from "../../assets/cortexa/Cortexa sec footer.png";


export default function Landing() {
  const [activeFaq, setActiveFaq] = useState(0);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;

    const header = document.querySelector(".cx-header");
    const headerHeight = header ? header.offsetHeight : 80;

    const y =
      el.getBoundingClientRect().top +
      window.pageYOffset -
      headerHeight;

    window.scrollTo({ top: y, behavior: "smooth" });
  };


  return (
    <div id="cortexa-ai-crm-landing">
      <header className="cx-header">
        <div className="cx-header-inner">

          <div className="cx-left">
            <img src={logoImg} alt="Cortexa" className="cx-logo-img" />
          </div>

          <nav className="cx-nav">
            <button onClick={() => scrollTo("features")}>Features</button>
            <button onClick={() => scrollTo("ai-setter")}>AI</button>
            <button onClick={() => scrollTo("whatsapp")}>Integrations</button>
            <button onClick={() => scrollTo("pricing")}>Pricing</button>
            <button onClick={() => scrollTo("trial")}>Resources</button>
          </nav>

          <div className="cx-actions">
            <a href="/sign-in" className="cx-login">Log in</a>
            <a href="#trial" className="cx-btn cx-btn-primary small">
              Start Free Trial
            </a>
          </div>

        </div>
      </header>  
      <div className="cx-wrap-full">

        {/* ================= HERO ================= */}
        <section id="features" className="cx-hero">
            <img src={heroImg} alt="" />
        </section>
        <section id="ai-setter" className="cx-hero">
            <img src={sec2Img} alt="" />
        </section>
        <section id="whatsapp" className="cx-hero">
            <img src={sec3Img} alt="" />
        </section>
        <section id="pricing" className="cx-hero">
            <img src={sec4Img} alt="" />
        </section>
        <section id="trial" className="cx-hero">
            <img src={bottomImg} alt="" />
        </section>
        <section id="footer" className="cx-hero">
            <img src={footerImg} alt="" />
        </section>
      </div>
     
    </div>
  );
}