"use client";
import ChatUI from "@/components/conversation/ChatUI";

export default function Home() {
  return (
    <main className="flex items-center justify-center h-screen overflow-hidden bg-[#0a0a0a] p-4 sm:p-8">
      {/* Primary surface: Centered Chat View */}
      <div className="w-full max-w-7xl h-full relative">
        <ChatUI />
      </div>
    </main>
  );
}
