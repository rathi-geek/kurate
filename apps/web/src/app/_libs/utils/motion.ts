/**
 * Kurate — Framer Motion presets (SOUL.md).
 * Spring physics only. Never use CSS ease-in-out or cubic-bezier.
 */
import type { Transition, Variants } from "framer-motion";

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 25,
};

export const springGentle: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 25,
};

export const springBouncy: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 22,
};

export const springHeavy: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

export const tabVariants: Variants = {
  hidden: { opacity: 0, x: 10 },
  visible: { opacity: 1, x: 0, transition: springGentle },
  exit: { opacity: 0, x: -10, transition: { type: "spring", stiffness: 400, damping: 30 } },
};

export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: springHeavy },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};
