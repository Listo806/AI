import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Search,
  Plus,
  Eye,
  Pencil,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import insuranceApi from "../../api/insuranceApi";
import QuoteModal from "./QuoteModal";
import "./Claims.css";

function formatMoney(value) {
  if (value == null || value === "") return "-";
  const n = Number(value);
  if (!isFinite(n)) return "-";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function toQuoteRow(q) {
  return {
    uuid: q.id,
    number: q.quoteNumber || q.id,
    customer: q.contactName || q.holderName || "-",
    type: q.policyType || "-",
    premium: formatMoney(q.quotedPremium),
    validUntil: formatDate(q.validUntil),
    status: q.status || "Draft",
    converted: q.convertedPolicyNumber || null,
  };
}

function pageWindow(current, totalPages) {
  const pages = [];
  const max = 7;
  if (totalPages <= max) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }
  pages.push(1);
  let start = Math.max(2, current - 1);
  let end = Math.min(totalPages - 1, current + 1);
  if (current <= 3) {
    start = 2;
    end = 4;
  } else if (current >= totalPages - 2) {
    start = totalPages - 3;
    end = totalPages - 1;
  }
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push("...");
  pages.push(totalPages);
  return pages;
}

const EMPTY_CELL_STYLE = {
  textAlign: "center",
  padding: "36px 16px",
  color: "#64748b",
};

export default function QuotesSection() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [quotes, setQuotes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [modalQuoteId, setModalQuoteId] = useState(null);
  const [modalNonce, setModalNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const handle = setTimeout(() => {
      insuranceApi
        .listQuotes({ search: search.trim() || undefined, page, limit })
        .then((res) => {
          if (cancelled) return;
          const data = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
              ? res
              : [];
          setQuotes(data.map(toQuoteRow));
          setTotal(Number(res?.total ?? data.length) || 0);
          setLoading(false);
        })
        .catch((e) => {
          if (cancelled) return;
          setQuotes([]);
          setTotal(0);
          setError(e?.message || "Failed to load quotes");
          setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [search, page, limit, refreshTick]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * limit + 1;
  const to = Math.min(safePage * limit, total);
  const pages = useMemo(
    () => pageWindow(safePage, totalPages),
    [safePage, totalPages],
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const openCreate = () => {
    setModalMode("create");
    setModalQuoteId(null);
    setModalNonce((n) => n + 1);
    setModalOpen(true);
  };
  const openView = (id) => {
    setModalMode("view");
    setModalQuoteId(id);
    setModalNonce((n) => n + 1);
    setModalOpen(true);
  };
  const openEdit = (id) => {
    setModalMode("edit");
    setModalQuoteId(id);
    setModalNonce((n) => n + 1);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);
  const handleSaved = () => setRefreshTick((t) => t + 1);

  return (
    <section className="insurance-ws-policies">
      <div className="insurance-ws-section-head">
        <div>
          <h2>Quotes</h2>
          <p>Create quotes and convert accepted ones into policies</p>
        </div>
        <div className="insurance-ws-section-actions">
          <button className="primary" onClick={openCreate}>
            <Plus size={14} /> New Quote
          </button>
        </div>
      </div>

      <div className="insurance-ws-filters">
        <label>
          <Search size={14} />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search quotes..."
          />
        </label>
      </div>

      <div className="insurance-ws-mobile-record-list">
        {loading ? (
          <div className="insurance-ws-mobile-empty">{t("common.loading")}</div>
        ) : error ? (
          <div className="insurance-ws-mobile-empty error">{error}</div>
        ) : quotes.length === 0 ? (
          <div className="insurance-ws-mobile-empty">{t("insuranceWorkspace.noRecords")}</div>
        ) : (
          quotes.map((quote, index) => (
            <article className={`insurance-ws-mobile-record-card tone-${(index % 5) + 1}`} key={quote.uuid} onClick={() => openView(quote.uuid)}>
              <div className="insurance-ws-mobile-record-icon"><span>Q</span></div>
              <div className="insurance-ws-mobile-record-main"><strong>{quote.number}</strong><b>{quote.customer}</b><small>{quote.type}</small></div>
              <div className="insurance-ws-mobile-record-mid"><small>{t("insuranceWorkspace.fields.premium")}</small><strong>{quote.premium}</strong><small>{t("insuranceWorkspace.fields.validUntil")}</small><span>{quote.validUntil}</span></div>
              <div className="insurance-ws-mobile-record-side"><small>{t("insuranceWorkspace.fields.status")}</small><span className="iw-pill">{quote.status}</span>{quote.converted && <small>→ {quote.converted}</small>}</div>
              <ChevronRight size={20} className="insurance-ws-mobile-record-arrow" />
            </article>
          ))
        )}
      </div>

      <div className="insurance-ws-table-wrap">
        <table className="insurance-ws-table">
          <thead>
            <tr>
              <th>
                <input type="checkbox" />
              </th>
              <th>Quote #</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Premium</th>
              <th>Valid Until</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={EMPTY_CELL_STYLE}>
                  Loading quotes...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={8} style={EMPTY_CELL_STYLE}>
                  {error}
                </td>
              </tr>
            ) : quotes.length === 0 ? (
              <tr>
                <td colSpan={8} style={EMPTY_CELL_STYLE}>
                  {search.trim()
                    ? "No quotes match your search."
                    : "No quotes yet. Create your first quote to get started."}
                </td>
              </tr>
            ) : (
              quotes.map((quote) => (
                <tr key={quote.uuid}>
                  <td>
                    <input type="checkbox" />
                  </td>
                  <td className="policy-id">{quote.number}</td>
                  <td>{quote.customer}</td>
                  <td>{quote.type}</td>
                  <td>{quote.premium}</td>
                  <td>{quote.validUntil}</td>
                  <td>
                    <div className="insurance-ws-two-line">
                      <span className="iw-pill">{quote.status}</span>
                      {quote.converted && (
                        <span>→ {quote.converted}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="insurance-ws-row-actions">
                      <Eye
                        size={14}
                        style={{ cursor: "pointer" }}
                        onClick={() => openView(quote.uuid)}
                      />
                      <Pencil
                        size={14}
                        style={{ cursor: "pointer" }}
                        onClick={() => openEdit(quote.uuid)}
                      />
                      <MoreVertical
                        size={14}
                        style={{ cursor: "pointer" }}
                        onClick={() => openView(quote.uuid)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="insurance-ws-pagination">
        <span>
          {total === 0
            ? "No quotes"
            : `Showing ${from} to ${to} of ${total.toLocaleString("en-US")} quotes`}
        </span>
        <div>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={14} />
          </button>
          {pages.map((n, i) =>
            n === "..." ? (
              <span key={`gap-${i}`}>...</span>
            ) : (
              <button
                key={n}
                className={n === safePage ? "active" : ""}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ),
          )}
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
        >
          <option value="20">20 / page</option>
          <option value="50">50 / page</option>
          <option value="100">100 / page</option>
        </select>
      </div>

      <QuoteModal
        key={modalNonce}
        open={modalOpen}
        mode={modalMode}
        quoteId={modalQuoteId}
        onClose={closeModal}
        onSaved={handleSaved}
      />
    </section>
  );
}
