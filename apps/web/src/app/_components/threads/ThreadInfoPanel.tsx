"use client";

import type { ContentThread } from "@/app/_libs/chat-types";

interface ThreadInfoPanelProps {
  thread: ContentThread;
  onClose: () => void;
}

export function ThreadInfoPanel({ thread, onClose }: ThreadInfoPanelProps) {
  const commentCount = thread.lastComment ? "Active" : "No comments yet";

  return (
    <div className="w-[320px] h-full border-l border-ink/[0.06] bg-white flex flex-col overflow-hidden shrink-0">
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-ink/[0.06]">
        <h3 className="font-sans text-[14px] font-bold text-ink">Thread info</h3>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center text-ink/30 hover:text-ink/60 cursor-pointer transition-colors"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-5">
          <span
            className="font-mono text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 inline-block mb-3"
            style={{
              backgroundColor:
                thread.contentType === "video"
                  ? "#D8C9F020"
                  : thread.contentType === "podcast"
                    ? "#F0C27A20"
                    : "#1A5C4B15",
              color:
                thread.contentType === "video"
                  ? "#7C3AED"
                  : thread.contentType === "podcast"
                    ? "#B8860B"
                    : "#1A5C4B",
              borderRadius: "999px",
            }}
          >
            {thread.contentType}
          </span>
          <h2 className="font-sans text-[16px] font-bold text-ink leading-snug mb-1">
            {thread.contentTitle || thread.contentUrl}
          </h2>
          {thread.contentSource && (
            <p className="font-mono text-[11px] text-ink/35 mb-2">{thread.contentSource}</p>
          )}
          {thread.contentReadTime && (
            <p className="font-mono text-[10px] text-ink/30">{thread.contentReadTime} read</p>
          )}
          <a
            href={thread.contentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 font-sans text-[12px] text-teal font-semibold hover:text-teal/80 transition-colors"
          >
            Open in new tab
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </a>
        </div>
        <div className="mx-4 border-t border-ink/6" />
        <div className="px-4 py-4">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/25 mb-3">Thread</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[12px] text-ink/50">Status</span>
              <span className="font-sans text-[12px] text-ink font-semibold">{commentCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-sans text-[12px] text-ink/50">Shared by</span>
              <span className="font-sans text-[12px] text-ink font-semibold">{thread.createdByName}</span>
            </div>
          </div>
        </div>
        <div className="mx-4 border-t border-ink/6" />
        <div className="px-4 py-4">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/25 mb-3">
            Participants · {thread.participants.length}
          </p>
          <div className="space-y-1">
            {thread.participants.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2.5 px-2 py-2 hover:bg-ink/[0.03] transition-colors rounded-md"
              >
                <div className="w-8 h-8 bg-ink text-cream flex items-center justify-center font-sans text-[11px] font-bold shrink-0 rounded-full">
                  {p.userName[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-[12px] font-semibold text-ink">{p.userName}</p>
                  <p className="font-mono text-[10px] text-ink/30">{p.userHandle}</p>
                </div>
                {p.role === "sharer" && (
                  <span className="font-mono text-[9px] text-teal bg-teal/10 px-2 py-0.5 shrink-0 rounded-full">
                    Shared
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
