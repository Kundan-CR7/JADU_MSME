import React, { useState } from 'react';
import { MessageSquare, Send, Loader } from 'lucide-react';

const AgentChatWidget = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendQuery = async () => {
    if (!query.trim()) return;

    const userMessage = { type: 'user', text: query };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/agent/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ query, history: messages })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { type: 'agent', text: data.response }]);
      setQuery('');
    } catch (error) {
      setMessages(prev => [...prev, { 
        type: 'error', 
        text: 'Failed to get response from AI agent' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="text-blue-600" />
        <h3 className="text-lg font-semibold">AI Assistant</h3>
      </div>

      {/* Chat Messages */}
      <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-gray-500 text-sm text-center py-8">
            Ask me anything about your inventory!<br/>
            <span className="text-xs">
              Try: &quot;What items are low in stock?&quot; or &quot;Show top selling items&quot;
            </span>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg ${
              msg.type === 'user' 
                ? 'bg-blue-100 ml-12' 
                : msg.type === 'error'
                ? 'bg-red-100'
                : 'bg-gray-100 mr-12'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Loader className="w-4 h-4 animate-spin" />
            AI is thinking...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendQuery()}
          placeholder="Ask about inventory, sales, suppliers..."
          className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          disabled={loading}
        />
        <button
          onClick={sendQuery}
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mt-3 flex-wrap">
        {['Low stock items?', 'Top sellers?', 'Unreliable suppliers?'].map(quickQuery => (
          <button
            key={quickQuery}
            onClick={() => setQuery(quickQuery)}
            className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full"
          >
            {quickQuery}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AgentChatWidget;
