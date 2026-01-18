import { useState } from 'react';

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
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', maxHeight: '800px' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: 600 }}>AI Assistant</h1>
      
      {/* Context Selector */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setContext('general')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: context === 'general' ? '2px solid #3b82f6' : '1px solid #e5e7eb',
            background: context === 'general' ? '#eff6ff' : '#fff',
            color: context === 'general' ? '#3b82f6' : '#64748b',
            fontWeight: context === 'general' ? '600' : '400',
            cursor: 'pointer'
          }}
        >
          General
        </button>
        <button
          onClick={() => setContext('lead')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: context === 'lead' ? '2px solid #3b82f6' : '1px solid #e5e7eb',
            background: context === 'lead' ? '#eff6ff' : '#fff',
            color: context === 'lead' ? '#3b82f6' : '#64748b',
            fontWeight: context === 'lead' ? '600' : '400',
            cursor: 'pointer'
          }}
        >
          Lead
        </button>
        <button
          onClick={() => setContext('pipeline')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: context === 'pipeline' ? '2px solid #3b82f6' : '1px solid #e5e7eb',
            background: context === 'pipeline' ? '#eff6ff' : '#fff',
            color: context === 'pipeline' ? '#3b82f6' : '#64748b',
            fontWeight: context === 'pipeline' ? '600' : '400',
            cursor: 'pointer'
          }}
        >
          Pipeline
        </button>
      </div>

      {/* Chat Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        background: '#f8fafc',
        borderRadius: '8px',
        marginBottom: '16px'
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              marginBottom: '16px',
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              maxWidth: '70%',
              padding: '12px 16px',
              borderRadius: '8px',
              background: message.role === 'user' ? '#3b82f6' : '#fff',
              color: message.role === 'user' ? '#fff' : '#0f172a',
              border: message.role === 'assistant' ? '1px solid #e5e7eb' : 'none'
            }}>
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
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            fontSize: '14px'
          }}
        />
        <button
          type="submit"
          className="crm-btn crm-btn-primary"
          style={{ padding: '12px 24px' }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
