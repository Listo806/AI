import React, { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import insuranceApi from "../../api/insuranceApi";

// Search and select an EXISTING Cortexa contact to attach to a policy. Reads the
// shared contacts table via /api/insurance/contacts; it never creates a new
// customer record, so the "reuse, don't duplicate customers" rule holds.
// value: { id, name } | null
export default function ContactPicker({ value, onChange }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);

  // Close the dropdown on an outside click.
  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Debounced search while the dropdown is open.
  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      insuranceApi
        .searchContacts(query.trim() || undefined)
        .then((rows) => {
          if (cancelled) return;
          setResults(Array.isArray(rows) ? rows : []);
          setLoading(false);
        })
        .catch(() => {
          if (cancelled) return;
          setResults([]);
          setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, open]);

  if (value && value.id) {
    return (
      <div className="iw-contact-selected">
        <span>{value.name || "Selected contact"}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Remove linked contact"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="iw-contact-picker" ref={boxRef}>
      <div className="iw-contact-input">
        <Search size={14} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search existing contacts..."
        />
      </div>
      {open && (
        <div className="iw-contact-menu">
          {loading ? (
            <div className="iw-contact-empty">Searching...</div>
          ) : results.length === 0 ? (
            <div className="iw-contact-empty">No contacts found</div>
          ) : (
            results.map((c) => (
              <button
                type="button"
                key={c.id}
                className="iw-contact-option"
                onClick={() => {
                  onChange({ id: c.id, name: c.name });
                  setOpen(false);
                  setQuery("");
                }}
              >
                <strong>{c.name || "Unnamed contact"}</strong>
                {(c.email || c.phone) && <small>{c.email || c.phone}</small>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
