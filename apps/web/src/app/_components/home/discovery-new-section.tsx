"use client";

import { motion } from "framer-motion";
import { useTranslations } from "@/i18n/use-translations";

import type { GroupDrop } from "@kurate/types";
import { cardStagger } from "@/app/_libs/utils/motion";
import { FeedShareCard } from "@/app/_components/groups/feed-share-card";

interface DiscoveryNewSectionProps {
  drops: GroupDrop[];
  isLoading: boolean;
  userId: string;
}

export function DiscoveryNewSection({ drops, isLoading, userId }: DiscoveryNewSectionProps) {
  const t = useTranslations("discovery");

  if (isLoading || !drops.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="bg-border h-px flex-1" />
        <h2 className="text-muted-foreground text-xs font-medium">{t("new_since_visit")}</h2>
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
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
