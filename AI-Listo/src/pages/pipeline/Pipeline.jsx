import { useState } from 'react';

export default function Pipeline() {
  // Placeholder data for Kanban board
  const [stages] = useState([
    { id: 'new', name: 'New', deals: [] },
    { id: 'qualified', name: 'Qualified', deals: [] },
    { id: 'proposal', name: 'Proposal', deals: [] },
    { id: 'negotiation', name: 'Negotiation', deals: [] },
    { id: 'closed-won', name: 'Closed Won', deals: [] },
    { id: 'closed-lost', name: 'Closed Lost', deals: [] },
  ]);

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>Pipeline</h1>
      
      {/* Kanban Board */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${stages.length}, 1fr)`, 
        gap: '16px',
        overflowX: 'auto',
        paddingBottom: '16px'
      }}>
        {stages.map((stage) => (
          <div 
            key={stage.id}
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '16px',
              minWidth: '250px',
              border: '1px solid #e5e7eb'
            }}
          >
            <h3 style={{ 
              margin: '0 0 16px 0', 
              fontSize: '16px', 
              fontWeight: '600',
              color: '#0f172a'
            }}>
              {stage.name}
            </h3>
            <div style={{ 
              minHeight: '400px',
              background: '#f8fafc',
              borderRadius: '6px',
              padding: '12px',
              border: '2px dashed #cbd5e1'
            }}>
              {stage.deals.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#94a3b8', 
                  fontSize: '14px',
                  padding: '20px'
                }}>
                  No deals in this stage
                </div>
              ) : (
                stage.deals.map((deal) => (
                  <div key={deal.id} style={{
                    background: '#fff',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    border: '1px solid #e5e7eb',
                    cursor: 'move'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{deal.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{deal.value}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ 
        marginTop: '24px', 
        padding: '16px', 
        background: '#f8fafc', 
        borderRadius: '8px',
        fontSize: '14px',
        color: '#64748b'
      }}>
        <p style={{ margin: 0 }}>
          💡 <strong>Note:</strong> Drag & drop functionality will be implemented in a future phase.
          This is the basic Kanban structure for deal movement.
        </p>
      </div>
    </div>
  );
}
