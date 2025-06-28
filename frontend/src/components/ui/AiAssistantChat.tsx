import { useState } from 'react';
import { apiService, AiAssistantResponse } from '../../services/api';
import React from 'react';

interface AiAssistantChatProps {
  context?: any;
  suggestedQuestions?: string[];
  title?: string;
  description?: string;
  styleVariant?: 'default' | 'card';
}

function renderMarkdown(text: string) {
  // Convierte **texto** en <strong>texto</strong>
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Convierte * texto de lista
  formatted = formatted.replace(/\n\* /g, '\n• ');
  // Convierte saltos de línea dobles en <br/><br/>
  formatted = formatted.replace(/\n{2,}/g, '<br/><br/>');
  // Convierte saltos de línea simples en <br/>
  formatted = formatted.replace(/\n/g, '<br/>');
  return formatted;
}

export function AiAssistantChat({
  context = {},
  suggestedQuestions = [
    '¿Por qué el modelo marcó este proveedor como posible fraude?',
    '¿Qué patrones sugieren actividad sospechosa?',
    '¿Cómo se compara este proveedor con otros?',
    '¿Qué métricas específicas contribuyeron más?'
  ],
  title = 'AI Fraud Analysis Assistant',
  description = 'This assistant analyzes fraud results and provides intelligent insights about patterns and risk factors.',
  styleVariant = 'default',
}: AiAssistantChatProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (msg?: string) => {
    const userMsg = msg || input;
    if (!userMsg.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);
    setError(null);
    try {
      const history = messages.slice(-9).concat({ role: 'user', text: userMsg });
      const res: AiAssistantResponse = await apiService.aiAssistantChat(userMsg, { ...context, history });
      setMessages((prev) => [...prev, { role: 'assistant', text: res.response }]);
    } catch (e: any) {
      const errorMsg = e.message || 'Error communicating with the AI assistant. Please try again later.';
      setMessages((prev) => [...prev, { role: 'assistant', text: errorMsg }]);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-xl p-4 mt-8 ${styleVariant === 'card' ? 'bg-purple-50 border border-purple-200' : 'bg-blue-50'}`}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 400, maxHeight: 700 }}>
      <div className="flex items-center mb-2">
        <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full mr-2">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M6.05 17.95l-1.414 1.414m12.728 0l-1.414-1.414M6.05 6.05L4.636 4.636" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
        <div>
          <div className="font-semibold text-purple-900">{title}</div>
          <div className="text-xs text-gray-500">{description}</div>
        </div>
      </div>
      <div className="mb-2">
        <div className="flex flex-wrap gap-2 mb-2">
          {suggestedQuestions.map((q, i) => (
            <button
              key={i}
              className="bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs px-3 py-1 rounded-full transition"
              onClick={() => handleSend(q)}
              disabled={loading}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
      {/* Chat area y input en layout fijo */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="bg-white rounded-lg border border-gray-200 p-3 min-h-[250px] max-h-[400px] md:min-h-[350px] md:max-h-[600px] overflow-y-auto mb-2 text-sm" style={{ flex: 1, minHeight: 0 }}>
          {messages.length === 0 && (
            <div className="text-gray-400">Ask a question about medical fraud or select a suggestion!</div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              {msg.role === 'assistant' ? (
                <p className="bg-purple-50 text-purple-900 px-3 py-2 rounded-lg whitespace-pre-line leading-relaxed text-base text-justify" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text.trim()) }} />
              ) : (
                <span className="inline-block px-2 py-1 rounded-lg bg-blue-100 text-blue-900">{msg.text}</span>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-purple-400 animate-pulse mt-2">
              <span className="w-3 h-3 rounded-full bg-purple-300 animate-bounce"></span>
              <span className="w-3 h-3 rounded-full bg-purple-300 animate-bounce delay-150"></span>
              <span className="w-3 h-3 rounded-full bg-purple-300 animate-bounce delay-300"></span>
              <span>The assistant is typing...</span>
            </div>
          )}
        </div>
        <form
          className="flex gap-2"
          style={{ marginTop: 0 }}
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
        >
          <textarea
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
            placeholder="Type your question about medical fraud..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            rows={2}
            maxLength={500}
            style={{ minHeight: 40, maxHeight: 60, overflow: 'auto' }}
          />
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            disabled={loading || !input.trim()}
          >Send</button>
        </form>
        {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
      </div>
    </div>
  );
} 