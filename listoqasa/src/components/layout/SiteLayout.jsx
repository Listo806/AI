import React from "react";
import Header from "./Header";
import Footer from "./Footer";

export default function SiteLayout({
  children,
  headerVariant = "light",
  showFooter = true,
}) {
  return (
    <div className="lq-site">
      <Header variant={headerVariant} />

      <main>{children}</main>
 
      <Footer />
    </div>
  );
}