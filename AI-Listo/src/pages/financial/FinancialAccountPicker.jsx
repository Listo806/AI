import React, { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import financialApi from "../../api/financialApi";

// Search + select an existing financial account to link a record to. value:
// { id, name } | null. Reuses the iw-contact-* styles from the shared work modal.
// The server re-validates that the account belongs to the caller's account (team).
export default function FinancialAccountPicker({ value, onChange }) {
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
        .listAccounts({ search: query.trim() || undefined, limit: 20 })
        .then((res) => {
          if (cancelled) return;
          setResults(res?.data || []);
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
        <span>{value.name || "Selected account"}</span>
        <button type="button" onClick={() => onChange(null)} aria-label="Remove linked account">
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
          placeholder="Search accounts..."
        />
      </div>
      {open && (
        <div className="iw-contact-menu">
          {loading ? (
            <div className="iw-contact-empty">Searching...</div>
          ) : results.length === 0 ? (
            <div className="iw-contact-empty">No accounts found</div>
          ) : (
            results.map((a) => (
              <button
                type="button"
                key={a.id}
                className="iw-contact-option"
                onClick={() => {
                  onChange({
                    id: a.id,
                    name: [a.accountNumber, a.clientName].filter(Boolean).join(" · ") || "Account",
                  });
                  setOpen(false);
                  setQuery("");
                }}
              >
                <strong>{a.accountNumber || "Account"}</strong>
                {a.clientName && <small>{a.clientName}</small>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
