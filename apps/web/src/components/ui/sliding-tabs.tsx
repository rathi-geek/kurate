"use client";

import { useId } from "react";

import { motion } from "framer-motion";
import { useSafeReducedMotion } from "@/app/_libs/hooks/useSafeReducedMotion";

import { cn } from "@/app/_libs/utils/cn";

// ─── Size Variants ─────────────────────────────────────────────────────────
// md  → default everywhere (text-[13px], font-semibold)
// sm  → compact override (text-sm, font-medium)
// lg  → future use (spacious, text-sm, font-semibold)
const SIZE_CONFIG = {
  sm: { pad: 4, btn: "px-4 py-1.5 text-sm font-medium", minW: "min-w-[200px]" },
  md: { pad: 4, btn: "px-5 py-2 text-[13px] font-semibold", minW: "min-w-[220px]" },
  lg: { pad: 6, btn: "px-6 py-2.5 text-sm font-semibold", minW: "min-w-[260px]" },
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
  const prefersReducedMotion = useSafeReducedMotion();
  const { pad, btn, minW } = SIZE_CONFIG[size];
  const pillId = `sliding-tab-pill-${uid}`;

  // Animate only when explicitly enabled and motion is not reduced
  const shouldAnimate = animated && !prefersReducedMotion;

  return (
    <div
      className={cn(
        "rounded-0 sm:rounded-button bg-surface relative flex shadow-md",
        minW,
        className,
      )}
      style={{ padding: pad }}>
      {tabs.map((tab) => {
        const isActive = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              "relative flex flex-1 items-center justify-center font-sans transition-colors duration-200",
              btn,
              isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-brand",
            )}>
            {/* Pill renders inside the active button; layoutId moves it between buttons */}
            {isActive &&
              (shouldAnimate ? (
                <motion.span
                  layoutId={pillId}
                  className="bg-primary absolute inset-0 rounded-[calc(var(--radius-button)-2px)]"
                  style={{ boxShadow: "0 4px 14px hsl(var(--primary) / 0.45)" }}
                  transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.6 }}
                />
              ) : (
                <span
                  className="bg-primary absolute inset-0 rounded-[calc(var(--radius-button)-2px)]"
                  style={{ boxShadow: "0 4px 14px hsl(var(--primary) / 0.45)" }}
                />
              ))}

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
