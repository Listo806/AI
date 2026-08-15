import React, { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import financialApi from "../../api/financialApi";

// Search + select an existing financial client to link a record to. value:
// { id, name } | null. Reuses the iw-contact-* styles from the shared work modal.
export default function FinancialClientPicker({ value, onChange }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      financialApi
        .searchClientRecords(query.trim() || undefined)
        .then((res) => {
          if (cancelled) return;
          setResults(Array.isArray(res) ? res : []);
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
        <span>{value.name || "Selected client"}</span>
        <button type="button" onClick={() => onChange(null)} aria-label="Remove linked client">
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
          placeholder="Search clients..."
        />
      </div>
      {open && (
        <div className="iw-contact-menu">
          {loading ? (
            <div className="iw-contact-empty">Searching...</div>
          ) : results.length === 0 ? (
            <div className="iw-contact-empty">No clients found</div>
          ) : (
            results.map((c) => (
              <button
                type="button"
                key={c.id}
                className="iw-contact-option"
                onClick={() => {
                  onChange({ id: c.id, name: c.name || c.clientNumber });
                  setOpen(false);
                  setQuery("");
                }}
              >
                <strong>{c.name || "Unnamed"}</strong>
                {c.clientNumber && <small>{c.clientNumber}</small>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
