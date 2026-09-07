import React from "react";

import { Heart, MapPin, BedDouble, Bath, Maximize2 } from "lucide-react";

import { useTranslation } from "react-i18next";

export default function PropertyCard({ property, showNew = false }) {
  const { t } = useTranslation();

  return (
    <article className="lq-property-card">
      <div className="lq-property-image-wrap">
        <img
          src={property.image}
          alt={property.title}
          className="lq-property-image"
        />

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
        <h3>{property.title}</h3>

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
