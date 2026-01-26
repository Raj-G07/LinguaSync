"use client";

import { useLingo } from "@/context/LingoContext";
import { LingoStatus } from "@lingo.dev/sdk";
import React, { useState, useEffect, useRef } from "react";

// --- Icon Components (self-contained to avoid external dependencies) ---

const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const MessageSquareIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const SendIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);

// --- Language Data ---
const LANGUAGES = [
  { code: "en-US", name: "English" },
  { code: "fr-FR", name: "French" },
  { code: "ja-JP", name: "Japanese" },
  { code: "es-ES", name: "Spanish" },
];

// --- UI Sub-components ---

const StatusIndicator = ({ status }: { status: LingoStatus }) => {
  const statusConfig = {
    connecting: { text: "Connecting...", color: "bg-yellow-500" },
    connected: { text: "Connected", color: "bg-emerald-500" },
    disconnected: { text: "Disconnected", color: "bg-zinc-500" },
    error: { text: "Connection Error", color: "bg-red-500" },
  };
  const { text, color } = statusConfig[status] || statusConfig.disconnected;

  return (
    <div className="flex items-center gap-2 text-sm text-zinc-400">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span>{text}</span>
    </div>
  );
};

const LanguageSelector = () => {
  const { targetLanguage, setLanguage, status } = useLingo();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLanguage =
    LANGUAGES.find((l) => l.code === targetLanguage) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (langCode: string) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={status !== "connected"}
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span>{selectedLanguage.name}</span>
        <ChevronDownIcon className="w-4 h-4 text-zinc-400" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-zinc-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
          <div className="py-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className="w-full text-left block px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ChatHeader = () => {
  const { status } = useLingo();
  return (
    <header className="flex items-center justify-between h-16 px-4 sm:px-6 border-b border-zinc-800 bg-zinc-950/70 backdrop-blur-sm sticky top-0 z-10 flex-shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-zinc-100">LinguaSync</h1>
        <StatusIndicator status={status} />
      </div>
      <LanguageSelector />
    </header>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 p-8">
    <MessageSquareIcon className="w-12 h-12 mb-4 text-zinc-600" />
    <h2 className="text-lg font-medium text-zinc-300">
      Your conversation starts here
    </h2>
    <p className="text-sm mt-1 max-w-xs mx-auto">
      Send a message in your selected language to begin.
    </p>
  </div>
);

const MessageList = () => {
  const { messages } = useLingo();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {messages.map((msg) => (
        <div key={msg.id} className="flex flex-col items-start">
          <div className="text-xs text-emerald-400 mb-1 font-medium">
            {msg.sender}
          </div>
          <div className="rounded-lg bg-zinc-800 px-4 py-2.5 max-w-[85%] sm:max-w-[75%]">
            <p className="text-zinc-100 whitespace-pre-wrap break-words">
              {msg.content}
            </p>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

const MessageInput = () => {
  const [content, setContent] = useState("");
  const { sendMessage, status } = useLingo();

  const canSend = content.trim().length > 0 && status === "connected";

  const doSendMessage = () => {
    if (canSend) {
      sendMessage(content.trim());
      setContent("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSendMessage();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      doSendMessage();
    }
  };

  return (
    <div className="px-4 sm:px-6 py-3 bg-zinc-950/70 backdrop-blur-sm border-t border-zinc-800 flex-shrink-0">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <input
          type="text"
          value={content}
          onChange={(e) =>
            e.target.value.length < 2048 && setContent(e.target.value)
          }
          onKeyDown={handleKeyPress}
          placeholder="Type your message..."
          className="flex-1 bg-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-transparent"
          disabled={status !== "connected"}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send message"
          className="bg-emerald-600 text-white rounded-full p-2.5 flex items-center justify-center hover:bg-emerald-700 transition-colors disabled:bg-zinc-700 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-emerald-500"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </form>
      <p className="text-xs text-zinc-500 text-center pt-3">
        Translations secured via Lingo.dev
      </p>
    </div>
  );
};

/**
 * A clean, professional chat UI for real-time translated conversations.
 *
 * Features:
 * - Dark theme with emerald/teal accents.
 * - Header with branding, connection status, and language selector.
 * - Scrollable message list with an inviting empty state.
 * - Sleek message input with 'Enter' to send and disabled states.
 * - Subtle footer with security information.
 * - Built with Tailwind CSS for a modern, responsive design.
 */
export default function ChatUI() {
  return (
    <div className="flex flex-col h-full bg-zinc-900 text-zinc-100 rounded-lg overflow-hidden border border-zinc-800 shadow-2xl shadow-black/30">
      <ChatHeader />
      <main className="flex-1 overflow-y-auto">
        <MessageList />
      </main>
      <MessageInput />
    </div>
  );
}
