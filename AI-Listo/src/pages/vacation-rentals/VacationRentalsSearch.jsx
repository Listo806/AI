import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PropertyMap from "../../components/PropertyMap";
import ContactModal from "../../components/ContactModal";
import PropertyWhatsAppModal from "../../components/PropertyWhatsAppModal";
import ImageCarousel from "../../components/ImageCarousel";
import { AMENITIES, formatAmenity } from "../../lib/amenities";
import { searchVacationRentals } from "../../api/vacationRentalsApi";
import "../listings/Listings.css";
import "./VacationRentalsSearch.css";

const PROPERTY_TYPE_OPTIONS = [
  "house",
  "apartment",
  "land",
  "commercial",
  "villa",
  "office",
];

const PAGE_SIZE = 20;

function normalizeVacationProperty(p) {
  const thumb = p.thumbnailUrl || p.primaryImage || null;
  const rawImages = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
  const images = rawImages.length > 0 ? rawImages : (thumb ? [thumb] : []);
  return {
    ...p,
    thumbnailUrl: thumb,
    images,
    amenities: Array.isArray(p.amenities) ? p.amenities : [],
    ratingAvg: p.ratingAvg != null ? Number(p.ratingAvg) : 0,
    ratingCount: p.ratingCount != null ? Number(p.ratingCount) : 0,
    price: p.pricePerNight ?? p.price ?? null,
  };
}

