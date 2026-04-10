"use client";

import { formatDateLabel } from "@kurate/utils";
import { motion } from "framer-motion";
import { useTranslations } from "@/i18n/use-translations";

import type { GroupDrop } from "@kurate/types";
import { cardStagger } from "@/app/_libs/utils/motion";
import { FeedShareCard } from "@/app/_components/groups/feed-share-card";

interface DiscoveryTodaySectionProps {
  drops: GroupDrop[];
  isLoading: boolean;
  userId: string;
}

export function DiscoveryTodaySection({ drops, isLoading, userId }: DiscoveryTodaySectionProps) {
  const t = useTranslations("discovery");

  if (!isLoading && !drops.length) return null;

  const dateLabel = formatDateLabel();

  if (isLoading) {
    return (
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="bg-border h-px flex-1" />
          <div className="bg-surface h-3 w-28 animate-pulse rounded" />
          <span className="bg-border h-px flex-1" />
        </div>
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-card border-border bg-card space-y-3 border p-4">
              <div className="flex items-center gap-2">
                <div className="bg-surface size-8 animate-pulse rounded-full" />
                <div className="bg-surface h-3 w-32 animate-pulse rounded" />
              </div>
              <div className="bg-surface h-40 w-full animate-pulse rounded-card" />
              <div className="bg-surface h-3 w-48 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="bg-border h-px flex-1" />
        <h2 className="text-muted-foreground text-xs font-medium">
          {t("today")} · {dateLabel}
        </h2>
        <span className="bg-border h-px flex-1" />
      </div>
      <div className="flex flex-col gap-3">
        {drops.map((drop, index) => (
          <motion.div
            key={drop.id}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={cardStagger}
            custom={index}>
            <FeedShareCard
              drop={drop}
              currentUserId={userId}
              groupId={drop.convo_id}
              userRole="member"
              context="discovery"
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
