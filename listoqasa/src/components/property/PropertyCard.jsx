import React, { useState } from "react";
import { Link } from "react-router-dom";

import { Heart, MapPin, BedDouble, Bath, Maximize2 } from "lucide-react";

import { useTranslation } from "react-i18next";

export default function PropertyCard({ property, showNew = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = property.image || property.thumbnailUrl || property.thumbnail_url || property.coverImage || property.images?.[0]?.url || property.images?.[0];
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
        /> : <div className="lq-property-image lq-property-image-empty" role="img" aria-label="Property photo unavailable" style={{display:"grid",placeItems:"center",background:"#eef2f7",color:"#667085",minHeight:160}}>Photo unavailable</div>}

        </Link>
        {showNew && <span className="lq-property-new">{t("home.new")}</span>}

        <button
          type="button"
          className="lq-property-favorite"
          aria-label="Add property to favorites"
        >
          <Heart size={22} strokeWidth={1.8} />
        </button>
      </div>

      <div className="lq-property-body">
        <h3><Link to={target}>{property.title}</Link></h3>

        <div className="lq-property-location">
          <MapPin size={13} />

          <span>{property.location}</span>
        </div>

        <div className="lq-property-price">{property.price}</div>

        <div className="lq-property-meta">
          {property.beds && (
            <span>
              <BedDouble size={13} />
              {property.beds} {t("home.beds")}
            </span>
          )}

          {property.baths && (
            <span>
              <Bath size={13} />
              {property.baths} {t("home.baths")}
            </span>
          )}

          {property.area && (
            <span>
              <Maximize2 size={13} />

              {property.area}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
