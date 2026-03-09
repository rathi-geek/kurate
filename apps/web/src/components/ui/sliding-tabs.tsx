"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/app/_libs/utils/cn";

// ─── Size Variants ─────────────────────────────────────────────────────────
// md  → default everywhere (text-[13px], font-semibold)
// sm  → compact override (text-sm, font-medium)
// lg  → future use (spacious, text-sm, font-semibold)
const SIZE_CONFIG = {
  sm: { pad: 4, btn: "px-4 py-1.5 text-sm font-medium",     minW: "min-w-[200px]" },
  md: { pad: 4, btn: "px-5 py-2 text-[13px] font-semibold", minW: "min-w-[220px]" },
  lg: { pad: 6, btn: "px-6 py-2.5 text-sm font-semibold",   minW: "min-w-[260px]" },
} as const;

export type SlidingTabsSize = keyof typeof SIZE_CONFIG;

export interface SlidingTabItem<T extends string = string> {
  value: T;
  label: string;
  /** Optional node rendered inside the label span, e.g. an animated +1 badge */
  suffix?: React.ReactNode;
}

interface SlidingTabsProps<T extends string = string> {
  tabs: SlidingTabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: SlidingTabsSize;
  /**
   * Set to false to skip the layoutId animation (e.g. when another Framer
   * Motion shared-layout element is already animating on the same page).
   * Defaults to true.
   */
  animated?: boolean;
  className?: string;
}

export function SlidingTabs<T extends string>({
  tabs,
  value,
  onChange,
  size = "md",
  animated = true,
  className,
}: SlidingTabsProps<T>) {
  const uid = useId();
  const prefersReducedMotion = useReducedMotion();
  const { pad, btn, minW } = SIZE_CONFIG[size];
  const pillId = `sliding-tab-pill-${uid}`;

  // Animate only when explicitly enabled and motion is not reduced
  const shouldAnimate = animated && !prefersReducedMotion;

  return (
    <div
      className={cn("relative flex rounded-button bg-surface", minW, className)}
      style={{ padding: pad }}
    >
      {tabs.map((tab) => {
        const isActive = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              "relative flex-1 flex items-center justify-center font-sans transition-colors duration-200",
              btn,
              isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-brand",
            )}
          >
            {/* Pill renders inside the active button; layoutId moves it between buttons */}
            {isActive && (
              shouldAnimate ? (
                <motion.span
                  layoutId={pillId}
                  className="absolute inset-0 rounded-[calc(var(--radius-button)-2px)] bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.6 }}
                />
              ) : (
                <span className="absolute inset-0 rounded-[calc(var(--radius-button)-2px)] bg-primary" />
              )
            )}

            {/* Label + optional badge */}
            <span className="relative z-10">
              {tab.label}
              {tab.suffix}
            </span>
          </button>
        );
      })}
    </div>
  );
}
