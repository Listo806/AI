import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  getPlans,
  getTeamSubscription,
  getTeamFeatures,
  selectPlan,
} from '../../api/subscriptionApi';
import { getMyTeams } from '../../api/platformApi';
import './account.css';

export default function Billing() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [features, setFeatures] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectingPlanId, setSelectingPlanId] = useState(null);
  /** Resolved team id: from user.teamId or first team from GET /teams (for owners with no team_id set) */
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
    return () => { cancelled = true; };
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
      showError(err?.message || t('common.error'));
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

  const handleSelectPlan = async (planId) => {
    if (!teamId) {
      showError(t('account.billing.noTeam'));
      return;
    }
    setSelectingPlanId(planId);
    try {
      await selectPlan(teamId, planId);
      showSuccess(t('account.billing.planSelected'));
      await load();
    } catch (err) {
      showError(err?.message || t('common.error'));
    } finally {
      setSelectingPlanId(null);
    }
  };

  const currentPlanName = features?.planName ?? subscription?.planId ?? null;
  const currentPlanFromList = plans.find((p) => p.id === subscription?.planId) || plans.find((p) => p.name === currentPlanName);
  const isOwner = user?.role === 'owner' || user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <div className="account-page">
      <div className="account-header">
        <h1 className="account-title">{t('account.billing.title')}</h1>
        <p className="account-description">{t('account.billing.description')}</p>
      </div>

      {!teamResolved || loading ? (
        <p style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</p>
      ) : !teamId ? (
        <div className="account-message account-message-error">
          {t('account.billing.noTeam')}
        </div>
      ) : (
        <>
          {/* Current plan summary strip */}
          <div className="billing-section">
            <h2 className="billing-section-title">{t('account.billing.currentPlan')}</h2>
            <div className="billing-current-strip">
              <div>
                <h3 className="billing-plan-name">
                  {currentPlanFromList?.name ?? currentPlanName ?? t('account.billing.noPlan')}
                </h3>
                {currentPlanFromList && (
                  <p className="billing-plan-price">
                    ${Number(currentPlanFromList.price ?? 0).toFixed(2)} / {t('account.billing.month')}
                  </p>
                )}
              </div>
              {subscription?.status === 'active' && (
                <span className="billing-status">✓ {t('account.billing.active')}</span>
              )}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '-8px 0 0 0' }}>
              {t('account.billing.noPaymentGateway')}
            </p>
          </div>

          {/* Available plans - modern card grid */}
          <div className="billing-section">
            <h2 className="billing-section-title">{t('account.billing.availablePlans')}</h2>
            {plans.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>{t('account.billing.noPlans')}</p>
            ) : (
              <div className="billing-plans-grid">
                {plans.map((plan) => {
                  const isCurrent = subscription?.planId === plan.id;
                  const featureItems = [];
                  if (plan.crmAccess) featureItems.push(t('account.billing.featureCrm'));
                  if (plan.aiFeatures) featureItems.push(t('account.billing.featureAi'));
                  if (plan.seatLimit != null) featureItems.push(`${plan.seatLimit} ${t('account.billing.seats')}`);
                  if (featureItems.length === 0) featureItems.push(plan.seatLimit != null ? `${plan.seatLimit} ${t('account.billing.seats')}` : 'Included');
                  return (
                    <div
                      key={plan.id}
                      className={`billing-plan-card ${isCurrent ? 'billing-plan-current' : ''}`}
                    >
                      {isCurrent && <span className="billing-plan-badge">{t('account.billing.current')}</span>}
                      <div className="billing-plan-header">
                        <h3 className="billing-plan-name">{plan.name}</h3>
                        <p className="billing-plan-price-amount">
                          ${Number(plan.price ?? 0).toFixed(0)}
                          <span> / {t('account.billing.month')}</span>
                        </p>
                      </div>
                      {plan.description ? (
                        <p className="billing-plan-desc">{plan.description}</p>
                      ) : (
                        <div className="billing-plan-desc" style={{ minHeight: '2.8em' }} />
                      )}
                      <ul className="billing-plan-features">
                        {featureItems.map((label, i) => (
                          <li key={i}>
                            <span className="feature-check">✓</span>
                            {label}
                          </li>
                        ))}
                      </ul>
                      <div className="billing-plan-cta">
                        {isCurrent ? (
                          <button type="button" className="account-btn-current" disabled>
                            ✓ {t('account.billing.current')}
                          </button>
                        ) : isOwner ? (
                          <button
                            type="button"
                            className="account-btn-primary"
                            onClick={() => handleSelectPlan(plan.id)}
                            disabled={!!selectingPlanId}
                          >
                            {selectingPlanId === plan.id ? t('common.loading') : t('account.billing.selectPlan')}
                          </button>
                        ) : (
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
                            {t('account.billing.ownerSelects')}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
