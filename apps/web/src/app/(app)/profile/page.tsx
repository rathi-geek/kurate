"use client";

import { useEffect, useState } from "react";

import Image from "next/image";

import { ProfileEditModal } from "@/app/_components/profile/ProfileEditModal";
import { ProfileSkeleton } from "@/app/_components/profile/ProfileSkeleton";
import { ContentDNA } from "@/app/_components/vault/ContentDNA";
import { useAuth } from "@/app/_libs/auth-context";
import { useUserInterests } from "@/app/_libs/hooks/useUserInterests";
import { useContentDNA } from "@/app/_libs/hooks/useContentDNA";
import { createClient } from "@/app/_libs/supabase/client";
import { useTranslations } from "@/i18n/use-translations";

const DASH = "—";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const { user, profile, loading } = useAuth();
  const { data: interests = [] } = useUserInterests(user?.id);
  const { data: contentDNA = [] } = useContentDNA();
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

  if (loading && !profile) {
    return <ProfileSkeleton />;
  }

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
    <div className="mx-auto max-w-2xl px-6 py-8">
      <p className="text-muted-foreground mb-6 font-mono text-xs font-medium tracking-wider uppercase">
        {t("title")}
      </p>

      <div className="mb-6 flex items-start gap-4">
        <div className="bg-primary relative h-16 w-16 shrink-0 overflow-hidden rounded-full">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={displayName} fill className="object-cover" sizes="64px" />
          ) : (
            <div className="text-primary-foreground flex h-full w-full items-center justify-center text-2xl font-bold">
              {avatarLetter}
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="mb-1 flex items-center gap-3">
            <h1 className="text-2xl font-bold">{displayName || DASH}</h1>
            <button
              onClick={() => setEditOpen(true)}
              className="hover:bg-accent rounded-full border px-3 py-1.5 text-xs transition-colors">
              {t("edit_btn")}
            </button>
          </div>
          <p className="text-muted-foreground mb-2 font-mono text-sm">
            {handle ? `@${handle}` : ""}
          </p>
          {bio && <p className="text-muted-foreground mb-3 text-sm leading-relaxed">{bio}</p>}

          {interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {interests.map((tag) => (
                <span
                  key={tag}
                  className="bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-5 gap-3">
        {profileStats.map((stat) => (
          <div key={stat.labelKey} className="bg-card rounded-xl border py-4 text-center">
            <div className="text-xl font-bold">{stat.value}</div>
            <div className="text-muted-foreground mt-1 font-mono text-xs uppercase">
              {t(stat.labelKey)}
            </div>
          </div>
        ))}
      </div>

      <ContentDNA interests={contentDNA} totalItems={savedCount ?? 0} />

      <ProfileEditModal open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}
