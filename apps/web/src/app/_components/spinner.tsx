"use client";

import { motion } from "framer-motion";

import { spinnerTransition } from "@/lib/motion-variants";
import { BrandStar } from "@/components/brand";

interface SpinnerProps {
  /** Icon size in px. Defaults to 14. */
  s?: number;
}

/**
 * Spinning BrandStar used inside loading buttons.
 *
 * Usage:
 * ```tsx
 * <Button disabled={loading}>
 *   {loading ? <Spinner /> : <>{t("submit")} <Arrow s={14} /></>}
 * </Button>
 * ```
 */
export function Spinner({ s = 14 }: SpinnerProps) {
  return (
    <motion.span
      animate={{ rotate: 360 }}
      transition={spinnerTransition}
      className="inline-block">
      <BrandStar s={s} />
    </motion.span>
  );
}
