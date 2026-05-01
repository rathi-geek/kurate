"use client";

import type { VaultFilters as VaultFiltersType } from "@kurate/types";
import { type Variants, motion } from "framer-motion";
import { useSafeReducedMotion } from "@/app/_libs/hooks/useSafeReducedMotion";

import { Button } from "@/components/ui/button";

import { fadeUp } from "@/app/_libs/utils/motion";
import { BrandArch } from "@/components/brand";
import { useTranslations } from "@/i18n/use-translations";

export interface VaultEmptyStateProps {
  onExplore: () => void;
  variant?: "default" | "filtered";
  filters?: VaultFiltersType;
}

const CONTENT_TYPE_KEY: Record<string, string> = {
  article:  "empty_state_filtered_items_articles",
  video:    "empty_state_filtered_items_videos",
  podcast:  "empty_state_filtered_items_podcasts",
  tweet:    "empty_state_filtered_items_tweets",
  substack: "empty_state_filtered_items_substack",
  spotify:  "empty_state_filtered_items_spotify",
  link:     "empty_state_filtered_items_links",
};

const TIME_KEY: Record<string, string> = {
  today: "empty_state_filtered_time_today",
  week:  "empty_state_filtered_time_week",
  month: "empty_state_filtered_time_month",
};

const READ_STATUS_KEY: Record<string, string> = {
  marked:   "empty_state_filtered_read_read",
  unmarked: "empty_state_filtered_read_unread",
};

export function VaultEmptyState({ onExplore, variant = "default", filters }: VaultEmptyStateProps) {
  const t = useTranslations("vault");
  const prefersReducedMotion = useSafeReducedMotion();
  const isFiltered = variant === "filtered";
  const activeFilters: VaultFiltersType = filters ?? {
    time: "all",
    contentType: "all",
    search: "",
    readStatus: "all",
  };

  const itemLabel = t(CONTENT_TYPE_KEY[activeFilters.contentType] ?? "empty_state_filtered_items_all");
  const timeLabel = TIME_KEY[activeFilters.time] ? t(TIME_KEY[activeFilters.time]!) : null;
  const readStatusLabel = READ_STATUS_KEY[activeFilters.readStatus] ? t(READ_STATUS_KEY[activeFilters.readStatus]!) : null;

  const filteredTitle = readStatusLabel
    ? timeLabel
      ? t("empty_state_filtered_message_read_with_time", { readStatusLabel, itemLabel, timeLabel })
      : t("empty_state_filtered_message_read", { readStatusLabel, itemLabel })
    : timeLabel
      ? t("empty_state_filtered_message_with_time", { itemLabel, timeLabel })
      : t("empty_state_filtered_message", { itemLabel });

  return (
    <motion.div
      className="flex min-h-0 flex-1 flex-col items-center justify-center py-10"
      initial={prefersReducedMotion ? false : "hidden"}
      animate="visible"
      variants={fadeUp as Variants}>
      <BrandArch s={56} className="text-muted-foreground/30 mb-5" />
      <h2 className="text-foreground px-4 text-center font-serif text-lg font-bold">
        {isFiltered ? filteredTitle : t("empty_state_title")}
      </h2>
      <p className="text-muted-foreground mt-1 px-4 text-center font-sans text-sm">
        {isFiltered ? t("empty_state_filtered_subtitle") : t("empty_state_subtitle")}
      </p>
      {!isFiltered && (
        <Button variant="outline" size="sm" onClick={onExplore} className="mt-4">
          {t("empty_state_explore_btn")}
        </Button>
      )}
    </motion.div>
  );
}
