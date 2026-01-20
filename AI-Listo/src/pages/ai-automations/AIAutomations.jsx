import { useState } from 'react';
import '../shared/ai-pages.css';
import './ai-automations.css';

export default function AIAutomations() {
  const [selectedAutomation, setSelectedAutomation] = useState(null);

  const automations = [
    {
      id: 'whatsapp',
      title: 'WhatsApp Automation',
      description: 'Automate WhatsApp messages for leads, follow-ups, and responses.',
      status: 'Configuration available in a future phase.'
    },
    {
      id: 'email',
      title: 'Email Automation',
      description: 'Send automated emails for lead nurturing, updates, and follow-ups.',
      status: 'Configuration available in a future phase.'
    },
    {
      id: 'instagram',
      title: 'Instagram Automation',
      description: 'Automate responses and engagement for Instagram inquiries and messages.',
      status: 'Configuration available in a future phase.'
    }
  ];

  const handleAutomationClick = (automation) => {
    setSelectedAutomation(automation);
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
            ← Back
          </button>
          <h1>{selectedAutomation.title}</h1>
        </div>

        <div className="ai-automations-detail">
          <div className="ai-automations-detail-description">
            {selectedAutomation.id === 'whatsapp' && (
              <p>Configure automated WhatsApp messaging rules and responses for leads and contacts.</p>
            )}
            {selectedAutomation.id === 'email' && (
              <p>Configure automated email sequences and follow-ups for leads and contacts.</p>
            )}
            {selectedAutomation.id === 'instagram' && (
              <p>Configure automated responses and engagement for Instagram inquiries and messages.</p>
            )}
          </div>

          <div className="ai-automations-helper-line">
            This automation will work together with your leads, pipeline, and AI Assistant.
          </div>

          <div className="ai-automations-placeholder">
            <p>{selectedAutomation.title} configuration will be available in a future phase.</p>
          </div>
        </div>
      </div>
    );
  }

  // Main View
  return (
    <div>
      <div className="ai-automations-header">
        <h1>AI Automations</h1>
      </div>

      <div className="ai-automations-description">
        <p>Automate communication and follow-ups across your most important channels.</p>
      </div>

      <div className="ai-automations-helper-line">
        These automations will integrate with your leads, pipeline, and AI Assistant.
      </div>

      <div className="ai-automations-modules">
        {automations.map((automation) => (
          <div
            key={automation.id}
            className="ai-automations-module-card"
            onClick={() => handleAutomationClick(automation)}
          >
            <div className="ai-automations-module-header">
              <h2>{automation.title}</h2>
            </div>
            <div className="ai-automations-module-description">
              <p>{automation.description}</p>
            </div>
            <div className="ai-automations-module-status">
              <span>{automation.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
