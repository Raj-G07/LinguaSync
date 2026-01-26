"use client";

import React, { useEffect, useState } from 'react';
import { useLingo } from '@/context/LingoContext';
import { AlertTriangle } from 'lucide-react';

export default function LinguaGuard({ children }: { children: React.ReactNode }) {
  const { status } = useLingo();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // RSC/SSR Safety: Render neutral shell until hydrated
  if (!mounted) {
    return <div className="fixed inset-0 bg-zinc-950" aria-hidden="true" />;
  }

  // SYSTEM LOCKDOWN: Only on true MCP error
  if (status === 'error') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-red-950/90 text-white p-8 animate-in fade-in duration-500">
        <AlertTriangle className="h-24 w-24 mb-6 text-red-500" />
        <h1 className="text-4xl font-bold mb-4 font-mono tracking-tighter text-center uppercase">SYSTEM LOCKDOWN</h1>
        <p className="text-xl max-w-2xl text-center mb-8 font-mono opacity-80 leading-relaxed">
          Lingo.dev Translation Services are unreachable.
          <br />
          Communication is strictly blocked to prevent raw text leakage.
        </p>
        <div className="bg-black/40 p-5 rounded-lg border border-red-500/20 font-mono text-xs space-y-1">
          <div className="flex gap-2"><span className="text-red-500">CODE:</span> <span>LINGO_MCP_UNREACHABLE</span></div>
          <div className="flex gap-2"><span className="text-red-500">SECURITY:</span> <span>STRICT_BLOCK_ACTIVE</span></div>
        </div>
      </div>
    );
  }

  // UI Ready: Render children immediately
  // Input will be disabled by ChatUI until status === 'connected'
  return <>{children}</>;
}
