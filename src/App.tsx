/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  User, 
  Bot, 
  RotateCcw, 
  MessageSquare, 
  Sparkles, 
  Headphones, 
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Halo! Saya Lumina, asisten virtual Customer Service Anda. Ada yang bisa saya bantu hari ini?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Lazy initialization of Gemini
  const googleAI = useMemo(() => {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") return null;
    return new GoogleGenAI({ apiKey: key });
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    if (!googleAI) {
      const errorMessage: Message = {
        id: 'no-api-key-' + Date.now(),
        role: 'model',
        text: '⚠️ **Konfigurasi Diperlukan**: Silakan atur `GEMINI_API_KEY` di panel Secrets AI Studio agar chatbot bisa merespons.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'user',
        text: input,
        timestamp: new Date(),
      }, errorMessage]);
      setInput('');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

      // Add the current user message to history
      history.push({
        role: 'user',
        parts: [{ text: input }]
      });

      const response = await googleAI!.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: history,
        config: {
          systemInstruction: "Anda adalah Lumina, agen Customer Service profesional dari perusahaan fiktif bernama 'Lumina Hub'. Gunakan bahasa Indonesia yang ramah, sopan, dan solutif. Jika ditanya hal teknis yang tidak Anda ketahui, arahkan pelanggan untuk menghubungi staf manusia kami di help@luminahub.com. Berikan jawaban yang ringkas namun informatif.",
          temperature: 0.7,
        },
      });

      const responseText = response.text;

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || 'Maaf, saya tidak mendapatkan respons yang jelas. Bisa ulangi?',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("AI Error:", error);
      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        role: 'model',
        text: 'Maaf, saya mengalami kendala teknis saat memproses pesan Anda. Coba lagi dalam beberapa saat.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        role: 'model',
        text: 'Chat telah direset. Ada lagi yang bisa saya bantu?',
        timestamp: new Date(),
      }
    ]);
  };

  return (
    <div className="flex h-screen bg-brand-bg text-white font-sans relative overflow-hidden">
      {/* Background Blobs */}
      <div className="gradient-mesh">
        <div className="mesh-blob blob-1" />
        <div className="mesh-blob blob-2" />
      </div>

      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex w-72 flex-col glass-dark p-6 border-r border-white/5 z-10">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2 bg-gradient-to-tr from-violet-600 to-indigo-500 rounded-xl shadow-lg shadow-violet-500/20">
            <Headphones size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Lumina Hub</h1>
        </div>

        <div className="flex-1 space-y-6">
          <div>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Quick Actions</p>
            <button 
              onClick={resetChat}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-sm group"
            >
              <div className="flex items-center gap-2">
                <RotateCcw size={16} className="text-white/60 group-hover:text-white transition-colors" />
                <span className="text-white/80 group-hover:text-white">Mulai Ulang Chat</span>
              </div>
              <ChevronRight size={14} className="text-white/20" />
            </button>
          </div>

          <div>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Support Resources</p>
            <ul className="space-y-1">
              <li 
                onClick={() => {
                  if (!isTyping) {
                    const text = "Tolong berikan informasi Pusat Bantuan";
                    setInput(text);
                    // We need to trigger the sequence
                    setTimeout(() => {
                      const sendBtn = document.getElementById('send-button');
                      sendBtn?.click();
                    }, 50);
                  }
                }}
                className="flex items-center gap-3 text-sm text-white/60 hover:text-white transition-colors cursor-pointer p-2.5 rounded-xl hover:bg-white/5 group"
              >
                <Info size={16} className="group-hover:text-blue-400 transition-colors" />
                <span>Pusat Bantuan</span>
              </li>
              <li 
                onClick={() => {
                  if (!isTyping) {
                    const text = "Saya ingin berbicara dengan staf manusia";
                    setInput(text);
                    setTimeout(() => {
                      const sendBtn = document.getElementById('send-button');
                      sendBtn?.click();
                    }, 50);
                  }
                }}
                className="flex items-center gap-3 text-sm text-white/60 hover:text-white transition-colors cursor-pointer p-2.5 rounded-xl hover:bg-white/5 group"
              >
                <MessageSquare size={16} className="group-hover:text-emerald-400 transition-colors" />
                <span>Hubungi Manusia</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-auto pt-6">
          <div className="bg-gradient-to-br from-indigo-600/10 to-violet-600/10 p-4 rounded-2xl border border-indigo-500/20">
            <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider mb-1.5">Butuh bantuan?</p>
            <p className="text-xs text-white/60 leading-relaxed">Agen kami tersedia 24/7 untuk membantu Anda.</p>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <header className="h-20 px-8 flex items-center justify-between glass-dark border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
                <Bot size={22} className="text-violet-400" />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-brand-bg"></div>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">Lumina Assistant</h2>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">{isTyping ? 'Sedang Mengetik...' : 'Online'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-all hidden sm:block">
              <ExternalLink size={20} />
            </button>
          </div>
        </header>

        {/* Messages Container */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scroll-smooth"
        >
          <div className="flex justify-center mb-8">
            <span className="px-4 py-1.5 bg-white/5 backdrop-blur-sm rounded-full text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold border border-white/5">HARI INI</span>
          </div>

          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div className={`mt-1 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-white/10 ${
                  msg.role === 'user' ? 'bg-white/10' : 'bg-violet-600/20'
                }`}>
                  {msg.role === 'user' ? (
                    <span className="text-[10px] font-bold text-white/80">USER</span>
                  ) : (
                    <span className="text-[10px] font-bold text-violet-400">AI</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className={`px-4 py-3 rounded-2xl shadow-xl ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-none shadow-indigo-500/20' 
                      : 'glass text-white/90 rounded-tl-none border border-white/10 shadow-black/40'
                  }`}>
                    <div className="markdown-body">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  </div>
                  <span className={`text-[10px] text-white/30 font-bold tracking-widest px-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-4 items-center mr-auto"
              >
                <div className="h-8 w-8 rounded-lg bg-violet-600/20 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <Bot size={14} className="text-violet-400 animate-pulse" />
                </div>
                <div className="flex gap-1.5 p-4 glass rounded-2xl rounded-tl-none border border-white/10 shadow-xl">
                  <div className="h-1.5 w-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="h-1.5 w-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="h-1.5 w-1.5 bg-violet-400 rounded-full animate-bounce" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-8 pt-0 mt-auto">
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#12141C] border border-white/10 rounded-2xl shadow-2xl overflow-hidden focus-within:ring-2 focus-within:ring-violet-500/50 transition-all flex items-end px-4 py-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ketik pesan Anda di sini..."
                rows={1}
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-white px-2 placeholder-white/20 resize-none min-h-[40px] max-h-32 py-2"
              />
              <div className="flex gap-2 items-center mb-1">
                <button
                  id="send-button"
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className={`p-2.5 rounded-xl transition-all shadow-lg shrink-0 ${
                    !input.trim() || isTyping 
                    ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                    : 'bg-violet-600 text-white hover:bg-violet-500 shadow-violet-600/30 active:scale-95'
                  }`}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
            <p className="text-center text-[9px] text-white/20 mt-4 font-bold uppercase tracking-[0.3em]">
              TERPROTEKSI OLEH LUMINA SECURE GATEWAY
            </p>
          </div>
        </div>
      </main>
    </div>
  );

}
