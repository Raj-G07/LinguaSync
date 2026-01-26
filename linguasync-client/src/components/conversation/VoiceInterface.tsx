"use client";

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Loader2, Languages } from 'lucide-react';
import { useLingo } from '@/context/LingoContext';

export default function VoiceInterface() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  
  const { targetLanguage } = useLingo();

  const toggleMic = () => {
    if (!isListening) {
      setIsListening(true);
      simulateVoiceFlow();
    } else {
      setIsListening(false);
      resetFlow();
    }
  };

  const simulateVoiceFlow = async () => {
    // 1. Listening Phase (STT)
    console.log('[Voice] Capture started. Sending Opus stream to Lingo.dev...');
    
    // Simulate interim transcript returned from Lingo.dev
    setTimeout(() => setInterimTranscript('How are you doing today?'), 1000);
    
    // 2. Processing Phase (Translation + TTS generation)
    setTimeout(() => {
      setIsListening(false);
      setIsProcessing(true);
      console.log('[Voice] Context analysis & translation in progress...');
    }, 3000);

    // 3. Playback Phase (TTS)
    setTimeout(() => {
      setIsProcessing(false);
      setIsSpeaking(true);
      console.log(`[Voice] Playing synthesized ${targetLanguage} audio stream...`);
    }, 5000);

    // 4. Reset
    setTimeout(() => {
      setIsSpeaking(false);
      setInterimTranscript('');
    }, 8000);
  };

  const resetFlow = () => {
    setIsListening(false);
    setIsProcessing(false);
    setIsSpeaking(false);
    setInterimTranscript('');
  };

  return (
    <div className="flex flex-col items-center bg-zinc-900/80 border border-zinc-800 p-6 rounded-3xl shadow-2xl backdrop-blur-xl max-w-sm w-full">
      <div className="relative mb-8">
        {/* Active Ring */}
        {(isListening || isSpeaking) && (
          <div className={`absolute -inset-4 rounded-full opacity-20 animate-ping ${isListening ? 'bg-emerald-500' : 'bg-blue-500'}`} />
        )}
        
        <button 
          onClick={toggleMic}
          className={`relative h-20 w-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
            isListening ? 'bg-emerald-600' : 'bg-zinc-800 hover:bg-zinc-700'
          }`}
        >
          {isListening ? <Mic className="h-8 w-8 text-white" /> : <MicOff className="h-8 w-8 text-zinc-400" />}
        </button>
      </div>

      <div className="space-y-4 w-full text-center">
        <div className="min-h-[2rem]">
          {isListening && (
            <div className="flex flex-col items-center gap-1">
               <span className="text-[10px] text-emerald-500 font-mono uppercase tracking-widest">Live STT Stream</span>
               <p className="text-sm text-zinc-300 italic">" {interimTranscript || 'Listening...'} "</p>
            </div>
          )}
          
          {isProcessing && (
            <div className="flex items-center justify-center gap-2 text-zinc-400">
               <Loader2 className="h-4 w-4 animate-spin" />
               <span className="text-xs font-mono uppercase tracking-tighter">Lingo.dev Translating & Synthesizing...</span>
            </div>
          )}

          {isSpeaking && (
            <div className="flex flex-col items-center gap-1 text-blue-400">
               <Volume2 className="h-6 w-6 animate-bounce" />
               <span className="text-[10px] font-mono uppercase tracking-widest">Playing {targetLanguage} Audio</span>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-zinc-800 flex items-center justify-center gap-2">
           <Languages className="h-3 w-3 text-zinc-500" />
           <p className="text-[10px] text-zinc-500 font-mono uppercase">
             Direct Audio-to-Audio Translation Layer
           </p>
        </div>
      </div>
    </div>
  );
}
