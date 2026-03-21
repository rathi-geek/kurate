"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { ProfileEditModal } from "@/app/_components/profile/ProfileEditModal";
import { useAuth } from "@/app/_libs/auth-context";
import { useUserInterests } from "@/app/_libs/hooks/useUserInterests";
import { createClient } from "@/app/_libs/supabase/client";

const DASH = "—";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const { user, profile } = useAuth();
  const { data: interests = [] } = useUserInterests(user?.id);
  const [editOpen, setEditOpen] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    async function fetchCounts() {
      const { count } = await supabase
        .from("user_logged_items")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      setSavedCount(count ?? 0);
    }

    fetchCounts();
  }, [user]);

  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");
  const handle = profile?.handle ?? "";
  const bio = profile?.about ?? "";
  const avatarUrl = profile?.avatar_url ?? "";
  const avatarLetter = displayName ? displayName[0].toUpperCase() : "?";

  const profileStats = [
    { labelKey: "stat_saved" as const, value: savedCount !== null ? savedCount : DASH },
    { labelKey: "stat_read" as const, value: DASH },
    { labelKey: "stat_shared" as const, value: DASH },
    { labelKey: "stat_following" as const, value: DASH },
    { labelKey: "stat_trust_score" as const, value: DASH },
  ];

  return (
    <div className="mx-auto max-w-xl px-6 py-8">
      <p className="font-mono text-xs font-medium text-muted-foreground uppercase tracking-wider mb-6">
        {t("title")}
      </p>

      <div className="flex items-start gap-4 mb-6">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-primary">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={displayName} fill className="object-cover" sizes="64px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-primary-foreground">
              {avatarLetter}
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{displayName || DASH}</h1>
            <button
              onClick={() => setEditOpen(true)}
              className="text-xs px-3 py-1.5 border rounded-full hover:bg-accent transition-colors">
              {t("edit_btn")}
            </button>
          </div>
          <p className="font-mono text-sm text-muted-foreground mb-2">
            {handle ? `@${handle}` : ""}
          </p>
          {bio && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              {bio}
            </p>
          )}

          {interests.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {interests.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-8">
        {profileStats.map((stat) => (
          <div key={stat.labelKey} className="text-center py-4 bg-card border rounded-xl">
            <div className="text-xl font-bold">{stat.value}</div>
            <div className="font-mono text-xs text-muted-foreground uppercase mt-1">
              {t(stat.labelKey)}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <p className="font-mono text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
          {t("content_dna_title")}
        </p>
        <div className="bg-card border rounded-card p-6">
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            {t("content_dna_coming_soon")}
          </div>
        </div>
      </div>

      <ProfileEditModal open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}
