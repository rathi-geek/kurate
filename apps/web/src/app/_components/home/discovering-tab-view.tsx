"use client";

import { useEffect, useRef } from "react";

import { DiscoveryNewSection } from "@/app/_components/home/discovery-new-section";
import { DiscoveryTodaySection } from "@/app/_components/home/discovery-today-section";
import { DiscoveryVaultSection } from "@/app/_components/home/discovery-vault-section";
import { useAuth } from "@/app/_libs/auth-context";
import { useDiscoveryFeed } from "@/app/_libs/hooks/useDiscoveryFeed";
import { useScrollDirection } from "@/app/_libs/hooks/useScrollDirection";
import { useTranslations } from "@/i18n/use-translations";

interface DiscoveringTabViewProps {
  onScrollDirectionChange?: (dir: "up" | "down") => void;
}

export function DiscoveringTabView({ onScrollDirectionChange }: DiscoveringTabViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollDir = useScrollDirection(scrollRef);
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations("discovery");

  const { todayDrops, newDrops, isLoading } = useDiscoveryFeed(user?.id ?? "");

  useEffect(() => {
    if (scrollDir) onScrollDirectionChange?.(scrollDir);
  }, [scrollDir, onScrollDirectionChange]);

  if (authLoading) {
    return (
      <div ref={scrollRef} className="flex-1 no-scrollbar overflow-y-auto p-4 pb-16 md:pb-4">
        <div className="mx-auto max-w-2xl space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-card border-border bg-card h-48 animate-pulse border" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div ref={scrollRef} className="flex-1 no-scrollbar overflow-y-auto p-4 pb-16 md:pb-4">
        <div className="mx-auto flex min-h-[40vh] max-w-2xl items-center justify-center">
          <p className="text-center font-sans text-sm text-muted-foreground">
            {t("signin_to_see_discover")}
          </p>
        </div>
      </div>
    );
  }

  const feedEmpty = !isLoading && todayDrops.length === 0 && newDrops.length === 0;

  return (
    <div ref={scrollRef} className="flex-1 no-scrollbar overflow-y-auto p-4 pb-16 md:pb-4">
      <div className="mx-auto max-w-2xl space-y-8">
        <DiscoveryVaultSection userId={user.id} />
        <DiscoveryTodaySection drops={todayDrops} isLoading={isLoading} userId={user.id} />
        <DiscoveryNewSection drops={newDrops} isLoading={isLoading} userId={user.id} />

        {feedEmpty && (
          <div className="flex flex-col items-center justify-center gap-2 px-8 py-16 text-center">
            <p className="text-foreground text-sm font-medium">{t("empty_title")}</p>
            <p className="text-muted-foreground text-xs">{t("empty_subtitle")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
