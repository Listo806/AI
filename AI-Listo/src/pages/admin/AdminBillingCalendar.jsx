import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BadgeDollarSign,
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Download,
  Filter,
  MoreHorizontal,
  PauseCircle,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  TrendingUp,
  UserRoundX,
  X,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import billingCalendarApi from "../../api/billingCalendarApi";
import "./AdminBillingCalendar.css";

const STATUS_META = {
  scheduled: { labelKey: "scheduled", color: "#2563eb" },
  paid: { labelKey: "paid", color: "#10b981" },
  failed: { labelKey: "failed", color: "#ef4444" },
  past_due: { labelKey: "pastDue", color: "#f97316" },
  canceled: { labelKey: "canceled", color: "#64748b" },
  rescheduled: { labelKey: "rescheduled", color: "#7c3aed" },
};

const EXCEPTION_META = {
  failed_payments: { key: "failedPayments", Icon: AlertTriangle },
  past_due: { key: "pastDue", Icon: Clock3 },
  rescheduled: { key: "rescheduled", Icon: CalendarDays },
  needs_review: { key: "needsReview", Icon: Bell },
  refund_pending: { key: "refundPending", Icon: RefreshCw },
};

const activityIcon = (kind) => {
  switch (kind) {
    case "payment_success":
    case "renewed": return CircleCheckBig;
    case "payment_failed":
    case "past_due": return AlertTriangle;
    case "billing_date_updated": return CalendarDays;
    case "refund":
    case "refund_pending": return RotateCcw;
    case "paused": return PauseCircle;
    case "canceled": return XCircle;
    default: return ReceiptText;
  }
};

const money = (v, c = "USD", locale) =>
  new Intl.NumberFormat(locale, { style: "currency", currency: c, maximumFractionDigits: 2 }).format(Number(v || 0));
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dayTitle = (d, locale) => new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(d);
const asDate = (value) => value ? new Date(value) : null;
const dateTimeLabel = (value, locale) => {
  const d = asDate(value);
  if (!d || Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(d);
};

function monthDays(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const start = new Date(first); start.setDate(first.getDate() - first.getDay());
  const end = new Date(last); end.setDate(last.getDate() + (6 - last.getDay()));
  const rows = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) rows.push(new Date(d));
  return rows;
}

function weekDays(selectedDate) {
  const start = new Date(selectedDate);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i); return d;
  });
}

function StatusPill({ status, t }) {
  const m = STATUS_META[status] || STATUS_META.scheduled;
  return <span className={`abc-status ${status}`}><i style={{ background: m.color }} />{t(`adminBillingCalendar.status.${m.labelKey}`)}</span>;
}

function StatCard({ tone, label, value, amount, active, onClick }) {
  return <button className={`abc-day-stat ${tone} ${active ? "active" : ""}`} onClick={onClick}>
    <strong>{value}</strong><span>{label}</span><b>{amount}</b>
  </button>;
}

function Modal({ title, onClose, children, wide = false }) {
  return <div className="abc-modal-overlay" onMouseDown={onClose}>
    <div className={`abc-modal ${wide ? "wide" : ""}`} onMouseDown={(e) => e.stopPropagation()}>
      <header><h3>{title}</h3><button onClick={onClose}><X /></button></header>
      <div className="abc-modal-body">{children}</div>
    </div>
  </div>;
}

