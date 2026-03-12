"use client";

import { useEffect, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/app/_libs/utils/cn";

interface CyclingTextProps {
  /** List of phrases to cycle through */
  phrases: string[];
  /** Milliseconds each phrase is shown (default: 2200) */
  interval?: number;
  className?: string;
}

/**
 * Crossfades through `phrases` on a timer.
 * Each phrase slides up-out and the next slides up-in.
 */
export function CyclingText({ phrases, interval = 2200, className }: CyclingTextProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (phrases.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % phrases.length);
    }, interval);
    return () => clearInterval(timer);
  }, [phrases, interval]);

  return (
    <span className={cn("relative inline-block", className)}>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="inline-block">
          {phrases[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
