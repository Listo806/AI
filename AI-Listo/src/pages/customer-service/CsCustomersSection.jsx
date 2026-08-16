import React, { useEffect, useState } from "react";
import customerServiceApi from "../../api/customerServiceApi";
import CsCustomerDetail from "./CsCustomerDetail";
import { relativeTime } from "../sales/salesFormat";

// Customers tab: the account's CRM contacts enriched with real ticket rollups. Read
// from /customer-service/customers (team-scoped, per-customer counts). No duplicate
// customer identity is created — these ARE the CRM contacts.
export default function CsCustomersSection() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailId, setDetailId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => { setPage(1); }, [debounced, limit]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    customerServiceApi
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
    return () => { alive = false; };
  }, [debounced, page, limit]);

  // Re-render the data-lucide action icons whenever the rows change.
  useEffect(() => { window.lucide?.createIcons(); }, [rows, loading, detailId]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <>
      <div className="csw-section-head">
        <div>
          <h2>Customers</h2>
          <p>Your contacts, with their support history</p>
        </div>
      </div>
      <div className="csw-filters">
        <label>
          <i data-lucide="search" style={{ width: 16, height: 16 }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..." />
        </label>
        <button className="reset" onClick={() => setSearch("")}>↻ Reset</button>
      </div>
      <div className="csw-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Total Tickets</th>
              <th>Open</th>
              <th>Resolved</th>
              <th>Last Interaction</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 24, color: "#64748b" }}>Loading…</td></tr>
            ) : error ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 24, color: "#b91c1c" }}>{error}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 24, color: "#64748b" }}>No customers yet.</td></tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id}>
                  <td><b>{c.name || "-"}</b></td>
                  <td>{c.email || "-"}</td>
                  <td>{c.phone || "-"}</td>
                  <td>{c.totalTickets ?? 0}</td>
                  <td>{c.openTickets ?? 0}</td>
                  <td>{c.resolvedTickets ?? 0}</td>
                  <td className="recent">{c.lastInteraction ? relativeTime(c.lastInteraction) : "-"}</td>
                  <td>
                    <div className="row-actions">
                      <button onClick={() => setDetailId(c.id)}><i data-lucide="eye" style={{ width: 14, height: 14 }} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="csw-pagination">
          <span>Showing {from} to {to} of {total.toLocaleString("en-US")} customers</span>
          <div>
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
            <button className="active">{page}</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>›</button>
          </div>
          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </select>
        </div>
      </div>

      <CsCustomerDetail
        open={!!detailId}
        customerId={detailId}
        onClose={() => setDetailId(null)}
      />
    </>
  );
}
