import i18n from "./i18n";

const resources = {
  en: {
    header: {
      listProperty: "List Property",
      aiCrm: "AI CRM",
      listPropertyMenu: {
        rentals: "Rentals",
        rentalsDesc: "Residential · Commercial",
        vacationRentals: "Vacation Rentals",
        vacationRentalsDesc: "Furnished · Daily",
        owners: "Owners",
        ownersDesc: "List and manage your property",
        agents: "Agents",
        agentsDesc: "Upload listings and receive leads",
        developers: "Developers",
        developersDesc: "Projects · Multi-unit listings",
      },
    },
    vacationBrowse: {
      heroTitle: "Find the right place for every stay.",
      heroDescription:
        "Explore rentals across Ecuador, from city apartments to coastal and mountain homes.",
      heroSearchPlaceholder:
        "Search by city, neighborhood, or property",
      heroSearchButton: "Search",
    },
  },

  es: {
    header: {
      listProperty: "Publicar Propiedad",
      aiCrm: "AI CRM",
      listPropertyMenu: {
        rentals: "Alquileres",
        rentalsDesc: "Residencial · Comercial",
        vacationRentals: "Alquiler Vacacional",
        vacationRentalsDesc: "Amueblado · Diario",
        owners: "Propietarios",
        ownersDesc: "Publica y gestiona tu propiedad",
        agents: "Agentes",
        agentsDesc: "Sube propiedades y recibe leads",
        developers: "Desarrolladores",
        developersDesc: "Proyectos · Unidades múltiples",
      },
    },
    vacationBrowse: {
      heroTitle: "Encuentra el lugar ideal para cada estadía.",
      heroDescription:
        "Explora alquileres en Ecuador, desde apartamentos urbanos hasta casas de playa y montaña.",
      heroSearchPlaceholder:
        "Busca por ciudad, barrio o propiedad",
      heroSearchButton: "Buscar",
    },
  },

  pt: {
    header: {
      listProperty: "Anunciar Imóvel",
      aiCrm: "AI CRM",
      listPropertyMenu: {
        rentals: "Aluguéis",
        rentalsDesc: "Residencial · Comercial",
        vacationRentals: "Aluguel por Temporada",
        vacationRentalsDesc: "Mobiliado · Diário",
        owners: "Proprietários",
        ownersDesc: "Anuncie e gerencie seu imóvel",
        agents: "Agentes",
        agentsDesc: "Envie anúncios e receba leads",
        developers: "Incorporadoras",
        developersDesc: "Projetos · Múltiplas unidades",
      },
    },
    vacationBrowse: {
      heroTitle: "Encontre o lugar ideal para cada estadia.",
      heroDescription:
        "Explore aluguéis no Equador, de apartamentos urbanos a casas de praia e montanha.",
      heroSearchPlaceholder:
        "Busque por cidade, bairro ou imóvel",
      heroSearchButton: "Buscar",
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
