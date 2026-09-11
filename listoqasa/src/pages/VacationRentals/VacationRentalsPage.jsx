import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  Bot,
} from "lucide-react";

import {
  useTranslation,
} from "react-i18next";

import SiteLayout from "../../components/layout/SiteLayout";

import {
  getLocationCount,
  getVacationRentalsLayoutData,
} from "../../api/vacationRentalsApi";

import vacationHeroImage from "../../assets/public/images/listoqasa/home-hero.jpg";

import "./VacationRentalsPage.css";

const PROPERTY_PLACEHOLDER = "";

/*
 * These 8 city names are DESIGN CONFIGURATION,
 * not fake property data.
 *
 * Property counts below are always loaded from the API.
 * Images are presentation assets.
 */
const LOCATION_IMAGES = import.meta.glob(
  "../../assets/public/images/listoqasa/locations/*.jpg",
  {
    eager: true,
    import: "default",
  }
);

function getLocationImage(slug) {
  const suffix = `/locations/${slug}.jpg`;

  const match = Object.entries(LOCATION_IMAGES).find(
    ([path]) => path.endsWith(suffix)
  );

  return match?.[1] || "";
}

const LOCATION_CONFIG = [
  {
    city: "Quito",
    slug: "quito",
  },
  {
    city: "Guayaquil",
    slug: "guayaquil",
  },
  {
    city: "Cuenca",
    slug: "cuenca",
  },
  {
    city: "Manta",
    slug: "manta",
  },
  {
    city: "Cumbayá",
    slug: "cumbaya",
  },
  {
    city: "Samborondón",
    slug: "samborondon",
  },
  {
    city: "Tumbaco",
    slug: "tumbaco",
  },
  {
    city: "Salinas",
    slug: "salinas",
  },
];

function formatPrice(value, type) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  const numeric = Number(value);

  if (Number.isNaN(numeric)) {
    return String(value);
  }

  const formatted =
    new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(numeric);

  return type === "rent"
    ? `$${formatted} /month`
    : `$${formatted}`;
}

function normalizeProperty(item) {
  const area =
    item?.squareFeet ??
    item?.square_feet ??
    item?.lotSize ??
    item?.lot_size ??
    null;

  return {
    id: item.id,

    title:
      item.title ||
      item.name ||
      "Untitled Property",

    city:
      item.city || "",

    state:
      item.state || "",

    price:
      formatPrice(
        item.price,
        item.type
      ),

    beds:
      item.bedrooms ??
      item.beds ??
      null,

    baths:
      item.bathrooms ??
      item.baths ??
      null,

    area,

    image:
      item.thumbnailUrl ||
      item.thumbnail_url ||
      item.coverImage ||
      (
        Array.isArray(item.images)
          ? item.images[0]
          : null
      ) ||
      PROPERTY_PLACEHOLDER,

    propertyType:
      item.propertyType ||
      item.property_type ||
      "",

    type:
      item.type || "",

    publishedAt:
      item.publishedAt ||
      item.published_at ||
      null,

    createdAt:
      item.createdAt ||
      item.created_at ||
      null,
  };
}

function getBadge(section, t) {
  switch (section) {
    case "rent":
      return {
        text:
          t(
            "vacationBrowse.badges.forRent"
          ),
        className: "rent",
      };

    case "land":
      return {
        text:
          t(
            "vacationBrowse.badges.land"
          ),
        className: "land",
      };

    case "commercial":
      return {
        text:
          t(
            "vacationBrowse.badges.commercial"
          ),
        className: "commercial",
      };

    case "new":
      return {
        text:
          t(
            "vacationBrowse.badges.newProject"
          ),
        className: "new",
      };

    default:
      return null;
  }
}

