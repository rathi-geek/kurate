"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AppSidebar } from "@/app/_components/app-sidebar";
import { ChatBubble } from "@/app/_components/chat/chat-bubble";
import { ChatInput } from "@/app/_components/chat/chat-input";
import { createClient } from "@/app/_libs/supabase/client";

interface Message {
  id: string;
  role: "user" | "system";
  content: string;
  timestamp: Date;
}

const springSnappy = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
};

type Tab = "logging" | "discovering";

export default function ChatPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("discovering");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  async function handleSend(text: string) {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    if (activeTab === "logging") {
      const urlMatch = text.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        setTimeout(() => {
          const sysMsg: Message = {
            id: crypto.randomUUID(),
            role: "system",
            content: "Link detected! This would be saved to your vault in the full implementation.",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, sysMsg]);
        }, 500);
      } else {
        setTimeout(() => {
          const sysMsg: Message = {
            id: crypto.randomUUID(),
            role: "system",
            content: "Please paste a link to save it to your vault.",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, sysMsg]);
        }, 500);
      }
    } else {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const sysMsg: Message = {
          id: crypto.randomUUID(),
          role: "system",
          content: "This is a demo response. In the full implementation, this would connect to an AI service to provide recommendations based on your query.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, sysMsg]);
      }, 1500);
    }
  }

  return (
    <div className="h-screen flex bg-background">
      <AppSidebar userEmail={userEmail} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="shrink-0 flex items-center justify-center py-3 border-b bg-background">
          <div className="relative inline-flex bg-muted rounded-full p-[3px]">
            {(["discovering", "logging"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative px-5 py-1.5 cursor-pointer"
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="tab-pill"
                    className="absolute inset-0 bg-background rounded-full shadow-sm"
                    transition={springSnappy}
                  />
                )}
                <span
                  className={`relative z-10 text-sm font-medium transition-colors ${
                    activeTab === tab ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {tab === "discovering" ? "Discovering" : "Logging"}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
          <div className="max-w-2xl mx-auto space-y-4 pb-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold mb-2">
                  {activeTab === "discovering" ? "Discover" : "Log"}
                </h2>
                <p className="text-muted-foreground">
                  {activeTab === "discovering"
                    ? "Ask me about any topic to get personalized recommendations."
                    : "Paste a link to save it to your vault and share with your network."}
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((msg) => (
                  <ChatBubble key={msg.id} role={msg.role}>
                    {msg.content}
                  </ChatBubble>
                ))}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-1 p-4"
                  >
                    <motion.span
                      animate={{ scale: [0.8, 1, 0.8] }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                      className="w-2 h-2 bg-muted-foreground rounded-full"
                    />
                    <motion.span
                      animate={{ scale: [0.8, 1, 0.8] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                      className="w-2 h-2 bg-muted-foreground rounded-full"
                    />
                    <motion.span
                      animate={{ scale: [0.8, 1, 0.8] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                      className="w-2 h-2 bg-muted-foreground rounded-full"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>

        <ChatInput
          onSend={handleSend}
          placeholder={activeTab === "discovering" ? "Ask me about any topic..." : "Paste a link to log it..."}
        />
      </div>
    </div>
  );
}
