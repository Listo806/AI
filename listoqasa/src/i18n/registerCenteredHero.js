import i18n from "./i18n";

const resources = {
  en: {
    home: {
      heroTabs: { buy: "Buy", rent: "Rent", vacationRentals: "Vacation Rentals" },
      searchButton: "Search",
      heroTagline: "Search smarter. Search faster."
    },
    vacationBrowse: {
      heroTabs: { buy: "Buy", rent: "Rent", vacationRentals: "Vacation Rentals" },
      heroTagline: "Search smarter. Search faster."
    }
  },
  es: {
    home: {
      heroTabs: { buy: "Comprar", rent: "Alquilar", vacationRentals: "Alquiler Vacacional" },
      searchButton: "Buscar",
      heroTagline: "Busca mejor. Encuentra más rápido."
    },
    vacationBrowse: {
      heroTabs: { buy: "Comprar", rent: "Alquilar", vacationRentals: "Alquiler Vacacional" },
      heroTagline: "Busca mejor. Encuentra más rápido."
    }
  },
  pt: {
    home: {
      heroTabs: { buy: "Comprar", rent: "Alugar", vacationRentals: "Aluguel por Temporada" },
      searchButton: "Buscar",
      heroTagline: "Busque melhor. Encontre mais rápido."
    },
    vacationBrowse: {
      heroTabs: { buy: "Comprar", rent: "Alugar", vacationRentals: "Aluguel por Temporada" },
      heroTagline: "Busque melhor. Encontre mais rápido."
    }
  }
};

Object.entries(resources).forEach(([language, resource]) => {
  i18n.addResourceBundle(language, "translation", resource, true, true);
});

export default resources;
