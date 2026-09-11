import i18n from "./i18n";

const resources = {
  en: {
    home: {
      heroBuyTitle: "Find Homes That Match You",
      heroRentTitle: "Find the Perfect Rental",
      heroTabs: {
        buy: "Buy",
        rent: "Rent",
        vacationRentals: "Vacation Rentals",
      },
      searchButton: "Search",
      heroTagline: "Search smarter. Search faster.",
    },
  },

  es: {
    home: {
      heroBuyTitle: "Encuentra casas que encajen contigo",
      heroRentTitle: "Encuentra el alquiler perfecto",
      heroTabs: {
        buy: "Comprar",
        rent: "Alquilar",
        vacationRentals: "Alquiler Vacacional",
      },
      searchButton: "Buscar",
      heroTagline: "Busca mejor. Encuentra más rápido.",
    },
  },

  pt: {
    home: {
      heroBuyTitle: "Encontre casas que combinam com você",
      heroRentTitle: "Encontre o aluguel perfeito",
      heroTabs: {
        buy: "Comprar",
        rent: "Alugar",
        vacationRentals: "Aluguel por Temporada",
      },
      searchButton: "Buscar",
      heroTagline: "Busque melhor. Encontre mais rápido.",
    },
  },
};

Object.entries(resources).forEach(([language, resource]) => {
  i18n.addResourceBundle(
    language,
    "translation",
    resource,
    true,
    true
  );
});

export default resources;
