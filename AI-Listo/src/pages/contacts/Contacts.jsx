import { useState } from 'react';
import '../shared/ai-pages.css';

export default function Contacts() {
  // Placeholder data
  const [contacts] = useState([]);

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>Contacts</h1>
      
      {contacts.length === 0 ? (
        <div className="contacts-empty">
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>👥</div>
          <h3>No contacts yet</h3>
          <p>
            Contacts will appear here as you interact with leads and properties.
          </p>
        </div>
      ) : (
        <div className="crm-section">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Phone</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Linked Leads</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Linked Properties</th>
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
