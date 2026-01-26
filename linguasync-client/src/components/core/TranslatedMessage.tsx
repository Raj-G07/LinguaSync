"use client";

import React from 'react';
import { t } from '@lingo.dev/sdk'; // In production, this imports from the compiled manifest

interface TranslatedMessageProps {
  messageId: string;
  className?: string;
  // Intentionally omitting 'defaultText' or 'fallback' props
  // to enforce strict dependency on the compiled dictionary.
}

export default function TranslatedMessage({ messageId, className }: TranslatedMessageProps) {
  // Logic:
  // 1. Look up the messageId in the compiled Lingo dictionary.
  // 2. If found, render.
  // 3. If missing, render a visible ERROR to alert developers/users.
  
  // In this mock, t() returns a string. In strict mode, t() might throw or return null.
  const translatedText = t(messageId);

  if (!translatedText) {
    // Fail loud
    return (
      <span className="bg-red-500 text-white px-1 text-xs font-mono rounded">
        MISSING_ID:{messageId}
      </span>
    );
  }

  return (
    <span 
      data-lingo-id={messageId} 
      className={className}
    >
      {translatedText}
    </span>
  );
}
