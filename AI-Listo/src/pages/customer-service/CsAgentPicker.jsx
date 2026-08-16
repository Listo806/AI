import React, { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import customerServiceApi from "../../api/customerServiceApi";

// Search + select a team user as the assigned agent. value: { id, name } | null.
// Reuses the iw-contact-* styles. The server re-validates the agent is a user in
// the ticket's account (team) before assignment.
export default function CsAgentPicker({ value, onChange }) {
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
      customerServiceApi
        .searchAgents(query.trim() || undefined)
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
        <span>{value.name || "Selected agent"}</span>
        <button type="button" onClick={() => onChange(null)} aria-label="Remove assigned agent">
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
          placeholder="Search agents..."
        />
      </div>
      {open && (
        <div className="iw-contact-menu">
          {loading ? (
            <div className="iw-contact-empty">Searching...</div>
          ) : results.length === 0 ? (
            <div className="iw-contact-empty">No agents found</div>
          ) : (
            results.map((a) => (
              <button
                type="button"
                key={a.id}
                className="iw-contact-option"
                onClick={() => {
                  onChange({ id: a.id, name: a.name || a.email });
                  setOpen(false);
                  setQuery("");
                }}
              >
                <strong>{a.name || "Unnamed"}</strong>
                {a.email && <small>{a.email}</small>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
