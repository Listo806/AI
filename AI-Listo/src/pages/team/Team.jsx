import { useState } from 'react';

export default function Team() {
  // Placeholder data
  const [teamMembers] = useState([]);

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>Team</h1>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <p style={{ color: '#64748b', margin: 0 }}>
            Manage your team members, roles, and seats
          </p>
        </div>
        <button className="crm-btn crm-btn-primary">
          + Add Member
        </button>
      </div>

      {teamMembers.length === 0 ? (
        <div className="crm-empty-state">
          <div className="crm-empty-icon">👥</div>
          <h3 className="crm-empty-title">No team members yet</h3>
          <p className="crm-empty-text">
            Add team members to collaborate on leads and properties.
          </p>
        </div>
      ) : (
        <div className="crm-section">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Role</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Seats</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => (
                <tr key={member.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>{member.name}</td>
                  <td style={{ padding: '12px' }}>{member.email}</td>
                  <td style={{ padding: '12px' }}>
                    <span className="crm-item-badge badge-published">
                      {member.role || 'Member'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{member.seats || 1}</td>
                  <td style={{ padding: '12px' }}>
                    <button className="crm-btn crm-btn-secondary" style={{ fontSize: '12px', padding: '4px 8px' }}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Seats Summary */}
      <div style={{ 
        marginTop: '24px', 
        padding: '16px', 
        background: '#f8fafc', 
        borderRadius: '8px'
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>Seats Summary</h3>
        <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
          Used: 0 / Available: 0 (UI skeleton - will be connected to backend in future phase)
        </p>
      </div>
    </div>
  );
}
