"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {LingoStatus } from '@lingo.dev/sdk';

interface Message {
  id: string;
  sender: string;
  content: string;
}

interface LingoState {
  status: LingoStatus;
  targetLanguage: string;
  mcpSessionId: string | null;
  messages: Message[];
}

interface LingoContextType extends LingoState {
  sendMessage: (content: string, type?: string) => void;
  setLanguage: (lang: string) => void;
  socketId: string | null;
}

const LingoContext = createContext<LingoContextType | undefined>(undefined);

const WS_URL = process.env.NEXT_PUBLIC_LINGO_WS_URL!;

export function LingoProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<LingoStatus>('connecting');
  const [targetLanguage, setTargetLanguage] = useState<string>('en-US'); 
  const [mcpSessionId, setMcpSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [socketId, setSocketId] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const currentLangRef = useRef<string>('en-US');
  const isConnectingRef = useRef<boolean>(false);

  // Update ref when language changes
  useEffect(() => {
    currentLangRef.current = targetLanguage;
  }, [targetLanguage]);

  // Create WebSocket ONCE with StrictMode protection
  useEffect(() => {
    // Guard against duplicate creation (StrictMode double-mount)
    if (isConnectingRef.current || socketRef.current) {
      console.log('[LingoClient] WebSocket already exists, skipping creation');
      return;
    }

    isConnectingRef.current = true;
    console.log('[LingoClient] ═══ WebSocket created ═══');
    
    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    const timeoutId = setTimeout(() => {
      console.error('[LingoClient] ✗ MCP_READY timeout');
      setStatus('error');
      socket.close();
    }, 10000);

    socket.onopen = () => {
      console.log('[LingoClient] ✓ WebSocket connected - waiting for MCP_READY');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[LingoClient] ← Received:', JSON.stringify(data));

        switch (data.type) {
          case 'INIT':
          setSocketId(data.socketId);
          break;
          case 'MCP_READY':
            clearTimeout(timeoutId);
            console.log('[LingoClient] ✓ MCP_READY received');
            setStatus('connected');
            setMcpSessionId('sess_' + Math.random().toString(36).substr(2, 9));
            // Send initial join
            socket.send(JSON.stringify({ type: 'join', lang: currentLangRef.current }));
            console.log('[LingoClient] → Sent initial join');
            break;

          case 'MCP_ERROR':
            clearTimeout(timeoutId);
            console.error('[LingoClient] ✗ MCP_ERROR received');
            setStatus('error');
            break;

          case 'JOIN_CONFIRMED':
            console.log('[LingoClient] ✓ Join confirmed:', data.lang);
            break;

          case 'msg':
            setMessages(prev => [...prev, {
              id: data.id,
              sender: data.sender,
              content: data.content
            }]);
            break;
        }
      } catch (e) {
        console.error('[LingoClient] ✗ Parse error:', e);
      }
    };

    socket.onerror = (err) => {
      clearTimeout(timeoutId);
      console.error('[LingoClient] ✗ WebSocket error:', err);
      setStatus('error');
    };

    socket.onclose = () => {
      clearTimeout(timeoutId);
      console.log('[LingoClient] WebSocket closed');
      socketRef.current = null;
      isConnectingRef.current = false;
      setStatus('disconnected');
    };

    // Cleanup on unmount
    return () => {
      clearTimeout(timeoutId);
      console.log('[LingoClient] Cleaning up WebSocket');
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
      isConnectingRef.current = false;
    };
  }, []); // EMPTY dependency array - socket created ONCE

  const sendMessage = (content: string, type: string = 'chat') => {
    console.log(`[LingoClient] sendMessage (${type}):`, content);
    console.log('[LingoClient] Socket state:', socketRef.current?.readyState);
    
    if (socketRef.current?.readyState === WebSocket.OPEN && status === 'connected') {
      const payload = { type, content };
      console.log('[LingoClient] → WS send:', JSON.stringify(payload));
      socketRef.current.send(JSON.stringify(payload));
    } else {
      console.error('[LingoClient] ✗ Cannot send - socket not ready or MCP not connected');
    }
  };

  const setLanguage = (lang: string) => {
    setTargetLanguage(lang);
    if (socketRef.current?.readyState === WebSocket.OPEN && status === 'connected') {
      socketRef.current.send(JSON.stringify({ type: 'join', lang }));
      console.log('[LingoClient] → Language update:', lang);
    }
  };

  // Debug status changes
  useEffect(() => {
    console.log('[LingoClient] Status:', status);
  }, [status]);

  return (
    <LingoContext.Provider value={{ 
      status, 
      targetLanguage, 
      mcpSessionId, 
      messages, 
      socketId,
      sendMessage,
      setLanguage
    }}>
      {children}
    </LingoContext.Provider>
  );
}

export function useLingo() {
  const context = useContext(LingoContext);
  if (context === undefined) {
    throw new Error('useLingo must be used within a LingoProvider');
  }
  return context;
}
