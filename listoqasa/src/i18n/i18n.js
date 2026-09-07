import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      /* =====================================================
         HEADER
      ===================================================== */
      header: {
        buy: "Buy",
        rent: "Rent",
        vacationRentals: "Vacation Rentals",
        sell: "Sell",
        land: "Land",
        agents: "Agents",
        developers: "Developers",
        findAgent: "Find Agent",
        aiHelp: "AI Help",
      },

      /* =====================================================
         FOOTER
      ===================================================== */
      footer: {
        description:
          "Ecuador's most powerful real estate marketplace. Buy, rent, sell, and discover the perfect property with ease.",

        buy: "Buy",
        homesForSale: "Homes for Sale",
        luxuryHomes: "Luxury Homes",
        apartments: "Apartments",
        landLots: "Land & Lots",
        newProjects: "New Projects",

        rent: "Rent",
        homesForRent: "Homes for Rent",
        vacationRentals: "Vacation Rentals",
        shortTermRentals: "Short Term Rentals",

        propertyTypes: "Property Types",
        houses: "Houses",
        land: "Land",
        commercial: "Commercial",
        developments: "Developments",

        company: "Company",
        aboutUs: "About Us",
        careers: "Careers",
        contactUs: "Contact Us",
        blog: "Blog",

        support: "Support",
        helpCenter: "Help Center",
        termsOfUse: "Terms of Use",
        privacyPolicy: "Privacy Policy",
        sitemap: "Sitemap",

        stayConnected: "Stay Connected",

        copyright:
          "© 2025 ListoQasa. All rights reserved.",
      },

      /* =====================================================
         HOME
      ===================================================== */
      home: {
        heroTitle1: "Find Homes",
        heroTitle2: "That Match You",

        heroDescription:
          "Buy, rent, or find the perfect place to stay.",

        searchPlaceholder:
          "Search by city, neighborhood, or property",

        categories: {
          forSale: "For Sale",
          forRent: "For Rent",
          apartments: "Apartments",
          houses: "Houses",
          land: "Land",
          commercial: "Commercial",
          vacationRentals: "Vacation Rentals",
          developers: "Developers",
          newProjects: "New Projects",
        },

        newListings: "New Listings",
        luxuryHomes: "Luxury Homes",
        viewAll: "View all",

        ownerBannerTitle:
          "Looking to sell or rent your property?",

        ownerBannerDescription:
          "List your property on ListoQasa and reach people searching across Ecuador.",

        new: "NEW",

        beds: "Beds",
        baths: "Baths",
      },

      /* =====================================================
         OWNERS
      ===================================================== */
      owners: {
        heroTitle1: "List Your Property.",
        heroTitle2: "Let AI Do the Work.",

        heroDescription1:
          "Reach serious buyers and renters faster.",

        heroDescription2:
          "List once and get maximum exposure across Ecuador.",

        listProperty: "List Your Property",

        secure: "Quick. Easy. Secure.",

        exposureEyebrow: "MAXIMUM EXPOSURE",

        exposureTitle:
          "Your Property. More Visibility. Better Results.",

        exposureDescription1:
          "List on ListoQasa and get your property in front of thousands of",

        exposureDescription2:
          "active buyers and renters across Ecuador.",

        hugeAudience: "Huge Audience",
        hugeAudienceDesc:
          "Reach thousands of active buyers and renters every day.",

        smartMatching: "Smart AI Matching",
        smartMatchingDesc:
          "We connect your property with the right people.",

        moreVisibility: "More Visibility",
        moreVisibilityDesc:
          "Your listing is seen across our entire marketplace.",

        secureReliable: "Secure & Reliable",
        secureReliableDesc:
          "Safe, professional, and built for your success.",

        oneListing:
          "ONE LISTING. EVERYWHERE IT MATTERS.",

        rightPeopleTitle:
          "We Put Your Property in Front of the Right People",

        flowList: "You List",
        flowProperty: "Your Property",

        listoQasa: "ListoQasa",
        marketplace: "Marketplace",

        aiMatches: "AI Matches",
        rightPeople: "the Right People",

        buyersRenters: "Buyers & Renters",
        findProperty: "Find Your Property",

        exposure247: "24/7",
        propertyExposure: "Property Exposure",
        alwaysVisible: "Always visible",

        thousands: "Thousands",
        activeBuyers: "Active Buyers",
        searchingDaily: "Searching daily",

        moreInquiries: "More Inquiries",
        qualifiedLeads: "Get more qualified leads",

        betterResults: "Better Results",
        sellFaster:
          "Sell or rent faster with ListoQasa",

        ctaTitle:
          "Ready to List Your Property?",

        ctaDescription:
          "Create your listing in minutes and let AI help you reach the right buyers and renters.",

        easyCreate: "Easy to create",
        maximumExposure: "Maximum exposure",
        noHassle: "No hassle",
        startToday: "Start today",
      },

      /* =====================================================
         AGENTS
      ===================================================== */
      agent: {
        heroTitle1: "More Leads.",
        heroTitle2: "More Closings.",

        heroDescription:
          "List unlimited properties and connect with motivated buyers every day on ListoQasa.",

        viewPlans: "View Agent Plans",

        unlimitedTitle:
          "Unlimited Listings. Maximum Opportunities.",

        unlimitedDescription1:
          "List as many properties as you want for one simple monthly price.",

        unlimitedDescription2:
          "Get your listings in front of thousands of active buyers and renters across Ecuador.",

        unlimitedProperties: "Unlimited Properties",

        unlimitedPropertiesDesc:
          "List all your properties. No limits. No extra fees.",

        moreBuyers: "More Buyers. More Leads.",

        moreBuyersDesc:
          "We bring motivated buyers to you through targeted marketing.",

        betterResults: "Better Results",

        betterResultsDesc:
          "More visibility. More inquiries. More closings.",

        focusEyebrow: "OUR FOCUS",

        qualityLeadsTitle:
          "We Bring You Quality Leads",

        qualityLeadsDescription:
          "Our marketing engine works 24/7 to put your listings in front of the right people at the right time.",

        focus1:
          "Premium placement across our marketplace",

        focus2:
          "Targeted digital marketing that drives real results",

        focus3:
          "Local expertise with nationwide reach",

        focus4:
          "Continuous traffic. Consistent opportunities.",

        googleAds: "Google Ads",
        socialMedia: "Social Media",
        marketplace: "Marketplace",
        emailCampaigns: "Email Campaigns",
        strategicPartnerships:
          "Strategic Partnerships",

        smartTools:
          "Power Your Business with Smart Tools",

        smartToolsDesc:
          "Try our AI Agent, CRM, and automation tools designed to help you convert more leads and save time.",

        aiAgent: "AI Agent",
        aiAgentDesc: "Engage leads 24/7",

        smartCrm: "Smart CRM",
        smartCrmDesc:
          "Manage everything in one place",

        automation: "Automation",
        automationDesc:
          "Follow up. Nurture. Close more deals.",

        growTitle:
          "Ready to Grow Your Business?",

        growDescription1:
          "Join successful agents who list on ListoQasa and",

        growDescription2:
          "close more deals, every month.",
      },

      /* =====================================================
         FIND AGENT
      ===================================================== */
      findAgent: {
        eyebrow:
          "FIND REAL ESTATE PROFESSIONALS YOU CAN TRUST",

        heroTitle1: "Work with Local",
        heroTitle2: "Real Estate",
        heroTitleHighlight: "Experts.",

        heroDescription:
          "Connect with trusted agents and agencies who advertise with us and are ready to help you buy, rent or sell.",

        findProfessional: "Find a Professional",

        verified: "Verified Professionals",
        verifiedDesc:
          "Every professional is verified",

        localExpertise:
          "Local Market Expertise",

        localExpertiseDesc:
          "Professionals who know your market",

        moreOpportunities:
          "More Opportunities",

        moreOpportunitiesDesc:
          "Connect with professionals actively helping clients",

        directContact: "Direct Contact",

        directContactDesc:
          "Reach out and start the conversation",

        aiAgent: "AI Agent",
        connected247: "24/7",

        whatsapp: "WhatsApp",
        connected: "Connected",

        workspace: "All-in-One",
        workspaceDesc: "Workspace",

        secure: "Secure &",
        reliable: "Reliable",

        searchTitle:
          "Find the Right Professional",

        searchSubtitle:
          "Search by name, agency, location, or specialty.",

        searchPlaceholder:
          "Search by name, agency, or keyword...",

        allCities: "All Cities",
        allSpecialties: "All Specialties",
        search: "Search",

        lookingFor: "I'm looking for:",

        allProfessionals:
          "All Professionals",

        independentAgents:
          "Independent Agents",

        realEstateAgencies:
          "Real Estate Agencies",

        featuredTitle:
          "Featured Real Estate Professionals",

        featuredDescription:
          "Browse top agents and agencies who are actively helping buyers, renters and sellers.",

        viewAllProfessionals:
          "View All Professionals",

        viewAgencyProfile:
          "View Agency Profile",

        viewAgentProfile:
          "View Agent Profile",

        agency:
          "Real Estate Agency",

        independentAgent:
          "Independent Agent",

        whyTitle:
          "Why Choose a Professional on ListoQasa?",

        trustedNetwork:
          "Trusted Network",

        trustedNetworkDesc:
          "We connect you with verified professionals who promote their services on our platform.",

        localKnowledge:
          "Local Knowledge",

        localKnowledgeDesc:
          "Work with experts who know your city, neighborhoods and market conditions.",

        betterResults:
          "Better Results",

        betterResultsDesc:
          "Get better guidance, more opportunities and smoother transactions.",

        directCommunication:
          "Direct Communication",

        directCommunicationDesc:
          "Contact professionals directly and start the conversation easily.",

        ctaTitle:
          "Ready to Find the Right Professional?",

        ctaDescription:
          "Connect with local real estate experts who are ready to help you achieve your goals.",
      },
    },
  },

  /* =========================================================
     SPANISH
  ========================================================= */
  es: {
    translation: {
      header: {
        buy: "Comprar",
        rent: "Alquilar",
        vacationRentals:
          "Alquileres Vacacionales",
        sell: "Vender",
        land: "Terrenos",
        agents: "Agentes",
        developers: "Desarrolladores",
        findAgent: "Buscar Agente",
        aiHelp: "Ayuda IA",
      },

      footer: {
        description:
          "El marketplace inmobiliario más potente de Ecuador. Compra, alquila, vende y encuentra la propiedad perfecta con facilidad.",

        buy: "Comprar",
        homesForSale: "Casas en Venta",
        luxuryHomes: "Casas de Lujo",
        apartments: "Apartamentos",
        landLots: "Terrenos y Lotes",
        newProjects: "Nuevos Proyectos",

        rent: "Alquilar",
        homesForRent: "Casas en Alquiler",
        vacationRentals:
          "Alquileres Vacacionales",
        shortTermRentals:
          "Alquileres de Corta Estadía",

        propertyTypes:
          "Tipos de Propiedad",

        houses: "Casas",
        land: "Terrenos",
        commercial: "Comercial",
        developments: "Desarrollos",

        company: "Empresa",
        aboutUs: "Sobre Nosotros",
        careers: "Carreras",
        contactUs: "Contáctanos",
        blog: "Blog",

        support: "Soporte",
        helpCenter: "Centro de Ayuda",
        termsOfUse: "Términos de Uso",
        privacyPolicy:
          "Política de Privacidad",
        sitemap: "Mapa del Sitio",

        stayConnected:
          "Mantente Conectado",

        copyright:
          "© 2025 ListoQasa. Todos los derechos reservados.",
      },

      home: {
        heroTitle1: "Encuentra Casas",
        heroTitle2: "Que Se Adaptan a Ti",

        heroDescription:
          "Compra, alquila o encuentra el lugar perfecto para quedarte.",

        searchPlaceholder:
          "Busca por ciudad, vecindario o propiedad",

        categories: {
          forSale: "En Venta",
          forRent: "En Alquiler",
          apartments: "Apartamentos",
          houses: "Casas",
          land: "Terrenos",
          commercial: "Comercial",
          vacationRentals:
            "Alquileres Vacacionales",
          developers: "Desarrolladores",
          newProjects: "Nuevos Proyectos",
        },

        newListings:
          "Nuevas Propiedades",

        luxuryHomes:
          "Casas de Lujo",

        viewAll: "Ver todo",

        ownerBannerTitle:
          "¿Quieres vender o alquilar tu propiedad?",

        ownerBannerDescription:
          "Publica tu propiedad en ListoQasa y llega a personas que buscan en todo Ecuador.",

        new: "NUEVO",

        beds: "Hab.",
        baths: "Baños",
      },

      owners: {
        heroTitle1:
          "Publica tu Propiedad.",

        heroTitle2:
          "Deja que la IA Haga el Trabajo.",

        heroDescription1:
          "Llega más rápido a compradores e inquilinos serios.",

        heroDescription2:
          "Publica una vez y obtén máxima exposición en todo Ecuador.",

        listProperty:
          "Publica tu Propiedad",

        secure:
          "Rápido. Fácil. Seguro.",

        exposureEyebrow:
          "MÁXIMA EXPOSICIÓN",

        exposureTitle:
          "Tu Propiedad. Más Visibilidad. Mejores Resultados.",

        exposureDescription1:
          "Publica en ListoQasa y muestra tu propiedad a miles de",

        exposureDescription2:
          "compradores e inquilinos activos en Ecuador.",

        hugeAudience:
          "Gran Audiencia",

        hugeAudienceDesc:
          "Llega a miles de compradores e inquilinos activos cada día.",

        smartMatching:
          "Matching Inteligente con IA",

        smartMatchingDesc:
          "Conectamos tu propiedad con las personas adecuadas.",

        moreVisibility:
          "Más Visibilidad",

        moreVisibilityDesc:
          "Tu anuncio se muestra en todo nuestro marketplace.",

        secureReliable:
          "Seguro y Confiable",

        secureReliableDesc:
          "Seguro, profesional y diseñado para tu éxito.",

        oneListing:
          "UNA PUBLICACIÓN. EN TODOS LOS LUGARES IMPORTANTES.",

        rightPeopleTitle:
          "Ponemos tu Propiedad Frente a las Personas Adecuadas",

        flowList: "Tú Publicas",
        flowProperty: "Tu Propiedad",

        listoQasa: "ListoQasa",
        marketplace: "Marketplace",

        aiMatches:
          "La IA Encuentra",

        rightPeople:
          "a las Personas Adecuadas",

        buyersRenters:
          "Compradores e Inquilinos",

        findProperty:
          "Encuentran tu Propiedad",

        exposure247: "24/7",

        propertyExposure:
          "Exposición de Propiedad",

        alwaysVisible:
          "Siempre visible",

        thousands: "Miles",

        activeBuyers:
          "Compradores Activos",

        searchingDaily:
          "Buscando cada día",

        moreInquiries:
          "Más Consultas",

        qualifiedLeads:
          "Obtén más clientes potenciales calificados",

        betterResults:
          "Mejores Resultados",

        sellFaster:
          "Vende o alquila más rápido con ListoQasa",

        ctaTitle:
          "¿Listo para Publicar tu Propiedad?",

        ctaDescription:
          "Crea tu anuncio en minutos y deja que la IA te ayude a llegar a los compradores e inquilinos adecuados.",

        easyCreate:
          "Fácil de crear",

        maximumExposure:
          "Máxima exposición",

        noHassle:
          "Sin complicaciones",

        startToday:
          "Empieza hoy",
      },

      agent: {
        heroTitle1: "Más Clientes.",
        heroTitle2: "Más Cierres.",

        heroDescription:
          "Publica propiedades ilimitadas y conecta cada día con compradores motivados en ListoQasa.",

        viewPlans:
          "Ver Planes para Agentes",

        unlimitedTitle:
          "Publicaciones Ilimitadas. Máximas Oportunidades.",

        unlimitedDescription1:
          "Publica tantas propiedades como quieras por un simple precio mensual.",

        unlimitedDescription2:
          "Muestra tus propiedades a miles de compradores e inquilinos activos en Ecuador.",

        unlimitedProperties:
          "Propiedades Ilimitadas",

        unlimitedPropertiesDesc:
          "Publica todas tus propiedades. Sin límites. Sin cargos adicionales.",

        moreBuyers:
          "Más Compradores. Más Clientes.",

        moreBuyersDesc:
          "Te conectamos con compradores motivados mediante marketing dirigido.",

        betterResults:
          "Mejores Resultados",

        betterResultsDesc:
          "Más visibilidad. Más consultas. Más cierres.",

        focusEyebrow:
          "NUESTRO ENFOQUE",

        qualityLeadsTitle:
          "Te Conseguimos Clientes de Calidad",

        qualityLeadsDescription:
          "Nuestro motor de marketing trabaja 24/7 para mostrar tus propiedades a las personas adecuadas en el momento adecuado.",

        focus1:
          "Ubicación premium en nuestro marketplace",

        focus2:
          "Marketing digital dirigido que genera resultados reales",

        focus3:
          "Experiencia local con alcance nacional",

        focus4:
          "Tráfico continuo. Oportunidades constantes.",

        googleAds: "Google Ads",
        socialMedia: "Redes Sociales",
        marketplace: "Marketplace",
        emailCampaigns:
          "Campañas de Email",

        strategicPartnerships:
          "Alianzas Estratégicas",

        smartTools:
          "Impulsa tu Negocio con Herramientas Inteligentes",

        smartToolsDesc:
          "Prueba nuestro Agente IA, CRM y herramientas de automatización diseñadas para ayudarte a convertir más clientes y ahorrar tiempo.",

        aiAgent: "Agente IA",
        aiAgentDesc:
          "Atiende clientes 24/7",

        smartCrm:
          "CRM Inteligente",

        smartCrmDesc:
          "Gestiona todo en un solo lugar",

        automation:
          "Automatización",

        automationDesc:
          "Haz seguimiento. Cultiva. Cierra más negocios.",

        growTitle:
          "¿Listo para Hacer Crecer tu Negocio?",

        growDescription1:
          "Únete a agentes exitosos que publican en ListoQasa y",

        growDescription2:
          "cierran más negocios cada mes.",
      },

      findAgent: {
        eyebrow:
          "ENCUENTRA PROFESIONALES INMOBILIARIOS DE CONFIANZA",

        heroTitle1:
          "Trabaja con",

        heroTitle2:
          "Expertos Inmobiliarios",

        heroTitleHighlight:
          "Locales.",

        heroDescription:
          "Conecta con agentes y agencias de confianza que anuncian con nosotros y están listos para ayudarte a comprar, alquilar o vender.",

        findProfessional:
          "Buscar un Profesional",

        verified:
          "Profesionales Verificados",

        verifiedDesc:
          "Cada profesional está verificado",

        localExpertise:
          "Experiencia en el Mercado Local",

        localExpertiseDesc:
          "Profesionales que conocen tu mercado",

        moreOpportunities:
          "Más Oportunidades",

        moreOpportunitiesDesc:
          "Conecta con profesionales que ayudan activamente a clientes",

        directContact:
          "Contacto Directo",

        directContactDesc:
          "Comunícate e inicia la conversación",

        aiAgent: "Agente IA",
        connected247: "24/7",

        whatsapp: "WhatsApp",
        connected: "Conectado",

        workspace: "Todo en Uno",
        workspaceDesc:
          "Espacio de Trabajo",

        secure: "Seguro y",
        reliable: "Confiable",

        searchTitle:
          "Encuentra al Profesional Adecuado",

        searchSubtitle:
          "Busca por nombre, agencia, ubicación o especialidad.",

        searchPlaceholder:
          "Buscar por nombre, agencia o palabra clave...",

        allCities:
          "Todas las Ciudades",

        allSpecialties:
          "Todas las Especialidades",

        search: "Buscar",

        lookingFor:
          "Estoy buscando:",

        allProfessionals:
          "Todos los Profesionales",

        independentAgents:
          "Agentes Independientes",

        realEstateAgencies:
          "Agencias Inmobiliarias",

        featuredTitle:
          "Profesionales Inmobiliarios Destacados",

        featuredDescription:
          "Explora agentes y agencias que ayudan activamente a compradores, inquilinos y vendedores.",

        viewAllProfessionals:
          "Ver Todos los Profesionales",

        viewAgencyProfile:
          "Ver Perfil de Agencia",

        viewAgentProfile:
          "Ver Perfil de Agente",

        agency:
          "Agencia Inmobiliaria",

        independentAgent:
          "Agente Independiente",

        whyTitle:
          "¿Por Qué Elegir un Profesional en ListoQasa?",

        trustedNetwork:
          "Red de Confianza",

        trustedNetworkDesc:
          "Te conectamos con profesionales verificados que promocionan sus servicios en nuestra plataforma.",

        localKnowledge:
          "Conocimiento Local",

        localKnowledgeDesc:
          "Trabaja con expertos que conocen tu ciudad, barrios y condiciones del mercado.",

        betterResults:
          "Mejores Resultados",

        betterResultsDesc:
          "Obtén mejor orientación, más oportunidades y transacciones más fluidas.",

        directCommunication:
          "Comunicación Directa",

        directCommunicationDesc:
          "Contacta directamente con profesionales e inicia la conversación fácilmente.",

        ctaTitle:
          "¿Listo para Encontrar al Profesional Adecuado?",

        ctaDescription:
          "Conecta con expertos inmobiliarios locales listos para ayudarte a alcanzar tus objetivos.",
      },
    },
  },

  /* =========================================================
     PORTUGUESE
  ========================================================= */
  pt: {
    translation: {
      header: {
        buy: "Comprar",
        rent: "Alugar",
        vacationRentals:
          "Aluguéis de Temporada",
        sell: "Vender",
        land: "Terrenos",
        agents: "Agentes",
        developers: "Desenvolvedores",
        findAgent: "Encontrar Agente",
        aiHelp: "Ajuda IA",
      },

      footer: {
        description:
          "O marketplace imobiliário mais poderoso do Equador. Compre, alugue, venda e encontre a propriedade perfeita com facilidade.",

        buy: "Comprar",
        homesForSale:
          "Casas à Venda",
        luxuryHomes:
          "Casas de Luxo",
        apartments:
          "Apartamentos",
        landLots:
          "Terrenos e Lotes",
        newProjects:
          "Novos Projetos",

        rent: "Alugar",
        homesForRent:
          "Casas para Alugar",

        vacationRentals:
          "Aluguéis de Temporada",

        shortTermRentals:
          "Aluguéis de Curta Duração",

        propertyTypes:
          "Tipos de Imóvel",

        houses: "Casas",
        land: "Terrenos",
        commercial: "Comercial",
        developments:
          "Empreendimentos",

        company: "Empresa",
        aboutUs: "Sobre Nós",
        careers: "Carreiras",
        contactUs: "Contato",
        blog: "Blog",

        support: "Suporte",
        helpCenter:
          "Central de Ajuda",

        termsOfUse:
          "Termos de Uso",

        privacyPolicy:
          "Política de Privacidade",

        sitemap:
          "Mapa do Site",

        stayConnected:
          "Mantenha-se Conectado",

        copyright:
          "© 2025 ListoQasa. Todos os direitos reservados.",
      },

      home: {
        heroTitle1:
          "Encontre Casas",

        heroTitle2:
          "Que Combinam com Você",

        heroDescription:
          "Compre, alugue ou encontre o lugar perfeito para ficar.",

        searchPlaceholder:
          "Pesquise por cidade, bairro ou propriedade",

        categories: {
          forSale: "À Venda",
          forRent: "Para Alugar",
          apartments: "Apartamentos",
          houses: "Casas",
          land: "Terrenos",
          commercial: "Comercial",

          vacationRentals:
            "Aluguéis de Temporada",

          developers:
            "Incorporadoras",

          newProjects:
            "Novos Projetos",
        },

        newListings:
          "Novos Anúncios",

        luxuryHomes:
          "Casas de Luxo",

        viewAll: "Ver tudo",

        ownerBannerTitle:
          "Quer vender ou alugar sua propriedade?",

        ownerBannerDescription:
          "Anuncie sua propriedade no ListoQasa e alcance pessoas procurando em todo o Equador.",

        new: "NOVO",

        beds: "Quartos",
        baths: "Banhos",
      },

      owners: {
        heroTitle1:
          "Anuncie sua Propriedade.",

        heroTitle2:
          "Deixe a IA Fazer o Trabalho.",

        heroDescription1:
          "Alcance compradores e locatários sérios mais rapidamente.",

        heroDescription2:
          "Anuncie uma vez e obtenha máxima exposição em todo o Equador.",

        listProperty:
          "Anuncie sua Propriedade",

        secure:
          "Rápido. Fácil. Seguro.",

        exposureEyebrow:
          "MÁXIMA EXPOSIÇÃO",

        exposureTitle:
          "Sua Propriedade. Mais Visibilidade. Melhores Resultados.",

        exposureDescription1:
          "Anuncie no ListoQasa e coloque sua propriedade diante de milhares de",

        exposureDescription2:
          "compradores e locatários ativos em todo o Equador.",

        hugeAudience:
          "Grande Audiência",

        hugeAudienceDesc:
          "Alcance milhares de compradores e locatários ativos todos os dias.",

        smartMatching:
          "Correspondência Inteligente com IA",

        smartMatchingDesc:
          "Conectamos sua propriedade às pessoas certas.",

        moreVisibility:
          "Mais Visibilidade",

        moreVisibilityDesc:
          "Seu anúncio aparece em todo o nosso marketplace.",

        secureReliable:
          "Seguro e Confiável",

        secureReliableDesc:
          "Seguro, profissional e desenvolvido para o seu sucesso.",

        oneListing:
          "UM ANÚNCIO. EM TODOS OS LUGARES IMPORTANTES.",

        rightPeopleTitle:
          "Colocamos sua Propriedade Diante das Pessoas Certas",

        flowList:
          "Você Anuncia",

        flowProperty:
          "Sua Propriedade",

        listoQasa: "ListoQasa",
        marketplace: "Marketplace",

        aiMatches:
          "A IA Encontra",

        rightPeople:
          "as Pessoas Certas",

        buyersRenters:
          "Compradores e Locatários",

        findProperty:
          "Encontram sua Propriedade",

        exposure247: "24/7",

        propertyExposure:
          "Exposição da Propriedade",

        alwaysVisible:
          "Sempre visível",

        thousands: "Milhares",

        activeBuyers:
          "Compradores Ativos",

        searchingDaily:
          "Pesquisando diariamente",

        moreInquiries:
          "Mais Consultas",

        qualifiedLeads:
          "Receba mais leads qualificados",

        betterResults:
          "Melhores Resultados",

        sellFaster:
          "Venda ou alugue mais rápido com ListoQasa",

        ctaTitle:
          "Pronto para Anunciar sua Propriedade?",

        ctaDescription:
          "Crie seu anúncio em minutos e deixe a IA ajudar você a alcançar os compradores e locatários certos.",

        easyCreate:
          "Fácil de criar",

        maximumExposure:
          "Máxima exposição",

        noHassle:
          "Sem complicações",

        startToday:
          "Comece hoje",
      },

      agent: {
        heroTitle1: "Mais Leads.",
        heroTitle2:
          "Mais Fechamentos.",

        heroDescription:
          "Anuncie propriedades ilimitadas e conecte-se todos os dias com compradores motivados no ListoQasa.",

        viewPlans:
          "Ver Planos para Agentes",

        unlimitedTitle:
          "Anúncios Ilimitados. Máximas Oportunidades.",

        unlimitedDescription1:
          "Anuncie quantas propriedades quiser por um preço mensal simples.",

        unlimitedDescription2:
          "Coloque seus anúncios diante de milhares de compradores e locatários ativos em todo o Equador.",

        unlimitedProperties:
          "Propriedades Ilimitadas",

        unlimitedPropertiesDesc:
          "Anuncie todas as suas propriedades. Sem limites. Sem taxas extras.",

        moreBuyers:
          "Mais Compradores. Mais Leads.",

        moreBuyersDesc:
          "Levamos compradores motivados até você através de marketing direcionado.",

        betterResults:
          "Melhores Resultados",

        betterResultsDesc:
          "Mais visibilidade. Mais contatos. Mais fechamentos.",

        focusEyebrow:
          "NOSSO FOCO",

        qualityLeadsTitle:
          "Levamos Leads de Qualidade Até Você",

        qualityLeadsDescription:
          "Nosso mecanismo de marketing trabalha 24/7 para colocar seus anúncios diante das pessoas certas no momento certo.",

        focus1:
          "Posicionamento premium em nosso marketplace",

        focus2:
          "Marketing digital direcionado que gera resultados reais",

        focus3:
          "Experiência local com alcance nacional",

        focus4:
          "Tráfego contínuo. Oportunidades consistentes.",

        googleAds: "Google Ads",
        socialMedia:
          "Redes Sociais",
        marketplace:
          "Marketplace",

        emailCampaigns:
          "Campanhas de Email",

        strategicPartnerships:
          "Parcerias Estratégicas",

        smartTools:
          "Potencialize seu Negócio com Ferramentas Inteligentes",

        smartToolsDesc:
          "Experimente nosso Agente IA, CRM e ferramentas de automação projetadas para ajudar você a converter mais leads e economizar tempo.",

        aiAgent: "Agente IA",

        aiAgentDesc:
          "Atenda leads 24/7",

        smartCrm:
          "CRM Inteligente",

        smartCrmDesc:
          "Gerencie tudo em um só lugar",

        automation:
          "Automação",

        automationDesc:
          "Acompanhe. Cultive. Feche mais negócios.",

        growTitle:
          "Pronto para Expandir seu Negócio?",

        growDescription1:
          "Junte-se a agentes de sucesso que anunciam no ListoQasa e",

        growDescription2:
          "fecham mais negócios todos os meses.",
      },

      findAgent: {
        eyebrow:
          "ENCONTRE PROFISSIONAIS IMOBILIÁRIOS EM QUEM VOCÊ PODE CONFIAR",

        heroTitle1:
          "Trabalhe com",

        heroTitle2:
          "Especialistas Imobiliários",

        heroTitleHighlight:
          "Locais.",

        heroDescription:
          "Conecte-se com agentes e imobiliárias confiáveis que anunciam conosco e estão prontos para ajudar você a comprar, alugar ou vender.",

        findProfessional:
          "Encontrar um Profissional",

        verified:
          "Profissionais Verificados",

        verifiedDesc:
          "Todos os profissionais são verificados",

        localExpertise:
          "Experiência no Mercado Local",

        localExpertiseDesc:
          "Profissionais que conhecem seu mercado",

        moreOpportunities:
          "Mais Oportunidades",

        moreOpportunitiesDesc:
          "Conecte-se com profissionais que ajudam clientes ativamente",

        directContact:
          "Contato Direto",

        directContactDesc:
          "Entre em contato e inicie a conversa",

        aiAgent: "Agente IA",
        connected247: "24/7",

        whatsapp: "WhatsApp",
        connected: "Conectado",

        workspace: "Tudo em Um",
        workspaceDesc: "Workspace",

        secure: "Seguro e",
        reliable: "Confiável",

        searchTitle:
          "Encontre o Profissional Certo",

        searchSubtitle:
          "Pesquise por nome, imobiliária, localização ou especialidade.",

        searchPlaceholder:
          "Pesquisar por nome, imobiliária ou palavra-chave...",

        allCities:
          "Todas as Cidades",

        allSpecialties:
          "Todas as Especialidades",

        search: "Pesquisar",

        lookingFor:
          "Estou procurando:",

        allProfessionals:
          "Todos os Profissionais",

        independentAgents:
          "Agentes Independentes",

        realEstateAgencies:
          "Imobiliárias",

        featuredTitle:
          "Profissionais Imobiliários em Destaque",

        featuredDescription:
          "Conheça agentes e imobiliárias que ajudam ativamente compradores, locatários e vendedores.",

        viewAllProfessionals:
          "Ver Todos os Profissionais",

        viewAgencyProfile:
          "Ver Perfil da Imobiliária",

        viewAgentProfile:
          "Ver Perfil do Agente",

        agency: "Imobiliária",

        independentAgent:
          "Agente Independente",

        whyTitle:
          "Por Que Escolher um Profissional no ListoQasa?",

        trustedNetwork:
          "Rede Confiável",

        trustedNetworkDesc:
          "Conectamos você a profissionais verificados que promovem seus serviços em nossa plataforma.",

        localKnowledge:
          "Conhecimento Local",

        localKnowledgeDesc:
          "Trabalhe com especialistas que conhecem sua cidade, bairros e condições de mercado.",

        betterResults:
          "Melhores Resultados",

        betterResultsDesc:
          "Tenha melhor orientação, mais oportunidades e transações mais tranquilas.",

        directCommunication:
          "Comunicação Direta",

        directCommunicationDesc:
          "Entre em contato diretamente com profissionais e inicie a conversa facilmente.",

        ctaTitle:
          "Pronto para Encontrar o Profissional Certo?",

        ctaDescription:
          "Conecte-se com especialistas imobiliários locais prontos para ajudar você a alcançar seus objetivos.",
      },
    },
  },
};

/* =========================================================
   LANGUAGE
========================================================= */

const SUPPORTED_LANGUAGES = ["en", "es", "pt"];

const getInitialLanguage = () => {
  const saved =
    localStorage.getItem("listoqasa_language");

  if (
    saved &&
    SUPPORTED_LANGUAGES.includes(saved)
  ) {
    return saved;
  }

  return "en";
};

i18n
  .use(initReactI18next)
  .init({
    resources,

    lng: getInitialLanguage(),

    fallbackLng: "en",

    supportedLngs:
      SUPPORTED_LANGUAGES,

    load: "languageOnly",

    nonExplicitSupportedLngs: true,

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  });

i18n.on(
  "languageChanged",
  (language) => {
    const normalized =
      language
        ?.split("-")[0]
        ?.toLowerCase() || "en";

    localStorage.setItem(
      "listoqasa_language",
      normalized
    );

    document.documentElement.lang =
      normalized;
  }
);

document.documentElement.lang =
  getInitialLanguage();

export default i18n;