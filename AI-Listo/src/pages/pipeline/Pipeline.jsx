import { useState } from 'react';
import './pipeline.css';

export default function Pipeline() {
  // Placeholder data for Kanban board
  const [stages] = useState([
    { id: 'new', name: 'New', deals: [], className: 'new' },
    { id: 'qualified', name: 'Qualified', deals: [], className: 'qualified' },
    { id: 'proposal', name: 'Proposal', deals: [], className: 'proposal' },
    { id: 'negotiation', name: 'Negotiation', deals: [], className: 'negotiation' },
    { id: 'won', name: 'Won', deals: [], className: 'won' },
    { id: 'lost', name: 'Lost', deals: [], className: 'lost' },
  ]);

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>Pipeline</h1>
      
      {/* Pipeline Board */}
      <div className="pipeline-board">
        {stages.map((stage) => (
          <div 
            key={stage.id}
            className={`pipeline-column ${stage.className}`}
          >
            {/* Stage Header */}
            <div className="pipeline-header">
              <span>{stage.name}</span>
              <span className="pipeline-count">{stage.deals.length}</span>
            </div>

            {/* Deals List */}
            <div className="pipeline-deals">
              {stage.deals.length === 0 ? (
                <div className="pipeline-empty">
                  No deals in this stage yet
                </div>
              ) : (
                stage.deals.map((deal) => (
                  <div key={deal.id} className="pipeline-deal">
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{deal.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{deal.value}</div>
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
