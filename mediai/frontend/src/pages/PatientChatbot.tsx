import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Trash2, HelpCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/CustomComponents';

interface Msg {
  role: 'user' | 'bot';
  content: string;
  suggestedActions?: string[];
}

export const PatientChatbot: React.FC = () => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'bot',
      content: "Welcome to MediBot Portal. Ask me about symptoms, physical wellness, doctor visit scheduling, or how to locate ICU beds.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (msgText: string) => {
    if (!msgText.trim() || isLoading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: msgText }]);
    setIsLoading(true);

    try {
      const res = await api.post('/ai/chatbot', {
        message: msgText,
        userId: user?.id,
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
          content: 'MediBot service is temporarily unavailable. Please consult an active clinician for assistance.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'bot',
        content: 'Chat session reset. How can I assist you now?',
      },
    ]);
  };

  const prompts = [
    'Check cardiovascular symptoms',
    'How do I schedule an appointment?',
    'What are normal blood glucose ranges?',
    'Check emergency alerts guidelines',
  ];

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col md:flex-row gap-6">
      {/* Suggestions panel */}
      <div className="w-full md:w-80 shrink-0 space-y-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <HelpCircle className="h-5 w-5 text-brand-600" />
            <CardTitle className="text-sm">Prompt Suggestions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {prompts.map((p) => (
              <button
                key={p}
                onClick={() => handleSend(p)}
                className="w-full text-left p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/40 text-xs font-semibold hover:border-brand-500 hover:text-brand-500 transition-all leading-normal"
              >
                💡 {p}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <button
              onClick={clearChat}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border border-red-200 dark:border-red-900/40 text-clinical-rose hover:bg-red-50 dark:hover:bg-red-950/20 transition-all shadow-sm"
            >
              <Trash2 className="h-4 w-4" />
              Clear Conversation
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Main chat layout */}
      <Card className="flex-1 flex flex-col h-full overflow-hidden p-0">
        {/* Chat window header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-brand-50 dark:bg-brand-950/40 p-2.5 rounded-full text-brand-600 dark:text-brand-400">
              <Bot className="h-5.5 w-5.5 animate-pulse-subtle" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">MediBot Fullscreen Dialogue</h3>
              <p className="text-[10px] text-slate-450 mt-0.5">Rule-based NLP and OpenAI GPTEngine Fallbacks</p>
            </div>
          </div>
        </div>

        {/* Messages box */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20 dark:bg-slate-950/10">
          {messages.map((m, idx) => (
            <div key={idx} className="space-y-2.5">
              <div className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                    m.role === 'user'
                      ? 'bg-brand-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-tl-none'
                  }`}
                >
                  {m.content}
                </div>
              </div>

              {m.role === 'bot' && m.suggestedActions && m.suggestedActions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 justify-start pl-2">
                  {m.suggestedActions.map((act) => (
                    <button
                      key={act}
                      onClick={() => handleSend(act)}
                      className="px-3 py-1 rounded-full border border-brand-200 dark:border-brand-900/40 text-brand-600 dark:text-brand-400 text-[10px] font-semibold bg-brand-50/50 dark:bg-brand-950/20 hover:bg-brand-100 transition-colors"
                    >
                      {act}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none px-4.5 py-2.5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 bg-white dark:bg-slate-900 shrink-0"
        >
          <input
            type="text"
            placeholder="Type your medical query or symptoms here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 text-xs px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-5 rounded-xl font-bold flex items-center justify-center transition-colors shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </Card>
    </div>
  );
};
