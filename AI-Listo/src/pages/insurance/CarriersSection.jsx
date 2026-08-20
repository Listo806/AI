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
import CarrierModal from "./CarrierModal";
import "./Claims.css";

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

export default function CarriersSection() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [carriers, setCarriers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [modalCarrierId, setModalCarrierId] = useState(null);
  const [modalNonce, setModalNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const handle = setTimeout(() => {
      insuranceApi
        .listCarriers({ search: search.trim() || undefined, page, limit })
        .then((res) => {
          if (cancelled) return;
          const data = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
              ? res
              : [];
          setCarriers(data);
          setTotal(Number(res?.total ?? data.length) || 0);
          setLoading(false);
        })
        .catch((e) => {
          if (cancelled) return;
          setCarriers([]);
          setTotal(0);
          setError(e?.message || "Failed to load carriers");
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
    setModalCarrierId(null);
    setModalNonce((n) => n + 1);
    setModalOpen(true);
  };
  const openView = (id) => {
    setModalMode("view");
    setModalCarrierId(id);
    setModalNonce((n) => n + 1);
    setModalOpen(true);
  };
  const openEdit = (id) => {
    setModalMode("edit");
    setModalCarrierId(id);
    setModalNonce((n) => n + 1);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);
  const handleSaved = () => setRefreshTick((t) => t + 1);

  return (
    <section className="insurance-ws-policies">
      <div className="insurance-ws-section-head">
        <div>
          <h2>Carriers</h2>
          <p>Manage the carriers your policies are placed with</p>
        </div>
        <div className="insurance-ws-section-actions">
          <button className="primary" onClick={openCreate}>
            <Plus size={14} /> New Carrier
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
            placeholder="Search carriers..."
          />
        </label>
      </div>

      <div className="insurance-ws-mobile-record-list">
        {loading ? (
          <div className="insurance-ws-mobile-empty">{t("common.loading")}</div>
        ) : error ? (
          <div className="insurance-ws-mobile-empty error">{error}</div>
        ) : carriers.length === 0 ? (
          <div className="insurance-ws-mobile-empty">{t("insuranceWorkspace.noRecords")}</div>
        ) : (
          carriers.map((c, index) => (
            <article className={`insurance-ws-mobile-record-card tone-${(index % 5) + 1}`} key={c.id} onClick={() => openView(c.id)}>
              <div className="insurance-ws-mobile-record-icon"><span>{c.carrierMark || (c.name || "?").charAt(0)}</span></div>
              <div className="insurance-ws-mobile-record-main"><strong>{c.name || "-"}</strong><span>{c.contactEmail || "-"}</span><small>{c.contactPhone || "-"}</small></div>
              <div className="insurance-ws-mobile-record-mid"><small>{t("insuranceWorkspace.fields.policies")}</small><strong>{c.policyCount ?? 0}</strong></div>
              <div className="insurance-ws-mobile-record-side"><small>{t("insuranceWorkspace.fields.status")}</small><span className="iw-pill">{c.status || "active"}</span></div>
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
              <th>Carrier</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Policies</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={EMPTY_CELL_STYLE}>
                  Loading carriers...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} style={EMPTY_CELL_STYLE}>
                  {error}
                </td>
              </tr>
            ) : carriers.length === 0 ? (
              <tr>
                <td colSpan={7} style={EMPTY_CELL_STYLE}>
                  {search.trim()
                    ? "No carriers match your search."
                    : "No carriers yet. Add your first carrier to get started."}
                </td>
              </tr>
            ) : (
              carriers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <input type="checkbox" />
                  </td>
                  <td>
                    <div className="insurance-ws-carrier">
                      <span>{c.carrierMark || (c.name || "?").charAt(0)}</span>
                      <strong>{c.name || "-"}</strong>
                    </div>
                  </td>
                  <td>{c.contactEmail || "-"}</td>
                  <td>{c.contactPhone || "-"}</td>
                  <td>{c.policyCount ?? 0}</td>
                  <td>
                    <span className="iw-pill">{c.status || "active"}</span>
                  </td>
                  <td>
                    <div className="insurance-ws-row-actions">
                      <Eye
                        size={14}
                        style={{ cursor: "pointer" }}
                        onClick={() => openView(c.id)}
                      />
                      <Pencil
                        size={14}
                        style={{ cursor: "pointer" }}
                        onClick={() => openEdit(c.id)}
                      />
                      <MoreVertical
                        size={14}
                        style={{ cursor: "pointer" }}
                        onClick={() => openView(c.id)}
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
            ? "No carriers"
            : `Showing ${from} to ${to} of ${total.toLocaleString("en-US")} carriers`}
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

      <CarrierModal
        key={modalNonce}
        open={modalOpen}
        mode={modalMode}
        carrierId={modalCarrierId}
        onClose={closeModal}
        onSaved={handleSaved}
      />
    </section>
  );
}
