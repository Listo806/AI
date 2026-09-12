import React, { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Users,
  CalendarDays,
  MapPin,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import SiteLayout from "../../components/layout/SiteLayout";
import {
  legacyVacationSections,
  legacyVacationDestinations,
} from "./legacyVacationData";

import VacationRentalsFooter from "./VacationRentalsFooter";

import "./VacationRentalsPage.css";

function LegacyStayRow({ section }) {
  const { t } = useTranslation();
  const rowRef = useRef(null);

  const move = (direction) => {
    const row = rowRef.current;
    if (!row) return;

    row.scrollBy({
      left:
        direction *
        Math.max(300, row.clientWidth * 0.75),
      behavior: "smooth",
    });
  };

  return (
    <section className="lq-old-vr-section">
      <div className="lq-old-vr-section-head">
        <h2>
          {t(`vacationLegacy.sections.${section.key}`, {
            defaultValue: section.title,
          })}
        </h2>

        <Link
          to={section.viewAll}
          className="lq-old-vr-view-all"
        >
          {t("vacationLegacy.viewAll", {
            defaultValue: "View all",
          })}
        </Link>
      </div>

      <div className="lq-old-vr-row-shell">
        <div
          className="lq-old-vr-row"
          ref={rowRef}
        >
          {section.items.map((stay, index) => (
            <article
              className="lq-old-vr-card"
              key={`${section.key}-${index}`}
            >
              <img
                src={stay.image}
                alt={stay.title}
                loading="lazy"
              />

              <div className="lq-old-vr-card-copy">
                <h3>{stay.title}</h3>
                <p>{stay.subtitle}</p>
              </div>
            </article>
          ))}
        </div>

        <button
          type="button"
          className="lq-old-vr-arrow lq-old-vr-arrow-left"
          onClick={() => move(-1)}
          aria-label="Previous"
        >
          <ChevronLeft size={22} />
        </button>

        <button
          type="button"
          className="lq-old-vr-arrow lq-old-vr-arrow-right"
          onClick={() => move(1)}
          aria-label="Next"
        >
          <ChevronRight size={22} />
        </button>
      </div>
    </section>
  );
}

export default function VacationRentalsPage() {
  const { t } = useTranslation();

  const [city, setCity] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  const [guests, setGuests] = useState({
    adults: 0,
    children: 0,
    infants: 0,
    pets: 0,
  });

  const [guestOpen, setGuestOpen] = useState(false);

  const totalGuests = useMemo(
    () =>
      guests.adults +
      guests.children +
      guests.infants,
    [guests]
  );

  const changeGuest = (key, delta) => {
    setGuests((current) => ({
      ...current,
      [key]: Math.max(0, current[key] + delta),
    }));
  };

  const submitSearch = (event) => {
    event.preventDefault();

    const params = new URLSearchParams();

    if (city.trim()) {
      params.set("city", city.trim());
    }

    if (checkIn) {
      params.set("checkIn", checkIn);
    }

    if (checkOut) {
      params.set("checkOut", checkOut);
    }

    if (totalGuests > 0) {
      params.set("guests", String(totalGuests));
    }

    window.location.href =
      `https://listostays.com/vacation-rentals/search?${params.toString()}`;
  };

  return (
    <SiteLayout headerVariant="light" showFooter={false}>
      <section className="lq-old-vr-hero">
        <div className="lq-old-vr-overlay" />

        <div className="lq-old-vr-hero-content">
          <h1>
            {t("vacationLegacy.heroTitle", {
              defaultValue: "Find your perfect stay",
            })}
          </h1>

          <p>
            {t("vacationLegacy.heroSubtitle", {
              defaultValue:
                "Beachfront, city, nature & luxury stays across Latin America",
            })}
          </p>

          <form
            className="lq-old-vr-search"
            onSubmit={submitSearch}
          >
            <label className="lq-old-vr-search-field lq-old-vr-search-where">
              <span>
                {t("vacationLegacy.where", {
                  defaultValue: "Where",
                })}
              </span>

              <div>
                <MapPin size={17} />

                <input
                  value={city}
                  onChange={(event) =>
                    setCity(event.target.value)
                  }
                  placeholder={t(
                    "vacationLegacy.destinationPlaceholder",
                    {
                      defaultValue:
                        "Search destinations",
                    }
                  )}
                />
              </div>
            </label>

            <label className="lq-old-vr-search-field">
              <span>
                {t("vacationLegacy.checkIn", {
                  defaultValue: "Check in",
                })}
              </span>

              <div>
                <CalendarDays size={17} />
                <input
                  type="date"
                  value={checkIn}
                  onChange={(event) =>
                    setCheckIn(event.target.value)
                  }
                />
              </div>
            </label>

            <label className="lq-old-vr-search-field">
              <span>
                {t("vacationLegacy.checkOut", {
                  defaultValue: "Check out",
                })}
              </span>

              <div>
                <CalendarDays size={17} />
                <input
                  type="date"
                  value={checkOut}
                  onChange={(event) =>
                    setCheckOut(event.target.value)
                  }
                />
              </div>
            </label>

            <div className="lq-old-vr-guests-wrap">
              <button
                type="button"
                className="lq-old-vr-search-field lq-old-vr-guests-trigger"
                onClick={() =>
                  setGuestOpen((value) => !value)
                }
              >
                <span>
                  {t("vacationLegacy.guests", {
                    defaultValue: "Guests",
                  })}
                </span>

                <div>
                  <Users size={17} />
                  <strong>
                    {totalGuests > 0
                      ? `${totalGuests} ${t(
                          "vacationLegacy.guests",
                          { defaultValue: "Guests" }
                        )}`
                      : t("vacationLegacy.addGuests", {
                          defaultValue: "Add guests",
                        })}
                  </strong>
                </div>
              </button>

              {guestOpen && (
                <div className="lq-old-vr-guests-panel">
                  {[
                    ["adults", "Adults", "Ages 13 or above"],
                    ["children", "Children", "Ages 2–12"],
                    ["infants", "Infants", "Under 2"],
                    ["pets", "Pets", "Bringing a service animal?"],
                  ].map(([key, title, subtitle]) => (
                    <div
                      className="lq-old-vr-guest-row"
                      key={key}
                    >
                      <div>
                        <strong>
                          {t(
                            `vacationLegacy.guestTypes.${key}`,
                            { defaultValue: title }
                          )}
                        </strong>

                        <small>{subtitle}</small>
                      </div>

                      <div className="lq-old-vr-guest-controls">
                        <button
                          type="button"
                          onClick={() =>
                            changeGuest(key, -1)
                          }
                        >
                          <Minus size={14} />
                        </button>

                        <span>{guests[key]}</span>

                        <button
                          type="button"
                          onClick={() =>
                            changeGuest(key, 1)
                          }
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="lq-old-vr-search-submit"
            >
              <Search size={18} />
              {t("vacationLegacy.search", {
                defaultValue: "Search",
              })}
            </button>
          </form>
        </div>
      </section>

      <main className="lq-old-vr-page">
        <div className="lq-old-vr-container">
          {legacyVacationSections.map((section) => (
            <LegacyStayRow
              key={section.key}
              section={section}
            />
          ))}
        </div>

        <section className="lq-old-vr-seo">
          <div className="lq-old-vr-container">
            <h2>
              {t("vacationLegacy.exploreTitle", {
                defaultValue:
                  "Explore vacation rentals across Latin America",
              })}
            </h2>

            <div className="lq-old-vr-seo-grid">
              {legacyVacationDestinations.map(
                (group) => (
                  <div
                    className="lq-old-vr-seo-col"
                    key={group.country}
                  >
                    <h3>{group.country}</h3>

                    <div>
                      {group.cities.map((cityName) => (
                        <Link
                          key={cityName}
                          to={`/vacation-rentals?city=${encodeURIComponent(
                            cityName
                          )}`}
                        >
                          {cityName}
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      </main>

      <VacationRentalsFooter />
    </SiteLayout>
  );
}
