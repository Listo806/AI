import React from "react";
import SalesRecordSection from "./SalesRecordSection";
import InvoiceModal from "./InvoiceModal";
import salesApi from "../../api/salesApi";
import { money, formatDate, initials } from "./salesFormat";

const columns = [
  { header: "Invoice #", className: "quote-id", render: (r) => r.invoiceNumber || "-" },
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
    header: "Order",
    render: (r) => (
      <div className="sales-ws-two-line">
        <strong>{r.orderNumber || "-"}</strong>
      </div>
    ),
  },
  { header: "Amount", className: "sales-ws-money", render: (r) => (r.amount != null ? money(r.amount) : "-") },
  {
    header: "Status",
    render: (r) => (
      <span className={`sales-ws-status ${String(r.status || "").toLowerCase()}`}>{r.status || "-"}</span>
    ),
  },
  {
    header: "Due / Paid",
    render: (r) => (
      <div className="sales-ws-two-line">
        <strong>{formatDate(r.dueDate)}</strong>
        <span>{r.paidDate ? `paid ${formatDate(r.paidDate)}` : "unpaid"}</span>
      </div>
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

export default function InvoicesSection() {
  return (
    <SalesRecordSection
      title="Invoices"
      subtitle="Track invoices across the sales cycle"
      newLabel="New Invoice"
      columns={columns}
      fetchList={(params) => salesApi.listInvoices(params)}
      ModalComponent={InvoiceModal}
    />
  );
}
