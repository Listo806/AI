import React from "react";
import Header from "./Header";
import Footer from "./Footer";

export default function SiteLayout({
  children,
  headerVariant = "light",
  showHeader = true,
  showFooter = true,
}) {
  return (
    <div className="lq-site">
      {showHeader && <Header variant={headerVariant} />}

      <main>{children}</main>
 
      {showFooter && <Footer />}
    </div>
  );
}