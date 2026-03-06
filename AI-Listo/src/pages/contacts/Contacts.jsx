import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getContacts, createContact, updateContact, deleteContact } from '../../api/contactsApi';
import { getOwnerLeads } from '../../api/analyticsApi';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import '../shared/ai-pages.css';
import './contacts.css';

export default function Contacts() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [contacts, setContacts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formLeadId, setFormLeadId] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getContacts({ teamId: user?.teamId });
      setContacts(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err?.message || t('common.error'));
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [t, user?.teamId]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    (async () => {
      try {
        const list = await getOwnerLeads(500);
        setLeads(Array.isArray(list) ? list : []);
      } catch {
        setLeads([]);
      }
    })();
  }, []);

  const openCreate = () => {
    setEditingContact(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormLeadId('');
    setFormNotes('');
    setShowForm(true);
  };

  const openEdit = (contact) => {
    setEditingContact(contact);
    setFormName(contact.name || '');
    setFormEmail(contact.email || '');
    setFormPhone(contact.phone || '');
    setFormLeadId(contact.leadId || '');
    setFormNotes(contact.notes || '');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingContact(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = formName.trim();
    if (!name) {
      showError(t('contacts.nameRequired') || 'Name is required');
      return;
    }
    setSaving(true);
    try {
      if (editingContact) {
        await updateContact(editingContact.id, {
          name,
          email: formEmail.trim() || null,
          phone: formPhone.trim() || null,
          leadId: formLeadId || null,
          notes: formNotes.trim() || null,
        });
        showSuccess(t('contacts.contactUpdated') || 'Contact updated');
      } else {
        await createContact({
          name,
          email: formEmail.trim() || undefined,
          phone: formPhone.trim() || undefined,
          leadId: formLeadId || undefined,
          teamId: user?.teamId,
          notes: formNotes.trim() || undefined,
        });
        showSuccess(t('contacts.contactCreated') || 'Contact created');
      }
      closeForm();
      await loadContacts();
    } catch (err) {
      showError(err?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contact) => {
    if (!window.confirm(t('contacts.deleteConfirm') || 'Delete this contact? This cannot be undone.')) return;
    setDeletingId(contact.id);
    try {
      await deleteContact(contact.id);
      showSuccess(t('contacts.contactDeleted') || 'Contact deleted');
      await loadContacts();
    } catch (err) {
      showError(err?.message || t('common.error'));
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  }, [contacts, showForm]);

  if (loading) {
    return (
      <div>
        <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>{t('contacts.title')}</h1>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
          {t('common.loading')}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 600 }}>{t('contacts.title')}</h1>
        <button type="button" className="crm-btn crm-btn-primary" onClick={openCreate}>
          {t('contacts.addContact')}
        </button>
      </div>

      {error && (
        <div className="contacts-error" role="alert">
          {error}
        </div>
      )}

      {showForm && (
        <div className="contacts-modal-overlay" onClick={closeForm}>
          <div className="contacts-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>
              {editingContact ? t('contacts.editContact') : t('contacts.addContact')}
            </h3>
            <form onSubmit={handleSubmit}>
              <label className="contacts-label">
                <span>{t('contacts.contactName')} *</span>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="contacts-input"
                  autoFocus
                />
              </label>
              <label className="contacts-label">
                <span>{t('common.email')}</span>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="contacts-input"
                />
              </label>
              <label className="contacts-label">
                <span>{t('common.phone')}</span>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="contacts-input"
                />
              </label>
              {leads.length > 0 && (
                <label className="contacts-label">
                  <span>{t('contacts.linkedLead')}</span>
                  <select
                    className="contacts-input"
                    value={formLeadId}
                    onChange={(e) => setFormLeadId(e.target.value)}
                  >
                    <option value="">—</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>{l.name || l.email || l.id}</option>
                    ))}
                  </select>
                </label>
              )}
              <label className="contacts-label">
                <span>{t('contacts.notes')}</span>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="contacts-input"
                  rows={3}
                />
              </label>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="crm-btn crm-btn-secondary" onClick={closeForm}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="crm-btn crm-btn-primary" disabled={saving}>
                  {saving ? t('common.loading') : (editingContact ? t('contacts.saveContact') : t('contacts.createContact'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {contacts.length === 0 ? (
        <div className="contacts-empty">
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
            <i data-lucide="users" style={{ width: '48px', height: '48px', stroke: '#64748b', strokeWidth: 2 }}></i>
          </div>
          <h3>{t('contacts.noContacts')}</h3>
          <p>{t('contacts.description')}</p>
          <button type="button" className="crm-btn crm-btn-primary" onClick={openCreate} style={{ marginTop: '16px' }}>
            {t('contacts.addContact')}
          </button>
        </div>
      ) : (
        <div className="contacts-table-wrapper">
          <table className="contacts-table">
            <thead>
              <tr>
                <th>{t('common.name')}</th>
                <th>{t('common.email')}</th>
                <th>{t('common.phone')}</th>
                <th>{t('contacts.linkedLead')}</th>
                <th style={{ width: '100px' }}>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id}>
                  <td>{contact.name}</td>
                  <td>{contact.email || '—'}</td>
                  <td>{contact.phone || '—'}</td>
                  <td>{contact.leadName || '—'}</td>
                  <td>
                    <button
                      type="button"
                      className="contacts-btn-icon"
                      onClick={() => openEdit(contact)}
                      title={t('contacts.editContact')}
                      aria-label={t('contacts.editContact')}
                    >
                      <i data-lucide="pencil" style={{ width: '16px', height: '16px' }}></i>
                    </button>
                    <button
                      type="button"
                      className="contacts-btn-icon contacts-btn-danger"
                      onClick={() => handleDelete(contact)}
                      disabled={deletingId === contact.id}
                      title={t('contacts.deleteContact')}
                      aria-label={t('contacts.deleteContact')}
                    >
                      <i data-lucide="trash-2" style={{ width: '16px', height: '16px' }}></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
