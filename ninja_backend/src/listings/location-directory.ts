/** Approved Ecuador marketplace location directory. Slugs are stable public identifiers. */
export interface DirectoryLocation { slug: string; name: string; parentCity: string | null }
export const DIRECTORY_LOCATIONS: DirectoryLocation[] = [
  {
    "slug": "quito",
    "name": "Quito",
    "parentCity": null
  },
  {
    "slug": "cumbaya",
    "name": "Cumbayá",
    "parentCity": null
  },
  {
    "slug": "tumbaco",
    "name": "Tumbaco",
    "parentCity": null
  },
  {
    "slug": "la-carolina",
    "name": "La Carolina",
    "parentCity": "Quito"
  },
  {
    "slug": "inaquito",
    "name": "Iñaquito",
    "parentCity": "Quito"
  },
  {
    "slug": "gonzalez-suarez",
    "name": "González Suárez",
    "parentCity": "Quito"
  },
  {
    "slug": "la-floresta",
    "name": "La Floresta",
    "parentCity": "Quito"
  },
  {
    "slug": "quito-tenis",
    "name": "Quito Tenis",
    "parentCity": "Quito"
  },
  {
    "slug": "el-batan",
    "name": "El Batán",
    "parentCity": "Quito"
  },
  {
    "slug": "nayon",
    "name": "Nayón",
    "parentCity": "Quito"
  },
  {
    "slug": "calderon",
    "name": "Calderón",
    "parentCity": "Quito"
  },
  {
    "slug": "conocoto",
    "name": "Conocoto",
    "parentCity": "Quito"
  },
  {
    "slug": "sangolqui",
    "name": "Sangolquí",
    "parentCity": null
  },
  {
    "slug": "valle-de-los-chillos",
    "name": "Valle de Los Chillos",
    "parentCity": "Quito"
  },
  {
    "slug": "pomasqui",
    "name": "Pomasqui",
    "parentCity": "Quito"
  },
  {
    "slug": "cayambe",
    "name": "Cayambe",
    "parentCity": null
  },
  {
    "slug": "machachi",
    "name": "Machachi",
    "parentCity": null
  },
  {
    "slug": "guayaquil",
    "name": "Guayaquil",
    "parentCity": null
  },
  {
    "slug": "samborondon",
    "name": "Samborondón",
    "parentCity": null
  },
  {
    "slug": "duran",
    "name": "Durán",
    "parentCity": null
  },
  {
    "slug": "daule",
    "name": "Daule",
    "parentCity": null
  },
  {
    "slug": "milagro",
    "name": "Milagro",
    "parentCity": null
  },
  {
    "slug": "playas",
    "name": "Playas",
    "parentCity": null
  },
  {
    "slug": "norte-de-guayaquil",
    "name": "Norte de Guayaquil",
    "parentCity": "Guayaquil"
  },
  {
    "slug": "centro-de-guayaquil",
    "name": "Centro de Guayaquil",
    "parentCity": "Guayaquil"
  },
  {
    "slug": "via-a-la-costa",
    "name": "Vía a la Costa",
    "parentCity": "Guayaquil"
  },
  {
    "slug": "los-ceibos",
    "name": "Los Ceibos",
    "parentCity": "Guayaquil"
  },
  {
    "slug": "urdesa",
    "name": "Urdesa",
    "parentCity": "Guayaquil"
  },
  {
    "slug": "kennedy",
    "name": "Kennedy",
    "parentCity": "Guayaquil"
  },
  {
    "slug": "puerto-santa-ana",
    "name": "Puerto Santa Ana",
    "parentCity": "Guayaquil"
  },
  {
    "slug": "cuenca",
    "name": "Cuenca",
    "parentCity": null
  },
  {
    "slug": "ricaurte",
    "name": "Ricaurte",
    "parentCity": "Cuenca"
  },
  {
    "slug": "challuabamba",
    "name": "Challuabamba",
    "parentCity": "Cuenca"
  },
  {
    "slug": "banos",
    "name": "Baños",
    "parentCity": "Cuenca"
  },
  {
    "slug": "san-joaquin",
    "name": "San Joaquín",
    "parentCity": "Cuenca"
  },
  {
    "slug": "gualaceo",
    "name": "Gualaceo",
    "parentCity": null
  },
  {
    "slug": "paute",
    "name": "Paute",
    "parentCity": null
  },
  {
    "slug": "chordeleg",
    "name": "Chordeleg",
    "parentCity": null
  },
  {
    "slug": "giron",
    "name": "Girón",
    "parentCity": null
  },
  {
    "slug": "manta",
    "name": "Manta",
    "parentCity": null
  },
  {
    "slug": "montecristi",
    "name": "Montecristi",
    "parentCity": null
  },
  {
    "slug": "portoviejo",
    "name": "Portoviejo",
    "parentCity": null
  },
  {
    "slug": "jaramijo",
    "name": "Jaramijó",
    "parentCity": null
  },
  {
    "slug": "jipijapa",
    "name": "Jipijapa",
    "parentCity": null
  },
  {
    "slug": "chone",
    "name": "Chone",
    "parentCity": null
  },
  {
    "slug": "bahia-de-caraquez",
    "name": "Bahía de Caráquez",
    "parentCity": null
  },
  {
    "slug": "puerto-lopez",
    "name": "Puerto López",
    "parentCity": null
  },
  {
    "slug": "salinas",
    "name": "Salinas",
    "parentCity": null
  },
  {
    "slug": "la-libertad",
    "name": "La Libertad",
    "parentCity": null
  },
  {
    "slug": "santa-elena",
    "name": "Santa Elena",
    "parentCity": null
  },
  {
    "slug": "punta-blanca",
    "name": "Punta Blanca",
    "parentCity": null
  },
  {
    "slug": "ambato",
    "name": "Ambato",
    "parentCity": null
  },
  {
    "slug": "banos-de-agua-santa",
    "name": "Baños de Agua Santa",
    "parentCity": null
  },
  {
    "slug": "pelileo",
    "name": "Pelileo",
    "parentCity": null
  },
  {
    "slug": "riobamba",
    "name": "Riobamba",
    "parentCity": null
  },
  {
    "slug": "guano",
    "name": "Guano",
    "parentCity": null
  },
  {
    "slug": "latacunga",
    "name": "Latacunga",
    "parentCity": null
  },
  {
    "slug": "salcedo",
    "name": "Salcedo",
    "parentCity": null
  },
  {
    "slug": "ibarra",
    "name": "Ibarra",
    "parentCity": null
  },
  {
    "slug": "otavalo",
    "name": "Otavalo",
    "parentCity": null
  },
  {
    "slug": "cotacachi",
    "name": "Cotacachi",
    "parentCity": null
  },
  {
    "slug": "tulcan",
    "name": "Tulcán",
    "parentCity": null
  },
  {
    "slug": "loja",
    "name": "Loja",
    "parentCity": null
  },
  {
    "slug": "catamayo",
    "name": "Catamayo",
    "parentCity": null
  },
  {
    "slug": "machala",
    "name": "Machala",
    "parentCity": null
  },
  {
    "slug": "santa-rosa",
    "name": "Santa Rosa",
    "parentCity": null
  },
  {
    "slug": "huaquillas",
    "name": "Huaquillas",
    "parentCity": null
  },
  {
    "slug": "santo-domingo",
    "name": "Santo Domingo",
    "parentCity": null
  },
  {
    "slug": "quevedo",
    "name": "Quevedo",
    "parentCity": null
  },
  {
    "slug": "babahoyo",
    "name": "Babahoyo",
    "parentCity": null
  },
  {
    "slug": "esmeraldas",
    "name": "Esmeraldas",
    "parentCity": null
  },
  {
    "slug": "atacames",
    "name": "Atacames",
    "parentCity": null
  },
  {
    "slug": "tena",
    "name": "Tena",
    "parentCity": null
  },
  {
    "slug": "puyo",
    "name": "Puyo",
    "parentCity": null
  },
  {
    "slug": "nueva-loja",
    "name": "Nueva Loja",
    "parentCity": null
  },
  {
    "slug": "el-coca",
    "name": "El Coca",
    "parentCity": null
  },
  {
    "slug": "macas",
    "name": "Macas",
    "parentCity": null
  },
  {
    "slug": "zamora",
    "name": "Zamora",
    "parentCity": null
  },
  {
    "slug": "puerto-ayora",
    "name": "Puerto Ayora",
    "parentCity": null
  },
  {
    "slug": "puerto-baquerizo-moreno",
    "name": "Puerto Baquerizo Moreno",
    "parentCity": null
  },
  {
    "slug": "puerto-villamil",
    "name": "Puerto Villamil",
    "parentCity": null
  }
];
export function findDirectoryLocation(slug?: string): DirectoryLocation | undefined {
  return DIRECTORY_LOCATIONS.find(item => item.slug === slug);
}
