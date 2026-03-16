"use client";

import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { queryKeys } from "@/app/_libs/query/keys";
import { createClient } from "@/app/_libs/supabase/client";
import { PlusIcon } from "@/components/icons";
import type { GroupRole } from "@/app/_libs/types/groups";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const supabase = createClient();

export interface GroupInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  inviteCode: string;
  memberIds: Set<string>;
  currentUserId: string;
}

type SearchProfile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  handle: string | null;
};

export function GroupInviteModal({
  open,
  onOpenChange,
  groupId,
  inviteCode,
  memberIds,
  currentUserId,
}: GroupInviteModalProps) {
  const t = useTranslations("groups");
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [inviteRole, setInviteRole] = useState<Exclude<GroupRole, "owner">>("member");
  const [sendingEmailInvite, setSendingEmailInvite] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isEmail = EMAIL_REGEX.test(searchQuery.trim());
  const hasNoResults = searchQuery.trim() && !searching && searchResults.length === 0;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSearchQuery("");
      setSearchResults([]);
    }
    onOpenChange(next);
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
      const words = query.trim().split(/\s+/);

      // Primary: match handle OR first_name OR last_name (ilike = case-insensitive)
      const primaryQuery = supabase
        .from("profiles")
        .select("id, first_name, last_name, avtar_url, handle")
        .or(`handle.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .neq("id", currentUserId)
        .limit(8);

      // Secondary: full-name match when query has multiple words (e.g. "john doe")
      const secondaryQuery =
        words.length >= 2
          ? supabase
              .from("profiles")
              .select("id, first_name, last_name, avtar_url, handle")
              .ilike("first_name", `%${words[0]}%`)
              .ilike("last_name", `%${words[words.length - 1]}%`)
              .neq("id", currentUserId)
              .limit(8)
          : Promise.resolve({ data: null });

      const [{ data: primaryData }, { data: secondaryData }] = await Promise.all([
        primaryQuery,
        secondaryQuery,
      ]);

      // Merge and deduplicate by id
      const seen = new Set<string>();
      const merged = [...(primaryData ?? []), ...(secondaryData ?? [])].filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });

      setSearchResults(
        merged.map((p) => ({
          id: p.id,
          display_name: [p.first_name, p.last_name].filter(Boolean).join(" ") || null,
          avatar_url: p.avtar_url,
          handle: p.handle ?? null,
        })),
      );
      setSearching(false);
    }, 300);
  };

  const handleAddMember = async (profileId: string) => {
    setAddingId(profileId);
    await supabase.from("conversation_members").insert({
      convo_id: groupId,
      user_id: profileId,
      role: inviteRole,
    });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.groups.members(groupId),
    });
    setAddingId(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleEmailInvite = async () => {
    if (!isEmail) return;
    setSendingEmailInvite(true);
    try {
      const res = await fetch("/api/groups/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: searchQuery.trim().toLowerCase(),
          groupId,
          inviteCode,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to send invite");
      toast.success(`Invite sent to ${searchQuery.trim()}`);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setSendingEmailInvite(false);
    }
  };

  const encodeEmail = (email: string): string => {
    return btoa(email).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  const handleCopyEmailInvite = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/groups/join/${inviteCode}?e=${encodeEmail(searchQuery.trim().toLowerCase())}`;
    await navigator.clipboard.writeText(url);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyInvite = async () => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/groups/join/${inviteCode}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("add_member")}</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-3">
          <Input
            placeholder={t("add_member_placeholder")}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
          />

          {/* Role selector */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">Add as:</span>
            <button
              type="button"
              onClick={() => setInviteRole("member")}
              className={`text-xs px-2 py-0.5 rounded-badge border transition-colors ${
                inviteRole === "member"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              Member
            </button>
            <button
              type="button"
              onClick={() => setInviteRole("admin")}
              className={`text-xs px-2 py-0.5 rounded-badge border transition-colors ${
                inviteRole === "admin"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              Admin
            </button>
          </div>

          {searching && (
            <p className="text-muted-foreground px-1 text-xs">{t("searching")}</p>
          )}
          {searchResults.length > 0 && (
            <div className="border-border rounded-card overflow-hidden border">
              {searchResults.map((profile) => {
                const alreadyMember = memberIds.has(profile.id);
                return (
                  <button
                    key={profile.id}
                    type="button"
                    disabled={alreadyMember || addingId === profile.id}
                    onClick={() =>
                      !alreadyMember && handleAddMember(profile.id)
                    }
                    className="hover:bg-surface border-border/50 flex w-full items-center gap-2.5 border-b px-3 py-2.5 text-left transition-colors last:border-0 disabled:opacity-60">
                    <div className="bg-primary/10 flex size-7 shrink-0 items-center justify-center rounded-full">
                      <span className="text-primary text-[10px] font-bold">
                        {(profile.display_name?.[0] ?? "?").toUpperCase()}
                      </span>
                    </div>
                    <span className="text-foreground flex-1 text-sm">{profile.display_name}</span>
                    {profile.handle && (
                      <span className="text-muted-foreground text-xs">@{profile.handle}</span>
                    )}
                    {alreadyMember ? (
                      <span className="text-muted-foreground text-[10px]">
                        {t("member_role_member")}
                      </span>
                    ) : addingId === profile.id ? (
                      <span className="text-muted-foreground text-[10px]">
                        {t("saving")}
                      </span>
                    ) : (
                      <PlusIcon className="text-primary size-3.5" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Email invite — show when query looks like an email and no platform users found */}
          {hasNoResults && isEmail && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleEmailInvite}
                disabled={sendingEmailInvite}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left border border-border rounded-card hover:bg-surface transition-colors disabled:opacity-60"
              >
                <PlusIcon className="text-primary size-3.5 shrink-0" />
                <span>
                  {sendingEmailInvite ? "Sending..." : `Invite ${searchQuery.trim()} by email`}
                </span>
              </button>
              <button
                type="button"
                onClick={handleCopyEmailInvite}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left border border-border rounded-card hover:bg-surface transition-colors"
              >
                <PlusIcon className="text-primary size-3.5 shrink-0" />
                <span>{copiedEmail ? "Copied!" : `Copy invite link for ${searchQuery.trim()}`}</span>
              </button>
            </div>
          )}

          {hasNoResults && !isEmail && (
            <p className="text-muted-foreground px-1 text-xs">
              {t("no_members_found")}
            </p>
          )}

          <div className="border-border/50 border-t pt-1">
            <button
              type="button"
              onClick={handleCopyInvite}
              className="text-primary text-xs transition-opacity hover:opacity-70">
              {copied ? t("invite_copied") : t("invite_link")}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
