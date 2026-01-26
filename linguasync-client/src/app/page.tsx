"use client";
import ChatUI from '@/components/conversation/ChatUI';

export default function Home() {
  return (
    <main className="flex flex-col h-screen overflow-hidden bg-zinc-950">
      {/* Primary surface: Centered Chat View */}
      <div className="flex-1 max-w-7xl mx-auto w-full relative">
        <ChatUI />
      </div>
    </main>
  );
}