function PropertyCard({
  property,
  section,
}) {
  const { t } =
    useTranslation();

  const badge =
    getBadge(section, t);

  return (
    <article className="lq-vr-card">
      <Link
        to={`/property?id=${property.id}`}
        className="lq-vr-card-link"
      >
        <div className="lq-vr-card-image-wrap">
          <img
            src={property.image}
            alt={property.title}
            className="lq-vr-card-image"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />

          {badge && (
            <span
              className={`lq-vr-badge lq-vr-badge-${badge.className}`}
            >
              {badge.text}
            </span>
          )}
        </div>

        <div className="lq-vr-card-body">
          <h3>
            {property.title}
          </h3>

          <div className="lq-vr-card-location">
            <MapPin size={12} />

            <span>
              {[
                property.city,
                property.state,
              ]
                .filter(Boolean)
                .join(", ")}
            </span>
          </div>

          <div className="lq-vr-card-price">
            {property.price || "—"}
          </div>

          <div className="lq-vr-card-meta">
            {property.beds != null && (
              <span>
                <BedDouble
                  size={13}
                />

                {property.beds}{" "}
                {t(
                  "vacationBrowse.beds"
                )}
              </span>
            )}

            {property.baths != null && (
              <span>
                <Bath size={13} />

                {property.baths}{" "}
                {t(
                  "vacationBrowse.baths"
                )}
              </span>
            )}

            {property.area != null && (
              <span>
                <Maximize2
                  size={13}
                />

                {Number(
                  property.area
                ).toLocaleString()}{" "}
                m²
              </span>
            )}
          </div>
        </div>
      </Link>

      <button
        type="button"
        className="lq-vr-heart"
        aria-label={t(
          "vacationBrowse.save"
        )}
      >
        <Heart size={23} />
      </button>
    </article>
  );
}

function PropertyRow({
  title,
  items,
  section,
  loading,
  viewAllTo,
}) {
  const { t } =
    useTranslation();

  const rowRef =
    useRef(null);

  const scrollRow = (
    direction
  ) => {
    const element =
      rowRef.current;

    if (!element) return;

    element.scrollBy({
      left:
        direction *
        Math.max(
          300,
          element.clientWidth *
            0.72
        ),

      behavior: "smooth",
    });
  };

  return (
    <section className="lq-vr-section">
      <div className="lq-vr-section-header">
        <h2>
          {title}
        </h2>

        <Link
          to={viewAllTo}
          className="lq-vr-view-all"
        >
          {t(
            "vacationBrowse.viewAll"
          )}

          <ArrowRight
            size={16}
          />
        </Link>
      </div>

      <div className="lq-vr-row-shell">
        <div
          ref={rowRef}
          className="lq-vr-row"
        >
          {loading
            ? Array.from({
                length: 6,
              }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="lq-vr-card lq-vr-card-skeleton"
                  >
                    <div className="lq-vr-skeleton-image" />

                    <div className="lq-vr-skeleton-line" />

                    <div className="lq-vr-skeleton-line small" />
                  </div>
                )
              )
            : items.map(
                (property) => (
                  <PropertyCard
                    key={
                      property.id
                    }
                    property={
                      property
                    }
                    section={
                      section
                    }
                  />
                )
              )}
        </div>

        {!loading &&
          items.length > 0 && (
            <>
              <button
                type="button"
                className="lq-vr-arrow lq-vr-arrow-left"
                aria-label="Previous"
                onClick={() =>
                  scrollRow(-1)
                }
              >
                <ChevronLeft
                  size={22}
                />
              </button>

              <button
                type="button"
                className="lq-vr-arrow lq-vr-arrow-right"
                aria-label="Next"
                onClick={() =>
                  scrollRow(1)
                }
              >
                <ChevronRight
                  size={22}
                />
              </button>
            </>
          )}
      </div>

      {!loading &&
        items.length === 0 && (
          <p className="lq-vr-empty">
            {t(
              "vacationBrowse.noProperties"
            )}
          </p>
        )}
    </section>
  );
}

