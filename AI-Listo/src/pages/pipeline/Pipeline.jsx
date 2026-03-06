import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getDeals, createDeal, updateDeal, updateDealStage, deleteDeal } from '../../api/pipelineApi';
import { getMyTeams, getTeamMembers } from '../../api/platformApi';
import { getOwnerLeads } from '../../api/analyticsApi';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import './pipeline.css';

const STAGE_IDS = ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

const STAGES_CONFIG = [
  { id: 'new', nameKey: 'pipeline.new', className: 'new' },
  { id: 'qualified', nameKey: 'pipeline.qualified', className: 'qualified' },
  { id: 'proposal', nameKey: 'pipeline.proposal', className: 'proposal' },
  { id: 'negotiation', nameKey: 'pipeline.negotiation', className: 'negotiation' },
  { id: 'won', nameKey: 'pipeline.won', className: 'won' },
  { id: 'lost', nameKey: 'pipeline.lost', className: 'lost' },
];

function groupDealsByStage(deals) {
  const grouped = {};
  STAGE_IDS.forEach((id) => {
    grouped[id] = [];
  });
  (deals || []).forEach((deal) => {
    const stage = deal.stage || 'new';
    if (grouped[stage]) {
      grouped[stage].push(deal);
    } else {
      grouped.new.push(deal);
    }
  });
  STAGE_IDS.forEach((id) => {
    grouped[id].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  });
  return grouped;
}

