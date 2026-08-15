import React, { useEffect, useState } from "react";
import { Search, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import salesApi from "../../api/salesApi";
import { money, formatDate, initials } from "./salesFormat";

// Customers tab: the account's existing Cortexa contacts (reused, not duplicated),
// enriched with each customer's sales rollups. Read-only here; contacts are
// managed in the CRM.
export default function CustomersSection() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debounced, limit]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    salesApi
      .listCustomers({ search: debounced || undefined, page, limit })
      .then((res) => {
        if (!alive) return;
        setRows(res?.data || []);
        setTotal(res?.total || 0);
        setError("");
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError("Could not load customers.");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [debounced, page, limit]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <section className="sales-ws-quotes">
      <div className="sales-ws-section-head">
        <div>
          <h2>Customers</h2>
          <p>Your customers and their sales activity</p>
        </div>
      </div>

      <div className="sales-ws-filters">
        <label>
          <Search size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers..."
          />
        </label>
        <button className="reset" onClick={() => setSearch("")}>
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      <div className="sales-ws-table-wrap">
        <table className="sales-ws-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Status</th>
              <th>Quotes</th>
              <th>Orders</th>
              <th>Invoices</th>
              <th>Order Revenue</th>
              <th>Since</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="sales-ws-empty-row">Loading…</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="sales-ws-empty-row">{error}</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="sales-ws-empty-row">No customers yet.</td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="sales-ws-owner">
                      <span>{initials(c.name)}</span>
                      <div className="sales-ws-two-line">
                        <strong>{c.name || "-"}</strong>
                        {c.email && <span>{c.email}</span>}
                      </div>
                    </div>
                  </td>
                  <td>
                    {c.status ? (
                      <span className={`sales-ws-status ${String(c.status).toLowerCase()}`}>{c.status}</span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{c.quoteCount ?? 0}</td>
                  <td>{c.orderCount ?? 0}</td>
                  <td>{c.invoiceCount ?? 0}</td>
                  <td className="sales-ws-money">{money(c.orderRevenue)}</td>
                  <td>{formatDate(c.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="sales-ws-pagination">
        <span>
          Showing {from} to {to} of {total.toLocaleString("en-US")} customers
        </span>
        <div>
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            <ChevronLeft size={14} />
          </button>
          <button className="active">{page}</button>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            <ChevronRight size={14} />
          </button>
        </div>
        <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
          <option value="20">20 / page</option>
          <option value="50">50 / page</option>
          <option value="100">100 / page</option>
        </select>
      </div>
    </section>
  );
}
