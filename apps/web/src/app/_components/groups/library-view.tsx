"use client";

import { useTranslations } from "@/i18n/use-translations";

import { useGroupFeed } from "@/app/_libs/hooks/useGroupFeed";
import { LibraryCard } from "@/app/_components/groups/library-card";
import type { GroupRole, GroupDrop } from "@kurate/types";

interface LibraryViewProps {
  groupId: string;
  currentUserId: string;
  userRole: GroupRole;
}

export function LibraryView({
  groupId,
  currentUserId,
}: LibraryViewProps) {
  const t = useTranslations("groups");
  // Fetch all pages (no cursor — just keep fetching until no more)
  const { drops, isLoading, fetchNextPage, hasNextPage } = useGroupFeed(
    groupId,
    currentUserId,
  );

  // Eagerly load all pages
  if (hasNextPage) {
    fetchNextPage();
  }

  const mustReadDrops = drops.filter(
    (d: GroupDrop) => d.engagement.mustRead.count > 0,
  );

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-card border bg-card aspect-video animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-8">
      {/* Must Read section */}
      {mustReadDrops.length > 0 && (
        <section>
          <p className="mb-3 font-sans text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
            {t("must_read")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mustReadDrops.map((drop: GroupDrop) => (
              <LibraryCard
                key={drop.id}
                drop={drop}
                currentUserId={currentUserId}
                groupId={groupId}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Shared section */}
      <section>
        <p className="mb-3 font-sans text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
          {t("all_shared")}
        </p>
        {drops.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            {t("library_empty")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {drops.map((drop: GroupDrop) => (
              <LibraryCard
                key={drop.id}
                drop={drop}
                currentUserId={currentUserId}
                groupId={groupId}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
