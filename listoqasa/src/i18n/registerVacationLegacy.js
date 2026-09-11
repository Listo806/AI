import i18n from "./i18n";

const resources = {
  en: {
    vacationLegacy: {
      heroTitle: "Find your perfect stay",
      heroSubtitle:
        "Beachfront, city, nature & luxury stays across Latin America",
      where: "Where",
      checkIn: "Check in",
      checkOut: "Check out",
      guests: "Guests",
      addGuests: "Add guests",
      search: "Search",
      destinationPlaceholder: "Search destinations",
      viewAll: "View all",
      exploreTitle:
        "Explore vacation rentals across Latin America",
      guestTypes: {
        adults: "Adults",
        children: "Children",
        infants: "Infants",
        pets: "Pets",
      },
      sections: {
        popular: "Popular in Latin America",
        beachfront: "Beachfront escapes",
        city: "City stays",
        mountain: "Mountain & nature",
        luxury: "Luxury stays",
        weekend: "Weekend getaways",
        budget: "Budget stays",
        trending: "Trending now",
        gems: "Hidden gems",
      },
    },
  },

  es: {
    vacationLegacy: {
      heroTitle: "Encuentra tu estadía perfecta",
      heroSubtitle:
        "Playa, ciudad, naturaleza y alojamientos de lujo en toda Latinoamérica",
      where: "Dónde",
      checkIn: "Llegada",
      checkOut: "Salida",
      guests: "Huéspedes",
      addGuests: "Añadir huéspedes",
      search: "Buscar",
      destinationPlaceholder: "Buscar destinos",
      viewAll: "Ver todo",
      exploreTitle:
        "Explora alquileres vacacionales en Latinoamérica",
      guestTypes: {
        adults: "Adultos",
        children: "Niños",
        infants: "Bebés",
        pets: "Mascotas",
      },
      sections: {
        popular: "Popular en Latinoamérica",
        beachfront: "Escapadas frente al mar",
        city: "Estancias en la ciudad",
        mountain: "Montaña y naturaleza",
        luxury: "Estancias de lujo",
        weekend: "Escapadas de fin de semana",
        budget: "Estancias económicas",
        trending: "Tendencias actuales",
        gems: "Joyas escondidas",
      },
    },
  },

  pt: {
    vacationLegacy: {
      heroTitle: "Encontre sua estadia perfeita",
      heroSubtitle:
        "Praia, cidade, natureza e estadias de luxo em toda a América Latina",
      where: "Onde",
      checkIn: "Check-in",
      checkOut: "Check-out",
      guests: "Hóspedes",
      addGuests: "Adicionar hóspedes",
      search: "Buscar",
      destinationPlaceholder: "Buscar destinos",
      viewAll: "Ver tudo",
      exploreTitle:
        "Explore aluguéis de temporada na América Latina",
      guestTypes: {
        adults: "Adultos",
        children: "Crianças",
        infants: "Bebês",
        pets: "Animais",
      },
      sections: {
        popular: "Popular na América Latina",
        beachfront: "Escapadas à beira-mar",
        city: "Estadias na cidade",
        mountain: "Montanha e natureza",
        luxury: "Estadias de luxo",
        weekend: "Escapadas de fim de semana",
        budget: "Estadias econômicas",
        trending: "Em alta agora",
        gems: "Joias escondidas",
      },
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