export default function AdminBillingCalendar() {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage || i18n.language || undefined;
  const quickRef = useRef(null);

  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [view, setView] = useState("month");
  const [dayPanelOpen, setDayPanelOpen] = useState(true);
  const [calendar, setCalendar] = useState({});
  const [overview, setOverview] = useState({});
  const [day, setDay] = useState({ summary: {}, customers: [], total: 0, page: 1, totalPages: 1 });
  const [upcoming, setUpcoming] = useState([]);
  const [activity, setActivity] = useState([]);
  const [exceptions, setExceptions] = useState({});
  const [status, setStatus] = useState("all");
  const [calendarFilter, setCalendarFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);
  const [quickDate, setQuickDate] = useState("");
  const [quickTime, setQuickTime] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [rescheduleRow, setRescheduleRow] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [changePlanRow, setChangePlanRow] = useState(null);
  const [newPlan, setNewPlan] = useState("solo");
  const [newCycle, setNewCycle] = useState("monthly");
  const [refundRow, setRefundRow] = useState(null);
  const [refundTxn, setRefundTxn] = useState(null);
  const [refundType, setRefundType] = useState("full");
  const [refundItemId, setRefundItemId] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("requested_by_admin");

  const days = useMemo(() => monthDays(month), [month]);
  const currentWeek = useMemo(() => weekDays(selectedDate), [selectedDate]);
  const selectedRows = useMemo(() => (day.customers || []).filter((r) => selectedIds.includes(r.subscriptionId || r.id)), [day.customers, selectedIds]);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 4500);
  };

  const loadMonth = useCallback(async () => {
    try {
      setError("");
      const mk = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
      const [m, o, u, a, e] = await Promise.all([
        billingCalendarApi.month(mk),
        billingCalendarApi.overview(mk),
        billingCalendarApi.upcoming({ limit: 5 }),
        billingCalendarApi.activity({ limit: 5 }),
        billingCalendarApi.exceptions(),
      ]);
      const map = {};
      (m?.days || []).forEach((x) => { map[x.date] = x; });
      setCalendar(map);
      setOverview(o || {});
      setUpcoming(u?.data || u || []);
      setActivity(a?.data || a || []);
      setExceptions(e || {});
    } catch (e) {
      setError(e?.message || t("adminBillingCalendar.errors.load", { defaultValue: "Unable to load billing calendar." }));
    }
  }, [month, t]);

  const loadDay = useCallback(async (page = 1) => {
    try {
      const r = await billingCalendarApi.day(ymd(selectedDate), {
        page, limit: 7, status: status === "all" ? undefined : status, search: search || undefined,
      });
      setDay(r || { summary: {}, customers: [], total: 0, page: 1, totalPages: 1 });
    } catch (e) {
      setError(e?.message || t("adminBillingCalendar.errors.day", { defaultValue: "Unable to load billing day." }));
    }
  }, [selectedDate, status, search, t]);

  useEffect(() => { loadMonth(); }, [loadMonth]);
  useEffect(() => { loadDay(1); setSelectedIds([]); }, [loadDay]);

  const refreshAll = async () => Promise.all([loadMonth(), loadDay(day.page || 1)]);

  const selectDate = (d) => {
    setSelectedDate(d);
    setDayPanelOpen(true);
    setStatus("all");
    if (d.getMonth() !== month.getMonth() || d.getFullYear() !== month.getFullYear()) {
      setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  };
  const toggleId = (id) => setSelectedIds((v) => v.includes(id) ? v.filter((x) => x !== id) : [...v, id]);
  const toggleStatus = (s) => setStatus((v) => v === s ? "all" : s);

  const statusKeys = (info) => Array.isArray(info?.statuses) ? info.statuses : Object.keys(info?.statuses || {});
  const calendarMatches = (info) => calendarFilter === "all" || statusKeys(info).includes(calendarFilter);

  const doBulkReschedule = async () => {
    if (!selectedIds.length || !quickDate) return;
    const time = quickTime || "12:00";
    const localDate = new Date(`${quickDate}T${time}:00`);
    if (Number.isNaN(localDate.getTime())) return setError(t("adminBillingCalendar.errors.invalidDate", { defaultValue: "Invalid billing date/time." }));
    const nextBilledAt = localDate.toISOString();
    if (!window.confirm(t("adminBillingCalendar.confirm.bulkReschedule", {
      defaultValue: `Reschedule ${selectedIds.length} subscription(s) to ${quickDate} at ${time}? Paddle will be updated first.`,
      count: selectedIds.length, date: quickDate, time,
    }))) return;
    setBusy(true); setError("");
    try {
      const result = await billingCalendarApi.bulkReschedule({ subscriptionIds: selectedIds, nextBilledAt });
      if (result?.failed) {
        setError(t("adminBillingCalendar.messages.reschedulePartial", { defaultValue: `${result.succeeded || 0} updated, ${result.failed} failed.`, succeeded: result.succeeded || 0, failed: result.failed }));
      } else {
        showNotice(t("adminBillingCalendar.messages.rescheduled", { defaultValue: "Billing schedule updated after Paddle confirmation." }));
      }
      setSelectedIds([]);
      setQuickDate(""); setQuickTime("");
      selectDate(localDate);
      await refreshAll();
    } catch (e) { setError(e?.message || "Reschedule failed."); }
    finally { setBusy(false); }
  };

  const reminderMessage = (row, target) => {
    const due = row?.billingAt ? dateTimeLabel(row.billingAt, locale) : dayTitle(selectedDate, locale);
    const link = target?.updatePaymentMethodUrl;
    return [
      `Hello ${row?.customerName || target?.customerName || ""},`,
      "",
      `This is a reminder about your Cortexa subscription billing scheduled for ${due}.`,
      link ? `You can securely review or update your payment method here: ${link}` : "Please review your Cortexa billing details and contact support if you need assistance.",
      "",
      "Thank you,",
      "Cortexa",
    ].join("\n");
  };

  const sendReminderForRow = async (row, quiet = false) => {
    const id = row.subscriptionId || row.id;
    const target = await billingCalendarApi.reminderTarget(id);
    const customerId = row.customerId || target?.customerId;
    if (!customerId) throw new Error("Customer account could not be resolved for this subscription.");
    await billingCalendarApi.sendCustomerEmail(customerId, {
      subject: "Cortexa billing reminder",
      message: reminderMessage(row, target),
    });
    if (!quiet) showNotice(t("adminBillingCalendar.messages.reminderSent", { defaultValue: "Billing reminder sent." }));
    return target;
  };

  const bulkReminder = async () => {
    if (!selectedRows.length) return;
    if (!window.confirm(t("adminBillingCalendar.confirm.sendReminder", { defaultValue: `Send a billing reminder to ${selectedRows.length} selected customer(s)?`, count: selectedRows.length }))) return;
    setBusy(true); setError("");
    let ok = 0; const failures = [];
    for (const row of selectedRows) {
      try { await sendReminderForRow(row, true); ok += 1; }
      catch (e) { failures.push(`${row.customerName}: ${e?.message || "failed"}`); }
    }
    setBusy(false);
    if (failures.length) setError(`${ok} sent. ${failures.length} failed: ${failures.join("; ")}`);
    else showNotice(t("adminBillingCalendar.messages.remindersSent", { defaultValue: `${ok} billing reminder(s) sent.`, count: ok }));
  };

  const retryRow = async (row, quiet = false) => {
    const id = row.subscriptionId || row.id;
    const result = await billingCalendarApi.retryPayment(id);
    if (result?.automaticRetryManagedByPaddle) {
      if (result.updatePaymentMethodUrl && !quiet) window.open(result.updatePaymentMethodUrl, "_blank", "noopener,noreferrer");
      return { ...result, row };
    }
    return { ...result, row };
  };

  const bulkRetry = async () => {
    const eligible = selectedRows.filter((r) => ["failed", "past_due"].includes(r.status));
    if (!eligible.length) return setError(t("adminBillingCalendar.messages.noRetryEligible", { defaultValue: "None of the selected rows are failed or past due." }));
    setBusy(true); setError("");
    const results = [];
    for (const row of eligible) {
      try { results.push(await retryRow(row, true)); }
      catch (e) { results.push({ row, error: e?.message || "failed" }); }
    }
    setBusy(false);
    const manualUnsupported = results.filter((r) => r.automaticRetryManagedByPaddle);
    if (manualUnsupported.length) {
      setModal({ type: "retry-results", data: results });
    } else {
      showNotice(t("adminBillingCalendar.messages.retryRequested", { defaultValue: "Retry request completed." }));
    }
    await refreshAll();
  };

  const exportSelected = () => {
    if (!selectedRows.length) return;
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [
      ["Customer", "Customer ID", "Plan", "Billing Time", "Status", "Subscription ID", "Paddle Subscription ID", "Transaction ID"],
      ...selectedRows.map((r) => [r.customerName, r.customerId, r.planName, r.billingAt || r.billingTime, r.status, r.subscriptionId, r.paddleSubscriptionId, r.paddleTransactionId]),
    ];
    const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `billing-calendar-${ymd(selectedDate)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const openAllUpcoming = async () => {
    setModalLoading(true); setModal({ type: "upcoming", data: [] });
    try { const r = await billingCalendarApi.upcoming({ limit: 90 }); setModal({ type: "upcoming", data: r?.data || r || [] }); }
    catch (e) { setError(e?.message || "Unable to load upcoming billing days."); setModal(null); }
    finally { setModalLoading(false); }
  };

  const openAllActivity = async () => {
    setModalLoading(true); setModal({ type: "activity", data: [] });
    try { const r = await billingCalendarApi.activity({ limit: 100 }); setModal({ type: "activity", data: r?.data || r || [] }); }
    catch (e) { setError(e?.message || "Unable to load billing activity."); setModal(null); }
    finally { setModalLoading(false); }
  };

  const openExceptions = async (type = "all") => {
    setModalLoading(true); setModal({ type: "exceptions", exceptionType: type, data: [] });
    try { const r = await billingCalendarApi.exceptionRecords({ type, limit: 200 }); setModal({ type: "exceptions", exceptionType: type, data: r?.data || [] }); }
    catch (e) { setError(e?.message || "Unable to load billing exceptions."); setModal(null); }
    finally { setModalLoading(false); }
  };

  const openCustomer = async (customerId) => {
    if (!customerId) return;
    setModalLoading(true); setModal({ type: "customer" }); setCustomerDetail(null);
    try { setCustomerDetail(await billingCalendarApi.customerDetail(customerId)); }
    catch (e) { setError(e?.message || "Unable to load customer."); setModal(null); }
    finally { setModalLoading(false); }
  };

  const openActivity = (item) => setModal({ type: "activity-detail", data: item });

  const openReschedule = (row) => {
    const d = asDate(row.billingAt) || selectedDate;
    setRescheduleRow(row);
    setRescheduleDate(ymd(d));
    setRescheduleTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
    setModal({ type: "reschedule" });
    setOpenMenu(null);
  };

  const saveSingleReschedule = async () => {
    if (!rescheduleRow || !rescheduleDate) return;
    const time = rescheduleTime || "12:00";
    const next = new Date(`${rescheduleDate}T${time}:00`);
    const current = rescheduleRow.billingAt ? dateTimeLabel(rescheduleRow.billingAt, locale) : "—";
    if (!window.confirm(t("adminBillingCalendar.confirm.singleReschedule", { defaultValue: `Reschedule billing from ${current} to ${dateTimeLabel(next, locale)}? Paddle will be updated first.`, from: current, to: dateTimeLabel(next, locale) }))) return;
    setBusy(true);
    try {
      await billingCalendarApi.reschedule(rescheduleRow.subscriptionId, { nextBilledAt: next.toISOString() });
      setModal(null); setRescheduleRow(null); selectDate(next);
      showNotice(t("adminBillingCalendar.messages.rescheduled", { defaultValue: "Billing schedule updated after Paddle confirmation." }));
      await refreshAll();
    } catch (e) { setError(e?.message || "Reschedule failed."); }
    finally { setBusy(false); }
  };

  const openChangePlan = (row) => {
    setChangePlanRow(row); setNewPlan((row.planName || "").toLowerCase().includes("business") ? "business" : (row.planName || "").toLowerCase().includes("scale") ? "scale" : "solo");
    setNewCycle((row.planPriceLabel || "").includes("year") ? "annual" : "monthly");
    setModal({ type: "change-plan" }); setOpenMenu(null);
  };

  const saveChangePlan = async () => {
    if (!changePlanRow?.customerId) return;
    setBusy(true);
    try {
      await billingCalendarApi.changeCustomerPlan(changePlanRow.customerId, { plan: newPlan, billingCycle: newCycle });
      setModal(null); showNotice(t("adminBillingCalendar.messages.planChanged", { defaultValue: "Customer plan updated." })); await refreshAll();
    } catch (e) { setError(e?.message || "Could not change plan."); }
    finally { setBusy(false); }
  };

  const pauseRow = async (row) => {
    setOpenMenu(null);
    if (!window.confirm(t("adminBillingCalendar.confirm.pause", { defaultValue: `Pause ${row.customerName}'s subscription at the next billing period?`, customer: row.customerName }))) return;
    setBusy(true); try { await billingCalendarApi.pauseSubscription(row.subscriptionId, { immediately: false }); showNotice("Subscription pause sent to Paddle and confirmed."); await refreshAll(); } catch (e) { setError(e?.message || "Pause failed."); } finally { setBusy(false); }
  };

  const cancelRow = async (row) => {
    setOpenMenu(null);
    if (!window.confirm(t("adminBillingCalendar.confirm.cancel", { defaultValue: `Cancel ${row.customerName}'s subscription at the end of the current billing period?`, customer: row.customerName }))) return;
    setBusy(true); try { await billingCalendarApi.cancelSubscription(row.subscriptionId, { immediately: false }); showNotice("Cancellation sent to Paddle and confirmed."); await refreshAll(); } catch (e) { setError(e?.message || "Cancel failed."); } finally { setBusy(false); }
  };

  const reminderRow = async (row) => {
    setOpenMenu(null); setBusy(true);
    try { await sendReminderForRow(row); }
    catch (e) { setError(e?.message || "Reminder failed."); }
    finally { setBusy(false); }
  };

  const retrySingle = async (row) => {
    setOpenMenu(null); setBusy(true);
    try {
      const r = await retryRow(row);
      if (r?.automaticRetryManagedByPaddle) {
        showNotice(t("adminBillingCalendar.messages.paddleRetry", { defaultValue: "Paddle manages automatic retries. The secure payment-update page was opened when available." }));
      }
    } catch (e) { setError(e?.message || "Retry failed."); }
    finally { setBusy(false); }
  };

  const openRefund = async (row) => {
    setOpenMenu(null); setRefundRow(row); setRefundTxn(null); setRefundType("full"); setRefundItemId(""); setRefundAmount(""); setRefundReason("requested_by_admin");
    setModal({ type: "refund" }); setModalLoading(true);
    try {
      const txn = await billingCalendarApi.transaction(row.paddleTransactionId);
      setRefundTxn(txn?.data || txn);
    } catch (e) { setError(e?.message || "Unable to load Paddle transaction."); setModal(null); }
    finally { setModalLoading(false); }
  };

  const submitRefund = async () => {
    if (!refundRow?.subscriptionId || !refundRow?.paddleTransactionId) return;
    setBusy(true);
    try {
      const result = await billingCalendarApi.refund(refundRow.subscriptionId, {
        transactionId: refundRow.paddleTransactionId, type: refundType, reason: refundReason,
        itemId: refundType === "partial" ? refundItemId : undefined,
        amount: refundType === "partial" ? refundAmount : undefined,
      });
      setModal(null);
      showNotice(result?.status === "pending_approval" ? "Refund requested in Paddle and is pending approval." : "Refund request accepted by Paddle.");
      await refreshAll();
    } catch (e) { setError(e?.message || "Refund request failed."); }
    finally { setBusy(false); }
  };

  const s = day.summary || {};
  const renderDateCell = (d) => {
    const key = ymd(d), info = calendar[key], outside = d.getMonth() !== month.getMonth(), active = key === ymd(selectedDate);
    const matched = !info || calendarMatches(info);
    return <button key={key} className={`abc-date ${outside ? "outside" : ""} ${active ? "active" : ""} ${matched ? "" : "filtered-out"}`} onClick={() => selectDate(d)}>
      <div><span>{d.getDate()}</span>{info?.customerCount != null && <em>{info.customerCount}</em>}</div>
      {info && <><strong>{money(info.expectedAmount, info.currency || "USD", locale)}</strong><p>{statusKeys(info).map((x) => <i key={x} style={{ background: STATUS_META[x]?.color || "#64748b" }} />)}</p></>}
    </button>;
  };

  return <div className="abc-page">
    <div className="abc-title"><h1>{t("adminBillingCalendar.title")}</h1><p>{t("adminBillingCalendar.subtitle")}</p></div>
    {error && <div className="abc-error"><span>{error}</span><button onClick={() => setError("")}><X /></button></div>}
    {notice && <div className="abc-notice">{notice}</div>}
    {busy && <div className="abc-busy">{t("common.loading")}</div>}

    <section className="abc-kpis">
      <div className="abc-kpi abc-kpi-purple"><div className="abc-kpi-copy"><span>{t("adminBillingCalendar.kpis.monthlyRevenue")}</span><strong>{money(overview.monthlyRevenue, "USD", locale)}</strong><small>{t("adminBillingCalendar.kpis.currentMonth")}</small></div><i className="abc-kpi-icon"><BadgeDollarSign /></i></div>
      <div className="abc-kpi abc-kpi-green"><div className="abc-kpi-copy"><span>{t("adminBillingCalendar.kpis.activeSubscriptions")}</span><strong>{Number(overview.activeSubscriptions || 0).toLocaleString(locale)}</strong><small>{t("adminBillingCalendar.kpis.activeInPaddle")}</small></div><i className="abc-kpi-icon"><CreditCard /></i></div>
      <div className="abc-kpi abc-kpi-blue"><div className="abc-kpi-copy"><span>{t("adminBillingCalendar.kpis.mrrForecast")}</span><strong>{money(overview.mrrForecast, "USD", locale)}</strong><small>{t("adminBillingCalendar.kpis.upcomingRenewals")}</small></div><i className="abc-kpi-icon"><TrendingUp /></i></div>
      <div className="abc-kpi abc-kpi-orange"><div className="abc-kpi-copy"><span>{t("adminBillingCalendar.kpis.failedPayments")}</span><strong>{Number(overview.failedPayments || 0).toLocaleString(locale)}</strong><small>{t("adminBillingCalendar.kpis.needsAttention")}</small></div><i className="abc-kpi-icon"><AlertTriangle /></i></div>
      <div className="abc-kpi abc-kpi-violet"><div className="abc-kpi-copy"><span>{t("adminBillingCalendar.kpis.churnRate")}</span><strong>{Number(overview.churnRate || 0).toFixed(2)}%</strong><small>{t("adminBillingCalendar.kpis.currentMonth")}</small></div><i className="abc-kpi-icon"><UserRoundX /></i></div>
    </section>

    <section className={`abc-main ${dayPanelOpen ? "" : "day-closed"}`}>
      <article className="abc-calendar">
        <header><h2>{t("adminBillingCalendar.title")}</h2><div className="abc-view">
          {["month", "week", "list"].map((x) => <button key={x} className={view === x ? "active" : ""} onClick={() => setView(x)}>{t(`adminBillingCalendar.views.${x}`)}</button>)}
          <div className="abc-filter-wrap"><button className={calendarFilter !== "all" ? "active-filter" : ""} onClick={() => setFilterOpen((v) => !v)}><Filter /></button>{filterOpen && <div className="abc-filter-menu">
            <button className={calendarFilter === "all" ? "active" : ""} onClick={() => { setCalendarFilter("all"); setFilterOpen(false); }}>{t("common.all")}</button>
            {Object.entries(STATUS_META).map(([k, m]) => <button key={k} className={calendarFilter === k ? "active" : ""} onClick={() => { setCalendarFilter(k); setFilterOpen(false); }}><i style={{ background: m.color }} />{t(`adminBillingCalendar.status.${m.labelKey}`)}</button>)}
          </div>}</div>
        </div></header>

        <div className="abc-toolbar"><button onClick={() => selectDate(new Date())}>{t("common.today")}</button><button onClick={() => setMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}><ChevronLeft /></button><button onClick={() => setMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}><ChevronRight /></button><strong>{new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(month)}</strong></div>
        <div className="abc-legend">{Object.entries(STATUS_META).map(([k, m]) => <button key={k} className={calendarFilter === k ? "active" : ""} onClick={() => setCalendarFilter((v) => v === k ? "all" : k)}><i style={{ background: m.color }} />{t(`adminBillingCalendar.status.${m.labelKey}`)}</button>)}</div>

        {view !== "list" && <><div className="abc-week">{["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map((x) => <b key={x}>{t(`adminBillingCalendar.weekdays.${x}`)}</b>)}</div><div className={`abc-grid ${view === "week" ? "abc-week-only" : ""}`}>{(view === "week" ? currentWeek : days).map(renderDateCell)}</div></>}
        {view === "list" && <div className="abc-calendar-list">{Object.values(calendar).filter(calendarMatches).sort((a, b) => String(a.date).localeCompare(String(b.date))).map((info) => <button key={info.date} onClick={() => selectDate(new Date(`${info.date}T12:00:00`))}><span><b>{new Intl.DateTimeFormat(locale, { weekday: "short", month: "short", day: "numeric" }).format(new Date(`${info.date}T12:00:00`))}</b><small>{info.customerCount} {t("adminBillingCalendar.customers", { defaultValue: "customers" })}</small></span><strong>{money(info.expectedAmount, info.currency || "USD", locale)}</strong><i className="abc-list-dots">{statusKeys(info).map((x) => <em key={x} style={{ background: STATUS_META[x]?.color || "#64748b" }} />)}</i><ChevronRight /></button>)}</div>}
      </article>

      {dayPanelOpen && <aside className="abc-day-panel">
        <header className="abc-day-head"><h2>{dayTitle(selectedDate, locale)}</h2><button onClick={() => { setStatus("all"); setSearch(""); setDayPanelOpen(false); }}><X />{t("common.close")}</button></header>
        <div className="abc-day-stats"><StatCard tone="scheduled" label={t("adminBillingCalendar.status.scheduled")} value={s.scheduled?.count || 0} amount={money(s.scheduled?.amount, "USD", locale)} active={status === "scheduled"} onClick={() => toggleStatus("scheduled")} /><StatCard tone="paid" label={t("adminBillingCalendar.status.paid")} value={s.paid?.count || 0} amount={money(s.paid?.amount, "USD", locale)} active={status === "paid"} onClick={() => toggleStatus("paid")} /><StatCard tone="failed" label={t("adminBillingCalendar.status.failed")} value={s.failed?.count || 0} amount={money(s.failed?.amount, "USD", locale)} active={status === "failed"} onClick={() => toggleStatus("failed")} /><StatCard tone="pastdue" label={t("adminBillingCalendar.status.pastDue")} value={s.past_due?.count || 0} amount={money(s.past_due?.amount, "USD", locale)} active={status === "past_due"} onClick={() => toggleStatus("past_due")} /></div>
        <div className="abc-search"><div><Search /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("adminBillingCalendar.searchCustomers")} /></div><button onClick={() => setStatus((v) => v === "all" ? "failed" : "all")}><Filter />{t("adminBillingCalendar.filters")}</button></div>

        <table className="abc-table"><thead><tr><th></th><th>{t("adminBillingCalendar.table.customer")}</th><th>{t("adminBillingCalendar.table.plan")}</th><th>{t("adminBillingCalendar.table.billingTime")}</th><th>{t("common.status")}</th><th>{t("common.actions")}</th></tr></thead><tbody>{(day.customers || []).map((r) => {
          const id = r.subscriptionId || r.id;
          return <tr key={id}><td><input type="checkbox" checked={selectedIds.includes(id)} onChange={() => toggleId(id)} /></td><td><button className="abc-customer" onClick={() => openCustomer(r.customerId)}><span>{r.initials || (r.customerName || "?").slice(0, 2).toUpperCase()}</span><div><b>{r.customerName}</b><small>{r.customerId}</small></div></button></td><td><b>{r.planName}</b><small>{r.planPriceLabel}</small>{r.dueTodayDifferent && <small className="abc-exception">Due today: {money(r.dueToday, r.currency || "USD", locale)}</small>}</td><td>{r.billingAt ? new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(r.billingAt)) : r.billingTime}</td><td><StatusPill status={r.status} t={t} /></td><td className="abc-actions"><button onClick={() => setOpenMenu(openMenu === id ? null : id)}><MoreHorizontal /></button>{openMenu === id && <div className="abc-menu">
            <button onClick={() => { setOpenMenu(null); openCustomer(r.customerId); }}>{t("adminBillingCalendar.actions.viewCustomer")}</button>
            <button onClick={() => openReschedule(r)}>{t("adminBillingCalendar.actions.rescheduleBilling")}</button>
            <button onClick={() => openChangePlan(r)}>{t("adminBillingCalendar.actions.changePlan")}</button>
            <button onClick={() => pauseRow(r)}>{t("adminBillingCalendar.actions.pauseSubscription")}</button>
            <button onClick={() => cancelRow(r)}>{t("adminBillingCalendar.actions.cancelSubscription")}</button>
            <button onClick={() => reminderRow(r)}>{t("adminBillingCalendar.actions.sendReminder")}</button>
            {r.refundEligible && <button onClick={() => openRefund(r)}>{t("adminBillingCalendar.actions.refund")}</button>}
            {r.retryEligible && <button onClick={() => retrySingle(r)}>{t("adminBillingCalendar.actions.retryPayment")}</button>}
          </div>}</td></tr>;
        })}</tbody></table>
        <footer className="abc-pagination"><span>{t("adminBillingCalendar.showing", { defaultValue: "Showing" })} {day.total ? ((day.page - 1) * 7) + 1 : 0}–{Math.min(day.page * 7, day.total || 0)} {t("common.of")} {day.total || 0} {t("adminBillingCalendar.customers", { defaultValue: "customers" })}</span><div><button disabled={day.page <= 1} onClick={() => loadDay(day.page - 1)}><ChevronLeft /></button><b>{day.page || 1}</b><button disabled={day.page >= day.totalPages} onClick={() => loadDay(day.page + 1)}><ChevronRight /></button></div></footer>
      </aside>}
    </section>

    <section className="abc-bottom">
      <article className="abc-card"><header><h3>{t("adminBillingCalendar.sections.upcomingBillingDays")}</h3><button onClick={openAllUpcoming}>{t("adminBillingCalendar.viewAll")} →</button></header>{(upcoming || []).map((x) => <button key={x.date} className="abc-row abc-upcoming" onClick={() => selectDate(new Date(`${x.date}T12:00:00`))}><span>{x.label || x.date}</span><small>{x.customerCount} {t("adminBillingCalendar.customers", { defaultValue: "customers" })}</small><b>{money(x.expectedAmount, x.currency || "USD", locale)}</b></button>)}</article>

      <article className="abc-card"><header><h3>{t("adminBillingCalendar.sections.recentActivity")}</h3><button onClick={openAllActivity}>{t("adminBillingCalendar.viewAll")} →</button></header>{(activity || []).map((x, i) => { const Icon = activityIcon(x.kind); return <button key={x.id || i} className={`abc-row abc-activity tone-${x.kind || "default"}`} onClick={() => openActivity(x)}><i><Icon /></i><span><b>{x.title}</b><small>{x.customerName}</small></span><time>{x.timeAgo}</time><strong>{x.amountLabel}</strong></button>; })}</article>

      <article className="abc-card"><header><h3>{t("adminBillingCalendar.sections.billingExceptions")}</h3><button onClick={() => openExceptions("all")}>{t("adminBillingCalendar.viewAll")} →</button></header>{Object.entries(EXCEPTION_META).map(([key, meta]) => { const countKey = meta.key === "failedPayments" ? "failedPayments" : meta.key; const count = exceptions[countKey]; const Icon = meta.Icon; return <button key={key} className={`abc-row abc-ex-row tone-${key}`} onClick={() => openExceptions(key)}><i><Icon /></i><span>{t(`adminBillingCalendar.exceptions.${meta.key}`)}</span><b>{Number(count || 0).toLocaleString(locale)}</b></button>; })}</article>

      <article className="abc-card abc-bulk"><header><h3>{t("adminBillingCalendar.sections.bulkActions")} <span>({selectedIds.length} {t("adminBillingCalendar.selected", { defaultValue: "selected" })})</span></h3></header><div className="abc-bulk-buttons">
        <button disabled={!selectedIds.length || busy} onClick={() => quickRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}><CalendarDays />{t("adminBillingCalendar.actions.reschedule")}</button>
        <button disabled={!selectedIds.length || busy} onClick={bulkReminder}><Send />{t("adminBillingCalendar.actions.sendReminder")}</button>
        <button disabled={!selectedIds.length || busy} onClick={bulkRetry}><RefreshCw />{t("adminBillingCalendar.actions.retryFailed")}</button>
        <button disabled={!selectedIds.length || busy} onClick={exportSelected}><Download />{t("adminBillingCalendar.actions.exportList")}</button>
      </div><div className="abc-quick" ref={quickRef}><h4>{t("adminBillingCalendar.quickReschedule")}</h4><div><span>{t("adminBillingCalendar.moveSelectedTo")}</span><input type="date" value={quickDate} onChange={(e) => setQuickDate(e.target.value)} /><input type="time" value={quickTime} onChange={(e) => setQuickTime(e.target.value)} /><button disabled={!selectedIds.length || !quickDate || busy} onClick={doBulkReschedule}>{t("adminBillingCalendar.actions.reschedule")}</button></div><small>{t("adminBillingCalendar.paddleConfirmation")}</small></div></article>
    </section>

    <footer className="abc-footer"><div><CircleDollarSign />{t("adminBillingCalendar.syncedWithPaddle")}</div><div><span />{t("adminBillingCalendar.paddleStatus")} · {t("adminBillingCalendar.lastSync")}: {overview.lastSyncLabel || "—"}<button onClick={refreshAll}><RefreshCw /></button></div></footer>

    {modal && <Modal wide={["upcoming", "activity", "exceptions", "customer"].includes(modal.type)} title={
      modal.type === "upcoming" ? t("adminBillingCalendar.sections.upcomingBillingDays") :
      modal.type === "activity" ? t("adminBillingCalendar.sections.recentActivity") :
      modal.type === "exceptions" ? t("adminBillingCalendar.sections.billingExceptions") :
      modal.type === "customer" ? t("adminBillingCalendar.actions.viewCustomer") :
      modal.type === "reschedule" ? t("adminBillingCalendar.actions.rescheduleBilling") :
      modal.type === "change-plan" ? t("adminBillingCalendar.actions.changePlan") :
      modal.type === "refund" ? t("adminBillingCalendar.actions.refund") :
      modal.type === "retry-results" ? t("adminBillingCalendar.actions.retryFailed") : "Activity"
    } onClose={() => setModal(null)}>
      {modalLoading && <div className="abc-modal-loading">{t("common.loading")}</div>}

      {modal.type === "upcoming" && !modalLoading && <div className="abc-modal-list">{(modal.data || []).map((x) => <button key={x.date} onClick={() => { setModal(null); selectDate(new Date(`${x.date}T12:00:00`)); }}><CalendarDays /><span><b>{x.label || x.date}</b><small>{x.customerCount} {t("adminBillingCalendar.customers", { defaultValue: "customers" })}</small></span><strong>{money(x.expectedAmount, x.currency || "USD", locale)}</strong><ChevronRight /></button>)}</div>}

      {modal.type === "activity" && !modalLoading && <div className="abc-modal-list">{(modal.data || []).map((x) => { const Icon = activityIcon(x.kind); return <button key={x.id} onClick={() => openActivity(x)}><Icon /><span><b>{x.title}</b><small>{x.customerName} · {x.timeAgo}</small></span><strong>{x.amountLabel}</strong><ChevronRight /></button>; })}</div>}

      {modal.type === "activity-detail" && <div className="abc-detail-grid"><label>{t("adminBillingCalendar.table.customer")}</label><b>{modal.data?.customerName || "—"}</b><label>Activity</label><b>{modal.data?.title || "—"}</b><label>Time</label><b>{dateTimeLabel(modal.data?.happenedAt, locale)}</b><label>Transaction</label><b>{modal.data?.transactionId || "—"}</b><label>Subscription</label><b>{modal.data?.paddleSubscriptionId || modal.data?.subscriptionId || "—"}</b>{modal.data?.fromBilledAt && <><label>Previous billing</label><b>{dateTimeLabel(modal.data.fromBilledAt, locale)}</b></>}{modal.data?.toBilledAt && <><label>New billing</label><b>{dateTimeLabel(modal.data.toBilledAt, locale)}</b></>} {modal.data?.customerId && <button className="abc-primary" onClick={() => openCustomer(modal.data.customerId)}>{t("adminBillingCalendar.actions.viewCustomer")}</button>}</div>}

      {modal.type === "exceptions" && !modalLoading && <div className="abc-modal-list">{!(modal.data || []).length && <p className="abc-empty">{t("common.noData")}</p>}{(modal.data || []).map((r, i) => { const meta = EXCEPTION_META[r.exceptionType] || EXCEPTION_META.needs_review; const Icon = meta.Icon; return <button key={r.recordId || i} onClick={() => { if (r.toBilledAt) { setModal(null); selectDate(new Date(r.toBilledAt)); } else if (r.customerId) openCustomer(r.customerId); }}><Icon /><span><b>{t(`adminBillingCalendar.exceptions.${meta.key}`)}</b><small>{r.customerName} · {r.status || ""}</small></span><strong>{r.amount != null ? money(r.amount, r.currency || "USD", locale) : ""}</strong><ChevronRight /></button>; })}</div>}

      {modal.type === "customer" && !modalLoading && customerDetail && <div className="abc-customer-detail"><section><h4>{customerDetail.customer?.name || customerDetail.customer?.email}</h4><p>{customerDetail.customer?.email}</p><p>{customerDetail.customer?.phone || ""}</p></section><div className="abc-detail-grid"><label>Plan</label><b>{customerDetail.subscription?.plan || customerDetail.customer?.plan_label || "—"}</b><label>{t("common.status")}</label><b>{customerDetail.subscription?.status || customerDetail.customer?.status || "—"}</b><label>Next billing</label><b>{dateTimeLabel(customerDetail.subscription?.nextBillingDate, locale)}</b><label>Paddle subscription</label><b>{customerDetail.subscription?.paddleSubscriptionId || "—"}</b></div><h4>Payments</h4><div className="abc-mini-table">{(customerDetail.payments || []).slice(0, 10).map((p) => <div key={p.id}><span>{dateTimeLabel(p.payment_date || p.created_at, locale)}</span><b>{money(p.amount, p.currency || "USD", locale)}</b><em>{p.status}</em></div>)}</div></div>}

      {modal.type === "reschedule" && <div className="abc-form"><p>{rescheduleRow?.customerName}</p><label>Current billing</label><div className="abc-readonly">{dateTimeLabel(rescheduleRow?.billingAt, locale)}</div><label>New billing date</label><input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} /><label>New billing time</label><input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} /><button className="abc-primary" disabled={!rescheduleDate || busy} onClick={saveSingleReschedule}>{t("adminBillingCalendar.actions.reschedule")}</button><small>{t("adminBillingCalendar.paddleConfirmation")}</small></div>}

      {modal.type === "change-plan" && <div className="abc-form"><p>{changePlanRow?.customerName}</p><label>Plan</label><select value={newPlan} onChange={(e) => setNewPlan(e.target.value)}><option value="solo">Solo</option><option value="business">Business</option><option value="scale">Scale</option></select><label>Billing cycle</label><select value={newCycle} onChange={(e) => setNewCycle(e.target.value)}><option value="monthly">Monthly</option><option value="annual">Annual</option></select><button className="abc-primary" disabled={busy} onClick={saveChangePlan}>{t("adminBillingCalendar.actions.changePlan")}</button></div>}

      {modal.type === "refund" && <div className="abc-form"><p>{refundRow?.customerName}</p><label>Transaction</label><div className="abc-readonly">{refundRow?.paddleTransactionId}</div><label>Refund type</label><select value={refundType} onChange={(e) => setRefundType(e.target.value)}><option value="full">Full refund</option><option value="partial">Partial refund</option></select>{refundType === "partial" && <><label>Transaction item</label><select value={refundItemId} onChange={(e) => setRefundItemId(e.target.value)}><option value="">Select item</option>{(refundTxn?.details?.lineItems || refundTxn?.details?.line_items || []).map((it) => <option key={it.id} value={it.id}>{it.product?.name || it.price?.name || it.id} — {it.totals?.total || ""}</option>)}</select><label>Amount (minor currency units, e.g. 1000 = $10.00)</label><input value={refundAmount} onChange={(e) => setRefundAmount(e.target.value.replace(/\D/g, ""))} /></>}<label>Reason</label><input value={refundReason} onChange={(e) => setRefundReason(e.target.value)} /><button className="abc-primary" disabled={busy || !refundTxn || (refundType === "partial" && (!refundItemId || !refundAmount))} onClick={submitRefund}>Request refund in Paddle</button><small>Most live Paddle refunds may remain pending approval until Paddle confirms them.</small></div>}

      {modal.type === "retry-results" && <div className="abc-modal-list">{(modal.data || []).map((r, i) => <div className="abc-retry-row" key={i}><span><b>{r.row?.customerName}</b><small>{r.error || r.message || "Paddle automatic recovery is active."}</small></span>{r.updatePaymentMethodUrl && <button onClick={() => window.open(r.updatePaymentMethodUrl, "_blank", "noopener,noreferrer")}>Open secure payment update</button>}</div>)}</div>}
    </Modal>}
  </div>;
}
