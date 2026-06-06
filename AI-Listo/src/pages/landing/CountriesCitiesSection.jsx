import React, { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";

export default function CountriesCitiesSection() {
  
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 640;   
  const isTablet = windowWidth < 1024;   
  const isNotebook = windowWidth < 1280;  

  let gridColumns = "repeat(7, 1fr)";
  if (isMobile) gridColumns = "repeat(1, 1fr)";
  else if (isTablet) gridColumns = "repeat(3, 1fr)";
  else if (isNotebook) gridColumns = "repeat(4, 1fr)";

  const countries = [
    {
      country: "Brazil",
      flagCode: "br",
      cities: [
        { name: "São Paulo", href: "/brazil/sao-paulo" },
        { name: "Rio de Janeiro", href: "/brazil/rio-de-janeiro" },
        { name: "Brasília", href: "/brazil/brasilia" },
        { name: "Belo Horizonte", href: "/brazil/belo-horizonte" },
        { name: "Curitiba", href: "/brazil/curitiba" },
      ],
    },
    {
      country: "Mexico",
      flagCode: "mx",
      cities: [
        { name: "Mexico City", href: "/mexico/mexico-city" },
        { name: "Guadalajara", href: "/mexico/guadalajara" },
        { name: "Monterrey", href: "/mexico/monterrey" },
        { name: "Cancún", href: "/mexico/cancun" },
        { name: "Puebla", href: "/mexico/puebla" },
      ],
    },
    {
      country: "Colombia",
      flagCode: "co",
      cities: [
        { name: "Bogotá", href: "/colombia/bogota" },
        { name: "Medellín", href: "/colombia/medellin" },
        { name: "Cali", href: "/colombia/cali" },
        { name: "Cartagena", href: "/colombia/cartagena" },
        { name: "Barranquilla", href: "/colombia/barranquilla" },
      ],
    },
    {
      country: "Argentina",
      flagCode: "ar",
      cities: [
        { name: "Buenos Aires", href: "/argentina/buenos-aires" },
        { name: "Córdoba", href: "/argentina/cordoba" },
        { name: "Rosario", href: "/argentina/rosario" },
        { name: "Mendoza", href: "/argentina/mendoza" },
        { name: "La Plata", href: "/argentina/la-plata" },
      ],
    },
    {
      country: "Chile",
      flagCode: "cl",
      cities: [
        { name: "Santiago", href: "/chile/santiago" },
        { name: "Valparaíso", href: "/chile/valparaiso" },
        { name: "Concepción", href: "/chile/concepcion" },
        { name: "Viña del Mar", href: "/chile/vina-del-mar" },
        { name: "La Serena", href: "/chile/la-serena" },
      ],
    },
    {
      country: "Peru",
      flagCode: "pe",
      cities: [
        { name: "Lima", href: "/peru/lima" },
        { name: "Arequipa", href: "/peru/arequipa" },
        { name: "Trujillo", href: "/peru/trujillo" },
        { name: "Cusco", href: "/peru/cusco" },
        { name: "Piura", href: "/peru/piura" },
      ],
    },
    {
      country: "Ecuador",
      flagCode: "ec",
      cities: [
        { name: "Quito", href: "/ecuador/quito" },
        { name: "Guayaquil", href: "/ecuador/guayaquil" },
        { name: "Cuenca", href: "/ecuador/cuenca" },
        { name: "Manta", href: "/ecuador/manta" },
        { name: "Samborondón", href: "/ecuador/samborondon" },
      ],
    },
  ];

  return (
    <div style={styles.inner}>
      <h2 style={styles.title}>BROWSE CITIES</h2>

      <div style={{ ...styles.grid, gridTemplateColumns: gridColumns }}>
        {countries.map((item, index) => {
          const hideBorder = isTablet || index === countries.length - 1;

          return (
            <div
              key={item.country}
              style={{
                ...styles.countryColumn,
                borderRight: hideBorder ? "none" : "1px solid #DDE3EF",
                borderBottom: isTablet ? "1px solid #DDE3EF" : "none", 
              }}
            >
              <div style={styles.countryHeader}>
                <img
                  src={`https://flagcdn.com/w40/${item.flagCode}.png`}
                  alt={`${item.country} flag`}
                  style={styles.flagImg}
                />
                <h3 style={styles.countryName}>{item.country}</h3>
              </div>

              <div style={styles.cityList}>
                {item.cities.map((city) => (
                  <a key={city.name} href={city.href} style={styles.cityLink}>
                    <span>{city.name}</span>
                    <ChevronRight size={18} strokeWidth={2} />
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  inner: {
    padding: "40px 20px",
    maxWidth: "100%",
    overflowX: "hidden",
  },

  title: {
    margin: "0 0 36px",
    fontSize: "20px",
    lineHeight: 1,
    fontWeight: 800,
    letterSpacing: "-0.3px",
    color: "#08142B",
  },

  grid: {
    display: "grid",
    gap: "30px 0px",
    alignItems: "start",
  },

  countryColumn: {
    padding: "10px 20px 25px 20px",
  },

  countryHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "24px",
  },

  flagImg: {
    width: "24px",
    height: "24px",
    objectFit: "cover",
    borderRadius: "50%",
    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
  },

  countryName: {
    margin: 0,
    fontSize: "15px",
    lineHeight: 1,
    fontWeight: 600,
    letterSpacing: "-0.7px",
    color: "#08142B",
  },

  cityList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  cityLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    color: "#0052E8",
    textDecoration: "none",
    fontSize: "15px",
    lineHeight: 1,
    fontWeight: 500,
    letterSpacing: "-0.5px",
  },
};