"use client";

import { Sidebar } from "@/components/chat/sidebar";
import { ChatWindow } from "@/components/chat/chat-window";
import { SyncUser } from "@/components/auth/sync-user";
import { useState } from "react";
import { Id } from "convex/_generated/dataModel";

export default function Home() {
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | undefined>();
  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | undefined>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleSelect = (type: "user" | "conv", id: any) => {
    if (type === "user") setSelectedUserId(id);
    else setSelectedConversationId(id);

    // Auto-close sidebar on mobile
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <main className="flex h-screen bg-black overflow-hidden selection:bg-indigo-500/30">
      {/* Sidebar - Desktop: 320px, Mobile: Full screen transition */}
      <div className={`w-80 border-r border-zinc-800/50 flex-shrink-0 transition-transform duration-300 fixed md:relative z-30 h-full bg-black ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <Sidebar
          selectedUserId={selectedUserId}
          selectedConversationId={selectedConversationId}
          onSelectUser={(id) => handleSelect("user", id)}
          onSelectConversation={(id) => handleSelect("conv", id)}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatWindow
          userId={selectedUserId}
          conversationId={selectedConversationId}
          onBack={() => setIsSidebarOpen(true)}
        />
      </div>

      <SyncUser />
    </main>
  );
}
