"use client";

import { useLingo } from "@/context/LingoContext";
import { LingoStatus } from "@lingo.dev/sdk";
import React, { useState, useEffect, useRef } from "react";
import { LanguageIcon } from "../ui/language";
import { PaperAirplaneIcon } from "../ui/paper-airplane";
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
    connected: { text: "Connected", color: "bg-[#69e300]" },
    disconnected: { text: "Disconnected", color: "bg-zinc-500" },
    error: { text: "Connection Error", color: "bg-red-500" },
  };
  const { text, color } = statusConfig[status] || statusConfig.disconnected;

  return (
    <div className="flex items-center gap-2 text-sm text-zinc-500">
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
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#69e300]"
      >
        <span>{selectedLanguage.name}</span>
        <ChevronDownIcon className="w-4 h-4 text-zinc-500" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-zinc-900 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
          <div className="py-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className="w-full text-left block px-4 py-2 text-sm text-zinc-300 hover:bg-[#69e300]/20 hover:text-zinc-100 transition-colors"
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
    <header className="flex items-center justify-between h-16 px-4 sm:px-6 border-b border-zinc-900 bg-[#0a0a0a]/60 backdrop-blur-sm sticky top-0 z-10 flex-shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-zinc-100">LinguaSync</h1>
        <div className="w-1.5 h-1.5 rounded-full bg-[#69e300]"></div>
      </div>
      <div className="flex items-center gap-4">
        <StatusIndicator status={status} />
        <LanguageSelector />
      </div>
    </header>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 p-8">
    <MessageSquareIcon className="w-12 h-12 mb-4 text-[#69e300]/40" />
    <h2 className="text-lg font-medium text-zinc-300">
      Your conversation starts here
    </h2>
    <p className="text-sm mt-1 max-w-xs mx-auto text-zinc-400">
      Send a message in your selected language to begin.
    </p>
  </div>
);

const MessageList = () => {
  const { messages, socketId } = useLingo();
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
        <div
          key={msg.id}
          className={`flex flex-col ${
            msg.sender !== socketId ? "items-start" : "items-end"
          }`}
        >
          <div className={`text-xs ${msg.sender !== socketId ? "text-[#69e300]" : "text-zinc-400"} mb-1 font-medium`}>
            {msg.sender === socketId ? "You" : msg.sender}
          </div>
          <div
            className={`rounded-2xl max-w-[75%] ${msg.sender === socketId ? `bg-[#69e300] rounded-tr-sm` : `bg-zinc-900 rounded-tl-sm`} px-4 py-2.5 max-w-[85%] sm:max-w-[75%]`}
          >
            <p
              className={`${msg.sender === socketId ? "text-black" : "text-zinc-200"} whitespace-pre-wrap break-words`}
            >
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
    <div className="px-4 sm:px-6 py-3 bg-[#0a0a0a]/60 backdrop-blur-sm border-t border-zinc-900 flex-shrink-0">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={content}
            onChange={(e) =>
              e.target.value.length < 2048 && setContent(e.target.value)
            }
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="w-full bg-zinc-900 rounded-lg pl-4 pr-10 py-2.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#69e300] border border-transparent"
            disabled={status !== "connected"}
            autoComplete="off"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400">
            <LanguageIcon size={20} />
          </div>
        </div>
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send message"
          className="bg-[#69e300] text-black rounded-full p-2 flex items-center justify-center hover:bg-[#7fed1a] transition-colors disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[#69e300]"
        >
          <PaperAirplaneIcon />
        </button>
      </form>
      <div className="flex items-center justify-center gap-2 text-xs text-zinc-600 text-center pt-3">
        <div className="w-1.5 h-1.5 rounded-full bg-[#69e300]/50"></div>
        <span>Secured & translated via Lingo.dev</span>
      </div>
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
    <div className="flex flex-col h-full bg-[#0a0a0a] text-zinc-200 rounded-lg overflow-hidden border border-zinc-900 shadow-2xl shadow-black/30">
      <ChatHeader />
      <main
        className={`
        flex-1 overflow-y-auto
        [&::-webkit-scrollbar]:w-[6px]
        [&::-webkit-scrollbar-thumb]:bg-[#6ae300e1]
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar:horizontal]:h-[4px]
  `}
      >
        <MessageList />
      </main>
      <MessageInput />
    </div>
  );
}
