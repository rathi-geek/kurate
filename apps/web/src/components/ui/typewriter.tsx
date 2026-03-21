"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/app/_libs/utils/cn";

interface TypewriterProps {
  /** Text to type out */
  text: string;
  /** Milliseconds per character (default: 30) */
  speed?: number;
  /** Show blinking cursor (default: true) */
  cursor?: boolean;
  className?: string;
}

/**
 * Types out `text` character by character with an optional blinking `|` cursor.
 * Re-runs from the start whenever `text` changes.
 */
export function Typewriter({ text, speed = 30, cursor = true, className }: TypewriterProps) {
  const [displayed, setDisplayed] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed("");
    indexRef.current = 0;

    const interval = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) clearInterval(interval);
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  useEffect(() => {
    if (!cursor) return;
    const blink = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(blink);
  }, [cursor]);

  return (
    <span className={className}>
      {displayed}
      {cursor && (
        <span
          className={cn(
            "ml-px inline-block w-[1px] translate-y-[1px] bg-current align-middle text-[0.9em]",
            cursorVisible ? "opacity-100" : "opacity-0",
          )}
          aria-hidden>
          |
        </span>
      )}
    </span>
  );
}
