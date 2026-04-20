"use client";

import { useState, useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "@/i18n/use-translations";

import { createClient } from "@/app/_libs/supabase/client";
import { ROUTES } from "@kurate/utils";
import { track } from "@/app/_libs/utils/analytics";
import { mediaToUrl } from "@/app/_libs/utils/getMediaUrl";
import { queryKeys } from "@kurate/query";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const supabase = createClient();

type SearchProfile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  handle: string | null;
};

export interface FindUserSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
}

export function FindUserSheet({ open, onOpenChange, currentUserId }: FindUserSheetProps) {
  const t = useTranslations("people");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [navigating, setNavigating] = useState<string | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isEmail = EMAIL_REGEX.test(searchQuery.trim());
  const hasNoResults = searchQuery.trim() && !searching && searchResults.length === 0;

  const reset = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSelectUser = async (profile: SearchProfile) => {
    setNavigating(profile.id);
    try {
      const res = await fetch("/api/people/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: profile.id }),
      });
      const json = await res.json() as { convoId?: string; error?: string };
      if (json.convoId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.people.conversations() });
        track("dm_created");
        handleOpenChange(false);
        router.push(ROUTES.APP.PERSON(json.convoId));
      }
    } finally {
      setNavigating(null);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      const trimmed = query.trim();
      if (EMAIL_REGEX.test(trimmed)) {
        setSearchResults([]);
        setSearching(false);
        return;
      }

      const words = trimmed.split(/\s+/);

      const primaryQuery = supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar:avatar_id(file_path, bucket_name), handle")
        .or(
          `handle.ilike.%${trimmed}%,first_name.ilike.%${trimmed}%,last_name.ilike.%${trimmed}%`,
        )
        .eq("is_onboarded", true)
        .neq("id", currentUserId)
        .limit(8);

      const secondaryQuery =
        words.length >= 2
          ? supabase
              .from("profiles")
              .select("id, first_name, last_name, avatar:avatar_id(file_path, bucket_name), handle")
              .ilike("first_name", `%${words[0]}%`)
              .ilike("last_name", `%${words[words.length - 1]}%`)
              .eq("is_onboarded", true)
              .neq("id", currentUserId)
              .limit(8)
          : Promise.resolve({ data: null });

      const [{ data: primaryData }, { data: secondaryData }] = await Promise.all([
        primaryQuery,
        secondaryQuery,
      ]);

      const seen = new Set<string>();
      const merged = [...(primaryData ?? []), ...(secondaryData ?? [])].filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });

      setSearchResults(
        merged.map((p) => ({
          id: p.id,
          display_name:
            [p.first_name, p.last_name].filter(Boolean).join(" ") || null,
          avatar_url: mediaToUrl(p.avatar as { file_path: string; bucket_name: string } | null),
          handle: p.handle ?? null,
        })),
      );
      setSearching(false);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">{t("find_sheet_title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder={t("find_sheet_search_placeholder")}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
            className="text-sm"
          />

          {searching && (
            <p className="text-muted-foreground px-1 text-xs">{t("find_sheet_searching")}</p>
          )}

          {searchResults.length > 0 && (
            <div className="border-border rounded-card overflow-hidden border">
              {searchResults.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  disabled={navigating === profile.id}
                  onClick={() => handleSelectUser(profile)}
                  className="hover:bg-surface border-border/50 flex w-full items-center gap-2.5 border-b px-3 py-2.5 text-left transition-colors last:border-0 disabled:opacity-60"
                >
                  <Avatar className="size-8">
                    {profile.avatar_url && (
                      <AvatarImage src={profile.avatar_url} alt={profile.display_name ?? profile.handle ?? ""} />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {(profile.display_name?.[0] ?? "?").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-foreground text-sm font-medium">
                      {profile.display_name ?? profile.handle ?? t("unknown")}
                    </div>
                    {profile.handle && (
                      <div className="text-muted-foreground text-xs">@{profile.handle}</div>
                    )}
                  </div>
                  {navigating === profile.id && (
                    <span className="text-muted-foreground text-xs">{t("find_sheet_opening")}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {hasNoResults && !isEmail && (
            <p className="text-muted-foreground px-1 text-xs">{t("find_sheet_no_users")}</p>
          )}

          {isEmail && (
            <p className="text-muted-foreground px-1 text-xs">{t("find_sheet_email_hint")}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
