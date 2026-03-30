"use client";

import { motion } from "framer-motion";
import { useTranslations } from "@/i18n/use-translations";

import { useDiscoveryVault } from "@/app/_libs/hooks/useDiscoveryVault";
import { staggerContainer, staggerItem } from "@/app/_libs/utils/motion";
import { VaultDiscoveryCard } from "@/app/_components/home/vault-discovery-card";

interface DiscoveryVaultSectionProps {
  userId: string;
}

export function DiscoveryVaultSection({ userId }: DiscoveryVaultSectionProps) {
  const t = useTranslations("discovery");
  const { data: items, isLoading } = useDiscoveryVault(userId);

  if (isLoading || !items?.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="bg-border h-px flex-1" />
        <h2 className="text-muted-foreground text-xs font-medium">{t("from_vault")}</h2>
        <span className="bg-border h-px flex-1" />
      </div>
      <motion.div
        className="-mx-4 flex gap-3 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}>
        {items.map((item) => (
          <motion.div key={item.id} variants={staggerItem} className="shrink-0">
            <VaultDiscoveryCard
              title={item.title}
              url={item.url}
              createdAt={item.created_at}
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