export default function VacationRentalsPage() {
  const { t } =
    useTranslation();

  const [loading, setLoading] =
    useState(true);

  const [data, setData] =
    useState({
      homesForRent: [],
      land: [],
      commercial: [],
      newProjects: [],
    });

  const [
    locationCounts,
    setLocationCounts,
  ] = useState({});

  useEffect(() => {
    const controller =
      new AbortController();

    const load = async () => {
      try {
        const result =
          await getVacationRentalsLayoutData(
            {
              limit: 6,
              signal:
                controller.signal,
            }
          );

        if (
          controller.signal.aborted
        ) {
          return;
        }

        setData({
          homesForRent:
            result.homesForRent.items.map(
              normalizeProperty
            ),

          land:
            result.land.items.map(
              normalizeProperty
            ),

          commercial:
            result.commercial.items.map(
              normalizeProperty
            ),

          newProjects:
            result.newProjects.items.map(
              normalizeProperty
            ),
        });
      } catch (error) {
        if (
          error?.name !==
          "AbortError"
        ) {
          console.error(
            "Vacation rentals layout API error:",
            error
          );
        }
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setLoading(false);
        }
      }

      /*
       * Counts are real API values.
       * We only keep city/image names as layout config.
       */
      const countResults =
        await Promise.allSettled(
          LOCATION_CONFIG.map(
            (location) =>
              getLocationCount(
                location.city,
                controller.signal
              )
          )
        );

      if (
        controller.signal.aborted
      ) {
        return;
      }

      const nextCounts = {};

      countResults.forEach(
        (result, index) => {
          const city =
            LOCATION_CONFIG[index]
              .city;

          nextCounts[city] =
            result.status ===
            "fulfilled"
              ? result.value.total
              : 0;
        }
      );

      setLocationCounts(
        nextCounts
      );
    };

    load();

    return () => {
      controller.abort();
    };
  }, []);

  const locations =
    useMemo(
      () =>
        LOCATION_CONFIG.map(
          (location) => ({
            ...location,

            image: getLocationImage(location.slug),

            count:
              Number(
                locationCounts[
                  location.city
                ] || 0
              ),
          })
        ),
      [locationCounts]
    );

  return (
    <SiteLayout
      headerVariant="light"
    >
      <section
        className="lq-vr-hero"
        style={{
          "--lq-vr-hero-image": `url(${vacationHeroImage})`,
        }}
      >
        <div className="lq-vr-hero-overlay" />
        <div className="lq-vr-hero-inner">
          <div className="lq-vr-hero-copy">
            <h1>{t("vacationBrowse.heroTitle")}</h1>

            <div className="lq-vr-hero-tabs">
              <Link to="/">{t("vacationBrowse.heroTabs.buy")}</Link>
              <Link to="/">{t("vacationBrowse.heroTabs.rent")}</Link>
              <Link to="/vacation-rentals" className="active">
                {t("vacationBrowse.heroTabs.vacationRentals")}
              </Link>
            </div>

            <form
              className="lq-vr-hero-search"
              onSubmit={(event) => event.preventDefault()}
            >
              <MapPin size={20} />
              <input
                type="text"
                placeholder={t("vacationBrowse.heroSearchPlaceholder")}
              />
              <button type="submit">
                {t("vacationBrowse.heroSearchButton")}
              </button>
            </form>

            <p className="lq-vr-hero-tagline">
              {t("vacationBrowse.heroTagline")}
            </p>
          </div>
        </div>
      </section>

      <main className="lq-vr-page">
        <div className="lq-vr-container">
          <PropertyRow
            title={t(
              "vacationBrowse.homesForRent"
            )}
            items={
              data.homesForRent
            }
            section="rent"
            loading={loading}
            viewAllTo="/rent"
          />

          <PropertyRow
            title={t(
              "vacationBrowse.landDevelopment"
            )}
            items={data.land}
            section="land"
            loading={loading}
            viewAllTo="/land"
          />

          <PropertyRow
            title={t(
              "vacationBrowse.commercialProperties"
            )}
            items={
              data.commercial
            }
            section="commercial"
            loading={loading}
            viewAllTo="/commercial"
          />

          <PropertyRow
            title={t(
              "vacationBrowse.newProjects"
            )}
            items={
              data.newProjects
            }
            section="new"
            loading={loading}
            viewAllTo="/new-projects"
          />

          <section className="lq-vr-locations-section">
            <h2>
              {t(
                "vacationBrowse.exploreEcuador"
              )}
            </h2>

            <div className="lq-vr-locations">
              {locations.map(
                (location) => (
                  <Link
                    key={
                      location.slug
                    }
                    to={`/buy?city=${encodeURIComponent(
                      location.city
                    )}`}
                    className="lq-vr-location-card"
                  >
                    <img
                      src={
                        location.image
                      }
                      alt=""
                      loading="lazy"
                    />

                    <div className="lq-vr-location-shade" />

                    <div className="lq-vr-location-copy">
                      <strong>
                        {
                          location.city
                        }
                      </strong>

                      <span>
                        {location.count.toLocaleString()}{" "}
                        {t(
                          "vacationBrowse.properties"
                        )}
                      </span>
                    </div>
                  </Link>
                )
              )}
            </div>
          </section>

          <section className="lq-vr-agent-cta">
            <div className="lq-vr-agent-icon">
              <Bot size={35} />
            </div>

            <div className="lq-vr-agent-copy">
              <h3>
                {t(
                  "vacationBrowse.agentTitle"
                )}
              </h3>

              <p>
                {t(
                  "vacationBrowse.agentText"
                )}
              </p>
            </div>

            <Link
              to="/agents"
              className="lq-vr-agent-link"
            >
              {t(
                "vacationBrowse.joinAgent"
              )}

              <ArrowRight
                size={22}
              />
            </Link>
          </section>
        </div>
      </main>
    </SiteLayout>
  );
}
