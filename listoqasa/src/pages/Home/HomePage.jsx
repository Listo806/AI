import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Volume2, Home, KeyRound, Building2, LandPlot, Store, Umbrella, Construction, ClipboardList, ArrowRight, HandCoins } from "lucide-react";
import { useTranslation } from "react-i18next";
import SiteLayout from "../../components/layout/SiteLayout";
import PropertyCard from "../../components/property/PropertyCard";
import { getNewListings, getLuxuryListings } from "../../api/listingsApi";
import "./HomePage.css";

const FALLBACK_PROPERTY_IMAGE = "/images/listoqasa/properties/property-placeholder.jpg";

function formatPrice(value, type) {
  if (value === null || value === undefined || value === "") return "";
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount);
  return type === "rent" ? `$${formatted} /month` : `$${formatted}`;
}

function normalizeListing(listing) {
  return {
    id: listing.id,
    title: listing.title || listing.name || "Untitled Property",
    location: [listing.city, listing.state].filter(Boolean).join(", ") || listing.address || "",
    price: formatPrice(listing.price, listing.type),
    beds: listing.bedrooms ?? listing.beds ?? null,
    baths: listing.bathrooms ?? listing.baths ?? null,
    area: listing.squareFeet ?? listing.square_feet ?? listing.area ?? listing.lotSize ?? null,
    image: listing.thumbnailUrl || listing.thumbnail_url || listing.coverImage || (Array.isArray(listing.images) ? listing.images[0] : null) || FALLBACK_PROPERTY_IMAGE,
    type: listing.type ?? null,
    listingType: listing.listingType ?? listing.listing_type ?? null,
    propertyType: listing.propertyType ?? null,
    raw: listing,
  };
}

function ListingSection({ title, properties, loading, error, newBadge = false, viewAllTo = "/buy" }) {
  const { t } = useTranslation();
  if (!loading && !error && properties.length === 0) return null;

  return (
    <section className="lq-listing-section">
      <div className="lq-section-heading-row">
        <h2>{title}</h2>
        <Link to={viewAllTo} className="lq-view-all">{t("home.viewAll")}<ArrowRight size={18} /></Link>
      </div>

      {loading ? (
        <div className="lq-listings-status">{t("common.loading", { defaultValue: "Loading properties..." })}</div>
      ) : error ? (
        <div className="lq-listings-status lq-listings-status-error">{t("common.loadError", { defaultValue: "Unable to load properties right now." })}</div>
      ) : (
        <div className="lq-property-grid">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} showNew={newBadge} to={`/property?id=${property.id}`} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [newListings, setNewListings] = useState([]);
  const [luxuryListings, setLuxuryListings] = useState([]);
  const [newLoading, setNewLoading] = useState(true);
  const [luxuryLoading, setLuxuryLoading] = useState(true);
  const [newError, setNewError] = useState("");
  const [luxuryError, setLuxuryError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadHomeListings() {
      const [newResult, luxuryResult] = await Promise.allSettled([
        getNewListings({ limit: 6, signal: controller.signal }),
        getLuxuryListings({ limit: 6, signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;

      if (newResult.status === "fulfilled") {
        setNewListings(newResult.value.items.map(normalizeListing));
      } else {
        console.error("Failed to load new listings:", newResult.reason);
        setNewError("failed");
      }

      if (luxuryResult.status === "fulfilled") {
        setLuxuryListings(luxuryResult.value.items.map(normalizeListing));
      } else {
        console.error("Failed to load luxury listings:", luxuryResult.reason);
        setLuxuryError("failed");
      }

      setNewLoading(false);
      setLuxuryLoading(false);
    }

    loadHomeListings();
    return () => controller.abort();
  }, []);

  const categories = useMemo(() => [
    { label: t("home.categories.forSale"), icon: Home, href: "/buy" },
    { label: t("home.categories.forRent"), icon: KeyRound, href: "/rent" },
    { label: t("home.categories.apartments"), icon: Building2, href: "/buy?propertyType=apartment" },
    { label: t("home.categories.houses"), icon: Home, href: "/buy?propertyType=house" },
    { label: t("home.categories.land"), icon: LandPlot, href: "/land" },
    { label: t("home.categories.commercial"), icon: Store, href: "/commercial" },
    { label: t("home.categories.vacationRentals"), icon: Umbrella, href: "/vacation-rentals" },
    { label: t("home.categories.developers"), icon: Construction, href: "/developers" },
    { label: t("home.categories.newProjects"), icon: ClipboardList, href: "/new-projects" },
  ], [t]);

  const submitSearch = (event) => {
    event.preventDefault();
    const value = searchValue.trim();
    navigate(value ? `/buy?search=${encodeURIComponent(value)}` : "/buy");
  };

  return (
    <SiteLayout headerVariant="light">
      <section className="lq-home-hero">
        <div className="lq-container lq-home-hero-inner">
          <div className="lq-home-hero-content">
            <h1>{t("home.heroTitle1")}<br />{t("home.heroTitle2")}</h1>
            <p>{t("home.heroDescription")}</p>
            <form className="lq-home-search" onSubmit={submitSearch}>
              <Search size={25} />
              <input type="text" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder={t("home.searchPlaceholder")} />
              <button type="button" className="lq-search-voice" aria-label="Voice search"><Volume2 size={26} /></button>
            </form>
          </div>
        </div>
      </section>

      <div className="lq-home-content">
        <div className="lq-container">
          <section className="lq-category-bar">
            {categories.map((category) => {
              const Icon = category.icon;
              return <Link to={category.href} className="lq-category-item" key={category.href}><Icon size={31} strokeWidth={1.35} /><span>{category.label}</span></Link>;
            })}
          </section>

          <ListingSection title={t("home.newListings")} properties={newListings} loading={newLoading} error={newError} newBadge viewAllTo="/buy" />
          <ListingSection title={t("home.luxuryHomes")} properties={luxuryListings} loading={luxuryLoading} error={luxuryError} viewAllTo="/buy?collection=luxury" />

          <Link to="/owners" className="lq-owner-home-banner">
            <div className="lq-owner-home-icon"><HandCoins size={42} strokeWidth={1.6} /></div>
            <div className="lq-owner-home-copy"><h3>{t("home.ownerBannerTitle")}</h3><p>{t("home.ownerBannerDescription")}</p></div>
            <ArrowRight className="lq-owner-home-arrow" size={34} />
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}
