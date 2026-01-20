import { useState, useEffect, useRef } from 'react';
import '../shared/ai-pages.css';
import './ai-assistant.css';

export default function AIAssistant() {
  const [context, setContext] = useState('general');
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: 'Hello! I\'m your AI Assistant. Ask me to analyze leads, summarize pipeline activity, or highlight items that need attention.' }
  ]);
  const [input, setInput] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const dropdownRef = useRef(null);

  const quickActions = [
    { icon: '✏️', label: 'Write a property description' },
    { icon: '✨', label: 'Improve a property description' },
    { icon: '📥', label: 'Analyze new leads' },
    { icon: '📊', label: 'Review pipeline activity' },
    { icon: '💡', label: 'Get insights or recommendations' }
  ];

  const handleQuickAction = (action) => {
    setInput(action.label);
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

    // Simulate AI response (placeholder)
    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `This is a placeholder response. In a future phase, I'll provide intelligent assistance based on the ${context === 'leads' ? 'leads' : context} context.`
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 500);
  };

  return (
    <div>
      {/* Header */}
      <div className="ai-assistant-header">
        <h1>🤖 AI Assistant</h1>
      </div>

      {/* Chat Container */}
      <div className="ai-assistant-container">
        {/* Context Tabs */}
        <div className="ai-assistant-tabs">
          <button
            onClick={() => setContext('general')}
            className={`ai-assistant-tab ${context === 'general' ? 'active' : ''}`}
          >
            General
          </button>
          <button
            onClick={() => setContext('leads')}
            className={`ai-assistant-tab ${context === 'leads' ? 'active' : ''}`}
          >
            Leads
          </button>
          <button
            onClick={() => setContext('pipeline')}
            className={`ai-assistant-tab ${context === 'pipeline' ? 'active' : ''}`}
          >
            Pipeline
          </button>
        </div>

        {/* Quick Actions Section */}
        <div className="ai-assistant-quick-actions">
          <div className="ai-assistant-quick-actions-label">
            What would you like to do today?
          </div>
          <div className="ai-assistant-dropdown-wrapper" ref={dropdownRef}>
            <button
              type="button"
              className="ai-assistant-dropdown-trigger"
              onClick={() => setShowQuickActions(!showQuickActions)}
            >
              <span>Select an action…</span>
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
                    <span className="ai-assistant-dropdown-icon">{action.icon}</span>
                    <span>{action.label}</span>
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
            <div className="ai-assistant-empty-helper-title">Try one of these:</div>
            <ul className="ai-assistant-empty-helper-list">
              <li>Write a property description</li>
              <li>Review pipeline activity</li>
              <li>Analyze new leads</li>
            </ul>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSend} className="ai-assistant-input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a question or command…"
            className="ai-assistant-input"
          />
          <button
            type="submit"
            className="ai-assistant-send-btn"
            disabled={!input.trim()}
          >
            <span>Send</span>
            <span>▶</span>
          </button>
        </form>
      </div>
    </div>
  );
}
