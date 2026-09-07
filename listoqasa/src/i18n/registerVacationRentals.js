import i18n from "./i18n";

const resources = {
  en: {
    vacationBrowse: {
      homesForRent:
        "Homes for Rent",

      landDevelopment:
        "Land & Development Opportunities",

      commercialProperties:
        "Commercial Properties",

      newProjects:
        "New Projects",

      exploreEcuador:
        "Explore Ecuador by Location",

      viewAll:
        "View all",

      beds:
        "Beds",

      baths:
        "Baths",

      properties:
        "Properties",

      save:
        "Save property",

      noProperties:
        "No properties available yet.",

      badges: {
        forRent:
          "FOR RENT",

        land:
          "LAND",

        commercial:
          "COMMERCIAL",

        newProject:
          "NEW PROJECT",
      },

      agentTitle:
        "Are you a real estate professional?",

      agentText:
        "Join ListoQasa and list your properties to reach more buyers and renters across Ecuador.",

      joinAgent:
        "Join as an Agent",
    },
  },

  es: {
    vacationBrowse: {
      homesForRent:
        "Casas en Alquiler",

      landDevelopment:
        "Terrenos y Oportunidades de Desarrollo",

      commercialProperties:
        "Propiedades Comerciales",

      newProjects:
        "Nuevos Proyectos",

      exploreEcuador:
        "Explora Ecuador por Ubicación",

      viewAll:
        "Ver todo",

      beds:
        "Hab.",

      baths:
        "Baños",

      properties:
        "Propiedades",

      save:
        "Guardar propiedad",

      noProperties:
        "Aún no hay propiedades disponibles.",

      badges: {
        forRent:
          "EN ALQUILER",

        land:
          "TERRENO",

        commercial:
          "COMERCIAL",

        newProject:
          "NUEVO PROYECTO",
      },

      agentTitle:
        "¿Eres un profesional inmobiliario?",

      agentText:
        "Únete a ListoQasa y publica tus propiedades para llegar a más compradores e inquilinos en Ecuador.",

      joinAgent:
        "Unirme como Agente",
    },
  },

  pt: {
    vacationBrowse: {
      homesForRent:
        "Casas para Alugar",

      landDevelopment:
        "Terrenos e Oportunidades de Desenvolvimento",

      commercialProperties:
        "Imóveis Comerciais",

      newProjects:
        "Novos Projetos",

      exploreEcuador:
        "Explore o Equador por Localização",

      viewAll:
        "Ver tudo",

      beds:
        "Quartos",

      baths:
        "Banhos",

      properties:
        "Imóveis",

      save:
        "Salvar imóvel",

      noProperties:
        "Ainda não há imóveis disponíveis.",

      badges: {
        forRent:
          "PARA ALUGAR",

        land:
          "TERRENO",

        commercial:
          "COMERCIAL",

        newProject:
          "NOVO PROJETO",
      },

      agentTitle:
        "Você é um profissional imobiliário?",

      agentText:
        "Junte-se ao ListoQasa e anuncie seus imóveis para alcançar mais compradores e locatários em todo o Equador.",

      joinAgent:
        "Entrar como Agente",
    },
  },
};

Object.entries(
  resources
).forEach(
  ([language, resource]) => {
    i18n.addResourceBundle(
      language,
      "translation",
      resource,
      true,
      true
    );
  }
);

export default resources;
