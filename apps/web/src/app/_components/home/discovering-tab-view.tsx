"use client";

import { useEffect, useRef } from "react";

import { useScrollDirection } from "@/app/_libs/hooks/useScrollDirection";

interface DiscoveringTabViewProps {
  onScrollDirectionChange?: (dir: "up" | "down") => void;
}

export function DiscoveringTabView({ onScrollDirectionChange }: DiscoveringTabViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollDir = useScrollDirection(scrollRef);

  useEffect(() => {
    if (scrollDir) onScrollDirectionChange?.(scrollDir);
  }, [scrollDir, onScrollDirectionChange]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 pb-16 md:pb-4">
      <div className="mx-auto max-w-2xl space-y-4" />
    </div>
  );
}
