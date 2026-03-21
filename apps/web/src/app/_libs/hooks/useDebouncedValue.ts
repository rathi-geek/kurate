"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Keeps local state in sync with a controlled value and calls a callback
 * after the value has been stable for `delayMs`. Use for search inputs,
 * filters, and any controlled input where the parent should be updated
 * after the user stops typing.
 *
 * @param controlledValue - Value from parent (e.g. filter state).
 * @param onDebouncedChange - Called with the latest value after `delayMs` of no changes.
 * @param delayMs - Debounce delay in milliseconds.
 * @returns [localValue, setLocalValue] for use in a controlled input.
 */
export function useDebouncedValue<T>(
  controlledValue: T,
  onDebouncedChange: (value: T) => void,
  delayMs: number,
): [T, (value: T) => void] {
  const [localValue, setLocalValue] = useState<T>(controlledValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(controlledValue);
  }, [controlledValue]);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onDebouncedChange(localValue);
      timeoutRef.current = null;
    }, delayMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [localValue, onDebouncedChange, delayMs]);

  return [localValue, setLocalValue];
}
