import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";

import {
  ShieldCheck,
  CreditCard,
  Users,
  Calendar,
  RefreshCw,
  CheckCircle2,
  Download,
  UserPlus,
  ChevronRight,
  Info,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import {
  getPlans,
  getTeamSubscription,
  getTeamFeatures,
  selectPlan,
} from "../../api/subscriptionApi";
import { getMyTeams } from "../../api/platformApi";
import "./account.css";

export default function Billing() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [features, setFeatures] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectingPlanId, setSelectingPlanId] = useState(null);
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

  const defaultFeatures = [
    "Full CRM dashboard",
    "CORTEXA AI Agent",
    "WhatsApp integration",
    "Leads & Pipeline",
    "Properties & Contacts",
    "Analytics",
    "Apps & Integrations",
    "3 users included",
  ];

  const mockInvoices = [
    { id: "INV-1042", date: "May 12, 2025", amount: "—", status: "Paid" },
    { id: "INV-1011", date: "Apr 12, 2025", amount: "—", status: "Paid" },
    { id: "INV-0980", date: "Mar 12, 2025", amount: "—", status: "Paid" },
  ];

  return (
    <div className="billing-page">
      <div className="account-header">
        <h1 className="account-title">Billing & Plan</h1>
        <p className="account-description">
          Manage your CORTEXA AI CRM subscription and workspace access.
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
              <span className="section-subtitle-label">Current Plan</span>
            </div>

            <div className="plan-main-details">
              <div className="plan-badge-icon">
                <ShieldCheck size={28} />
              </div>
              <div className="plan-meta-info">
                <div className="plan-title-row">
                  <h3 className="plan-name-headline">CORTEXA AI CRM</h3>
                  <span className="status-badge-active">Active</span>
                </div>
                <div className="plan-price-large">
                  $497 <span>/ month</span>
                </div>
                <p className="plan-caption-text">
                  The complete real estate CRM workspace powered by CORTEXA —
                  built to manage leads, automate follow-up, organize deals, and
                  help teams close more business.
                </p>
              </div>
              <button type="button" className="btn-action-outline">
                <CreditCard size={14} /> Update Payment Method
              </button>
            </div>

            <div className="plan-specs-row">
              <div className="spec-item">
                <Users size={20} className="spec-icon" />
                <div className="spec-data">
                  <span className="spec-value">3 users</span>
                  <span className="spec-label">included</span>
                </div>
              </div>
              <div className="spec-item">
                <Calendar size={20} className="spec-icon" />
                <div className="spec-data">
                  <span className="spec-value">June 12, 2025</span>
                  <span className="spec-label">Next billing date</span>
                </div>
              </div>
              <div className="spec-item">
                <RefreshCw size={20} className="spec-icon" />
                <div className="spec-data">
                  <span className="spec-value">Monthly</span>
                  <span className="spec-label">Billing cycle</span>
                </div>
              </div>
              <div className="spec-item">
                <CreditCard size={20} className="spec-icon" />
                <div className="spec-data">
                  <span className="spec-value">Payment method</span>
                  <div className="spec-wrap">
                    <span className="spec-label">Visa •••• 4242</span>
                    <button type="button" className="inline-edit-link">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: FEATURES LIST */}
          <div className="billing-card features-list-card">
            <h3 className="card-section-title">Features on this plan</h3>
            <ul className="features-checklist">
              {defaultFeatures.map((feat, index) => (
                <li key={index} className="feature-check-item">
                  <CheckCircle2 size={16} className="checklist-icon-green" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>  
        <div className="billing-dashboard-grid-2">    
          {/* SECTION 3: RECENT INVOICES */}
          <div className="billing-card recent-invoices-card">
            <div className="invoices-header-row">
              <h3 className="card-section-title">Recent Invoices</h3>
              <button type="button" className="btn-text-link">
                <Download size={14} /> Download Invoices
              </button>
            </div>

            <div className="table-responsive-wrapper">
              <table className="invoices-data-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th className="text-right-align">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mockInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="font-medium-dark">{inv.id}</td>
                      <td>{inv.date}</td>
                      <td>{inv.amount}</td>
                      <td>
                        <span className="invoice-status-paid">
                          <span className="dot-indicator"></span> {inv.status}
                        </span>
                      </td>
                      <td className="text-right-align">
                        <button
                          type="button"
                          className="btn-table-icon"
                          title="Download PDF"
                        >
                          <Download size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="view-all-footer-link">
              <button type="button" className="btn-link-navigation">
                View all invoices <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* SECTION 4: WORKSPACE ACCESS */}
          <div className="billing-card workspace-access-card">
            <h3 className="card-section-title">Workspace Access</h3>

            <div className="access-metrics-list">
              <div className="metric-row-item">
                <div className="metric-label-group">
                  <Users size={14} /> <span>Users included</span>
                </div>
                <span className="metric-value-output">3</span>
              </div>
              <div className="metric-row-item">
                <div className="metric-label-group">
                  <Users size={14} /> <span>Active users</span>
                </div>
                <span className="metric-value-output status-green-text">
                  3 / 3
                </span>
              </div>
              <div className="metric-row-item">
                <div className="metric-label-group">
                  <Users size={14} /> <span>Extra users</span>
                </div>
                <span className="metric-value-output">0</span>
              </div>
              <div className="metric-row-item">
                <div className="metric-label-group">
                  <Info size={14} /> <span>Extra user price</span>
                </div>
                <span className="metric-value-output font-medium-dark">
                  $27 / user / month
                </span>
              </div>
              <div className="metric-row-item">
                <div className="metric-label-group">
                  <RefreshCw size={15} /> <span>Workspace status</span>
                </div>
                <span className="badge-workspace-enabled">Enabled</span>
              </div>
            </div>

            <div className="add-user-embedded-box">
              <div className="add-user-content-text">
                <h4>Add a user</h4>
                <p>
                  Add additional users to your workspace. $27 / user / month
                  will be added to your billing.
                </p>
              </div>
              <button type="button" className="btn-action-outline-bold">
                <UserPlus size={14} /> Add User
              </button>
            </div>

            <button type="button" className="manage-users-footer-menu">
              <div className="manage-menu-label">
                <Users size={16} /> <span>Manage users</span>
              </div>
              <ChevronRight size={16} className="chevron-grey" />
            </button>
          </div>

          {/* GLOBAL FOOTER BANNER */}
          <div className="billing-global-footer-hint">
            <Info size={16} className="hint-icon" />
            <p>
              Additional billing controls will be connected once the payment
              gateway is live.
            </p>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
