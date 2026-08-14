import React, { useEffect, useMemo, useState } from "react";
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
import RenewalModal from "./RenewalModal";
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

function toRenewalRow(r) {
  return {
    uuid: r.id,
    policy: r.policyNumber || "-",
    customer: r.contactName || r.policyHolder || "",
    currentExpiration: formatDate(r.currentExpiration),
    renewalDate: formatDate(r.renewalDate),
    currentPremium: formatMoney(r.currentPremium),
    renewalPremium: formatMoney(r.renewalPremium),
    status: r.status || "Upcoming",
    renewed: r.renewedPolicyNumber || null,
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

export default function RenewalsSection() {
  const [search, setSearch] = useState("");
  const [renewals, setRenewals] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [modalRenewalId, setModalRenewalId] = useState(null);
  const [modalNonce, setModalNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const handle = setTimeout(() => {
      insuranceApi
        .listRenewals({ search: search.trim() || undefined, page, limit })
        .then((res) => {
          if (cancelled) return;
          const data = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
              ? res
              : [];
          setRenewals(data.map(toRenewalRow));
          setTotal(Number(res?.total ?? data.length) || 0);
          setLoading(false);
        })
        .catch((e) => {
          if (cancelled) return;
          setRenewals([]);
          setTotal(0);
          setError(e?.message || "Failed to load renewals");
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
    setModalRenewalId(null);
    setModalNonce((n) => n + 1);
    setModalOpen(true);
  };
  const openView = (id) => {
    setModalMode("view");
    setModalRenewalId(id);
    setModalNonce((n) => n + 1);
    setModalOpen(true);
  };
  const openEdit = (id) => {
    setModalMode("edit");
    setModalRenewalId(id);
    setModalNonce((n) => n + 1);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);
  const handleSaved = () => setRefreshTick((t) => t + 1);

  return (
    <section className="insurance-ws-policies">
      <div className="insurance-ws-section-head">
        <div>
          <h2>Renewals</h2>
          <p>Manage policy renewals and create renewed terms</p>
        </div>
        <div className="insurance-ws-section-actions">
          <button className="primary" onClick={openCreate}>
            <Plus size={14} /> New Renewal
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
            placeholder="Search renewals..."
          />
        </label>
      </div>

      <div className="insurance-ws-table-wrap">
        <table className="insurance-ws-table">
          <thead>
            <tr>
              <th>
                <input type="checkbox" />
              </th>
              <th>Policy</th>
              <th>Customer</th>
              <th>Expires</th>
              <th>Renewal Date</th>
              <th>Current</th>
              <th>Renewal</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={EMPTY_CELL_STYLE}>
                  Loading renewals...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={9} style={EMPTY_CELL_STYLE}>
                  {error}
                </td>
              </tr>
            ) : renewals.length === 0 ? (
              <tr>
                <td colSpan={9} style={EMPTY_CELL_STYLE}>
                  {search.trim()
                    ? "No renewals match your search."
                    : "No renewals yet. Create a renewal for a policy to get started."}
                </td>
              </tr>
            ) : (
              renewals.map((renewal) => (
                <tr key={renewal.uuid}>
                  <td>
                    <input type="checkbox" />
                  </td>
                  <td className="policy-id">{renewal.policy}</td>
                  <td>{renewal.customer}</td>
                  <td>{renewal.currentExpiration}</td>
                  <td>{renewal.renewalDate}</td>
                  <td>{renewal.currentPremium}</td>
                  <td>{renewal.renewalPremium}</td>
                  <td>
                    <div className="insurance-ws-two-line">
                      <span className="iw-pill">{renewal.status}</span>
                      {renewal.renewed && <span>→ {renewal.renewed}</span>}
                    </div>
                  </td>
                  <td>
                    <div className="insurance-ws-row-actions">
                      <Eye
                        size={14}
                        style={{ cursor: "pointer" }}
                        onClick={() => openView(renewal.uuid)}
                      />
                      <Pencil
                        size={14}
                        style={{ cursor: "pointer" }}
                        onClick={() => openEdit(renewal.uuid)}
                      />
                      <MoreVertical
                        size={14}
                        style={{ cursor: "pointer" }}
                        onClick={() => openView(renewal.uuid)}
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
            ? "No renewals"
            : `Showing ${from} to ${to} of ${total.toLocaleString("en-US")} renewals`}
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

      <RenewalModal
        key={modalNonce}
        open={modalOpen}
        mode={modalMode}
        renewalId={modalRenewalId}
        onClose={closeModal}
        onSaved={handleSaved}
      />
    </section>
  );
}
