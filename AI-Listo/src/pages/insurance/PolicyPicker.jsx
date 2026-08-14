import React, { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import insuranceApi from "../../api/insuranceApi";

// Search and select an existing policy to attach a claim to. Reuses the policies
// list endpoint (team-scoped). value: { id, label } | null
export default function PolicyPicker({ value, onChange }) {
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
      insuranceApi
        .listPolicies({ search: query.trim() || undefined, limit: 20 })
        .then((res) => {
          if (cancelled) return;
          const rows = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
              ? res
              : [];
          setResults(rows);
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

  const labelFor = (p) => {
    const num = p.policyNumber || "Policy";
    return p.holderName ? `${num} — ${p.holderName}` : num;
  };

  if (value && value.id) {
    return (
      <div className="iw-contact-selected">
        <span>{value.label || "Selected policy"}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Remove linked policy"
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
          placeholder="Search policies to attach this claim to..."
        />
      </div>
      {open && (
        <div className="iw-contact-menu">
          {loading ? (
            <div className="iw-contact-empty">Searching...</div>
          ) : results.length === 0 ? (
            <div className="iw-contact-empty">No policies found</div>
          ) : (
            results.map((p) => (
              <button
                type="button"
                key={p.id}
                className="iw-contact-option"
                onClick={() => {
                  onChange({ id: p.id, label: labelFor(p) });
                  setOpen(false);
                  setQuery("");
                }}
              >
                <strong>{p.policyNumber || "Policy"}</strong>
                {p.holderName && <small>{p.holderName}</small>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
