import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getPlans, createPlan, updatePlan, deletePlan } from '../../api/subscriptionApi';
import { useNotification } from '../../context/NotificationContext';
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
  const [form, setForm] = useState(plan ? { ...defaultForm, ...plan } : { ...defaultForm });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      showError(t('admin.plans.nameRequired'));
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description?.trim() || null,
        price: Number(form.price) || 0,
        seatLimit: Math.max(1, Number(form.seatLimit) || 1),
        listingLimit: form.listingLimit === '' || form.listingLimit == null ? null : Number(form.listingLimit),
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

  return (
    <div className="admin-reject-modal-overlay" onClick={onClose}>
      <div className="admin-reject-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <h3 style={{ marginTop: 0 }}>{plan ? t('admin.plans.editPlan') : t('admin.plans.createPlan')}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{t('admin.plans.name')} *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{t('admin.plans.description')}</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{t('admin.plans.price')}</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{t('admin.plans.seatLimit')}</label>
              <input
                type="number"
                min={1}
                value={form.seatLimit}
                onChange={(e) => setForm((f) => ({ ...f, seatLimit: e.target.value }))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{t('admin.plans.listingLimit')}</label>
            <input
              type="number"
              min={0}
              placeholder="Unlimited"
              value={form.listingLimit ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, listingLimit: e.target.value === '' ? null : e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border, #e5e7eb)' }}
            />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={!!form.crmAccess} onChange={(e) => setForm((f) => ({ ...f, crmAccess: e.target.checked }))} />
              {t('admin.plans.crmAccess')}
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={!!form.aiFeatures} onChange={(e) => setForm((f) => ({ ...f, aiFeatures: e.target.checked }))} />
              {t('admin.plans.aiFeatures')}
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="checkbox" checked={!!form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
              {t('admin.plans.enabled')}
            </label>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="crm-btn crm-btn-secondary">{t('common.cancel')}</button>
            <button type="submit" className="crm-btn crm-btn-primary" disabled={submitting}>
              {submitting ? t('common.loading') : (plan ? t('common.update') : t('common.add'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminPlans() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotification();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'create' | { plan } for edit
  const [togglingId, setTogglingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getPlans(false);
      setPlans(Array.isArray(list) ? list : []);
    } catch (err) {
      showError(err?.message || t('common.error'));
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [showError, t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleActive = async (plan) => {
    setTogglingId(plan.id);
    try {
      await updatePlan(plan.id, { isActive: !plan.isActive });
      showSuccess(plan.isActive ? t('admin.plans.disabled') : t('admin.plans.enabledSuccess'));
      await load();
    } catch (err) {
      showError(err?.message || t('common.error'));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (plan) => {
    if (!window.confirm(t('admin.plans.deleteConfirm', { name: plan.name }))) return;
    try {
      await deletePlan(plan.id);
      showSuccess(t('admin.plans.deleted'));
      await load();
    } catch (err) {
      showError(err?.message || t('common.error'));
    }
  };

  return (
    <div className="crm-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 600 }}>{t('admin.plans.title')}</h1>
        <button type="button" className="crm-btn crm-btn-primary" onClick={() => setModal('create')}>
          {t('admin.plans.createPlan')}
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</p>
      ) : plans.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>{t('admin.plans.noPlans')}</p>
      ) : (
        <div className="crm-section" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border, #e5e7eb)', textAlign: 'left' }}>
                <th style={{ padding: '12px', fontWeight: 600 }}>{t('admin.plans.name')}</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>{t('admin.plans.price')}</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>{t('admin.plans.seats')}</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>CRM</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>{t('admin.plans.status')}</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>{t('common.edit')}</th>
                <th style={{ padding: '12px', fontWeight: 600 }}></th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border, #e5e7eb)' }}>
                  <td style={{ padding: '12px' }}>{p.name}</td>
                  <td style={{ padding: '12px' }}>${Number(p.price ?? 0).toFixed(2)}</td>
                  <td style={{ padding: '12px' }}>{p.seatLimit ?? '—'}</td>
                  <td style={{ padding: '12px' }}>{p.crmAccess ? '✓' : '—'}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      background: p.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.2)',
                      color: p.isActive ? '#16a34a' : '#64748b',
                    }}>
                      {p.isActive ? t('admin.plans.active') : t('admin.plans.inactive')}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button type="button" className="crm-btn crm-btn-secondary" style={{ padding: '6px 12px' }} onClick={() => setModal({ plan: p })}>
                      {t('common.edit')}
                    </button>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button
                      type="button"
                      className="crm-btn crm-btn-secondary"
                      style={{ padding: '6px 12px', marginRight: '8px' }}
                      onClick={() => handleToggleActive(p)}
                      disabled={!!togglingId}
                    >
                      {togglingId === p.id ? t('common.loading') : (p.isActive ? t('admin.plans.disable') : t('admin.plans.enable'))}
                    </button>
                    <button
                      type="button"
                      className="crm-btn"
                      style={{ padding: '6px 12px', color: '#dc2626', borderColor: '#fecaca' }}
                      onClick={() => handleDelete(p)}
                    >
                      {t('common.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal === 'create' && (
        <PlanFormModal onClose={() => setModal(null)} onSuccess={load} />
      )}
      {modal?.plan && (
        <PlanFormModal plan={modal.plan} onClose={() => setModal(null)} onSuccess={load} />
      )}
    </div>
  );
}
