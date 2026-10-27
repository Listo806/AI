import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import "./SiteLayout.css";

export default function SiteLayout({
  children,
  headerVariant = "light",
  showHeader = true,
  showFooter = true,
  compactHeader = false,
  hideHeaderOnMobile = false,
  onHeaderBack,
}) {
  return (
    <div className={`lq-site${hideHeaderOnMobile ? " lq-site--hide-mobile-header" : ""}`}>
      {showHeader && <Header variant={headerVariant} compact={compactHeader} onBack={onHeaderBack} />}

      <main>{children}</main>
 
      {showFooter && <Footer />}
    </div>
  );
}