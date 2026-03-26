"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/i18n/use-translations";

import { useGroupMembers } from "@/app/_libs/hooks/useGroupMembers";
import { createClient } from "@/app/_libs/supabase/client";
import type { GroupRole } from "@kurate/types";
import type { Tables } from "@kurate/types";

const supabase = createClient();

interface GroupHeaderProps {
  group: Tables<"conversations">;
  currentUserId: string;
  currentUserRole: GroupRole;
  groupId: string;
}

export function GroupHeader({
  group,
  currentUserId,
  currentUserRole,
}: GroupHeaderProps) {
  const t = useTranslations("groups");
  const router = useRouter();
  const { members } = useGroupMembers(group.id, currentUserId);
  const [showSettings, setShowSettings] = useState(false);

  const handleDeleteGroup = async () => {
    if (!window.confirm(t("delete_group_confirm"))) return;
    await supabase.from("conversations").delete().eq("id", group.id);
    router.push("/home");
  };

  return (
    <div className="shrink-0 px-4 pt-4 pb-2 border-b border-border bg-background">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Group icon */}
          <div className="size-10 rounded-card bg-primary/10 flex items-center justify-center shrink-0">
            <div className="size-3 rounded-full bg-primary" />
          </div>

          <div className="min-w-0">
            <h1 className="font-serif text-xl font-normal tracking-tight text-ink truncate">
              {group.group_name}
            </h1>
            {group.group_description && (
              <p className="text-xs text-muted-foreground truncate">
                {group.group_description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Member avatars */}
          <div className="flex -space-x-1.5">
            {members.slice(0, 5).map((m) => (
              <div key={m.id} className="size-6 shrink-0">
                {m.profile.avatar_url ? (
                  <Image
                    src={m.profile.avatar_url}
                    alt={m.profile.display_name ?? ""}
                    width={24}
                    height={24}
                    className="rounded-full object-cover border-2 border-background"
                  />
                ) : (
                  <div className="size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px] font-bold border-2 border-background">
                    {(m.profile.display_name ?? "?")[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            ))}
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {members.length} {t("members")}
          </span>

          {/* Owner settings */}
          {currentUserRole === "owner" && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSettings((v) => !v)}
                className="text-xs px-2 py-1 rounded-badge border border-border hover:bg-surface transition-colors text-muted-foreground"
                aria-label={t("settings_aria")}
              >
                ···
              </button>
              {showSettings && (
                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-card shadow-md z-10 min-w-[140px]">
                  <button
                    type="button"
                    onClick={handleDeleteGroup}
                    className="w-full text-left text-sm px-3 py-2 text-error-foreground hover:bg-error-bg transition-colors rounded-card"
                  >
                    {t("delete_group")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
