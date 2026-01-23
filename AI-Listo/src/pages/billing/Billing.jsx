import { useState } from 'react';

export default function Billing() {
  // Placeholder data
  const [currentPlan] = useState({
    name: 'AI CRM PRO+',
    price: '$149.99',
    seats: 1,
    features: ['Unlimited Properties', 'CRM Access', 'AI Features', 'Advanced Analytics']
  });

  const [invoices] = useState([]);

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>Billing</h1>
      
      {/* Current Plan */}
      <div className="crm-section" style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '600' }}>Current Plan</h2>
        <div style={{
          padding: '24px',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600' }}>
                {currentPlan.name}
              </h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                {currentPlan.price} / month
              </p>
            </div>
            <button className="crm-btn crm-btn-primary">
              Change Plan
            </button>
          </div>
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Features:</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#64748b' }}>
              {currentPlan.features.map((feature, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{feature}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Seats */}
      <div className="crm-section" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Seats</h2>
          <button className="crm-btn crm-btn-secondary">
            Manage Seats
          </button>
        </div>
        <div style={{
          padding: '16px',
          background: '#f8fafc',
          borderRadius: '8px'
        }}>
          <p style={{ margin: 0, color: '#64748b' }}>
            Current seats: {currentPlan.seats} (UI skeleton - will be connected to backend in future phase)
          </p>
        </div>
      </div>

      {/* Invoices */}
      <div className="crm-section">
        <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '600' }}>Invoices</h2>
        {invoices.length === 0 ? (
          <div style={{
            padding: '24px',
            background: '#f8fafc',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#64748b'
          }}>
            <p style={{ margin: 0 }}>No invoices yet</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Amount</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>{invoice.date}</td>
                  <td style={{ padding: '12px' }}>{invoice.amount}</td>
                  <td style={{ padding: '12px' }}>
                    <span className="crm-item-badge badge-published">
                      {invoice.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button className="crm-btn crm-btn-secondary" style={{ fontSize: '12px', padding: '4px 8px' }}>
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
