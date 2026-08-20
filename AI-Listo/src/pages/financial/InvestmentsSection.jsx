import React from "react";
import { useTranslation } from "react-i18next";
import FinancialRecordSection from "./FinancialRecordSection";
import InvestmentModal from "./InvestmentModal";
import financialApi from "../../api/financialApi";
import { money, formatDate } from "../sales/salesFormat";

const STATUS_OPTIONS = ["Active", "Sold", "Closed"];

export default function InvestmentsSection() {
  const { t } = useTranslation();
  const columns = [
    { header: t("financialWorkspace.investments.columns.id"), render: (r) => r.investmentNumber || "-" },
    { header: t("financialWorkspace.investments.columns.holding"), render: (r) => <b>{r.name || "-"}</b> },
    { header: t("financialWorkspace.investments.columns.client"), render: (r) => r.clientName || "-" },
    { header: t("financialWorkspace.investments.columns.category"), render: (r) => r.category || "-" },
    { header: t("financialWorkspace.investments.columns.value"), className: "money", render: (r) => (r.amount != null ? money(r.amount) : "-") },
    {
      header: t("financialWorkspace.investments.columns.status"),
      render: (r) => (
        <span className={`status ${String(r.status || "").toLowerCase()}`}>{r.status || "-"}</span>
      ),
    },
    { header: t("financialWorkspace.investments.columns.asOf"), render: (r) => formatDate(r.asOfDate) },
  ];
   return (
    <FinancialRecordSection
      title={t("financialWorkspace.tabs.investments")}
      subtitle={t("financialWorkspace.investments.subtitle")}
      newLabel={t("financialWorkspace.actions.newInvestment")}
      columns={columns}
      statusOptions={STATUS_OPTIONS}
      fetchList={(params) => financialApi.listInvestments(params)}
      ModalComponent={InvestmentModal}
    />
  );
}
