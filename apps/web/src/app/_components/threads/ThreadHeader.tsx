"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ContentThread } from "@/app/_libs/chat-types";
import { getOtherParticipants } from "@/app/_libs/mockThreadData";
import { springGentle } from "@/app/_libs/utils/motion";

interface ThreadHeaderProps {
  thread: ContentThread;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  onClose: () => void;
  onToggleInfo: () => void;
  onOpenArticle?: (url: string) => void;
}

export function ThreadHeader({
  thread,
  isFullScreen,
  onToggleFullScreen,
  onClose,
  onToggleInfo,
  onOpenArticle,
}: ThreadHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const others = getOtherParticipants(thread);
  const participantNames = others.map((p) => p.userName).join(", ");

  return (
    <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-ink/[0.06] bg-white/80 backdrop-blur-sm">
      <button onClick={onToggleInfo} className="shrink-0 cursor-pointer flex -space-x-2" type="button">
        {others.slice(0, 3).map((p) => (
          <div
            key={p.userHandle}
            className="w-8 h-8 bg-ink text-cream flex items-center justify-center font-sans text-[11px] font-bold border-2 border-white rounded-full"
          >
            {p.userName[0]}
          </div>
        ))}
        {others.length > 3 && (
          <div className="w-8 h-8 bg-ink/20 text-ink flex items-center justify-center font-mono text-[10px] font-bold border-2 border-white rounded-full">
            +{others.length - 3}
          </div>
        )}
      </button>
      <button
        onClick={() => onOpenArticle?.(thread.contentUrl)}
        className="flex-1 min-w-0 text-left cursor-pointer"
        type="button"
      >
        <h3 className="font-sans text-[13px] font-bold text-ink truncate">
          {thread.contentTitle || "Untitled"}
        </h3>
        <p className="font-mono text-[10px] text-ink/35 truncate">with {participantNames}</p>
      </button>
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleFullScreen}
          className="w-8 h-8 flex items-center justify-center text-ink/30 hover:text-ink/60 cursor-pointer transition-colors rounded-full"
          title={isFullScreen ? "Exit full screen" : "Full screen"}
          type="button"
        >
          {isFullScreen ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M8 3v3a2 2 0 01-2 2H3" />
              <path d="M21 8h-3a2 2 0 01-2-2V3" />
              <path d="M3 16h3a2 2 0 012 2v3" />
              <path d="M16 21v-3a2 2 0 012-2h3" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M8 3H5a2 2 0 00-2 2v3" />
              <path d="M21 8V5a2 2 0 00-2-2h-3" />
              <path d="M3 16v3a2 2 0 002 2h3" />
              <path d="M16 21h3a2 2 0 002-2v-3" />
            </svg>
          )}
        </button>
        <div className="relative">
          <button
            onClick={() => setShowMenu((p) => !p)}
            className="w-8 h-8 flex items-center justify-center text-ink/30 hover:text-ink/60 cursor-pointer transition-colors rounded-full"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={springGentle}
                className="absolute right-0 top-full mt-1 w-44 bg-white border border-ink/10 py-1 z-30 rounded-lg shadow-lg"
              >
                <button
                  onClick={() => { onToggleInfo(); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-left font-sans text-[12px] text-ink/70 hover:bg-ink/5 cursor-pointer transition-colors"
                  type="button"
                >
                  Thread info
                </button>
                <div className="mx-2 my-1 border-t border-ink/6" />
                <button
                  onClick={() => { onClose(); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-left font-sans text-[12px] text-destructive hover:bg-destructive/5 cursor-pointer transition-colors"
                  type="button"
                >
                  Close thread
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
