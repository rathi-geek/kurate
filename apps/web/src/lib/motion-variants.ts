/**
 * Kurate — Motion variants & spring presets
 *
 * Single source of truth for all Framer Motion animation variants.
 * Import from here instead of defining variants inline in components.
 *
 * Usage:
 *   import { fadeUp, springGentle, tapScale } from "@/lib/motion-variants";
 */
import type { Transition, Variants } from "framer-motion";

// ─── SPRING TRANSITIONS ────────────────────────────────────────────────────
// Spring physics only — never CSS ease-in-out or cubic-bezier (SOUL.md).

/** Snappy spring — sidebar collapse, icon rotation (400 / 25) */
export const springSnappy: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 25,
};

/** Gentle spring — page transitions, modals, drawers (260 / 25) */
export const springGentle: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 25,
};

/** Bouncy spring — entry animations with energy (200 / 22) */
export const springBouncy: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 22,
};

/** Heavy spring — full-page level transitions (300 / 30) */
export const springHeavy: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

/** Tab pill spring — sliding tab indicator (500 / 40 / 0.6) */
export const springTab: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 40,
  mass: 0.6,
};

// ─── ENTER / EXIT VARIANTS ─────────────────────────────────────────────────

/**
 * Fade up — auth forms, onboarding cards.
 * Supports per-child stagger: pass `custom={index}` (×0.07 s per step).
 */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 28, delay: i * 0.07 },
  }),
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

/** Fade up large offset — landing page hero sections (30 px) */
export const fadeUpHero: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: springGentle },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/** Fade in (no movement) — overlays, backdrops */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: springGentle },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/** Slide up small — form step transitions, tab switches (8 px) */
export const slideUpSmall: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: springGentle },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

/** Fade up from right — form enters from right, exits right (e.g. password form) */
export const fadeUpRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: springGentle },
  exit: { opacity: 0, x: 20, transition: { duration: 0.15 } },
};

/** Fade up from left — form enters from left, exits left (e.g. magic link form) */
export const fadeUpLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: springGentle },
  exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
};

/** Slide in from left — mobile sidebar / drawer */
export const slideInLeft: Variants = {
  hidden: { x: -280 },
  visible: { x: 0, transition: springGentle },
  exit: { x: -280, transition: springGentle },
};

/** Slide in from right — side sheets, settings panel */
export const slideInRight: Variants = {
  hidden: { x: 280 },
  visible: { x: 0, transition: springGentle },
  exit: { x: 280, transition: springGentle },
};

/** Chat message — enters from below, exits upward */
export const messageVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: springGentle },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
};

// ─── PAGE-LEVEL ────────────────────────────────────────────────────────────

/** Page transition — whole-page enter/exit (small y offset) */
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: springHeavy },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/** Tab content — horizontal slide for tab switching */
export const tabVariants: Variants = {
  hidden: { opacity: 0, x: 10 },
  visible: { opacity: 1, x: 0, transition: springGentle },
  exit: {
    opacity: 0,
    x: -10,
    transition: { type: "spring", stiffness: 400, damping: 30 },
  },
};

// ─── STAGGER ───────────────────────────────────────────────────────────────

/** Stagger container — quick chips (60 ms between children) */
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
  exit: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
};

/** Stagger container slow — landing page hero (150 ms between children) */
export const staggerContainerSlow: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

/** Stagger item — child of staggerContainer / staggerContainerSlow */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 4 },
};

// ─── CARD / FEED ───────────────────────────────────────────────────────────

/**
 * Scroll-triggered card stagger.
 * Use with `custom={index}` for per-index delay (80 ms offset).
 * Combine with `whileInView` + `viewport={{ once: true }}`.
 */
export const cardStagger: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08 },
  }),
};

// ─── INTERACTIVE (spread props) ────────────────────────────────────────────

/** Press: scales button down 10% on tap */
export const tapScale = { whileTap: { scale: 0.9 } } as const;

/** Hover: lifts element 6 px */
export const hoverLift = { whileHover: { y: -6 } } as const;

/** Hover: lifts element 4 px (subtle) */
export const hoverLiftSlight = { whileHover: { y: -4 } } as const;

/** Hover: scales element up 4% */
export const hoverScale = { whileHover: { scale: 1.04 } } as const;

// ─── SPECIAL ───────────────────────────────────────────────────────────────

/**
 * Spinner: infinite clockwise rotation.
 * Use as `animate={{ rotate: 360 }}` with this transition.
 */
export const spinnerTransition: Transition = {
  duration: 1,
  repeat: Infinity,
  ease: "linear",
};

/**
 * CSS animation strings for elements that can't use Framer Motion
 * (e.g. pseudo-elements, SVG stroke-dashoffset).
 */
export const cssAnimations = {
  ctaBreathe: "ctaBreathe 3s ease-in-out infinite",
  marquee: (speed = 20) => `marquee ${speed}s linear infinite`,
} as const;
