import React from "react";
import FinancialRecordSection from "./FinancialRecordSection";
import TransactionModal from "./TransactionModal";
import financialApi from "../../api/financialApi";
import { money, formatDate } from "../sales/salesFormat";

const STATUS_OPTIONS = ["Pending", "Completed", "Failed", "Cancelled"];

const columns = [
  { header: "Transaction ID", render: (r) => r.transactionNumber || "-" },
  { header: "Client", render: (r) => <b>{r.clientName || "-"}</b> },
  { header: "Account", render: (r) => r.accountNumber || "-" },
  { header: "Type", render: (r) => r.transactionType || "-" },
  { header: "Amount", className: "money", render: (r) => (r.amount != null ? money(r.amount) : "-") },
  {
    header: "Status",
    render: (r) => (
      <span className={`status ${String(r.status || "").toLowerCase()}`}>{r.status || "-"}</span>
    ),
  },
  { header: "Date", render: (r) => formatDate(r.transactionDate) },
];

export default function TransactionsSection() {
  return (
    <FinancialRecordSection
      title="Transactions"
      subtitle="Tracking records of money movement (no funds are moved by Cortexa)"
      newLabel="New Transaction"
      columns={columns}
      statusOptions={STATUS_OPTIONS}
      fetchList={(params) => financialApi.listTransactions(params)}
      ModalComponent={TransactionModal}
    />
  );
}
