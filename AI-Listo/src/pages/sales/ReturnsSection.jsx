import React from "react";
import SalesRecordSection from "./SalesRecordSection";
import ReturnModal from "./ReturnModal";
import salesApi from "../../api/salesApi";
import { money, formatDate, initials } from "./salesFormat";

const columns = [
  { header: "Return #", className: "quote-id", render: (r) => r.returnNumber || "-" },
  {
    header: "Customer",
    render: (r) => (
      <div className="sales-ws-customer">
        <strong>{r.customerName || "-"}</strong>
        {r.segment && <span>{r.segment}</span>}
      </div>
    ),
  },
  {
    header: "Original Order",
    render: (r) => (
      <div className="sales-ws-two-line">
        <strong>{r.orderNumber || "-"}</strong>
      </div>
    ),
  },
  { header: "Amount", className: "sales-ws-money", render: (r) => (r.value != null ? money(r.value) : "-") },
  {
    header: "Reason",
    render: (r) => r.reason || "-",
  },
  {
    header: "Status",
    render: (r) => (
      <span className={`sales-ws-status ${String(r.status || "").toLowerCase()}`}>{r.status || "-"}</span>
    ),
  },
  {
    header: "Owner",
    render: (r) =>
      r.ownerName ? (
        <div className="sales-ws-owner">
          <span>{initials(r.ownerName)}</span>
          {r.ownerName}
        </div>
      ) : (
        "-"
      ),
  },
  { header: "Created", render: (r) => formatDate(r.createdAt) },
];

export default function ReturnsSection() {
  return (
    <SalesRecordSection
      title="Returns"
      subtitle="Create, manage and track all your returns"
      newLabel="New Return"
      columns={columns}
      fetchList={(params) => salesApi.listReturns(params)}
      ModalComponent={ReturnModal}
    />
  );
}
