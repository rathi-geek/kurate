"use client";

import type { SharedContentItem } from "@/app/_libs/mockPersonContent";

interface SharedContentStripProps {
  items: SharedContentItem[];
  expanded: boolean;
  onToggleExpand: () => void;
  onCardClick: (item: SharedContentItem) => void;
}

export function SharedContentStrip({
  items,
  onCardClick,
}: SharedContentStripProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid gap-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onCardClick(item)}
            className="text-left p-4 rounded-xl border border-ink/[0.08] bg-white hover:bg-ink/[0.02] transition-colors"
          >
            <span
              className="font-mono text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 inline-block mb-2 rounded-full"
              style={{
                backgroundColor:
                  item.contentType === "video"
                    ? "#D8C9F020"
                    : item.contentType === "podcast"
                      ? "#F0C27A20"
                      : "#1A5C4B15",
                color:
                  item.contentType === "video"
                    ? "#7C3AED"
                    : item.contentType === "podcast"
                      ? "#B8860B"
                      : "#1A5C4B",
              }}
            >
              {item.contentType}
            </span>
            <h3 className="font-sans text-[14px] font-bold text-ink leading-snug">
              {item.contentTitle}
            </h3>
            <p className="font-mono text-[11px] text-ink/35 mt-0.5">{item.contentSource}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
