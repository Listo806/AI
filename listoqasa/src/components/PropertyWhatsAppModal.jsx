import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/apiClient';
import { normalizePhoneToE164 } from '../utils/whatsapp';
import '../styles/ContactModal.css';

/**
 * Modal to collect phone (and optional name), create lead via POST /leads/whatsapp,
 * then open the returned WhatsApp URL (Property Funnel: lead creation, 24h/template, entry message).
 * @param {object} property - { id, title, ... }
 * @param {'property_whatsapp_detail'|'property_whatsapp_search'} source
 * @param {function} onClose
 */
export default function PropertyWhatsAppModal({ property, source, onClose }) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const normalized = normalizePhoneToE164(phone.trim());
    if (!normalized) {
      setError(t('properties.whatsappModal.invalidPhone', 'Please enter a valid phone number.'));
      return;
    }
    setLoading(true);
    try {
      const body = {
        phone: normalized,
        propertyId: property.id,
        source,
        propertyTitle: property.title || undefined,
        sellerType: 'agent',
      };
      if (name.trim()) body.name = name.trim();

      const result = await apiClient.request('/leads/whatsapp', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const url = result?.data?.whatsappUrl;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
        onClose();
      } else {
        setError(t('properties.whatsappModal.couldNotOpen', 'Could not open WhatsApp. Please try again.'));
      }
    } catch (err) {
      setError(err.message || t('properties.whatsappModal.openError', 'Failed to open WhatsApp. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="crm-modal-overlay" onClick={onClose}>
      <div className="crm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="crm-modal-header">
          <h3>{t('properties.whatsappModal.title', 'Contact via WhatsApp')}</h3>
          <button type="button" className="crm-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="crm-modal-body">
          <p style={{ marginBottom: '20px', color: '#64748b' }}>
            {t('properties.whatsappModal.messagePrompt', 'Enter your number to open WhatsApp and message us about ')}<strong>{property.title || t('properties.whatsappModal.thisProperty', 'this property')}</strong>.
          </p>

          {error && (
            <div className="crm-error" style={{ marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="crm-form">
            <div className="crm-form-field">
              <label htmlFor="whatsapp-phone">{t('properties.whatsappModal.phoneLabel', 'Phone *')}</label>
              <input
                id="whatsapp-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={(e) => {
                  const val = e.target.value?.trim();
                  if (val) {
                    const normalized = normalizePhoneToE164(val);
                    if (normalized) setPhone(normalized);
                  }
                }}
                disabled={loading}
                placeholder="+1 (555) 123-4567"
                required
              />
            </div>
            <div className="crm-form-field">
              <label htmlFor="whatsapp-name">{t('properties.whatsappModal.nameLabel', 'Name (optional)')}</label>
              <input
                id="whatsapp-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                placeholder={t('properties.whatsappModal.namePlaceholder', 'Your name')}
              />
            </div>
            <div className="crm-form-actions">
              <button
                type="button"
                onClick={onClose}
                className="crm-btn crm-btn-secondary"
                disabled={loading}
              >
                {t('properties.whatsappModal.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                className="crm-btn crm-btn-primary"
                disabled={loading}
              >
                {loading ? t('properties.whatsappModal.opening', 'Opening...') : t('properties.whatsappModal.openWhatsApp', 'Open WhatsApp')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
