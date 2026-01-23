import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../shared/ai-pages.css';
import './ai-automations.css';

export default function AIAutomations() {
  const { t } = useTranslation();
  const [selectedAutomation, setSelectedAutomation] = useState(null);

  const automations = [
    {
      id: 'whatsapp',
      titleKey: 'aiAutomations.whatsappAutomation',
      descriptionKey: 'aiAutomations.whatsappAutomationDesc',
      statusKey: 'aiAutomations.status',
      configKey: 'aiAutomations.whatsappConfig',
      isActive: false, // Active automation
      isLocked: true,
      lockReason: 'Coming Soon'
    },
    {
      id: 'email',
      titleKey: 'aiAutomations.emailAutomation',
      descriptionKey: 'aiAutomations.emailAutomationDesc',
      statusKey: 'aiAutomations.status',
      configKey: 'aiAutomations.emailConfig',
      isActive: false, // Inactive
      isLocked: true,
      lockReason: 'Coming Soon'
    },
    {
      id: 'instagram',
      titleKey: 'aiAutomations.instagramAutomation',
      descriptionKey: 'aiAutomations.instagramAutomationDesc',
      statusKey: 'aiAutomations.status',
      configKey: 'aiAutomations.instagramConfig',
      isActive: false, // Inactive
      isLocked: true,
      lockReason: 'Locked'
    }
  ];

  const handleAutomationClick = (automation) => {
    // Only allow clicking active automations
    if (automation.isActive && !automation.isLocked) {
      setSelectedAutomation(automation);
    }
  };

  const handleBack = () => {
    setSelectedAutomation(null);
  };

  // Detail View
  if (selectedAutomation) {
    return (
      <div>
        <div className="ai-automations-header">
          <button
            onClick={handleBack}
            className="ai-automations-back-btn"
          >
            {t('aiAutomations.back')}
          </button>
          <h1>{t(selectedAutomation.titleKey)}</h1>
        </div>

        <div className="ai-automations-detail">
          <div className="ai-automations-detail-description">
            <p>{t(selectedAutomation.configKey)}</p>
          </div>

          <div className="ai-automations-helper-line">
            {t('aiAutomations.detailHelper')}
          </div>

          <div className="ai-automations-placeholder">
            <p>{t('aiAutomations.configurationPlaceholder', { title: t(selectedAutomation.titleKey) })}</p>
          </div>
        </div>
      </div>
    );
  }

  // Main View
  return (
    <div>
      <div className="ai-automations-header">
        <h1>{t('aiAutomations.title')}</h1>
      </div>

      <div className="ai-automations-description">
        <p>{t('aiAutomations.description')}</p>
      </div>

      <div className="ai-automations-helper-line">
        {t('aiAutomations.helperLine')}
      </div>

      <div className="ai-automations-modules">
        {automations.map((automation) => (
          <div
            key={automation.id}
            className={`ai-automations-module-card ${automation.isLocked ? 'ai-automations-module-locked' : ''} ${!automation.isActive ? 'ai-automations-module-inactive' : ''}`}
            onClick={() => handleAutomationClick(automation)}
          >
            <div className="ai-automations-module-header">
              <h2>{t(automation.titleKey)}</h2>
              {automation.isLocked && (
                <span className="ai-automations-lock-badge">
                  🔒 {automation.lockReason || 'Locked'}
                </span>
              )}
            </div>
            <div className="ai-automations-module-description">
              <p>{t(automation.descriptionKey)}</p>
            </div>
            <div className="ai-automations-module-status">
              <span>{automation.isActive ? t(automation.statusKey) : (automation.lockReason || 'Inactive')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
