import React from "react";
import SalesRecordSection from "./SalesRecordSection";
import CommissionModal from "./CommissionModal";
import salesApi from "../../api/salesApi";
import { money, formatDate, initials } from "./salesFormat";

const columns = [
  { header: "Commission #", className: "quote-id", render: (r) => r.commissionNumber || "-" },
  {
    header: "Sales Rep",
    render: (r) =>
      r.repName ? (
        <div className="sales-ws-owner">
          <span>{initials(r.repName)}</span>
          {r.repName}
        </div>
      ) : (
        "-"
      ),
  },
  {
    header: "Customer",
    render: (r) => (
      <div className="sales-ws-two-line">
        <strong>{r.customerName || "-"}</strong>
        {r.orderNumber && <span>{r.orderNumber}</span>}
      </div>
    ),
  },
  { header: "Rate", render: (r) => (r.rate != null ? `${r.rate}%` : "-") },
  { header: "Amount", className: "sales-ws-money", render: (r) => (r.amount != null ? money(r.amount) : "-") },
  {
    header: "Status",
    render: (r) => (
      <span className={`sales-ws-status ${String(r.status || "").toLowerCase()}`}>{r.status || "-"}</span>
    ),
  },
  {
    header: "Earned / Paid",
    render: (r) => (
      <div className="sales-ws-two-line">
        <strong>{formatDate(r.earnedDate)}</strong>
        <span>{r.paidDate ? `paid ${formatDate(r.paidDate)}` : "unpaid"}</span>
      </div>
    ),
  },
  { header: "Created", render: (r) => formatDate(r.createdAt) },
];

export default function CommissionsSection() {
  return (
    <SalesRecordSection
      title="Commissions"
      subtitle="Track sales commissions and payouts"
      newLabel="New Commission"
      columns={columns}
      fetchList={(params) => salesApi.listCommissions(params)}
      ModalComponent={CommissionModal}
    />
  );
}
