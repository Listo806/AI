import React from "react";
import { useTranslation } from "react-i18next";
import FinancialRecordSection from "./FinancialRecordSection";
import TransactionModal from "./TransactionModal";
import financialApi from "../../api/financialApi";
import { money, formatDate } from "../sales/salesFormat";

const STATUS_OPTIONS = ["Pending", "Completed", "Failed", "Cancelled"];

export default function TransactionsSection() {
  const { t } = useTranslation();
  const columns = [
    { header: t("financialWorkspace.transactions.columns.id"), render: (r) => r.transactionNumber || "-" },
    { header: t("financialWorkspace.transactions.columns.client"), render: (r) => <b>{r.clientName || "-"}</b> },
    { header: t("financialWorkspace.transactions.columns.account"), render: (r) => r.accountNumber || "-" },
    { header: t("financialWorkspace.transactions.columns.type"), render: (r) => r.transactionType || "-" },
    { header: t("financialWorkspace.transactions.columns.amount"), className: "money", render: (r) => (r.amount != null ? money(r.amount) : "-") },
    {
      header: t("financialWorkspace.transactions.columns.status"),
      render: (r) => (
        <span className={`status ${String(r.status || "").toLowerCase()}`}>{r.status || "-"}</span>
      ),
    },
    { header: t("financialWorkspace.transactions.columns.date"), render: (r) => formatDate(r.transactionDate) },
  ];
   return (
    <FinancialRecordSection
      title={t("financialWorkspace.tabs.transactions")}
      subtitle={t("financialWorkspace.transactions.subtitle")}
      newLabel={t("financialWorkspace.actions.newTransaction")}
      columns={columns}
      statusOptions={STATUS_OPTIONS}
      fetchList={(params) => financialApi.listTransactions(params)}
      ModalComponent={TransactionModal}
    />
  );
}
