"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLingo } from '@/context/LingoContext';
import { FileText, Users, History, Languages, Loader2 } from 'lucide-react';

interface DocumentVersion {
  id: string;
  timestamp: number;
  editor: string;
  summary: string;
  content: string;
}

export default function DocumentEditor() {
  const { status, targetLanguage, sendMessage, messages } = useLingo();
  const [content, setContent] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [viewMode, setViewMode] = useState<'my-language' | 'side-by-side'>('my-language');
  const [originalContent, setOriginalContent] = useState('');
  const [originalLang, setOriginalLang] = useState('');
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeEditors, setActiveEditors] = useState<string[]>([]);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle incoming document updates
  useEffect(() => {
    const docMessages = messages.filter(msg => msg.id.startsWith('doc_'));
    if (docMessages.length > 0) {
      const latest = docMessages[docMessages.length - 1];
      setContent(latest.content);
      setIsTranslating(false);
    }
  }, [messages]);

  // Debounced content update
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setIsTranslating(true);

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      if (status === 'connected' && newContent.trim()) {
        // Send document edit through WebSocket
        sendMessage(JSON.stringify({
          docId: 'shared-doc-1',
          content: newContent
        }), 'doc_edit');
      }
    }, 300);
  }, [status, targetLanguage, sendMessage]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.textContent || '';
    handleContentChange(newContent);
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'my-language' ? 'side-by-side' : 'my-language');
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md z-10 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <FileText className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h1 className="font-bold tracking-tight">Shared Document</h1>
            <p className="text-xs text-zinc-500 font-mono">Real-time multilingual collaboration</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Active Editors */}
          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-full text-xs">
            <Users className="h-3 w-3 text-zinc-400" />
            <span>{activeEditors.length || 1} editing</span>
          </div>

          {/* View Mode Toggle */}
          <button
            onClick={toggleViewMode}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'side-by-side'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
            disabled={status !== 'connected'}
          >
            <Languages className="h-3 w-3" />
            {viewMode === 'my-language' ? 'My Language' : 'Side-by-Side'}
          </button>

          {/* Version History Toggle */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            <History className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {viewMode === 'my-language' ? (
            <div className="flex-1 p-6 overflow-y-auto">
              <div
                ref={editorRef}
                contentEditable={status === 'connected'}
                onInput={handleInput}
                className={`min-h-full p-4 rounded-lg bg-zinc-900 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-base leading-relaxed ${
                  status !== 'connected' ? 'opacity-50 cursor-not-allowed' : ''
                } ${!content ? 'before:content-[attr(data-placeholder)] before:text-zinc-600' : ''}`}
                data-placeholder="Start typing in your language..."
                suppressContentEditableWarning
              >
                {content}
              </div>
            </div>
          ) : (
            // Side-by-Side Mode
            <div className="flex-1 grid grid-cols-2 gap-4 p-6 overflow-y-auto">
              {/* Original Language */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2 px-2">
                  <span className="text-xs font-mono text-zinc-500 uppercase">Original ({originalLang || 'Detecting...'})</span>
                </div>
                <div className="flex-1 p-4 rounded-lg bg-zinc-900 border border-zinc-800 text-base leading-relaxed opacity-75">
                  {originalContent || content}
                </div>
              </div>

              {/* Your Language */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2 px-2">
                  <span className="text-xs font-mono text-zinc-500 uppercase">Your Language ({targetLanguage})</span>
                </div>
                <div className="flex-1 p-4 rounded-lg bg-zinc-900 border border-blue-800/50 text-base leading-relaxed">
                  {content}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <footer className="p-4 border-t border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <span className="text-zinc-600 font-mono uppercase tracking-tighter">
                  Translated via Lingo.dev MCP
                </span>
                {isTranslating && (
                  <div className="flex items-center gap-2 text-blue-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Translating...</span>
                  </div>
                )}
              </div>
              <div className="text-zinc-600">
                {status === 'connected' ? 'Connected' : 'Connecting...'}
              </div>
            </div>
          </footer>
        </div>

        {/* Version History Sidebar */}
        {showHistory && (
          <div className="w-80 border-l border-zinc-800 bg-zinc-900/50 flex flex-col">
            <div className="p-4 border-b border-zinc-800">
              <h2 className="font-bold text-sm">Version History</h2>
              <p className="text-xs text-zinc-500 mt-1">All summaries translated for you</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {versions.length === 0 ? (
                <div className="text-center text-zinc-600 text-sm py-8">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No versions yet</p>
                  <p className="text-xs mt-1">Edits will be auto-saved</p>
                </div>
              ) : (
                versions.map((version) => (
                  <div
                    key={version.id}
                    className="p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 cursor-pointer transition-colors"
                    onClick={() => setContent(version.content)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-zinc-400">
                        {new Date(version.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-xs text-zinc-500">{version.editor}</span>
                    </div>
                    <p className="text-sm text-zinc-300">{version.summary}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
