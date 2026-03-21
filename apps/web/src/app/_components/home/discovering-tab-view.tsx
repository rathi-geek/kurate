"use client";

import { useEffect, useMemo, useRef } from "react";

import { useScrollDirection } from "@/app/_libs/hooks/useScrollDirection";
import { useAuth } from "@/app/_libs/auth-context";
import { useDiscoveryNew } from "@/app/_libs/hooks/useDiscoveryNew";
import { useDiscoveryToday } from "@/app/_libs/hooks/useDiscoveryToday";
import { DiscoveryVaultSection } from "@/app/_components/home/discovery-vault-section";
import { DiscoveryTodaySection } from "@/app/_components/home/discovery-today-section";
import { DiscoveryNewSection } from "@/app/_components/home/discovery-new-section";

interface DiscoveringTabViewProps {
  onScrollDirectionChange?: (dir: "up" | "down") => void;
}

export function DiscoveringTabView({ onScrollDirectionChange }: DiscoveringTabViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollDir = useScrollDirection(scrollRef);
  const { user } = useAuth();

  const { drops: todayDrops, isLoading: todayLoading } = useDiscoveryToday(user?.id ?? "");
  const { drops: newDrops, isLoading: newLoading } = useDiscoveryNew(user?.id ?? "");

  const todayIds = useMemo(() => new Set(todayDrops.map((d) => d.id)), [todayDrops]);
  const filteredNewDrops = useMemo(
    () => newDrops.filter((d) => !todayIds.has(d.id)),
    [newDrops, todayIds],
  );

  useEffect(() => {
    if (scrollDir) onScrollDirectionChange?.(scrollDir);
  }, [scrollDir, onScrollDirectionChange]);

  if (!user) {
    return <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 pb-16 md:pb-4" />;
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 pb-16 md:pb-4">
      <div className="mx-auto max-w-2xl space-y-8">
        <DiscoveryVaultSection userId={user.id} />
        <DiscoveryTodaySection drops={todayDrops} isLoading={todayLoading} userId={user.id} />
        <DiscoveryNewSection drops={filteredNewDrops} isLoading={newLoading} userId={user.id} />
      </div>
    </div>
  );
}
