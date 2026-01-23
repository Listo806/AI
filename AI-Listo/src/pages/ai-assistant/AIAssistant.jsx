import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import '../shared/ai-pages.css';
import './ai-assistant.css';

export default function AIAssistant() {
  const { t, i18n } = useTranslation();
  const [context, setContext] = useState('general');
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: t('aiAssistant.greeting') }
  ]);
  const [input, setInput] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const dropdownRef = useRef(null);

  const quickActions = [
    { icon: 'edit', labelKey: 'aiAssistant.writePropertyDescription' },
    { icon: 'sparkles', labelKey: 'aiAssistant.improvePropertyDescription' },
    { icon: 'download', labelKey: 'aiAssistant.analyzeNewLeads' },
    { icon: 'bar-chart-3', labelKey: 'aiAssistant.reviewPipelineActivity' },
    { icon: 'lightbulb', labelKey: 'aiAssistant.getInsights' }
  ];

  // Initialize Lucide icons
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  });

  // Update greeting message when language changes
  useEffect(() => {
    setMessages([{ id: 1, role: 'assistant', content: t('aiAssistant.greeting') }]);
  }, [i18n.language, t]);

  const handleQuickAction = (action) => {
    setInput(t(action.labelKey));
    setShowQuickActions(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowQuickActions(false);
      }
    };

    if (showQuickActions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showQuickActions]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage = { id: Date.now(), role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');

    // Simulate AI response (placeholder) - Response language matches UI language
    setTimeout(() => {
      const contextKey = context === 'leads' ? 'aiAssistant.leads' : context === 'pipeline' ? 'aiAssistant.pipeline' : 'aiAssistant.general';
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: t('aiAssistant.placeholderResponse', { context: t(contextKey) })
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 500);
  };

  return (
    <div>
      {/* Header */}
      <div className="ai-assistant-header">
        <h1>
          <i data-lucide="bot" style={{ width: '28px', height: '28px', display: 'inline-block', verticalAlign: 'middle', marginRight: '8px', stroke: 'currentColor', strokeWidth: 2 }}></i>
          {t('aiAssistant.title')}
        </h1>
      </div>

      {/* Chat Container */}
      <div className="ai-assistant-container">
        {/* Context Tabs */}
        <div className="ai-assistant-tabs">
          <button
            onClick={() => setContext('general')}
            className={`ai-assistant-tab ${context === 'general' ? 'active' : ''}`}
          >
            {t('aiAssistant.general')}
          </button>
          <button
            onClick={() => setContext('leads')}
            className={`ai-assistant-tab ${context === 'leads' ? 'active' : ''}`}
          >
            {t('aiAssistant.leads')}
          </button>
          <button
            onClick={() => setContext('pipeline')}
            className={`ai-assistant-tab ${context === 'pipeline' ? 'active' : ''}`}
          >
            {t('aiAssistant.pipeline')}
          </button>
        </div>

        {/* Quick Actions Section */}
        <div className="ai-assistant-quick-actions">
          <div className="ai-assistant-quick-actions-label">
            {t('aiAssistant.whatWouldYouLike')}
          </div>
          <div className="ai-assistant-dropdown-wrapper" ref={dropdownRef}>
            <button
              type="button"
              className="ai-assistant-dropdown-trigger"
              onClick={() => setShowQuickActions(!showQuickActions)}
            >
              <span>{t('aiAssistant.selectAction')}</span>
              <span className="ai-assistant-dropdown-arrow">▾</span>
            </button>
            {showQuickActions && (
              <div className="ai-assistant-dropdown-menu">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    type="button"
                    className="ai-assistant-dropdown-item"
                    onClick={() => handleQuickAction(action)}
                  >
                    <i data-lucide={action.icon} className="ai-assistant-dropdown-icon" style={{ width: '18px', height: '18px', stroke: 'currentColor', strokeWidth: 2 }}></i>
                    <span>{t(action.labelKey)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="ai-assistant-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`ai-assistant-message-wrapper ${message.role === 'user' ? 'user' : ''}`}
            >
              <div className={`ai-assistant-message ${message.role === 'user' ? 'user' : ''}`}>
                {message.content}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State Helper (only when no user messages) */}
        {messages.filter(m => m.role === 'user').length === 0 && (
          <div className="ai-assistant-empty-helper">
            <div className="ai-assistant-empty-helper-title">{t('aiAssistant.tryThese')}</div>
            <ul className="ai-assistant-empty-helper-list">
              <li>{t('aiAssistant.writePropertyDescription')}</li>
              <li>{t('aiAssistant.reviewPipelineActivity')}</li>
              <li>{t('aiAssistant.analyzeNewLeads')}</li>
            </ul>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSend} className="ai-assistant-input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('aiAssistant.typeQuestion')}
            className="ai-assistant-input"
          />
          <button
            type="submit"
            className="ai-assistant-send-btn"
            disabled={!input.trim()}
          >
            <span>{t('aiAssistant.send')}</span>
            <span>▶</span>
          </button>
        </form>
      </div>
    </div>
  );
}
