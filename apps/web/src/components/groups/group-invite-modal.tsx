"use client";

import { useState } from "react";
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
  const [inviteRole, setInviteRole] = useState<Exclude<GroupRole, "owner">>("member");
  const [sendingEmailInvite, setSendingEmailInvite] = useState(false);

  const isEmail = EMAIL_REGEX.test(searchQuery.trim());
  const hasNoResults = searchQuery.trim() && !searching && searchResults.length === 0;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSearchQuery("");
      setSearchResults([]);
    }
    onOpenChange(next);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avtar_url, handle")
      .ilike("handle", `%${query}%`)
      .limit(8);
    setSearchResults(
      (data ?? []).map((p) => ({
        id: p.id,
        display_name: [p.first_name, p.last_name].filter(Boolean).join(" ") || null,
        avatar_url: p.avtar_url,
      })),
    );
    setSearching(false);
  };

  const handleAddMember = async (profileId: string) => {
    setAddingId(profileId);
    await supabase.from("group_members").insert({
      group_id: groupId,
      user_id: profileId,
      role: inviteRole,
      status: "active",
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
      // Requires DB migration: CREATE TABLE group_invites (...)
      // After migration, remove the `as any` cast
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const { error } = await db.from("group_invites").insert({
        group_id: groupId,
        invited_by: currentUserId,
        email: searchQuery.trim().toLowerCase(),
        invite_code: inviteCode,
        status: "pending",
      });
      if (error) throw new Error(error.message);
      toast.success(`Invite sent to ${searchQuery.trim()}`);
      setSearchQuery("");
      setSearchResults([]);
    } catch {
      toast.error("Failed to send invite. DB migration may be needed.");
    } finally {
      setSendingEmailInvite(false);
    }
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
                    <span className="text-foreground flex-1 text-sm">
                      {profile.display_name}
                    </span>
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

          {/* Email invite — show when query looks like an email or no platform users found */}
          {hasNoResults && isEmail && (
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
