import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  ShieldCheck,
  CreditCard,
  Users,
  Calendar,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  Info,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import {
  getPlans,
  getTeamSubscription,
  getTeamFeatures,
} from "../../api/subscriptionApi";
import { getMyTeams } from "../../api/platformApi";
import "./account.css";

const ACTIVE_LIKE = ["active", "trialing", "past_due"];

function formatPrice(value) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  return Number.isInteger(num) ? `$${num}` : `$${num.toFixed(2)}`;
}

function formatStatus(status) {
  if (!status) return null;
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Billing() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showError } = useNotification();
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [features, setFeatures] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teamId, setTeamId] = useState(null);
  const [teamResolved, setTeamResolved] = useState(false);

  useEffect(() => {
    const fromUser = user?.teamId ?? user?.team_id ?? null;
    if (fromUser) {
      setTeamId(fromUser);
      setTeamResolved(true);
      return;
    }
    if (!user?.id) {
      setTeamId(null);
      setTeamResolved(!!user);
      return;
    }
    let cancelled = false;
    getMyTeams()
      .then((teams) => {
        if (cancelled) return;
        const first = Array.isArray(teams) && teams.length ? teams[0] : null;
        setTeamId(first?.id ?? null);
        setTeamResolved(true);
      })
      .catch(() => {
        if (!cancelled) {
          setTeamId(null);
          setTeamResolved(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.teamId, user?.team_id]);

  const load = useCallback(async () => {
    if (!teamId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [plansList, sub, feat] = await Promise.all([
        getPlans(true),
        getTeamSubscription(teamId),
        getTeamFeatures(teamId),
      ]);
      setPlans(Array.isArray(plansList) ? plansList : []);
      setSubscription(sub || null);
      setFeatures(feat || null);
    } catch (err) {
      showError(err?.message || t("common.error"));
      setPlans([]);
      setSubscription(null);
      setFeatures(null);
    } finally {
      setLoading(false);
    }
  }, [teamId, showError, t]);

  useEffect(() => {
    load();
  }, [load]);

  // Derive the real current plan from the fetched subscription + plans.
  const currentPlan = subscription?.planId
    ? plans.find((p) => p.id === subscription.planId) || null
    : null;
  const status = subscription?.status || null;
  const planName = currentPlan?.name || features?.planName || null;
  const hasPlan = !!planName && ACTIVE_LIKE.includes(status);
  const planPrice =
    currentPlan?.price !== undefined && currentPlan?.price !== null
      ? formatPrice(currentPlan.price)
      : null;
  const seatLimit = subscription?.seatLimit ?? currentPlan?.seatLimit ?? null;
  const nextBillingDate = formatDate(subscription?.currentPeriodEnd);

  // Localized status label; falls back to the raw formatter for any status
  // outside the known active-like set.
  const statusLabel = (s) => {
    if (!s) return null;
    if (s === "active") return t("account.billing.active");
    if (s === "trialing") return t("account.billing.statusTrialing");
    if (s === "past_due") return t("account.billing.statusPastDue");
    return formatStatus(s);
  };

  // Build the feature checklist from the REAL features payload (no fabricated
  // "3 users included" line — seats are shown from the real seat limit only).
  const planFeatures = [];
  if (features?.hasActiveSubscription) {
    if (features.crmAccess)
      planFeatures.push(t("account.billing.featureFullCrm"));
    if (features.aiFeatures)
      planFeatures.push(t("account.billing.featureAiAgent"));
    if (features.aiAutomation)
      planFeatures.push(t("account.billing.featureAiAutomation"));
    if (features.analyticsLevel && features.analyticsLevel !== "none")
      planFeatures.push(t("account.billing.featureAnalytics"));
    if (features.priorityExposure)
      planFeatures.push(t("account.billing.featurePriorityExposure"));
    if (features.listingLimit === null)
      planFeatures.push(t("account.billing.featureUnlimitedListings"));
    else if (
      typeof features.listingLimit === "number" &&
      features.listingLimit > 0
    )
      planFeatures.push(
        t("account.billing.listingsCount", { count: features.listingLimit })
      );
    if (seatLimit)
      planFeatures.push(
        t("account.billing.seatsIncluded", { count: seatLimit })
      );
  }

  const statusBadgeStyle =
    status && status !== "active"
      ? { backgroundColor: "#fff7ed", borderColor: "#fed7aa", color: "#c2410c" }
      : undefined;

  return (
    <div className="billing-page">
      <div className="account-header">
        <h1 className="account-title">{t("account.billing.title")}</h1>
        <p className="account-description">
          {t("account.billing.pageDescription")}
        </p>
      </div>

      {!teamResolved || loading ? (
        <p className="billing-loading-text">{t("common.loading")}</p>
      ) : !teamId ? (
        <div className="account-message account-message-error">
          {t("account.billing.noTeam")}
        </div>
      ) : (
        <>
          <div className="billing-dashboard-grid">
            {/* SECTION 1: CURRENT PLAN */}
            <div className="billing-card current-plan-card">
              <div className="card-inner-header">
                <span className="section-subtitle-label">
                  {t("account.billing.currentPlan")}
                </span>
              </div>

              <div className="plan-main-details">
                <div className="plan-badge-icon">
                  <ShieldCheck size={28} />
                </div>
                <div className="plan-meta-info">
                  <div className="plan-title-row">
                    <h3 className="plan-name-headline">
                      {hasPlan ? planName : "CORTEXA AI CRM"}
                    </h3>
                    {hasPlan && status && (
                      <span className="status-badge-active" style={statusBadgeStyle}>
                        {statusLabel(status)}
                      </span>
                    )}
                  </div>
                  {hasPlan && planPrice && (
                    <div className="plan-price-large">
                      {planPrice} <span>/ {t("account.billing.month")}</span>
                    </div>
                  )}
                  <p className="plan-caption-text">
                    {hasPlan
                      ? t("account.billing.planCaptionActive")
                      : t("account.billing.planCaptionInactive")}
                  </p>
                </div>
              </div>

              <div className="plan-specs-row">
                {seatLimit ? (
                  <div className="spec-item">
                    <Users size={20} className="spec-icon" />
                    <div className="spec-data">
                      <span className="spec-value">
                        {t("account.billing.seatsCount", { count: seatLimit })}
                      </span>
                      <span className="spec-label">
                        {t("account.billing.included")}
                      </span>
                    </div>
                  </div>
                ) : null}
                {nextBillingDate ? (
                  <div className="spec-item">
                    <Calendar size={20} className="spec-icon" />
                    <div className="spec-data">
                      <span className="spec-value">{nextBillingDate}</span>
                      <span className="spec-label">
                        {t("account.billing.nextBillingDate")}
                      </span>
                    </div>
                  </div>
                ) : null}
                {hasPlan ? (
                  <div className="spec-item">
                    <RefreshCw size={20} className="spec-icon" />
                    <div className="spec-data">
                      <span className="spec-value">
                        {t("account.billing.monthly")}
                      </span>
                      <span className="spec-label">
                        {t("account.billing.billingCycle")}
                      </span>
                    </div>
                  </div>
                ) : null}
                <div className="spec-item">
                  <CreditCard size={20} className="spec-icon" />
                  <div className="spec-data">
                    <span className="spec-value">
                      {t("account.billing.paymentMethodLabel")}
                    </span>
                    <span className="spec-label">
                      {t("account.billing.managedByPaddle")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: FEATURES LIST */}
            <div className="billing-card features-list-card">
              <h3 className="card-section-title">
                {t("account.billing.featuresOnPlan")}
              </h3>
              {planFeatures.length ? (
                <ul className="features-checklist">
                  {planFeatures.map((feat, index) => (
                    <li key={index} className="feature-check-item">
                      <CheckCircle2 size={16} className="checklist-icon-green" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="plan-caption-text">
                  {t("account.billing.featuresPlaceholder")}
                </p>
              )}
            </div>
          </div>

          <div className="billing-dashboard-grid-2">
            {/* SECTION 3: INVOICES */}
            <div className="billing-card recent-invoices-card">
              <div className="invoices-header-row">
                <h3 className="card-section-title">
                  {t("account.billing.recentInvoices")}
                </h3>
              </div>

              <p className="plan-caption-text" style={{ padding: "16px 0" }}>
                {t("account.billing.noInvoices")}
              </p>
            </div>

            {/* SECTION 4: WORKSPACE ACCESS */}
            <div className="billing-card workspace-access-card">
              <h3 className="card-section-title">
                {t("account.billing.workspaceAccess")}
              </h3>

              <div className="access-metrics-list">
                <div className="metric-row-item">
                  <div className="metric-label-group">
                    <Users size={14} />{" "}
                    <span>{t("account.billing.seatsIncludedLabel")}</span>
                  </div>
                  <span className="metric-value-output">
                    {seatLimit ?? "—"}
                  </span>
                </div>
                <div className="metric-row-item">
                  <div className="metric-label-group">
                    <RefreshCw size={15} />{" "}
                    <span>{t("account.billing.workspaceStatus")}</span>
                  </div>
                  {hasPlan ? (
                    <span className="badge-workspace-enabled">
                      {statusLabel(status)}
                    </span>
                  ) : (
                    <span className="metric-value-output">
                      {t("account.billing.noActivePlan")}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="manage-users-footer-menu"
                onClick={() => navigate("/dashboard/team/members")}
              >
                <div className="manage-menu-label">
                  <Users size={16} />{" "}
                  <span>{t("account.billing.manageUsers")}</span>
                </div>
                <ChevronRight size={16} className="chevron-grey" />
              </button>
            </div>

            {/* GLOBAL FOOTER BANNER */}
            <div className="billing-global-footer-hint">
              <Info size={16} className="hint-icon" />
              <p>{t("account.billing.footerHint")}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