function formatDateRangeLine(checkIn, checkOut) {
  if (!checkIn || !checkOut) return null;
  try {
    const a = new Date(checkIn);
    const b = new Date(checkOut);
    const opts = { month: "short", day: "numeric" };
    return `${a.toLocaleDateString("en-US", opts)} – ${b.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
  } catch {
    return null;
  }
}

function fmtDayMonth(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatPillDates(checkIn, checkOut) {
  if (!checkIn && !checkOut) return "Select dates";
  if (checkIn && checkOut) return `${fmtDayMonth(checkIn)} – ${fmtDayMonth(checkOut)}`;
  if (checkIn) return `${fmtDayMonth(checkIn)} – Add checkout`;
  return `Add check-in – ${fmtDayMonth(checkOut)}`;
}

function exploreCardSubtitle(property, t) {
  const desc = (property.description || "").replace(/\s+/g, " ").trim();
  if (desc.length > 32) return desc.length > 88 ? `${desc.slice(0, 88)}…` : desc;
  const parts = [];
  if (property.city) parts.push(property.city);
  if (property.state) parts.push(property.state);
  if (property.propertyType)
    parts.push(t(`properties.propertyType_${property.propertyType}`));
  if (property.bedrooms != null && property.bedrooms !== "")
    parts.push(`${property.bedrooms} bd`);
  if (property.bathrooms != null && property.bathrooms !== "")
    parts.push(`${property.bathrooms} ba`);
  if (property.maxGuests != null && property.maxGuests !== "")
    parts.push(`${property.maxGuests} guest${Number(property.maxGuests) === 1 ? "" : "s"}`);
  return parts.join(" · ") || property.address || "";
}

export default function VacationRentalsSearch() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const urlPropertyType = searchParams.get("propertyType") || "";
  const urlSearch = searchParams.get("search") || "";
  const urlCity = searchParams.get("city") || "";
  const urlCheckIn = searchParams.get("checkIn") || "";
  const urlCheckOut = searchParams.get("checkOut") || "";
  const urlGuests = searchParams.get("guests") || "";
  const [pagination, setPagination] = useState({
    total: 0,
    limit: PAGE_SIZE,
    offset: 0,
  });
  const [loadingMore, setLoadingMore] = useState(false);

  const [draftCity, setDraftCity] = useState(urlCity);
  const [draftCheckIn, setDraftCheckIn] = useState(urlCheckIn);
  const [draftCheckOut, setDraftCheckOut] = useState(urlCheckOut);
  const [draftGuests, setDraftGuests] = useState(urlGuests);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState("list");
  const [selectedId, setSelectedId] = useState(null);
  const cardRefs = useRef({});
  const [searchPopover, setSearchPopover] = useState(null);
  const searchShellRef = useRef(null);

  useEffect(() => {
    if (!searchPopover) return;
    const onDown = (e) => {
      if (
        searchShellRef.current &&
        !searchShellRef.current.contains(e.target)
      ) {
        setSearchPopover(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [searchPopover]);

  const urlAmenities = (searchParams.get("amenities") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const [filters, setFilters] = useState({
    propertyType: urlPropertyType,
    search: urlSearch,
    minPrice: "",
    maxPrice: "",
    bedrooms: "",
    bathrooms: "",
    amenities: urlAmenities,
  });

  const [sortBy, setSortBy] = useState("newest");

  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [whatsappProperty, setWhatsappProperty] = useState(null);

  useEffect(() => {
    setDraftCity(urlCity);
    setDraftCheckIn(urlCheckIn);
    setDraftCheckOut(urlCheckOut);
    setDraftGuests(urlGuests);
  }, [urlCity, urlCheckIn, urlCheckOut, urlGuests]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      propertyType: urlPropertyType,
      search: urlSearch,
    }));
  }, [urlPropertyType, urlSearch]);

  useEffect(() => {
    // Any filter/sort change resets the result set from offset 0
    loadProperties({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    urlPropertyType,
    urlCity,
    urlSearch,
    urlCheckIn,
    urlCheckOut,
    urlGuests,
    filters.minPrice,
    filters.maxPrice,
    filters.bedrooms,
    filters.bathrooms,
    filters.amenities.join(","),
    sortBy,
  ]);

  const vacationDetailPath = (propertyId) => {
    const q = searchParams.toString();
    return q
      ? `/vacation-rentals/search/${propertyId}?${q}`
      : `/vacation-rentals/search/${propertyId}`;
  };

  const sortToApi = () => {
    if (sortBy === "price-low") return "price-low";
    if (sortBy === "price-high") return "price-high";
    return "recommended";
  };

  const loadProperties = async ({ reset = true, offsetOverride = null } = {}) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const minP =
        filters.minPrice !== "" && !Number.isNaN(Number(filters.minPrice))
          ? Number(filters.minPrice)
          : undefined;
      const maxP =
        filters.maxPrice !== "" && !Number.isNaN(Number(filters.maxPrice))
          ? Number(filters.maxPrice)
          : undefined;
      const bed =
        filters.bedrooms !== "" && !Number.isNaN(parseInt(filters.bedrooms, 10))
          ? parseInt(filters.bedrooms, 10)
          : undefined;
      const bath =
        filters.bathrooms !== "" && !Number.isNaN(parseFloat(filters.bathrooms))
          ? parseFloat(filters.bathrooms)
          : undefined;
      const guestsNum =
        urlGuests !== "" && !Number.isNaN(parseInt(urlGuests, 10))
          ? parseInt(urlGuests, 10)
          : undefined;

      const nextOffset = offsetOverride != null ? offsetOverride : (reset ? 0 : properties.length);

      const res = await searchVacationRentals({
        city: urlCity || undefined,
        checkIn: urlCheckIn || undefined,
        checkOut: urlCheckOut || undefined,
        search: urlSearch || undefined,
        propertyType: urlPropertyType || undefined,
        minPrice: minP,
        maxPrice: maxP,
        bedrooms: bed,
        bathrooms: bath,
        guests: guestsNum,
        amenities: filters.amenities.length > 0 ? filters.amenities.join(",") : undefined,
        sort: sortToApi(),
        limit: PAGE_SIZE,
        offset: nextOffset,
      });

      const raw = Array.isArray(res?.items) ? res.items : [];
      const normalized = raw.map(normalizeVacationProperty);

      if (reset) {
        setProperties(normalized);
        setSelectedId(null);
      } else {
        setProperties((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...normalized.filter((p) => !seen.has(p.id))];
        });
      }

      if (res && typeof res === "object" && !Array.isArray(res)) {
        setPagination({
          total: res.total ?? raw.length,
          limit: res.limit ?? PAGE_SIZE,
          offset: res.offset ?? nextOffset,
        });
      }
    } catch (err) {
      console.error("Failed to load vacation rentals:", err);
      setError(err.message || "Failed to load vacation rentals");
      if (reset) setProperties([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (loadingMore || loading) return;
    loadProperties({ reset: false });
  };

  const patchUrl = (updates) => {
    const params = new URLSearchParams(searchParams);
    params.delete("page");
    Object.entries(updates).forEach(([key, value]) => {
      if (value === "" || value == null) params.delete(key);
      else params.set(key, String(value));
    });
    setSearchParams(params);
  };

  const applyStickySearch = (e) => {
    e.preventDefault();
    patchUrl({
      city: draftCity.trim(),
      checkIn: draftCheckIn,
      checkOut: draftCheckOut,
      guests: draftGuests.trim(),
    });
    setSearchPopover(null);
  };

  const handleContactAgent = (property) => {
    setSelectedProperty(property);
    setShowContactModal(true);
  };

  const handleContactSubmit = (lead) => {
    console.log("Lead created:", lead);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (price) => {
    if (!price) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const mapProperties = properties.filter((p) => p.latitude && p.longitude);
  const selectedMapProperty =
    properties.find((p) => p.id === selectedId) || null;

  const handleMapPropertyClick = (property) => {
    setSelectedId(property.id);
    const el = cardRefs.current[property.id];
    el?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
    if (typeof window !== "undefined" && window.innerWidth <= 1024) {
      setMobilePanel("list");
    }
  };

  const handleCardActivate = (property) => {
    setSelectedId(property.id);
  };

  const dateLine = formatDateRangeLine(urlCheckIn, urlCheckOut);
  const headerCity = urlCity || "All locations";
  const resultsTitleCount =
    loading && properties.length === 0 ? "…" : pagination.total;

  const hasAnyFilters =
    urlSearch ||
    urlPropertyType ||
    urlCity ||
    urlCheckIn ||
    urlCheckOut ||
    urlGuests ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.bedrooms ||
    filters.bathrooms ||
    (filters.amenities && filters.amenities.length > 0);

  const clearAllFilters = () => {
    const next = new URLSearchParams();
    setSearchParams(next);
    setDraftCity("");
    setDraftCheckIn("");
    setDraftCheckOut("");
    setDraftGuests("");
    setFilters({
      propertyType: "",
      search: "",
      minPrice: "",
      maxPrice: "",
      bedrooms: "",
      bathrooms: "",
      amenities: [],
    });
    setSelectedId(null);
  };

  const modifyDatesOnly = () => {
    patchUrl({ checkIn: "", checkOut: "" });
    setDraftCheckIn("");
    setDraftCheckOut("");
  };

  return (
    <div className="listings-page vacation-rentals-page">
      {/* Sticky segmented search (Where / Dates / Guests) + submit */}
      <header className="vacation-sticky-search">
        <div className="vacation-sticky-search-container vacation-sticky-search-container--pill">
          <div className="vacation-search-shell" ref={searchShellRef}>
            <form
              className="vacation-search-pill-row"
              onSubmit={applyStickySearch}
            >
              <Link
                to="/dashboard"
                className="vacation-sticky-brand"
                onClick={() => setSearchPopover(null)}
              >
                <img
                  className="vacation-sticky-logo"
                  src="https://cdn.prod.website-files.com/69167a6a46fd073f4a958199/6921521d6cd18daedff74085_fb6918ba4a8709dd126682d90c8e31f1_ai_house_logo.avif"
                  alt=""
                />
                <span className="vacation-sticky-brand-text">Listo</span>
              </Link>

              <div className="vacation-search-pill" role="group" aria-label="Search vacation rentals">
                <button
                  type="button"
                  className={`vacation-pill-segment ${searchPopover === "where" ? "is-open" : ""}`}
                  onClick={() =>
                    setSearchPopover((p) => (p === "where" ? null : "where"))
                  }
                >
                  <span className="vacation-pill-label">Where</span>
                  <span className="vacation-pill-value">
                    {draftCity.trim() || "Search destinations"}
                  </span>
                </button>
                <button
                  type="button"
                  className={`vacation-pill-segment ${searchPopover === "dates" ? "is-open" : ""}`}
                  onClick={() =>
                    setSearchPopover((p) => (p === "dates" ? null : "dates"))
                  }
                >
                  <span className="vacation-pill-label">Check in · Check out</span>
                  <span className="vacation-pill-value">
                    {formatPillDates(draftCheckIn, draftCheckOut)}
                  </span>
                </button>
                <button
                  type="button"
                  className={`vacation-pill-segment ${searchPopover === "guests" ? "is-open" : ""}`}
                  onClick={() =>
                    setSearchPopover((p) => (p === "guests" ? null : "guests"))
                  }
                >
                  <span className="vacation-pill-label">Guests</span>
                  <span className="vacation-pill-value">
                    {draftGuests && String(draftGuests).trim() !== ""
                      ? `${draftGuests} guest${Number(draftGuests) === 1 ? "" : "s"}`
                      : "Add guests"}
                  </span>
                </button>
              </div>

              <button
                type="submit"
                className="vacation-pill-search-btn"
                aria-label="Search"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-4.3-4.3" />
                </svg>
              </button>
            </form>

            {searchPopover === "where" && (
              <div className="vacation-search-popover" role="dialog" aria-label="Where">
                <p className="vacation-popover-hint">
                  Search by city or destination.
                </p>
                <label className="vacation-popover-label" htmlFor="vac-pop-where-input">
                  Destination
                </label>
                <input
                  id="vac-pop-where-input"
                  className="vacation-popover-input"
                  value={draftCity}
                  onChange={(e) => setDraftCity(e.target.value)}
                  placeholder="Where to?"
                  autoComplete="off"
                />
                <div className="vacation-popover-actions">
                  <button
                    type="button"
                    className="listings-btn listings-btn-secondary"
                    onClick={() => setSearchPopover(null)}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {searchPopover === "dates" && (
              <div className="vacation-search-popover" role="dialog" aria-label="Dates">
                <p className="vacation-popover-hint">
                  Select check-in and check-out.
                </p>
                <div className="vacation-popover-dates">
                  <div>
                    <label className="vacation-popover-label" htmlFor="vac-pop-in">
                      Check-in
                    </label>
                    <input
                      id="vac-pop-in"
                      className="vacation-popover-input"
                      type="date"
                      value={draftCheckIn}
                      onChange={(e) => setDraftCheckIn(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="vacation-popover-label" htmlFor="vac-pop-out">
                      Check-out
                    </label>
                    <input
                      id="vac-pop-out"
                      className="vacation-popover-input"
                      type="date"
                      value={draftCheckOut}
                      onChange={(e) => setDraftCheckOut(e.target.value)}
                    />
                  </div>
                </div>
                <div className="vacation-popover-actions">
                  <button
                    type="button"
                    className="listings-btn listings-btn-secondary"
                    onClick={() => setSearchPopover(null)}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {searchPopover === "guests" && (
              <div className="vacation-search-popover" role="dialog" aria-label="Guests">
                <p className="vacation-popover-hint">
                  How many guests?
                </p>
                <label className="vacation-popover-label" htmlFor="vac-pop-guests">
                  Guests
                </label>
                <input
                  id="vac-pop-guests"
                  className="vacation-popover-input"
                  type="number"
                  min={1}
                  placeholder="e.g. 2"
                  value={draftGuests}
                  onChange={(e) => setDraftGuests(e.target.value)}
                />
                <div className="vacation-popover-actions">
                  <button
                    type="button"
                    className="listings-btn listings-btn-secondary"
                    onClick={() => setSearchPopover(null)}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      <main className="listings-main vacation-rentals-main">
        <div className="listings-container">
          {error && <div className="listings-error">{error}</div>}

          {/* SECTION 2 — Results header */}
          <div className="vacation-results-header">
            <h1 className="vacation-results-title">
              {loading && properties.length === 0
                ? "Searching vacation rentals…"
                : `${resultsTitleCount} vacation rental${pagination.total === 1 ? "" : "s"} in ${headerCity}`}
            </h1>
            {dateLine && (
              <p className="vacation-results-dates">Dates: {dateLine}</p>
            )}
            <div className="vacation-results-toolbar">
              <button
                type="button"
                className={`vacation-filters-toggle listings-btn listings-btn-secondary ${filtersOpen ? "vacation-filters-toggle-active" : ""}`}
                onClick={() => setFiltersOpen((o) => !o)}
                aria-expanded={filtersOpen}
              >
                Filters
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="listings-select vacation-sort-select"
              >
                <option value="newest">Sort: Recommended</option>
                <option value="price-low">Sort: Price (low to high)</option>
                <option value="price-high">Sort: Price (high to low)</option>
              </select>
            </div>
          </div>

          {/* Optional filters (PDF §2) — vacation-only, no sale/rent */}
          {filtersOpen && (
            <div className="vacation-filters-panel">
              <div className="listings-filters">
                <div
                  className="listings-search-container"
                  style={{ flex: "1 1 280px", minWidth: 200 }}
                >
                  <input
                    type="text"
                    placeholder="Search by keywords, address, description…"
                    value={filters.search}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFilters((f) => ({ ...f, search: v }));
                      const params = new URLSearchParams(searchParams);
                      params.delete("page");
                      if (v) params.set("search", v);
                      else params.delete("search");
                      setSearchParams(params);
                    }}
                    className="listings-search-input"
                  />
                </div>
                <select
                  value={filters.propertyType}
                  onChange={(e) => {
                    const newVal = e.target.value;
                    setFilters((f) => ({ ...f, propertyType: newVal }));
                    patchUrl({ propertyType: newVal });
                  }}
                  className="listings-select"
                >
                  <option value="">Property type: Any</option>
                  {PROPERTY_TYPE_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {t(`properties.propertyType_${value}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="listings-filters">
                <div className="listings-price-range">
                  <label>Price / night</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, minPrice: e.target.value }))
                    }
                    className="listings-input"
                  />
                  <span>to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, maxPrice: e.target.value }))
                    }
                    className="listings-input"
                  />
                </div>
                <select
                  value={filters.bedrooms}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, bedrooms: e.target.value }))
                  }
                  className="listings-select"
                >
                  <option value="">Bedrooms: Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5+</option>
                </select>
                <select
                  value={filters.bathrooms}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, bathrooms: e.target.value }))
                  }
                  className="listings-select"
                >
                  <option value="">Bathrooms: Any</option>
                  <option value="1">1+</option>
                  <option value="1.5">1.5+</option>
                  <option value="2">2+</option>
                  <option value="2.5">2.5+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>
                {hasAnyFilters && (
                  <button
                    type="button"
                    className="listings-btn listings-btn-secondary"
                    onClick={clearAllFilters}
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {/* Amenities */}
              <div className="vacation-amenities-filter">
                <p className="vacation-amenities-label">Amenities</p>
                <div className="vacation-amenities-grid">
                  {AMENITIES.map((a) => {
                    const active = filters.amenities.includes(a.slug);
                    return (
                      <button
                        type="button"
                        key={a.slug}
                        className={`vacation-amenity-pill ${active ? "is-active" : ""}`}
                        onClick={() => {
                          setFilters((f) => ({
                            ...f,
                            amenities: active
                              ? f.amenities.filter((s) => s !== a.slug)
                              : [...f.amenities, a.slug],
                          }));
                          // Also reflect in URL for shareability
                          const next = active
                            ? filters.amenities.filter((s) => s !== a.slug)
                            : [...filters.amenities, a.slug];
                          patchUrl({ amenities: next.join(",") });
                        }}
                        aria-pressed={active}
                      >
                        <span className="vacation-amenity-icon" aria-hidden>{a.icon}</span>
                        <span>{a.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="vacation-mobile-toggle">
            <button
              type="button"
              className={
                mobilePanel === "list" ? "vacation-mobile-active" : ""
              }
              onClick={() => setMobilePanel("list")}
            >
              List view
            </button>
            <button
              type="button"
              className={
                mobilePanel === "map" ? "vacation-mobile-active" : ""
              }
              onClick={() => setMobilePanel("map")}
            >
              Map view
            </button>
          </div>

          <div className="vacation-split">
            <div
              className={`vacation-grid-panel ${mobilePanel === "map" ? "vacation-panel-hidden-mobile" : ""}`}
            >
              {loading ? (
                <div className="listings-grid listings-grid--split">
                  {[1,2,3,4,5,6].map((n) => (
                    <div key={n} className="vacation-skeleton-card">
                      <div className="vacation-skeleton-image" />
                      <div className="vacation-skeleton-line vacation-skeleton-line--title" />
                      <div className="vacation-skeleton-line vacation-skeleton-line--sub" />
                      <div className="vacation-skeleton-line vacation-skeleton-line--price" />
                    </div>
                  ))}
                </div>
              ) : properties.length === 0 ? (
                <>
                  <div className="listings-empty-state vacation-empty-state">
                    <div className="listings-empty-icon">🏠</div>
                    <h3 className="listings-empty-title">
                      No vacation rentals available for these dates.
                    </h3>
                    <p className="listings-empty-text">
                      Try different dates or adjust filters. Results are always
                      vacation stays only.
                    </p>
                    <div className="vacation-empty-actions">
                      <button
                        type="button"
                        className="listings-btn listings-btn-secondary"
                        onClick={modifyDatesOnly}
                      >
                        Modify dates
                      </button>
                      <button
                        type="button"
                        className="listings-btn listings-btn-secondary"
                        onClick={clearAllFilters}
                      >
                        Clear filters
                      </button>
                    </div>
                  </div>
                  {/* Show skeleton placeholder cards below empty state */}
                  <div className="listings-grid listings-grid--split" style={{ marginTop: 24, opacity: 0.4 }}>
                    {[1,2,3,4,5,6].map((n) => (
                      <div key={n} className="vacation-skeleton-card">
                        <div className="vacation-skeleton-image" />
                        <div className="vacation-skeleton-line vacation-skeleton-line--title" />
                        <div className="vacation-skeleton-line vacation-skeleton-line--sub" />
                        <div className="vacation-skeleton-line vacation-skeleton-line--price" />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div>
                  <div className="listings-grid listings-grid--split">
                    {properties.map((property) => (
                      <article
                        key={property.id}
                        ref={(el) => {
                          cardRefs.current[property.id] = el;
                        }}
                        role="button"
                        tabIndex={0}
                        className={`listings-card listings-card--explore ${selectedId === property.id ? "listings-card-selected vacation-card-selected" : ""}`}
                        onClick={() => handleCardActivate(property)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleCardActivate(property);
                          }
                        }}
                      >
                        <div className="listings-card-media">
                          <ImageCarousel
                            images={property.images}
                            alt={property.title || ''}
                            onClickImage={(e) => {
                              e.stopPropagation();
                              navigate(vacationDetailPath(property.id));
                            }}
                            className="vacation-card-carousel"
                          />
                        </div>
                        <div className="listings-card-body">
                          <div className="listings-card-topline vacation-card-topline">
                            <h3 className="listings-card-title">
                              <Link
                                to={vacationDetailPath(property.id)}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {property.title || "Untitled Property"}
                              </Link>
                            </h3>
                            {Number(property.ratingAvg) > 0 && (
                              <span className="vacation-card-rating" aria-label={`Rating ${Number(property.ratingAvg).toFixed(1)} out of 5`}>
                                ★ {Number(property.ratingAvg).toFixed(1)}
                                {Number(property.ratingCount) > 0 && (
                                  <span className="vacation-card-rating-count"> ({property.ratingCount})</span>
                                )}
                              </span>
                            )}
                          </div>
                          <p className="listings-card-subtitle">
                            {exploreCardSubtitle(property, t)}
                          </p>
                          {Array.isArray(property.amenities) && property.amenities.length > 0 && (
                            <div className="vacation-card-amenities">
                              {property.amenities.slice(0, 3).map((slug) => {
                                const tag = formatAmenity(slug);
                                if (!tag) return null;
                                return (
                                  <span key={slug} className="vacation-card-amenity-tag">
                                    {tag}
                                  </span>
                                );
                              })}
                              {property.amenities.length > 3 && (
                                <span className="vacation-card-amenity-tag vacation-card-amenity-more">
                                  +{property.amenities.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                          <div className="listings-card-price-row">
                            {property.price != null ? (
                              <>
                                <span className="listings-card-price">
                                  {formatPrice(property.price)}
                                </span>
                                <span className="listings-card-price-note">
                                  {" "}
                                  / night
                                </span>
                              </>
                            ) : (
                              <span className="listings-card-price listings-card-price--muted">
                                Price on request
                              </span>
                            )}
                          </div>
                          <div
                            className="vacation-card-cta-row"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link
                              to={vacationDetailPath(property.id)}
                              className="vacation-card-detail-link"
                            >
                              View details →
                            </Link>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>

                  {properties.length < pagination.total && (
                    <div className="vacation-load-more">
                      <button
                        type="button"
                        className="listings-btn listings-btn-secondary vacation-load-more-btn"
                        onClick={loadMore}
                        disabled={loadingMore}
                      >
                        {loadingMore ? "Loading…" : `Load more (${pagination.total - properties.length} more)`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Map — ALWAYS visible (even with zero results) */}
            <div
              className={`vacation-map-panel ${mobilePanel === "list" ? "" : "vacation-map-visible-mobile"}`}
            >
              <PropertyMap
                mapRegion="ecuador"
                properties={mapProperties}
                selectedProperty={selectedMapProperty}
                onPropertyClick={handleMapPropertyClick}
                markerStyle="pricePill"
                priceMarkerVariant="perNight"
              />
            </div>
          </div>
        </div>
      </main>

      {showContactModal && selectedProperty && (
        <ContactModal
          property={selectedProperty}
          onClose={() => {
            setShowContactModal(false);
            setSelectedProperty(null);
          }}
          onSubmit={handleContactSubmit}
        />
      )}

      {whatsappProperty && (
        <PropertyWhatsAppModal
          property={whatsappProperty}
          source="property_whatsapp_search"
          onClose={() => setWhatsappProperty(null)}
        />
      )}
    </div>
  );
}
