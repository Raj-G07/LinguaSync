"use client";
import ChatUI from "@/components/conversation/ChatUI";

export default function Home() {
  return (
    <main className="flex items-center justify-center h-screen overflow-hidden bg-zinc-950 p-4 sm:p-8">
      {/* Primary surface: Centered Chat View */}
      <div className="w-full max-w-4xl h-[90vh] max-h-[800px] relative">
        <ChatUI />
      </div>
    </main>
  );
}
