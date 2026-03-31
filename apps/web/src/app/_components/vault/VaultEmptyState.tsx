"use client";

import { type Variants, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "@/i18n/use-translations";
import type { VaultFilters as VaultFiltersType } from "@kurate/types";

import { Button } from "@/components/ui/button";
import { BrandArch } from "@/components/brand";
import { fadeUp } from "@/app/_libs/utils/motion";

export interface VaultEmptyStateProps {
  onExplore: () => void;
  variant?: "default" | "filtered";
  filters?: VaultFiltersType;
}

export function VaultEmptyState({
  onExplore,
  variant = "default",
  filters,
}: VaultEmptyStateProps) {
  const t = useTranslations("vault");
  const prefersReducedMotion = useReducedMotion();
  const isFiltered = variant === "filtered";
  const activeFilters: VaultFiltersType = filters ?? {
    time: "all",
    contentType: "all",
    search: "",
    readStatus: "all",
  };

  const itemLabel = activeFilters.contentType === "article"
    ? t("empty_state_filtered_items_articles")
    : activeFilters.contentType === "video"
      ? t("empty_state_filtered_items_videos")
      : activeFilters.contentType === "podcast"
        ? t("empty_state_filtered_items_podcasts")
        : t("empty_state_filtered_items_all");

  const timeLabel = activeFilters.time === "today"
    ? t("empty_state_filtered_time_today")
    : activeFilters.time === "week"
      ? t("empty_state_filtered_time_week")
      : activeFilters.time === "month"
        ? t("empty_state_filtered_time_month")
        : null;

  const readStatusLabel = activeFilters.readStatus === "read"
    ? t("empty_state_filtered_read_read")
    : activeFilters.readStatus === "unread"
      ? t("empty_state_filtered_read_unread")
      : null;

  const filteredTitle = readStatusLabel
    ? (timeLabel
      ? t("empty_state_filtered_message_read_with_time", {
        readStatusLabel,
        itemLabel,
        timeLabel,
      })
      : t("empty_state_filtered_message_read", { readStatusLabel, itemLabel }))
    : (timeLabel
      ? t("empty_state_filtered_message_with_time", { itemLabel, timeLabel })
      : t("empty_state_filtered_message", { itemLabel }));

  return (
    <motion.div
      className="flex min-h-0 flex-1 flex-col items-center justify-center py-10"
      initial={prefersReducedMotion ? false : "hidden"}
      animate={prefersReducedMotion ? undefined : "visible"}
      variants={fadeUp as Variants}
    >
      <BrandArch
        s={56}
        className="mb-5 text-muted-foreground/30"
      />
      <h2 className="px-4 text-center font-serif text-lg font-bold text-foreground">
        {isFiltered ? filteredTitle : t("empty_state_title")}
      </h2>
      <p className="mt-1 px-4 text-center font-sans text-sm text-muted-foreground">
        {isFiltered ? t("empty_state_filtered_subtitle") : t("empty_state_subtitle")}
      </p>
      {!isFiltered && (
        <Button
          variant="outline"
          size="sm"
          onClick={onExplore}
          className="mt-4"
        >
          {t("empty_state_explore_btn")}
        </Button>
      )}
    </motion.div>
  );
}
