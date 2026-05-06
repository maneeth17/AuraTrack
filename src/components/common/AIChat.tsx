'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Send } from 'lucide-react';
import { generateChatResponse } from '@/app/actions';
import { useHabitStore } from '@/store/useHabitStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Input style is handled via CSS classes for theme compatibility

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const state = useHabitStore.getState();
      const { habits, logs } = state;
      const today = new Date().toISOString().split('T')[0];
      const completedToday = logs.filter(l => l.date === today && l.status === 'completed');

      const result = await generateChatResponse({
        message: input,
        habitContext: {
          habits: habits.map(h => ({
            title: h.title,
            completed: completedToday.some(l => l.habitId === h.id),
          })),
          completionPercentage: habits.length > 0 ? Math.round((completedToday.length / habits.length) * 100) : 0,
          totalXP: state.xp,
          level: state.level,
        }
      });

      const assistantMessage: Message = { role: 'assistant', content: result.message };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Chat error:', error);
      const errorMessage: Message = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-4 lg:bottom-4 lg:right-4 z-50 w-12 h-12 rounded-full bg-accent flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
      >
        <MessageSquare className="w-6 h-6 text-foreground" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 z-50 w-80 bg-surface border border-foreground/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-foreground/10">
              <h3 className="text-foreground font-semibold">AI Coach</h3>
              <button onClick={() => setIsOpen(false)} className="text-foreground/60 hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-64 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-foreground/40 text-sm text-center mt-8">Ask me anything about your habits!</p>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-accent text-foreground' 
                      : 'bg-foreground/10 text-foreground'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-foreground/10 rounded-lg p-3 text-sm text-foreground/60">Thinking...</div>
                </div>
              )}
            </div>
              <div className="p-4 border-t border-foreground/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about your habits..."
                    className="flex-1 border border-foreground/10 rounded-lg px-3 py-2 text-sm placeholder:text-foreground/30 focus:outline-none focus:border-accent/50"
                    style={{ 
                      backgroundColor: 'var(--background)',
                      color: 'var(--foreground)'
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="p-2 bg-accent text-foreground rounded-lg hover:bg-accent/80 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
