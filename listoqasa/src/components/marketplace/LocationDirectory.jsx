import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LocationDirectory.css';

// Directory labels are approved copy. Links use the backend's exact city filter;
// never silently broaden an area query to its parent city.
export const LOCATION_GROUPS = [
  ['QUITO & SURROUNDING AREAS', 'Quito','Cumbayá','Tumbaco','La Carolina','Iñaquito','González Suárez','La Floresta','Quito Tenis','El Batán','Nayón','Calderón','Conocoto','Sangolquí','Valle de Los Chillos','Pomasqui','Cayambe','Machachi'],
  ['GUAYAQUIL & NEARBY MARKETS','Guayaquil','Samborondón','Durán','Daule','Milagro','Playas','Norte de Guayaquil','Centro de Guayaquil','Vía a la Costa','Los Ceibos','Urdesa','Kennedy','Puerto Santa Ana'],
  ['CUENCA & AZUAY','Cuenca','Ricaurte','Challuabamba','Baños','San Joaquín','Gualaceo','Paute','Chordeleg','Girón'],
  ['MANTA & MANABÍ','Manta','Montecristi','Portoviejo','Jaramijó','Jipijapa','Chone','Bahía de Caráquez','Puerto López'],
  ['SANTA ELENA','Salinas','La Libertad','Santa Elena','Punta Blanca'],
  ['CENTRAL & NORTHERN HIGHLANDS','Ambato','Baños de Agua Santa','Pelileo','Riobamba','Guano','Latacunga','Salcedo','Ibarra','Otavalo','Cotacachi','Tulcán'],
  ['SOUTHERN & COASTAL CITIES','Loja','Catamayo','Machala','Santa Rosa','Huaquillas','Santo Domingo','Quevedo','Babahoyo','Esmeraldas','Atacames'],
  ['AMAZON & GALÁPAGOS','Tena','Puyo','Nueva Loja','El Coca','Macas','Zamora','Puerto Ayora','Puerto Baquerizo Moreno','Puerto Villamil'],
];
export const locationSlug = (name) => name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
// Parent city is used to scope neighborhoods without broadening them to the whole city.
const PARENTS = {
  'QUITO & SURROUNDING AREAS': 'Quito',
  'GUAYAQUIL & NEARBY MARKETS': 'Guayaquil',
  'CUENCA & AZUAY': 'Cuenca',
  'MANTA & MANABÍ': 'Manta',
};
const INDEPENDENT_CITIES = new Set(['Quito','Cumbayá','Tumbaco','Sangolquí','Cayambe','Machachi','Guayaquil','Samborondón','Durán','Daule','Milagro','Playas','Cuenca','Gualaceo','Paute','Chordeleg','Girón','Manta','Montecristi','Portoviejo','Jaramijó','Jipijapa','Chone','Bahía de Caráquez','Puerto López']);
export const DIRECTORY_LOCATIONS = LOCATION_GROUPS.flatMap(([group,...names])=>names.map(name=>({name,slug:locationSlug(name),group,parentCity:INDEPENDENT_CITIES.has(name)?null:PARENTS[group]||null})));
export const nearbyLocations = (item) => DIRECTORY_LOCATIONS.filter(x => x.group === item.group && x.slug !== item.slug).slice(0,6);
export default function LocationDirectory(){useEffect(() => { if (sessionStorage.getItem('lq:directory-focus') === '1') { sessionStorage.removeItem('lq:directory-focus'); requestAnimationFrame(() => document.getElementById('lq-location-directory-title')?.scrollIntoView({block:'start'})); } }, []);return <section className="lq-location-directory" aria-labelledby="lq-location-directory-title"><h2 id="lq-location-directory-title">Explore Properties Across Ecuador</h2><div className="lq-location-directory-grid">{LOCATION_GROUPS.map(([group,...names])=><div className="lq-location-directory-group" key={group}><h3>{group}</h3><ul>{names.map(name=><li key={name}><Link to={`/properties-in/${locationSlug(name)}`}>{name}</Link></li>)}</ul></div>)}</div></section>}
