"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useLingo } from '@/context/LingoContext';
import { Send, Globe, MessageSquare, Mic, Loader2 } from 'lucide-react';
import VoiceInterface from './VoiceInterface';

export default function ChatUI() {
  const { messages, sendMessage, targetLanguage, setLanguage, status } = useLingo();
  const [input, setInput] = useState('');
  const [showVoice, setShowVoice] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('[ChatUI] input:', value);
    setInput(value);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || status !== 'connected') return;

    const messageText = input.trim();
    setInput(''); // Clear immediately
    setIsSending(true);

    console.log('[ChatUI] → Sending message:', messageText);
    
    try {
      sendMessage(messageText);
      // Wait a moment for backend processing
      setTimeout(() => setIsSending(false), 500);
    } catch (err) {
      console.error('[ChatUI] Send failed:', err);
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  };

  const canSend = input.trim().length > 0 && status === 'connected' && !isSending;

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <MessageSquare className="h-5 w-5 text-emerald-500" />
          </div>
          <h1 className="font-bold tracking-tight text-lg">LinguaSync <span className="text-xs text-zinc-500 font-mono italic font-normal">beta</span></h1>
          {status === 'connecting' && (
            <span className="text-xs text-zinc-500 font-mono animate-pulse ml-2 leading-none">Connecting...</span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowVoice(!showVoice)}
            className={`p-2 rounded-lg transition-colors ${showVoice ? 'bg-blue-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}
            disabled={status !== 'connected'}
            title="Voice Translation"
          >
            <Mic className="h-4 w-4" />
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-full text-xs font-mono">
             <div className={`h-2 w-2 rounded-full ${status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
             {status === 'connected' ? 'Lingo.dev Enabled' : 'Connecting...'}
          </div>
          
          <div className="flex items-center gap-2 bg-zinc-800 p-1.5 rounded-lg border border-zinc-700/50">
            <Globe className="h-4 w-4 ml-1 text-zinc-400" />
            <select 
              value={targetLanguage}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer pr-8 py-0"
              disabled={status !== 'connected'}
            >
              <option value="en-US">English (US)</option>
              <option value="fr-FR">Français</option>
              <option value="ja-JP">日本語</option>
              <option value="es-ES">Español</option>
              <option value="de-DE">Deutsch</option>
            </select>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !showVoice && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2">
               <MessageSquare className="h-12 w-12 opacity-20" />
               <p className="text-sm font-mono italic">Send a message to start translating...</p>
               <p className="text-xs text-zinc-600">All messages are translated via Lingo.dev MCP</p>
            </div>
          )}
          
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-zinc-500">{msg.sender}</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest">Translated</span>
              </div>
              <div className="max-w-[85%] p-3 rounded-2xl bg-zinc-800 border border-zinc-700/50 shadow-xl">
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex items-center gap-2 text-zinc-500 text-xs">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Translating via Lingo.dev...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Voice Overlay */}
        {showVoice && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm z-20">
             <div className="relative">
                <button 
                  onClick={() => setShowVoice(false)}
                  className="absolute -top-4 -right-4 bg-zinc-800 p-1 rounded-full text-zinc-400 hover:text-white"
                >
                  <Send className="h-4 w-4 rotate-45" />
                </button>
                <VoiceInterface />
             </div>
          </div>
        )}
      </div>

      {/* Input */}
      <footer className="p-4 border-t border-zinc-800 bg-zinc-900/50">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={status === 'connected' ? "Type a message (will be translated)..." : "Waiting for connection..."}
            className="flex-1 bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all disabled:opacity-50"
            disabled={status !== 'connected'}
            autoFocus
          />
          <button 
            type="submit"
            disabled={!canSend}
            className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </form>
        <div className="mt-2 text-center flex flex-col items-center gap-1">
            <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-tighter text-nowrap">
                Securely routed via Lingo.dev MCP context layer
            </p>
            {process.env.NODE_ENV === 'development' && (
              <div className="text-[8px] font-mono text-zinc-600">
                  {messages.length} messages • {status}
              </div>
            )}
        </div>
      </footer>
    </div>
  );
}
