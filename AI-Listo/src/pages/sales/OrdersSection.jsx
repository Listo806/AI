import React from "react";
import SalesRecordSection from "./SalesRecordSection";
import OrderModal from "./OrderModal";
import salesApi from "../../api/salesApi";
import { money, formatDate, initials } from "./salesFormat";

const columns = [
  { header: "Order #", className: "quote-id", render: (r) => r.orderNumber || "-" },
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
    header: "Contact",
    render: (r) => (
      <div className="sales-ws-two-line">
        <strong>{r.contactName || "-"}</strong>
        {r.contactRole && <span>{r.contactRole}</span>}
      </div>
    ),
  },
  {
    header: "Deal",
    render: (r) => (
      <div className="sales-ws-two-line deal">
        <strong>{r.dealName || "-"}</strong>
      </div>
    ),
  },
  { header: "Value", className: "sales-ws-money", render: (r) => (r.value != null ? money(r.value) : "-") },
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

export default function OrdersSection() {
  return (
    <SalesRecordSection
      title="Orders"
      subtitle="Create, manage and track all your orders"
      newLabel="New Order"
      columns={columns}
      fetchList={(params) => salesApi.listOrders(params)}
      ModalComponent={OrderModal}
    />
  );
}
