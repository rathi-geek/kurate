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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryKeys } from "@/app/_libs/query/keys";
import { createClient } from "@/app/_libs/supabase/client";
import type { GroupRole } from "@/app/_libs/types/groups";
import { mediaToUrl } from "@/app/_libs/utils/getMediaUrl";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const supabase = createClient();

export interface GroupInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  memberIds: Set<string>;
  currentUserId: string;
}

type SearchProfile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  handle: string | null;
};

function CircleCheck({ checked, disabled }: { checked: boolean; disabled?: boolean }) {
  if (checked) {
    return (
      <div
        className={`size-4 rounded-full flex items-center justify-center shrink-0 ${
          disabled ? "bg-primary/40" : "bg-primary"
        }`}
      >
        <svg viewBox="0 0 10 10" className="size-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={2}>
          <polyline points="2,5 4,7.5 8,3" />
        </svg>
      </div>
    );
  }
  return (
    <div className="size-4 rounded-full border-2 border-muted-foreground/40 shrink-0" />
  );
}

export function GroupInviteModal({
  open,
  onOpenChange,
  groupId,
  memberIds,
  currentUserId,
}: GroupInviteModalProps) {
  const t = useTranslations("groups");
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedProfiles, setSelectedProfiles] = useState<SearchProfile[]>([]);
  const [addingAll, setAddingAll] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [emailProfile, setEmailProfile] = useState<SearchProfile | null>(null);
  const [inviteRole, setInviteRole] = useState<Exclude<GroupRole, "owner">>("member");
  const [sendingEmailInvite, setSendingEmailInvite] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isEmail = EMAIL_REGEX.test(searchQuery.trim());
  const hasNoResults = searchQuery.trim() && !searching && searchResults.length === 0;

  const reset = () => {
    setSearchQuery("");
    setSearchResults([]);
    setEmailProfile(null);
    setSelectedProfiles([]);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const toggleSelect = (profile: SearchProfile) => {
    if (memberIds.has(profile.id)) return;
    setSelectedProfiles((prev) =>
      prev.some((p) => p.id === profile.id)
        ? prev.filter((p) => p.id !== profile.id)
        : [...prev, profile],
    );
  };

  const handleAddAll = async () => {
    if (!selectedProfiles.length) return;
    setAddingAll(true);
    await supabase.from("conversation_members").insert(
      selectedProfiles.map((p) => ({ convo_id: groupId, user_id: p.id, role: inviteRole })),
    );
    await queryClient.invalidateQueries({ queryKey: queryKeys.groups.members(groupId) });
    setAddingAll(false);
    reset();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setEmailProfile(null);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      const trimmed = query.trim();
      const isQueryEmail = EMAIL_REGEX.test(trimmed);

      if (isQueryEmail) {
        const res = await fetch(`/api/groups/invite?email=${encodeURIComponent(trimmed.toLowerCase())}`);
        const json = await res.json();
        if (json.exists && json.profile) {
          setEmailProfile(json.profile as SearchProfile);
        }
        setSearchResults([]);
        setSearching(false);
        return;
      }

      const words = trimmed.split(/\s+/);

      const primaryQuery = supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar:avatar_id(file_path, bucket_name), handle")
        .or(`handle.ilike.%${trimmed}%,first_name.ilike.%${trimmed}%,last_name.ilike.%${trimmed}%`)
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
          display_name: [p.first_name, p.last_name].filter(Boolean).join(" ") || null,
          avatar_url: mediaToUrl(p.avatar as { file_path: string; bucket_name: string } | null),
          handle: p.handle ?? null,
        })),
      );
      setSearching(false);
    }, 300);
  };

  const encodeEmail = (email: string): string =>
    btoa(email).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const handleCopyEmailInvite = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/groups/join/${groupId}?e=${encodeEmail(searchQuery.trim().toLowerCase())}`;
    await navigator.clipboard.writeText(url);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
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
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to send invite");
      toast.success(`Invite sent to ${searchQuery.trim()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setSendingEmailInvite(false);
    }
  };

  const renderProfileRow = (profile: SearchProfile, key: string) => {
    const alreadyMember = memberIds.has(profile.id);
    const isSelected = selectedProfiles.some((p) => p.id === profile.id);
    return (
      <button
        key={key}
        type="button"
        disabled={alreadyMember}
        onClick={() => toggleSelect(profile)}
        className="hover:bg-surface border-border/50 flex w-full items-center gap-2.5 border-b px-3 py-2.5 text-left transition-colors last:border-0 disabled:opacity-50"
      >
        <div className="bg-primary/10 flex size-7 shrink-0 items-center justify-center rounded-full">
          <span className="text-primary text-[10px] font-bold">
            {(profile.display_name?.[0] ?? "?").toUpperCase()}
          </span>
        </div>
        <span className="text-foreground flex-1 text-sm">{profile.display_name}</span>
        {profile.handle && (
          <span className="text-muted-foreground text-xs">@{profile.handle}</span>
        )}
        <CircleCheck checked={alreadyMember || isSelected} disabled={alreadyMember} />
      </button>
    );
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

          {/* Selected chips */}
          {selectedProfiles.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedProfiles.map((p) => (
                <span
                  key={p.id}
                  className="bg-primary/10 text-primary flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs"
                >
                  {p.display_name ?? p.handle ?? "?"}
                  <button
                    type="button"
                    onClick={() => toggleSelect(p)}
                    className="hover:text-primary/70 leading-none"
                    aria-label="Remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

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
              {searchResults.map((profile) => renderProfileRow(profile, profile.id))}
            </div>
          )}

          {/* Email matches a platform user — show their profile to select */}
          {emailProfile && (
            <div className="border-border rounded-card overflow-hidden border">
              {renderProfileRow(emailProfile, `email-${emailProfile.id}`)}
            </div>
          )}

          {/* Email invite — show when email typed but NOT already a platform user */}
          {isEmail && !emailProfile && hasNoResults && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleEmailInvite}
                disabled={sendingEmailInvite}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left border border-border rounded-card hover:bg-surface transition-colors disabled:opacity-60"
              >
                <svg className="size-4 shrink-0 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m2 7 10 7 10-7" />
                </svg>
                <span>
                  {sendingEmailInvite ? "Sending..." : `Invite ${searchQuery.trim()} by email`}
                </span>
              </button>
              <button
                type="button"
                onClick={handleCopyEmailInvite}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left border border-border rounded-card hover:bg-surface transition-colors"
              >
                <svg className="size-4 shrink-0 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <span>{copiedEmail ? "Copied!" : `Copy invite link for ${searchQuery.trim()}`}</span>
              </button>
            </div>
          )}

          {hasNoResults && !isEmail && (
            <p className="text-muted-foreground px-1 text-xs">
              Not able to find user? Enter their email to send an invite to join.
            </p>
          )}

          {/* Batch add button */}
          {selectedProfiles.length > 0 && (
            <Button
              onClick={handleAddAll}
              disabled={addingAll}
              className="w-full"
              size="sm"
            >
              {addingAll
                ? "Adding..."
                : `Add ${selectedProfiles.length} member${selectedProfiles.length > 1 ? "s" : ""}`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
