"use client";

import { type Variants, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "@/i18n/use-translations";

import { Button } from "@/components/ui/button";
import { ExclamationCircleIcon } from "@/components/icons";
import { fadeUp } from "@/app/_libs/utils/motion";

export interface VaultErrorStateProps {
  onRetry: () => void;
}

export function VaultErrorState({ onRetry }: VaultErrorStateProps) {
  const t = useTranslations("vault");
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="flex min-h-[240px] flex-col items-center justify-center"
      initial={prefersReducedMotion ? false : "hidden"}
      animate={prefersReducedMotion ? undefined : "visible"}
      variants={fadeUp as Variants}
    >
      <ExclamationCircleIcon className="size-6 text-destructive/60" />
      <h2 className="mt-3 font-serif text-base font-bold text-foreground">
        {t("error_state_title")}
      </h2>
      <p className="mt-1 font-sans text-sm text-muted-foreground">
        {t("error_state_subtitle")}
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="mt-4"
      >
        {t("error_state_retry_btn")}
      </Button>
    </motion.div>
  );
}
