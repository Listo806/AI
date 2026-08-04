import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Home,
  Loader2,
  MapPin,
  Search,
  Save,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import "./PropertyImportModal.css";

const formatPrice = (
  value,
  currency = "USD",
  unavailableLabel = "Price unavailable",
) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return unavailableLabel;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return amount.toLocaleString();
  }
};

export default function PropertyImportModal({
  open,
  loading,
  saving,
  error,
  catalog,
  onClose,
  onSearch,
  onPageChange,
  onSave,
}) {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelectedIds(
      Array.isArray(catalog?.selectedPropertyIds)
        ? catalog.selectedPropertyIds
        : [],
    );
  }, [open, catalog?.selectedPropertyIds]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const items = Array.isArray(catalog?.items) ? catalog.items : [];

  const toggleProperty = (propertyId) => {
    setSelectedIds((current) =>
      current.includes(propertyId)
        ? current.filter((id) => id !== propertyId)
        : [...current, propertyId],
    );
  };

  const selectVisible = () => {
    setSelectedIds((current) =>
      Array.from(new Set([...current, ...items.map((item) => item.id)])),
    );
  };

  const clearVisible = () => {
    const visibleIds = new Set(items.map((item) => item.id));
    setSelectedIds((current) => current.filter((id) => !visibleIds.has(id)));
  };

  const submitSearch = (event) => {
    event.preventDefault();
    onSearch?.(search.trim());
  };

  if (!open) return null;

  const page = Number(catalog?.page || 1);
  const totalPages = Number(catalog?.totalPages || 1);

  return (
    <div className="cx-property-import-backdrop" onMouseDown={onClose}>
      <div
        className="cx-property-import-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="cx-property-import-head">
          <div>
            <span className="cx-property-import-icon">
              <Home size={22} />
            </span>
            <div>
              <h2>
                {t("aiCenter.propertyImportModal.title", "Import Properties")}
              </h2>
              <p>
                {t(
                  "aiCenter.propertyImportModal.subtitle",
                  "Choose which CRM properties your AI Agent may recommend.",
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("aiCenter.propertyImportModal.close", "Close")}
          >
            <X size={20} />
          </button>
        </header>

        <div className="cx-property-import-toolbar">
          <form onSubmit={submitSearch}>
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t(
                "aiCenter.propertyImportModal.searchPlaceholder",
                "Search title, city or address...",
              )}
            />
            <button type="submit">
              {t("aiCenter.propertyImportModal.searchButton", "Search")}
            </button>
          </form>
          <div>
            <button type="button" onClick={selectVisible}>
              {t("aiCenter.propertyImportModal.selectVisible", "Select visible")}
            </button>
            <button type="button" onClick={clearVisible}>
              {t("aiCenter.propertyImportModal.clearVisible", "Clear visible")}
            </button>
          </div>
        </div>

        {error && <div className="cx-property-import-error">{error}</div>}

        <div className="cx-property-import-summary">
          <strong>{selectedIds.length}</strong>{" "}
          {t(
            "aiCenter.propertyImportModal.propertiesSelected",
            "properties selected for AI recommendations.",
          )}
        </div>

        <div className="cx-property-import-content">
          {loading ? (
            <div className="cx-property-import-loading">
              <Loader2 size={24} />
              {t("aiCenter.propertyImportModal.loading", "Loading properties...")}
            </div>
          ) : items.length === 0 ? (
            <div className="cx-property-import-empty">
              <Home size={34} />
              <strong>
                {t(
                  "aiCenter.propertyImportModal.emptyTitle",
                  "No properties found",
                )}
              </strong>
              <p>
                {t(
                  "aiCenter.propertyImportModal.emptyDescription",
                  "Add properties in the Properties module or change your search.",
                )}
              </p>
            </div>
          ) : (
            <div className="cx-property-import-grid">
              {items.map((property) => {
                const selected = selectedSet.has(property.id);
                return (
                  <button
                    type="button"
                    key={property.id}
                    className={`cx-property-import-card ${selected ? "selected" : ""}`}
                    onClick={() => toggleProperty(property.id)}
                  >
                    <span className="cx-property-import-check">
                      {selected && <Check size={15} />}
                    </span>
                    <div className="cx-property-import-thumb">
                      {property.imageUrl ? (
                        <img
                          src={property.imageUrl}
                          alt={
                            property.title ||
                            t("aiCenter.propertyImportModal.propertyAlt", "Property")
                          }
                        />
                      ) : (
                        <Home size={26} />
                      )}
                    </div>
                    <div className="cx-property-import-copy">
                      <strong>
                        {property.title ||
                          t(
                            "aiCenter.propertyImportModal.untitledProperty",
                            "Untitled property",
                          )}
                      </strong>
                      <p>
                        <MapPin size={14} />
                        {[property.city, property.state]
                          .filter(Boolean)
                          .join(", ") ||
                          t(
                            "aiCenter.propertyImportModal.locationUnavailable",
                            "Location unavailable",
                          )}
                      </p>
                      <div>
                        <span>
                          {formatPrice(
                            property.price,
                            property.currency || "USD",
                            t(
                              "aiCenter.propertyImportModal.priceUnavailable",
                              "Price unavailable",
                            ),
                          )}
                        </span>
                        <small>
                          {t(
                            "aiCenter.propertyImportModal.bedBath",
                            "{{beds}} bd · {{baths}} ba",
                            {
                              beds: property.bedrooms ?? "—",
                              baths: property.bathrooms ?? "—",
                            },
                          )}
                        </small>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <footer className="cx-property-import-foot">
          <div className="cx-property-import-pagination">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => onPageChange?.(page - 1)}
            >
              <ChevronLeft size={17} />
            </button>
            <span>
              {t(
                "aiCenter.propertyImportModal.pageOf",
                "Page {{page}} of {{totalPages}}",
                { page, totalPages },
              )}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => onPageChange?.(page + 1)}
            >
              <ChevronRight size={17} />
            </button>
          </div>
          <button type="button" className="secondary" onClick={onClose}>
            {t("aiCenter.propertyImportModal.cancel", "Cancel")}
          </button>
          <button
            type="button"
            className="primary"
            disabled={saving}
            onClick={() => onSave?.(selectedIds)}
          >
            {saving ? (
              <Loader2 className="spin" size={17} />
            ) : (
              <Save size={17} />
            )}
            {saving
              ? t("aiCenter.propertyImportModal.saving", "Saving...")
              : t(
                  "aiCenter.propertyImportModal.saveButton",
                  "Save Property Catalog",
                )}
          </button>
        </footer>
      </div>
    </div>
  );
}
