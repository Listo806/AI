import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getPlans, createPlan, updatePlan, deletePlan } from '../../api/subscriptionApi';
import { loadPlansConfig, PLAN_ORDER } from '../../config/plans';
import { useNotification } from '../../context/NotificationContext';
import {
  BriefcaseBusiness,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  FileText,
  Gauge,
  Gift,
  MoreVertical,
  PackagePlus,
  Plus,
  Rocket,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  UserRound,
  X,
  ChevronDown,
} from 'lucide-react';
import './admin.css';

const defaultForm = {
  name: '',
  description: '',
  price: 0,
  seatLimit: 1,
  listingLimit: null,
  crmAccess: false,
  aiFeatures: false,
  analyticsLevel: 'none',
  priorityExposure: false,
  aiAutomation: false,
  planCategory: 'marketplace',
  isActive: true,
};

function PlanFormModal({ plan, onClose, onSuccess }) {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotification();
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const [form, setForm] = useState(() => ({
    ...defaultForm,
    ...plan,
    annualPrice: plan?.annualPrice ?? '',
    aiConversationLimit:
      plan?.aiConversationLimit ??
      plan?.aiConversationsLimit ??
      plan?.aiConversations ??
      '',
    whatsappConnections:
      plan?.whatsappConnections ??
      plan?.whatsappConnectionLimit ??
      plan?.whatsappLimit ??
      '',
    leadsContactsLimit:
      plan?.leadsContactsLimit ??
      plan?.leadContactLimit ??
      plan?.contactsLimit ??
      plan?.listingLimit ??
      '',
    iconColor: plan?.iconColor || '#22C55E',
  }));

  const visual = getPlanVisual(plan || form);
  const ModalPlanIcon = visual.Icon;

  const setField = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name?.trim()) {
      showError(t('admin.plans.nameRequired'));
      return;
    }

    setSubmitting(true);

    try {
      // Keep the existing API contract intact. The extra fields shown in this
      // redesigned modal are included only when the backend already supports them.
      const body = {
        name: form.name.trim(),
        description: form.description?.trim() || null,
        price: Number(form.price) || 0,
        seatLimit: Math.max(1, Number(form.seatLimit) || 1),
        listingLimit:
          form.leadsContactsLimit === '' ||
          form.leadsContactsLimit == null
            ? form.listingLimit === '' || form.listingLimit == null
              ? null
              : Number(form.listingLimit)
            : Number(form.leadsContactsLimit),
        crmAccess: !!form.crmAccess,
        aiFeatures: !!form.aiFeatures,
        analyticsLevel: form.analyticsLevel || 'none',
        priorityExposure: !!form.priorityExposure,
        aiAutomation: !!form.aiAutomation,
        planCategory: form.planCategory || 'marketplace',
        isActive: form.isActive !== false,
      };

      if (plan?.id) {
        await updatePlan(plan.id, body);
        showSuccess(t('admin.plans.updated'));
      } else {
        await createPlan(body);
        showSuccess(t('admin.plans.created'));
      }

      onSuccess();
      onClose();
    } catch (err) {
      showError(err?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    {
      id: 'general',
      label: t('admin.plans.tabGeneralPricing'),
      Icon: Tag,
    },
    {
      id: 'limits',
      label: t('admin.plans.tabLimits'),
      Icon: Gauge,
    },
    {
      id: 'features',
      label: t('admin.plans.tabFeatureAccess'),
      Icon: ShieldCheck,
    },
    {
      id: 'addons',
      label: t('admin.plans.tabAddons'),
      Icon: PackagePlus,
    },
    {
      id: 'status',
      label: t('admin.plans.tabPlanStatus'),
      Icon: CircleCheck,
    },
  ];

  const renderGeneralTab = () => (
    <>
      <div className="admin-plan-modal-two-col">
        <section className="admin-plan-modal-section admin-plan-modal-section-split">
          <h4>{t('admin.plans.generalInformation')}</h4>

          <label className="admin-plan-modal-field">
            <span>{t('admin.plans.planName')}</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              required
            />
          </label>

          <label className="admin-plan-modal-field">
            <span>{t('admin.plans.description')}</span>
            <textarea
              rows={3}
              value={form.description || ''}
              onChange={(e) => setField('description', e.target.value)}
            />
          </label>

          <div className="admin-plan-modal-field">
            <span>{t('admin.plans.planIconColor')}</span>

            <div className="admin-plan-icon-color-row">
              <div
                className={`admin-plan-modal-icon-preview admin-plan-icon-${visual.type}`}
              >
                <ModalPlanIcon size={19} />
              </div>

              <label className="admin-plan-color-picker">
                <span
                  className="admin-plan-color-dot"
                  style={{ background: form.iconColor }}
                />
                <input
                  type="text"
                  value={form.iconColor}
                  onChange={(e) => setField('iconColor', e.target.value)}
                />
                <span className="admin-plan-color-chevron"><ChevronDown size={14} /></span>
              </label>
            </div>
          </div>
        </section>

        <section className="admin-plan-modal-section">
          <h4>{t('admin.plans.pricingHeading')}</h4>

          <label className="admin-plan-modal-field">
            <span>{t('admin.plans.monthlyPriceUsd')}</span>
            <div className="admin-plan-modal-input-suffix">
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.price}
                onChange={(e) => setField('price', e.target.value)}
              />
              <em>{t('admin.plans.perMonthShort')}</em>
            </div>
          </label>

          <label className="admin-plan-modal-field">
            <span>{t('admin.plans.annualPriceUsd')}</span>
            <div className="admin-plan-modal-input-suffix">
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.annualPrice}
                onChange={(e) => setField('annualPrice', e.target.value)}
              />
              <em>{t('admin.plans.perYearShort')}</em>
            </div>
          </label>

          <p className="admin-plan-price-hint">
            <CircleCheck size={14} />
            {t('admin.plans.annualPriceHint')}
          </p>
        </section>
      </div>

      <section className="admin-plan-modal-wide-section">
        <h4>{t('admin.plans.basicLimits')}</h4>

        <div className="admin-plan-limits-grid">
          <label className="admin-plan-modal-field">
            <span>{t('admin.plans.seatsLimit')}</span>
            <div className="admin-plan-modal-input-suffix">
              <input
                type="number"
                min={1}
                value={form.seatLimit}
                onChange={(e) => setField('seatLimit', e.target.value)}
              />
              <em>{t('admin.plans.seat')}</em>
            </div>
            <small>{t('admin.plans.seatsHelp')}</small>
          </label>

          <label className="admin-plan-modal-field">
            <span>{t('admin.plans.aiConversations')}</span>
            <div className="admin-plan-modal-input-suffix">
              <input
                type="number"
                min={0}
                value={form.aiConversationLimit}
                onChange={(e) =>
                  setField('aiConversationLimit', e.target.value)
                }
              />
              <em>{t('admin.plans.perMonthLower')}</em>
            </div>
            <small>{t('admin.plans.aiConversationsHelp')}</small>
          </label>

          <label className="admin-plan-modal-field">
            <span>{t('admin.plans.whatsappConnections')}</span>
            <div className="admin-plan-modal-input-suffix">
              <input
                type="number"
                min={0}
                value={form.whatsappConnections}
                onChange={(e) =>
                  setField('whatsappConnections', e.target.value)
                }
              />
              <em>{t('admin.plans.connection')}</em>
            </div>
            <small>{t('admin.plans.whatsappConnectionsHelp')}</small>
          </label>

          <label className="admin-plan-modal-field">
            <span>{t('admin.plans.leadsContactsLimit')}</span>
            <div className="admin-plan-modal-input-suffix">
              <input
                type="number"
                min={0}
                value={form.leadsContactsLimit}
                onChange={(e) =>
                  setField('leadsContactsLimit', e.target.value)
                }
              />
              <em>{t('admin.plans.contactsLower')}</em>
            </div>
            <small>{t('admin.plans.leadsContactsHelp')}</small>
          </label>
        </div>
      </section>

      <section className="admin-plan-modal-wide-section admin-plan-summary-section">
        <h4>{t('admin.plans.coreInclusionsSummary')}</h4>

        <div className="admin-plan-inclusions">
          <span><CheckCircle2 size={15} /> CRM Access</span>
          <span><CheckCircle2 size={15} /> Leads</span>
          <span><CheckCircle2 size={15} /> Pipeline</span>
          <span><CheckCircle2 size={15} /> Basic AI (WhatsApp)</span>
          <span><CheckCircle2 size={15} /> WhatsApp Access</span>
        </div>
      </section>
    </>
  );

  const renderLimitsTab = () => (
    <section className="admin-plan-tab-panel-simple">
      <div className="admin-plan-limits-grid">
        <label className="admin-plan-modal-field">
          <span>{t('admin.plans.seatsLimit')}</span>
          <input
            type="number"
            min={1}
            value={form.seatLimit}
            onChange={(e) => setField('seatLimit', e.target.value)}
          />
        </label>

        <label className="admin-plan-modal-field">
          <span>{t('admin.plans.leadsContactsLimit')}</span>
          <input
            type="number"
            min={0}
            value={form.leadsContactsLimit}
            onChange={(e) =>
              setField('leadsContactsLimit', e.target.value)
            }
          />
        </label>
      </div>
    </section>
  );

  const renderFeaturesTab = () => (
    <section className="admin-plan-tab-panel-simple">
      <div className="admin-plan-checkbox-grid">
        <label>
          <input
            type="checkbox"
            checked={!!form.crmAccess}
            onChange={(e) => setField('crmAccess', e.target.checked)}
          />
          <span>{t('admin.plans.crmAccess')}</span>
        </label>

        <label>
          <input
            type="checkbox"
            checked={!!form.aiFeatures}
            onChange={(e) => setField('aiFeatures', e.target.checked)}
          />
          <span>{t('admin.plans.aiFeatures')}</span>
        </label>

        <label>
          <input
            type="checkbox"
            checked={!!form.aiAutomation}
            onChange={(e) => setField('aiAutomation', e.target.checked)}
          />
          <span>{t('admin.plans.aiAutomation')}</span>
        </label>

        <label>
          <input
            type="checkbox"
            checked={!!form.priorityExposure}
            onChange={(e) =>
              setField('priorityExposure', e.target.checked)
            }
          />
          <span>{t('admin.plans.priorityExposure')}</span>
        </label>
      </div>
    </section>
  );

  const renderAddonsTab = () => (
    <section className="admin-plan-tab-panel-simple">
      <label className="admin-plan-modal-field">
        <span>{t('admin.plans.planCategory')}</span>
        <select
          value={form.planCategory || 'marketplace'}
          onChange={(e) => setField('planCategory', e.target.value)}
        >
          <option value="marketplace">Marketplace</option>
          <option value="core">Core</option>
          <option value="premium">Premium</option>
        </select>
      </label>
    </section>
  );

  const renderStatusTab = () => (
    <section className="admin-plan-tab-panel-simple">
      <div className="admin-plan-status-toggle-card">
        <div>
          <strong>{t('admin.plans.planStatus')}</strong>
          <p>{t('admin.plans.planStatusHelp')}</p>
        </div>

        <label className="admin-plan-switch">
          <input
            type="checkbox"
            checked={form.isActive !== false}
            onChange={(e) => setField('isActive', e.target.checked)}
          />
          <span />
        </label>
      </div>
    </section>
  );

  return (
    <div
      className="admin-plan-modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className="admin-plan-modal"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="admin-plan-modal-header">
          <h3>
            {plan
              ? t('admin.plans.editPlan')
              : t('admin.plans.createPlan')}
          </h3>

          <button
            type="button"
            className="admin-plan-modal-close"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="admin-plan-modal-tabs">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={activeTab === id ? 'active' : ''}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <form onSubmit={handleSubmit}>
          <div className="admin-plan-modal-body">
            {activeTab === 'general' && renderGeneralTab()}
            {activeTab === 'limits' && renderLimitsTab()}
            {activeTab === 'features' && renderFeaturesTab()}
            {activeTab === 'addons' && renderAddonsTab()}
            {activeTab === 'status' && renderStatusTab()}
          </div>

          <div className="admin-plan-modal-footer">
            <button
              type="button"
              className="admin-plan-modal-cancel"
              onClick={onClose}
            >
              {t('common.cancel')}
            </button>

            <button
              type="submit"
              className="admin-plan-modal-save"
              disabled={submitting}
            >
              {submitting
                ? t('common.loading')
                : plan
                  ? t('admin.plans.saveChanges')
                  : t('admin.plans.createPlan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return new Intl.NumberFormat('en-US').format(num);
};

const getPlanVisual = (plan) => {
  const name = String(plan?.name || '').toLowerCase();

  if (name.includes('free')) {
    return { type: 'free', Icon: Gift };
  }
  if (name.includes('solo')) {
    return { type: 'solo', Icon: UserRound };
  }
  if (name.includes('business') || name.includes('team')) {
    return { type: 'business', Icon: BriefcaseBusiness };
  }
  if (name.includes('scale') || name.includes('growth')) {
    return { type: 'scale', Icon: Rocket };
  }

  return { type: 'default', Icon: FileText };
};

const getPlanMetric = (plan, keys) => {
  for (const key of keys) {
    if (plan?.[key] !== undefined && plan?.[key] !== null) {
      return plan[key];
    }
  }
  return null;
};

const getCoreFeatures = (plan) => {
  if (Array.isArray(plan?.coreFeatures) && plan.coreFeatures.length) {
    return plan.coreFeatures.slice(0, 2);
  }

  if (Array.isArray(plan?.features) && plan.features.length) {
    return plan.features
      .map((item) => (typeof item === 'string' ? item : item?.name || item?.label))
      .filter(Boolean)
      .slice(0, 2);
  }

  const features = [];

  if (plan?.crmAccess) {
    features.push('CRM, Leads, Pipeline');
  }

  if (plan?.aiFeatures && plan?.aiAutomation) {
    features.push('Advanced AI, Automations');
  } else if (plan?.aiFeatures) {
    features.push('Basic AI, WhatsApp');
  } else if (plan?.aiAutomation) {
    features.push('Automations');
  }

  if (plan?.priorityExposure) {
    features.push('Priority Access');
  }

  return features.slice(0, 2);
};

export default function AdminPlans() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotification();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Read-only view of the LIVE customer plans. Source of truth is the backend
  // plan-config (mirrored in ../../config/plans and tied to the Paddle price IDs),
  // so this list always matches the live pricing structure and can never drift.
  // The old editable subscription_plans CRUD is retired.
  useEffect(() => {
    let alive = true;
    loadPlansConfig()
      .then((cfg) => {
        if (!alive) return;
        const ordered = (cfg?.plans || [])
          .slice()
          .sort((a, b) => PLAN_ORDER.indexOf(a.id) - PLAN_ORDER.indexOf(b.id));
        const mapped = ordered.map((p) => {
          const core = [];
          if (p.features?.crm) core.push('CRM');
          if (p.features?.aiAgent) core.push('AI Agent');
          if (p.features?.advancedAiAgent) core.push('Advanced AI');
          if (p.features?.teamWorkspace) core.push('Team Workspace');
          if (p.features?.advancedAnalytics) core.push('Advanced Analytics');
          return {
            id: p.id,
            name:
              p.id === 'business'
                ? `${p.label} (3 users)`
                : p.id === 'scale'
                  ? `${p.label} (5 users)`
                  : p.label,
            description: '',
            price: p.pricing?.monthly ?? 0,
            intro: p.pricing?.intro ?? 0,
            isFree: !!p.isFree,
            seatLimit: p.seats,
            aiConversations: p.limits?.aiConversationsPerMonth ?? null,
            whatsappConnections: p.limits?.whatsappConnections ?? null,
            leadsContactsLimit: null,
            coreFeatures: core,
            isActive: true,
          };
        });
        setPlans(mapped);
      })
      .catch(() => alive && setPlans([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const total = plans.length;

  return (
    <div className="crm-page admin-plan-management-page">
      <div className="admin-plan-page-header">
        <div className="admin-plan-heading-wrap">
          <div className="admin-plan-heading-icon">
            <FileText size={22} />
          </div>

          <div>
            <h1>{t('admin.plans.managementTitle')}</h1>
            <p>{t('admin.plans.managementSubtitle')}</p>
          </div>
        </div>

        <span className="admin-plan-live-badge">
          <CheckCircle2 size={16} /> Live pricing
        </span>
      </div>

      {loading ? (
        <div className="admin-plan-state">
          {t('common.loading')}
        </div>
      ) : plans.length === 0 ? (
        <div className="admin-plan-state">
          {t('admin.plans.noPlans')}
        </div>
      ) : (
        <div className="admin-plan-table-card">
          <div className="admin-plan-table-scroll">
            <table className="admin-plan-table">
              <thead>
                <tr>
                  <th>{t('admin.plans.planColumn')}</th>
                  <th>
                    <span>Activation</span>
                    <small>one-time</small>
                  </th>
                  <th>
                    <span>{t('admin.plans.priceUsd')}</span>
                    <small>{t('admin.plans.monthly')}</small>
                  </th>
                  <th>
                    <span>{t('admin.plans.seats')}</span>
                    <small>{t('admin.plans.limit')}</small>
                  </th>
                  <th>
                    <span>{t('admin.plans.aiConversations')}</span>
                    <small>{t('admin.plans.perMonth')}</small>
                  </th>
                  <th>
                    <span>{t('admin.plans.whatsapp')}</span>
                    <small>{t('admin.plans.connections')}</small>
                  </th>
                  <th>
                    <span>{t('admin.plans.leadsContacts')}</span>
                    <small>{t('admin.plans.limit')}</small>
                  </th>
                  <th>{t('admin.plans.coreFeatures')}</th>
                  <th>{t('admin.plans.status')}</th>
                </tr>
              </thead>

              <tbody>
                {plans.map((plan) => {
                  const visual = getPlanVisual(plan);
                  const PlanIcon = visual.Icon;

                  const aiConversations = getPlanMetric(plan, [
                    'aiConversationLimit',
                    'aiConversationsLimit',
                    'aiConversations',
                    'monthlyAiConversations',
                  ]);

                  const whatsappConnections = getPlanMetric(plan, [
                    'whatsappConnections',
                    'whatsappConnectionLimit',
                    'whatsappLimit',
                  ]);

                  const leadsContacts = getPlanMetric(plan, [
                    'leadsContactsLimit',
                    'leadContactLimit',
                    'contactsLimit',
                    'listingLimit',
                  ]);

                  const features = getCoreFeatures(plan);

                  return (
                    <tr key={plan.id}>
                      <td>
                        <div className="admin-plan-name-cell">
                          <div
                            className={`admin-plan-icon admin-plan-icon-${visual.type}`}
                          >
                            <PlanIcon size={20} />
                          </div>

                          <div className="admin-plan-name-copy">
                            <div className="admin-plan-name-line">
                              <strong>{plan.name}</strong>

                              {visual.type === 'free' && (
                                <span className="admin-plan-free-badge">
                                  {t('admin.plans.freeBadge')}
                                </span>
                              )}
                            </div>

                            <small>
                              {plan.description || t('admin.plans.noDescription')}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="admin-plan-metric">
                          <strong>
                            {plan.isFree
                              ? '—'
                              : `$${Number(plan.intro ?? 0).toLocaleString(
                                  'en-US',
                                  { maximumFractionDigits: 2 },
                                )}`}
                          </strong>
                          <small>{plan.isFree ? 'no charge' : 'to start'}</small>
                        </div>
                      </td>

                      <td>
                        <div className="admin-plan-metric">
                          <strong>
                            ${Number(plan.price ?? 0).toLocaleString('en-US', {
                              maximumFractionDigits: 2,
                            })}
                          </strong>
                          <small>{t('admin.plans.perMonthShort')}</small>
                        </div>
                      </td>

                      <td>
                        <div className="admin-plan-metric">
                          <strong>{formatNumber(plan.seatLimit)}</strong>
                          <small>
                            {Number(plan.seatLimit) === 1
                              ? t('admin.plans.seat')
                              : t('admin.plans.seatsLower')}
                          </small>
                        </div>
                      </td>

                      <td>
                        <div className="admin-plan-metric">
                          <strong>{formatNumber(aiConversations)}</strong>
                          <small>{t('admin.plans.perMonthLower')}</small>
                        </div>
                      </td>

                      <td>
                        <div className="admin-plan-metric">
                          <strong>{formatNumber(whatsappConnections)}</strong>
                          <small>
                            {Number(whatsappConnections) === 1
                              ? t('admin.plans.connection')
                              : t('admin.plans.connectionsLower')}
                          </small>
                        </div>
                      </td>

                      <td>
                        <div className="admin-plan-metric">
                          <strong>{formatNumber(leadsContacts)}</strong>
                          <small>{t('admin.plans.contactsLower')}</small>
                        </div>
                      </td>

                      <td>
                        <div className="admin-plan-feature-list">
                          {features.length > 0 ? (
                            features.map((feature) => (
                              <div key={feature}>
                                <CheckCircle2 size={14} />
                                <span>{feature}</span>
                              </div>
                            ))
                          ) : (
                            <span className="admin-plan-empty">—</span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`admin-plan-status ${
                            plan.isActive ? 'is-active' : 'is-inactive'
                          }`}
                        >
                          {plan.isActive
                            ? t('admin.plans.active')
                            : t('admin.plans.inactive')}
                        </span>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="admin-plan-table-footer">
            <span>
              {t('admin.plans.showingPlans', {
                from: total ? 1 : 0,
                to: total,
                total,
              })}
            </span>

            <div className="admin-plan-pagination">
              <button type="button" disabled aria-label={t('common.previous')}>
                <ChevronLeft size={17} />
              </button>
              <button type="button" className="active">1</button>
              <button type="button" disabled aria-label={t('common.next')}>
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}