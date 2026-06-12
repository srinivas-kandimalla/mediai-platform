import React, { useState, useRef, useEffect } from 'react';
import { Bot, MessageSquare, Send, X, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

interface Msg {
  role: 'user' | 'bot';
  content: string;
  suggestedActions?: string[];
}

export const ChatbotWidget: React.FC = () => {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'bot',
      content: "Hello! I'm MediBot, your virtual clinical assistant. How can I help you today? You can check symptoms, ask about bookings, or get medication tips.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!user || user.role !== 'PATIENT') return null;

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg = textToSend;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await api.post('/ai/chatbot', {
        message: userMsg,
        userId: user.id,
      });

      if (res.data.success) {
        const { reply, suggestedActions } = res.data.data;
        setMessages((prev) => [
          ...prev,
          { role: 'bot', content: reply, suggestedActions },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          content: "I'm having trouble connecting to my diagnostic servers right now. Please book an appointment to discuss with a physician.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white p-4 rounded-full shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 animate-bounce"
        >
          <Bot className="h-6 w-6" />
          <span className="text-xs font-bold pr-1">Ask MediBot</span>
        </button>
      )}

      {/* Chat Window Popup */}
      {isOpen && (
        <div className="w-80 h-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-brand-600 px-4 py-3 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <Bot className="h-5 w-5 animate-pulse-subtle" />
              <div>
                <h4 className="text-xs font-bold tracking-wide">MediBot Assistant</h4>
                <span className="text-[9px] uppercase tracking-wider text-brand-100 font-semibold">Online & active</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Messages Scroll Box */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/20">
            {messages.map((msg, index) => (
              <div key={index} className="space-y-2">
                <div
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-brand-600 text-white rounded-tr-none'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>

                {/* Suggested Action Tags */}
                {msg.role === 'bot' && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 justify-start pl-2">
                    {msg.suggestedActions.map((action) => (
                      <button
                        key={action}
                        onClick={() => handleSend(action)}
                        className="px-2.5 py-1 rounded-full border border-brand-200 dark:border-brand-900 text-brand-600 dark:text-brand-400 text-[10px] font-semibold bg-brand-50/50 dark:bg-brand-950/20 hover:bg-brand-100/50 dark:hover:bg-brand-950/40 transition-colors"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none px-4 py-2 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messageEndRef} />
          </div>

          {/* Footer Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="border-t border-slate-100 dark:border-slate-800 p-2.5 flex gap-2 bg-white dark:bg-slate-900"
          >
            <input
              type="text"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white p-2 rounded-xl flex items-center justify-center transition-colors shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