function formatValue(value) {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}k`;
  return `$${n.toLocaleString()}`;
}

export default function Pipeline() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedDealId, setDraggedDealId] = useState(null);
  const [dragOverStageId, setDragOverStageId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState('');
  const [addValue, setAddValue] = useState('');
  const [addLeadId, setAddLeadId] = useState('');
  const [addAssignedTo, setAddAssignedTo] = useState('');
  const [adding, setAdding] = useState(false);
  const [leads, setLeads] = useState([]);
  const [members, setMembers] = useState([]);
  const [editingDeal, setEditingDeal] = useState(null);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStage, setEditStage] = useState('new');
  const [editLeadId, setEditLeadId] = useState('');
  const [editAssignedTo, setEditAssignedTo] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const effectiveTeamId = selectedTeamId || user?.teamId;

  const loadDeals = useCallback(async () => {
    if (!effectiveTeamId && (!user?.role || user.role === 'owner')) {
      setLoading(false);
      setDeals([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await getDeals({ teamId: effectiveTeamId || undefined });
      setDeals(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err?.message || t('common.error'));
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, [t, effectiveTeamId, user?.role]);

  useEffect(() => {
    (async () => {
      try {
        const list = await getMyTeams();
        setTeams(Array.isArray(list) ? list : []);
        if (list?.length > 0) {
          setSelectedTeamId((prev) => prev || (list.find((t) => t.id === user?.teamId)?.id || list[0]?.id) || null);
        }
      } catch {
        setTeams([]);
      }
    })();
  }, [user?.teamId]);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  useEffect(() => {
    if (!effectiveTeamId) return;
    (async () => {
      try {
        const [leadList, memberList] = await Promise.all([
          getOwnerLeads(500),
          getTeamMembers(effectiveTeamId),
        ]);
        setLeads(Array.isArray(leadList) ? leadList : []);
        setMembers(Array.isArray(memberList) ? memberList : []);
      } catch {
        setLeads([]);
        setMembers([]);
      }
    })();
  }, [effectiveTeamId]);

  const grouped = groupDealsByStage(deals);

  const handleDragStart = (e, deal) => {
    setDraggedDealId(deal.id);
    e.dataTransfer.setData('application/json', JSON.stringify({ id: deal.id, stage: deal.stage }));
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', deal.id);
  };

  const handleDragEnd = () => {
    setDraggedDealId(null);
    setDragOverStageId(null);
  };

  const handleDragOver = (e, stageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStageId(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStageId(null);
  };

  const handleDrop = async (e, targetStageId) => {
    e.preventDefault();
    setDragOverStageId(null);
    const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
    let dealId = null;
    try {
      const parsed = JSON.parse(raw);
      dealId = parsed?.id || parsed;
    } catch {
      dealId = raw;
    }
    if (!dealId) return;
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === targetStageId) {
      setDraggedDealId(null);
      return;
    }
    const targetDeals = grouped[targetStageId] || [];
    const newPosition = targetDeals.length;
    setDraggedDealId(null);

    const prevDeals = [...deals];
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId ? { ...d, stage: targetStageId, position: newPosition } : d
      )
    );

    try {
      await updateDealStage(dealId, targetStageId, newPosition);
      showSuccess(t('pipeline.dealMoved') || 'Deal moved');
    } catch (err) {
      setDeals(prevDeals);
      showError(err?.message || t('common.error'));
    }
  };

  const openEditModal = (deal) => {
    setEditingDeal(deal);
    setEditName(deal.name || '');
    setEditValue(deal.value != null ? String(deal.value) : '');
    setEditNotes(deal.notes || '');
    setEditStage(deal.stage || 'new');
    setEditLeadId(deal.leadId || '');
    setEditAssignedTo(deal.assignedTo || '');
  };

  const handleSaveDeal = async (e) => {
    e.preventDefault();
    if (!editingDeal) return;
    const name = editName.trim();
    if (!name) {
      showError(t('pipeline.dealNameRequired') || 'Deal name is required');
      return;
    }
    setSaving(true);
    try {
      const value = editValue.trim() ? parseFloat(editValue) : 0;
      const payload = {
        name,
        value: Number.isFinite(value) ? value : 0,
        notes: editNotes.trim() || null,
        leadId: editLeadId || null,
        assignedTo: editAssignedTo || null,
      };
      if (editStage !== editingDeal.stage) {
        const targetDeals = grouped[editStage] || [];
        await updateDealStage(editingDeal.id, editStage, targetDeals.length);
      }
      await updateDeal(editingDeal.id, payload);
      showSuccess(t('pipeline.dealUpdated') || 'Deal updated');
      setEditingDeal(null);
      await loadDeals();
    } catch (err) {
      showError(err?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDeal = async () => {
    if (!editingDeal) return;
    if (!window.confirm(t('pipeline.deleteDealConfirm') || 'Delete this deal? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await deleteDeal(editingDeal.id);
      showSuccess(t('pipeline.dealDeleted') || 'Deal deleted');
      setEditingDeal(null);
      await loadDeals();
    } catch (err) {
      showError(err?.message || t('common.error'));
    } finally {
      setDeleting(false);
    }
  };

  const handleAddDeal = async (e) => {
    e.preventDefault();
    const name = addName.trim();
    if (!name) {
      showError(t('pipeline.dealNameRequired') || 'Deal name is required');
      return;
    }
    if (!effectiveTeamId) {
      showError(t('pipeline.selectTeam') || 'Please select a team');
      return;
    }
    setAdding(true);
    try {
      const value = addValue.trim() ? parseFloat(addValue) : 0;
      await createDeal({
        name,
        value: Number.isFinite(value) ? value : 0,
        stage: 'new',
        position: (grouped.new || []).length,
        teamId: effectiveTeamId,
        leadId: addLeadId || undefined,
        assignedTo: addAssignedTo || undefined,
      });
      showSuccess(t('pipeline.dealCreated') || 'Deal created');
      setAddName('');
      setAddValue('');
      setAddLeadId('');
      setAddAssignedTo('');
      setShowAddForm(false);
      await loadDeals();
    } catch (err) {
      showError(err?.message || t('common.error'));
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>
          {t('pipeline.title')}
        </h1>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          {t('common.loading')}
        </div>
      </div>
    );
  }

  const leadsForTeam = leads.filter((l) => !l.teamId || l.teamId === effectiveTeamId);
  const getLeadName = (id) => (leads.find((l) => l.id === id)?.name) || (id ? t('pipeline.lead') : '');
  const getMemberLabel = (id) => {
    const m = members.find((x) => x.id === id);
    return m ? (m.name || m.email || m.id) : (id ? t('pipeline.assigned') : '');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 600 }}>{t('pipeline.title')}</h1>
          {teams.length > 1 && (
            <select
              className="pipeline-input"
              value={selectedTeamId || ''}
              onChange={(e) => setSelectedTeamId(e.target.value || null)}
              style={{ maxWidth: '220px' }}
              aria-label={t('pipeline.team')}
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          )}
        </div>
        <button
          type="button"
          className="crm-btn crm-btn-primary"
          onClick={() => setShowAddForm(true)}
          disabled={!effectiveTeamId}
        >
          {t('pipeline.addDeal')}
        </button>
      </div>

      {error && (
        <div className="pipeline-error" role="alert">
          {error}
        </div>
      )}

      {editingDeal && (
        <div className="pipeline-modal-overlay" onClick={() => setEditingDeal(null)}>
          <div className="pipeline-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>{t('pipeline.editDeal')}</h3>
            <form onSubmit={handleSaveDeal}>
              <label style={{ display: 'block', marginBottom: '12px' }}>
                <span style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{t('pipeline.dealName')} *</span>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="pipeline-input"
                />
              </label>
              <label style={{ display: 'block', marginBottom: '12px' }}>
                <span style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{t('pipeline.dealValue')}</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="pipeline-input"
                />
              </label>
              <label style={{ display: 'block', marginBottom: '12px' }}>
                <span style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{t('pipeline.stage')}</span>
                <select
                  value={editStage}
                  onChange={(e) => setEditStage(e.target.value)}
                  className="pipeline-input"
                >
                  {STAGES_CONFIG.map((s) => (
                    <option key={s.id} value={s.id}>{t(s.nameKey)}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'block', marginBottom: '12px' }}>
                <span style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{t('pipeline.linkLead')}</span>
                <select className="pipeline-input" value={editLeadId} onChange={(e) => setEditLeadId(e.target.value)}>
                  <option value="">—</option>
                  {(leadsForTeam.length ? leadsForTeam : leads).map((l) => (
                    <option key={l.id} value={l.id}>{l.name || l.email || l.id}</option>
                  ))}
                </select>
              </label>
              {members.length > 0 && (
                <label style={{ display: 'block', marginBottom: '12px' }}>
                  <span style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{t('pipeline.assignTo')}</span>
                  <select className="pipeline-input" value={editAssignedTo} onChange={(e) => setEditAssignedTo(e.target.value)}>
                    <option value="">—</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name || m.email || m.id}</option>
                    ))}
                  </select>
                </label>
              )}
              <label style={{ display: 'block', marginBottom: '16px' }}>
                <span style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{t('pipeline.notes')}</span>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="pipeline-input"
                  rows={3}
                />
              </label>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="crm-btn"
                  style={{ color: '#dc2626', borderColor: '#dc2626' }}
                  onClick={handleDeleteDeal}
                  disabled={deleting}
                >
                  {deleting ? t('common.loading') : t('pipeline.deleteDeal')}
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="crm-btn crm-btn-secondary" onClick={() => setEditingDeal(null)}>
                    {t('common.cancel')}
                  </button>
                  <button type="submit" className="crm-btn crm-btn-primary" disabled={saving}>
                    {saving ? t('common.loading') : t('pipeline.saveDeal')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="pipeline-add-form-wrapper">
          <form onSubmit={handleAddDeal} className="pipeline-add-form">
            <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>{t('pipeline.newDeal')}</h3>
            <label style={{ display: 'block', marginBottom: '12px' }}>
              <span style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                {t('pipeline.dealName')} *
              </span>
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder={t('pipeline.dealNamePlaceholder')}
                className="pipeline-input"
                autoFocus
              />
            </label>
            <label style={{ display: 'block', marginBottom: '16px' }}>
              <span style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                {t('pipeline.dealValue')}
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={addValue}
                onChange={(e) => setAddValue(e.target.value)}
                placeholder="0"
                className="pipeline-input"
              />
            </label>
            {leadsForTeam.length > 0 && (
              <label style={{ display: 'block', marginBottom: '12px' }}>
                <span style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{t('pipeline.linkLead')}</span>
                <select
                  className="pipeline-input"
                  value={addLeadId}
                  onChange={(e) => setAddLeadId(e.target.value)}
                >
                  <option value="">—</option>
                  {leadsForTeam.map((l) => (
                    <option key={l.id} value={l.id}>{l.name || l.email || l.id}</option>
                  ))}
                </select>
              </label>
            )}
            {members.length > 0 && (
              <label style={{ display: 'block', marginBottom: '16px' }}>
                <span style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>{t('pipeline.assignTo')}</span>
                <select
                  className="pipeline-input"
                  value={addAssignedTo}
                  onChange={(e) => setAddAssignedTo(e.target.value)}
                >
                  <option value="">—</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name || m.email || m.id}</option>
                  ))}
                </select>
              </label>
            )}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="crm-btn crm-btn-secondary"
                onClick={() => { setShowAddForm(false); setAddName(''); setAddValue(''); }}
              >
                {t('common.cancel')}
              </button>
              <button type="submit" className="crm-btn crm-btn-primary" disabled={adding}>
                {adding ? t('common.loading') : t('pipeline.createDeal')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="pipeline-board">
        {STAGES_CONFIG.map((stage) => (
          <div
            key={stage.id}
            className={`pipeline-column ${stage.className} ${dragOverStageId === stage.id ? 'pipeline-column-drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <div className="pipeline-header">
              <span>{t(stage.nameKey)}</span>
              <span className="pipeline-count">{(grouped[stage.id] || []).length}</span>
            </div>

            <div className="pipeline-deals">
              {(grouped[stage.id] || []).length === 0 ? (
                <div className="pipeline-empty">{t('pipeline.noDeals')}</div>
              ) : (
                (grouped[stage.id] || []).map((deal) => (
                  <div
                    key={deal.id}
                    className={`pipeline-deal ${draggedDealId === deal.id ? 'pipeline-deal-dragging' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal)}
                    onDragEnd={handleDragEnd}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ flex: 1, minWidth: 0 }} onClick={() => openEditModal(deal)}>
                        <div style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--text)', cursor: 'pointer' }}>
                          {deal.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {formatValue(deal.value)}
                        </div>
                        {(deal.leadId || deal.assignedTo) && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {deal.leadId && <span>{getLeadName(deal.leadId)}</span>}
                            {deal.leadId && deal.assignedTo && ' · '}
                            {deal.assignedTo && <span>{getMemberLabel(deal.assignedTo)}</span>}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="pipeline-deal-edit-btn"
                        onClick={(e) => { e.stopPropagation(); openEditModal(deal); }}
                        title={t('pipeline.editDeal')}
                        aria-label={t('pipeline.editDeal')}
                      >
                        ✎
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
