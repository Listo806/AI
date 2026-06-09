import React, { useState, useEffect } from "react";
import { MapPin } from "lucide-react";

export default function ExploreOurMarkets() {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth < 1024;

  const latinAmericaCountries = [
    {
      country: "Brazil",
      flagCode: "br",
      cities: ["São Paulo", "Rio de Janeiro", "Brasília", "Belo Horizonte", "Salvador"],
    },
    {
      country: "Mexico",
      flagCode: "mx",
      cities: ["Mexico City", "Guadalajara", "Monterrey", "Puebla", "Tijuana"],
    },
    {
      country: "Argentina",
      flagCode: "ar",
      cities: ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata"],
    },
    {
      country: "Chile",
      flagCode: "cl",
      cities: ["Santiago", "Valparaíso", "Concepción", "La Serena", "Antofagasta"],
    },
    {
      country: "Colombia",
      flagCode: "co",
      cities: ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena"],
    },
    {
      country: "Peru",
      flagCode: "pe",
      cities: ["Lima", "Arequipa", "Trujillo", "Cusco", "Piura"],
    },
    {
      country: "Ecuador",
      flagCode: "ec",
      cities: ["Quito", "Guayaquil", "Cuenca", "Manta", "Ambato"],
    },
  ];

  const europeUsCountries = [
    {
      country: "United Kingdom",
      flagCode: "gb",
      cities: ["London", "Manchester", "Birmingham", "Liverpool", "Leeds"],
    },
    {
      country: "Spain",
      flagCode: "es",
      cities: ["Madrid", "Barcelona", "Valencia", "Sevilla", "Málaga"],
    },
    {
      country: "Portugal",
      flagCode: "pt",
      cities: ["Lisbon", "Porto", "Braga", "Faro", "Coimbra"],
    },
    {
      country: "United States",
      flagCode: "us",
      isUS: true, 
      col1: ["New York City", "Boston", "Miami", "Orlando", "Los Angeles"],
      col2: ["San Francisco", "San Diego", "Chicago", "Dallas", "Houston", "Austin"],
    },
  ];

  const renderCityLinks = (cities, countrySlug) => (
    <div style={styles.cityList}>
      {cities.map((cityName) => (
        <a
          key={cityName}
          href={`/${countrySlug}/${cityName.toLowerCase().replace(/ /g, "-")}`}
          style={styles.cityLink}
        >
          <MapPin size={15} style={styles.pinIcon} />
          <span style={styles.cityName}>{cityName}</span>
        </a>
      ))}
    </div>
  );

  return (
    <div style={styles.container}>
      <h1 style={styles.mainTitle}>Explore Our Markets</h1>

      {/* --- SECTION 1: LATIN AMERICA --- */}
      <div style={styles.regionSection}>
        <h2 style={styles.regionTitle}>Latin America</h2>
        <div style={{ 
          ...styles.gridContainer, 
          gridTemplateColumns: isMobile ? "repeat(1, 1fr)" : isTablet ? "repeat(3, 1fr)" : "repeat(7, 1fr)" 
        }}>
          {latinAmericaCountries.map((item, index) => {
            const isLast = index === latinAmericaCountries.length - 1;
            return (
              <div 
                key={item.country} 
                style={{ 
                  ...styles.countryColumn, 
                  borderRight: !isLast && !isTablet && !isMobile ? "1px solid #E2E8F0" : "none" 
                }}
              >
                <div style={styles.countryHeader}>
                  <img src={`https://flagcdn.com/w40/${item.flagCode}.png`} alt="" style={styles.flagImg} />
                  <span style={styles.countryName}>{item.country}</span>
                </div>
                {renderCityLinks(item.cities, item.country.toLowerCase())}
              </div>
            );
          })}
        </div>
      </div>

      {/* --- SECTION 2: EUROPE & UNITED STATES --- */}
      <div style={styles.regionSection}>
        <h2 style={styles.regionTitle}>Europe & United States</h2>
        <div style={{ 
          ...styles.gridContainer, 
          gridTemplateColumns: isMobile ? "repeat(1, 1fr)" : isTablet ? "repeat(2, 1fr)" : "1fr 1fr 1fr 2fr"
        }}>
          {europeUsCountries.map((item, index) => {
            const isLast = index === europeUsCountries.length - 1;
            
            return (
              <div 
                key={item.country} 
                style={{ 
                  ...styles.countryColumn, 
                  borderRight: !isLast && !isTablet && !isMobile ? "1px solid #E2E8F0" : "none" 
                }}
              >
                <div style={styles.countryHeader}>
                  <img src={`https://flagcdn.com/w40/${item.flagCode}.png`} alt="" style={styles.flagImg} />
                  <span style={styles.countryName}>{item.country}</span>
                </div>

                {item.isUS ? (
                  <div style={styles.usColumnsWrapper}>
                    {renderCityLinks(item.col1, "united-states")}
                    {renderCityLinks(item.col2, "united-states")}
                  </div>
                ) : (
                  renderCityLinks(item.cities, item.country.toLowerCase().replace(/ /g, "-"))
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "20px 40px",
    maxWidth: "1360px",
    margin: "0 auto",
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    backgroundColor: "#ffffff",
  },

  mainTitle: {
    fontSize: "44px",
    fontWeight: "700",
    color: "#08142B",
    textAlign: "center",
    marginBottom: "60px",
    letterSpacing: "-1px",
  },

  regionSection: {
    marginBottom: "55px",
  },

  regionTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#08142B",
    marginBottom: "35px",
  },

  gridContainer: {
    display: "grid",
    gap: "30px 0px", 
    alignItems: "start",
  },

  countryColumn: {
    padding: "0 15px 0 20px", 
  },

  countryHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "22px",
  },

  flagImg: {
    width: "24px",
    height: "16px",
    objectFit: "cover",
    borderRadius: "2px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
  },

  countryName: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#08142B",
  },

  cityList: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    flex: 1,
  },

  usColumnsWrapper: {
    display: "flex",
    gap: "30px", 
  },

  cityLink: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none",
    color: "#2D3748",
  },

  pinIcon: {
    color: "#A0AEC0", 
    flexShrink: 0,
  },

  cityName: {
    fontSize: "15px",
    fontWeight: "400",
    color: "#4A5568",
  },
};