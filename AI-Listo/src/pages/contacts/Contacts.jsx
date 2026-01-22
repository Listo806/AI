import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../shared/ai-pages.css';

export default function Contacts() {
  const { t } = useTranslation();
  // Placeholder data
  const [contacts] = useState([]);

  // Initialize Lucide icons
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  });

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>{t('contacts.title')}</h1>
      
      {contacts.length === 0 ? (
        <div className="contacts-empty">
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
            <i data-lucide="users" style={{ width: '48px', height: '48px', stroke: '#64748b', strokeWidth: 2 }}></i>
          </div>
          <h3>{t('contacts.noContacts')}</h3>
          <p>
            {t('contacts.description')}
          </p>
        </div>
      ) : (
        <div className="crm-section">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>{t('common.name')}</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>{t('common.email')}</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>{t('common.phone')}</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>{t('contacts.linkedLeads')}</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>{t('contacts.linkedProperties')}</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>{contact.name}</td>
                  <td style={{ padding: '12px' }}>{contact.email || 'N/A'}</td>
                  <td style={{ padding: '12px' }}>{contact.phone || 'N/A'}</td>
                  <td style={{ padding: '12px' }}>{contact.leadsCount || 0}</td>
                  <td style={{ padding: '12px' }}>{contact.propertiesCount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
