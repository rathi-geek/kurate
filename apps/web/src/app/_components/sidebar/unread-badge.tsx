"use client";

import { cn } from "@/app/_libs/utils/cn";

export interface UnreadBadgeProps {
  count: number;
  /** "dot" = small circle on avatar (max 9+); "inline" = circle in row (max 99+) */
  variant: "dot" | "inline";
  className?: string;
}

export function UnreadBadge({ count, variant, className }: UnreadBadgeProps) {
  if (count <= 0) return null;

  const label = variant === "dot" ? (count > 9 ? "9+" : count) : count > 99 ? "99+" : count;

  return (
    <span
      className={cn(
        "bg-primary text-primary-foreground flex items-center justify-center rounded-full font-sans text-[10px] font-bold leading-none",
        variant === "dot" && "h-4 w-4",
        variant === "inline" && "size-5 shrink-0",
        className,
      )}
    >
      {label}
    </span>
  );
}
