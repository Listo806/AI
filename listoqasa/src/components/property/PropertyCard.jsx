import { propertyCoverImage } from "../../api/propertyPresentation";
import React, { useState } from "react";
import { Link } from "react-router-dom";

import { Heart, MapPin, BedDouble, Bath, Maximize2 } from "lucide-react";

import { useTranslation } from "react-i18next";

export default function PropertyCard({ property, showNew = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = propertyCoverImage(property);
  const target = `/property/${encodeURIComponent(property.id)}?type=${encodeURIComponent(property.type || "sale")}`;
  const { t } = useTranslation();

  return (
    <article className="lq-property-card">
      <div className="lq-property-image-wrap">
        <Link to={target} aria-label={`View ${property.title}`}>
        {!imageFailed && image ? <img
          src={image}
          alt={property.title}
          className="lq-property-image"
          onError={() => setImageFailed(true)}
        /> : <div className="lq-property-image lq-property-image-empty" role="img" aria-label="Property photo unavailable" style={{display:"grid",placeItems:"center",background:"#eef2f7",color:"#667085",minHeight:160}}></div>}

        </Link>
        <span className="lq-compact-status">{property.type === 'rent' ? t('properties.rent', { defaultValue: 'For Rent' }) : t('properties.buy', { defaultValue: 'For Sale' })}</span>

        <button
          type="button"
          className="lq-property-favorite"
          aria-label="Add property to favorites"
        >
          <Heart size={22} strokeWidth={1.8} />
        </button>
      </div>

      <div className="lq-property-body lq-compact-card-body">
        <div className="lq-compact-main-line">
          <strong>{property.propertyType || property.raw?.propertyType || 'Property'}</strong>
          <span>·</span><span>{property.raw?.city || property.location || 'Ecuador'}, {property.raw?.country || 'Ecuador'}</span>
          <span>·</span><strong className="lq-compact-price">{property.price}</strong>
        </div>
        <div className="lq-compact-specs">
          <span><Bath size={16}/>{property.baths ?? '—'} {t('home.baths')}</span>
          <span><Maximize2 size={16}/>{property.area ?? '—'} m²</span>
        </div>
      </div>
    </article>
  );
}
