"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

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

const supabase = createClient();

export interface GroupInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  inviteCode: string;
  memberIds: Set<string>;
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
}: GroupInviteModalProps) {
  const t = useTranslations("groups");
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
      role: "member",
      status: "active",
    });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.groups.members(groupId),
    });
    setAddingId(null);
    setSearchQuery("");
    setSearchResults([]);
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
          {searchQuery && !searching && searchResults.length === 0 && (
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
