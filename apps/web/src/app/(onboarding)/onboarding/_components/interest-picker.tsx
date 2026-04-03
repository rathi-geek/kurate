"use client";

import { INTEREST_OPTIONS } from "@kurate/utils";
import { cn } from "@/app/_libs/utils/cn";

const VISIBLE_COUNT = 5;

interface InterestPickerProps {
  interests: string[];
  onToggle: (interest: string) => void;
  expanded: boolean;
  onExpandToggle: () => void;
  label: string;
  showLessText: string;
  showMoreText: string;
}

export function InterestPicker({
  interests,
  onToggle,
  expanded,
  onExpandToggle,
  label,
  showLessText,
  showMoreText,
}: InterestPickerProps) {
  const visibleInterests = expanded ? INTEREST_OPTIONS : INTEREST_OPTIONS.slice(0, VISIBLE_COUNT);

  return (
    <div>
      <p className="text-foreground mb-3 block font-sans text-xs font-bold tracking-[0.08em] uppercase">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {visibleInterests.map((interest) => (
          <button
            key={interest}
            type="button"
            onClick={() => onToggle(interest)}
            className={cn(
              "rounded-badge px-3 py-1.5 font-sans text-sm transition-all",
              interests.includes(interest)
                ? "bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary/50 border",
            )}>
            {interest}
          </button>
        ))}
        <button
          type="button"
          onClick={onExpandToggle}
          className="text-muted-foreground hover:text-foreground rounded-badge px-3 py-1.5 font-sans text-sm underline transition-colors">
          {expanded ? showLessText : showMoreText}
        </button>
      </div>
    </div>
  );
}
