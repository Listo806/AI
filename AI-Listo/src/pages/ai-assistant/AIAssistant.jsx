import { useState } from 'react';
import '../shared/ai-pages.css';

export default function AIAssistant() {
  const [context, setContext] = useState('general');
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: 'Hello! I\'m your AI Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');

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
        content: `This is a placeholder response. In a future phase, I'll provide intelligent assistance based on the ${context} context.`
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 500);
  };

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>AI Assistant</h1>
      
      {/* Context Selector */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setContext('general')}
          className={`ai-tab ${context === 'general' ? 'active' : ''}`}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: context === 'general' ? '1px solid rgba(59, 130, 246, 0.85)' : '1px solid #e5e7eb',
            background: context === 'general' ? 'rgba(59, 130, 246, 0.15)' : '#fff',
            color: context === 'general' ? 'rgba(59, 130, 246, 0.85)' : '#64748b',
            fontWeight: context === 'general' ? '600' : '400',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          General
        </button>
        <button
          onClick={() => setContext('lead')}
          className={`ai-tab ${context === 'lead' ? 'active' : ''}`}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: context === 'lead' ? '1px solid rgba(59, 130, 246, 0.85)' : '1px solid #e5e7eb',
            background: context === 'lead' ? 'rgba(59, 130, 246, 0.15)' : '#fff',
            color: context === 'lead' ? 'rgba(59, 130, 246, 0.85)' : '#64748b',
            fontWeight: context === 'lead' ? '600' : '400',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Lead
        </button>
        <button
          onClick={() => setContext('pipeline')}
          className={`ai-tab ${context === 'pipeline' ? 'active' : ''}`}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: context === 'pipeline' ? '1px solid rgba(59, 130, 246, 0.85)' : '1px solid #e5e7eb',
            background: context === 'pipeline' ? 'rgba(59, 130, 246, 0.15)' : '#fff',
            color: context === 'pipeline' ? 'rgba(59, 130, 246, 0.85)' : '#64748b',
            fontWeight: context === 'pipeline' ? '600' : '400',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Pipeline
        </button>
      </div>

      {/* Chat Container */}
      <div className="ai-chat-container">
        {/* Chat Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div className={`ai-message ${message.role === 'user' ? 'user' : ''}`}>
                {message.content}
              </div>
            </div>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="ai-input"
          />
          <button
            type="submit"
            className="crm-btn crm-btn-primary"
            style={{ padding: '12px 24px', borderRadius: '14px' }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
