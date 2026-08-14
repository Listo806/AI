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
import CommissionModal from "./CommissionModal";
import "./Claims.css";

function formatMoney(value) {
  if (value == null || value === "") return "-";
  const n = Number(value);
  if (!isFinite(n)) return "-";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function toRow(c) {
  return {
    uuid: c.id,
    policy: c.policyNumber || "-",
    customer: c.contactName || c.policyHolder || "",
    agent: c.agentName || "Unassigned",
    rate: c.rate != null ? `${c.rate}%` : "-",
    amount: formatMoney(c.amount),
    status: c.status || "Pending",
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

export default function CommissionsSection() {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [modalId, setModalId] = useState(null);
  const [modalNonce, setModalNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const handle = setTimeout(() => {
      insuranceApi
        .listCommissions({ search: search.trim() || undefined, page, limit })
        .then((res) => {
          if (cancelled) return;
          const data = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
              ? res
              : [];
          setRows(data.map(toRow));
          setTotal(Number(res?.total ?? data.length) || 0);
          setLoading(false);
        })
        .catch((e) => {
          if (cancelled) return;
          setRows([]);
          setTotal(0);
          setError(e?.message || "Failed to load commissions");
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
    setModalId(null);
    setModalNonce((n) => n + 1);
    setModalOpen(true);
  };
  const openView = (id) => {
    setModalMode("view");
    setModalId(id);
    setModalNonce((n) => n + 1);
    setModalOpen(true);
  };
  const openEdit = (id) => {
    setModalMode("edit");
    setModalId(id);
    setModalNonce((n) => n + 1);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);
  const handleSaved = () => setRefreshTick((t) => t + 1);

  return (
    <section className="insurance-ws-policies">
      <div className="insurance-ws-section-head">
        <div>
          <h2>Commissions</h2>
          <p>Track commissions earned and due on your policies</p>
        </div>
        <div className="insurance-ws-section-actions">
          <button className="primary" onClick={openCreate}>
            <Plus size={14} /> New Commission
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
            placeholder="Search commissions..."
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
              <th>Agent</th>
              <th>Rate</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={EMPTY_CELL_STYLE}>
                  Loading commissions...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={8} style={EMPTY_CELL_STYLE}>
                  {error}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} style={EMPTY_CELL_STYLE}>
                  {search.trim()
                    ? "No commissions match your search."
                    : "No commissions yet. Create one against a policy to get started."}
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.uuid}>
                  <td>
                    <input type="checkbox" />
                  </td>
                  <td className="policy-id">{c.policy}</td>
                  <td>{c.customer}</td>
                  <td>{c.agent}</td>
                  <td>{c.rate}</td>
                  <td>{c.amount}</td>
                  <td>
                    <span className="iw-pill">{c.status}</span>
                  </td>
                  <td>
                    <div className="insurance-ws-row-actions">
                      <Eye
                        size={14}
                        style={{ cursor: "pointer" }}
                        onClick={() => openView(c.uuid)}
                      />
                      <Pencil
                        size={14}
                        style={{ cursor: "pointer" }}
                        onClick={() => openEdit(c.uuid)}
                      />
                      <MoreVertical
                        size={14}
                        style={{ cursor: "pointer" }}
                        onClick={() => openView(c.uuid)}
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
            ? "No commissions"
            : `Showing ${from} to ${to} of ${total.toLocaleString("en-US")} commissions`}
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

      <CommissionModal
        key={modalNonce}
        open={modalOpen}
        mode={modalMode}
        commissionId={modalId}
        onClose={closeModal}
        onSaved={handleSaved}
      />
    </section>
  );
}
