"use client";

import { motion } from "framer-motion";

const messageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

interface ChatBubbleProps {
  role: "user" | "system";
  children: React.ReactNode;
}

export function ChatBubble({ role, children }: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`
          max-w-[85%] px-4 py-3
          text-sm leading-relaxed
          ${
            isUser
              ? "bg-primary text-primary-foreground rounded-2xl"
              : "bg-card text-foreground rounded-2xl border"
          }
        `}
      >
        {children}
      </div>
    </motion.div>
  );
}
