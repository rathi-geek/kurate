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
  const { user } = useAuth();
  const t = useTranslations("discovery");

  const { todayDrops, newDrops, isLoading } = useDiscoveryFeed(user?.id ?? "");

  useEffect(() => {
    if (scrollDir) onScrollDirectionChange?.(scrollDir);
  }, [scrollDir, onScrollDirectionChange]);

  if (!user) {
    return (
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 pb-16 md:pb-4">
        <div className="mx-auto flex min-h-[40vh] max-w-2xl items-center justify-center">
          <p className="text-center font-sans text-sm text-muted-foreground">
            {t("signin_to_see_discover")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 pb-16 md:pb-4">
      <div className="mx-auto max-w-2xl space-y-8">
        <DiscoveryVaultSection userId={user.id} />
        <DiscoveryTodaySection drops={todayDrops} isLoading={isLoading} userId={user.id} />
        <DiscoveryNewSection drops={newDrops} isLoading={isLoading} userId={user.id} />
      </div>
    </div>
  );
}
