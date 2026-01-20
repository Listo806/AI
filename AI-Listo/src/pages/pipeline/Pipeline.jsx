import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './pipeline.css';

export default function Pipeline() {
  const { t } = useTranslation();
  
  // Placeholder data for Kanban board
  const [stages] = useState([
    { id: 'new', nameKey: 'pipeline.new', deals: [], className: 'new' },
    { id: 'qualified', nameKey: 'pipeline.qualified', deals: [], className: 'qualified' },
    { id: 'proposal', nameKey: 'pipeline.proposal', deals: [], className: 'proposal' },
    { id: 'negotiation', nameKey: 'pipeline.negotiation', deals: [], className: 'negotiation' },
    { id: 'won', nameKey: 'pipeline.won', deals: [], className: 'won' },
    { id: 'lost', nameKey: 'pipeline.lost', deals: [], className: 'lost' },
  ]);

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>{t('pipeline.title')}</h1>
      
      {/* Pipeline Board */}
      <div className="pipeline-board">
        {stages.map((stage) => (
          <div 
            key={stage.id}
            className={`pipeline-column ${stage.className}`}
          >
            {/* Stage Header */}
            <div className="pipeline-header">
              <span>{t(stage.nameKey)}</span>
              <span className="pipeline-count">{stage.deals.length}</span>
            </div>

            {/* Deals List */}
            <div className="pipeline-deals">
              {stage.deals.length === 0 ? (
                <div className="pipeline-empty">
                  {t('pipeline.noDeals')}
                </div>
              ) : (
                stage.deals.map((deal) => (
                  <div key={deal.id} className="pipeline-deal">
                    <div style={{ fontWeight: '600', marginBottom: '4px', color: '#E5E7EB' }}>{deal.name}</div>
                    <div style={{ fontSize: '12px', color: '#CBD5E1' }}>{deal.value}</div>
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
