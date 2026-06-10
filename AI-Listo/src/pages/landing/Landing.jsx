import { useEffect, useState } from "react";
import LandingDesktop from "./LandingDesktop";
import LandingMobile from "./LandingMobile";

export default function Landing() {
  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= 1024
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return isMobile
    ? <LandingMobile />
    : <LandingDesktop />;
}