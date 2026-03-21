"use client";

import { type Variants, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { BrandArch } from "@/components/brand";
import { fadeUp } from "@/app/_libs/utils/motion";

export interface VaultEmptyStateProps {
  onExplore: () => void;
}

export function VaultEmptyState({ onExplore }: VaultEmptyStateProps) {
  const t = useTranslations("vault");
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="flex min-h-[240px] flex-col items-center justify-center"
      initial={prefersReducedMotion ? false : "hidden"}
      animate={prefersReducedMotion ? undefined : "visible"}
      variants={fadeUp as Variants}
    >
      <BrandArch
        s={56}
        className="mb-5 text-muted-foreground/30"
      />
      <h2 className="font-serif text-lg font-bold text-foreground">
        {t("empty_state_title")}
      </h2>
      <p className="mt-1 font-sans text-sm text-muted-foreground">
        {t("empty_state_subtitle")}
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={onExplore}
        className="mt-4"
      >
        {t("empty_state_explore_btn")}
      </Button>
    </motion.div>
  );
}
