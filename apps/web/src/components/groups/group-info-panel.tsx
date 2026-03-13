"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/app/_libs/supabase/client";
import { useGroupMembers } from "@/app/_libs/hooks/useGroupMembers";
import { PencilIcon } from "@/components/icons";
import { queryKeys } from "@/app/_libs/query/keys";
import type { GroupRole } from "@/app/_libs/types/groups";
import type { Tables } from "@/app/_libs/types/database.types";

const supabase = createClient();

interface GroupInfoPanelProps {
  group: Tables<"groups">;
  currentUserId: string;
  userRole: GroupRole;
}

type ProfileResult = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

export function GroupInfoPanel({
  group,
  currentUserId,
  userRole,
}: GroupInfoPanelProps) {
  const t = useTranslations("groups");
  const queryClient = useQueryClient();
  const { members, isLoading: membersLoading } = useGroupMembers(
    group.id,
    currentUserId,
  );

  const [editingName, setEditingName] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [nameValue, setNameValue] = useState(group.name ?? "");
  const [descValue, setDescValue] = useState(group.description ?? "");
  const [saving, setSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProfileResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [copied, setCopied] = useState(false);

  const isOwner = userRole === "owner";
  const isAdminOrOwner = userRole === "owner" || userRole === "admin";

  const handleSaveName = async () => {
    if (!nameValue.trim()) return;
    setSaving(true);
    await supabase
      .from("groups")
      .update({ name: nameValue.trim() })
      .eq("id", group.id);
    setEditingName(false);
    setSaving(false);
  };

  const handleSaveDesc = async () => {
    setSaving(true);
    await supabase
      .from("groups")
      .update({ description: descValue.trim() || null })
      .eq("id", group.id);
    setEditingDesc(false);
    setSaving(false);
  };

  const handleSearchProfiles = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .ilike("display_name", `%${query}%`)
      .limit(5);
    setSearchResults(data ?? []);
    setSearching(false);
  };

  const handleAddMember = async (profileId: string) => {
    await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: profileId,
      role: "member",
      status: "active",
    });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.groups.members(group.id),
    });
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm(t("remove_member_confirm"))) return;
    await supabase.from("group_members").delete().eq("id", memberId);
    await queryClient.invalidateQueries({
      queryKey: queryKeys.groups.members(group.id),
    });
  };

  const handleCopyInvite = async () => {
    const url = `${window.location.origin}/groups/join/${group.invite_code}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ROLE_LABELS: Record<string, string> = {
    owner: t("member_role_owner"),
    admin: t("member_role_admin"),
    member: t("member_role_member"),
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
      {/* Group identity */}
      <section className="space-y-4">
        {/* Avatar */}
        <div className="flex justify-center">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">
              {(nameValue[0] ?? group.name[0] ?? "G").toUpperCase()}
            </span>
          </div>
        </div>

        {/* Name */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("group_name")}
            </span>
            {isOwner && !editingName && (
              <button
                type="button"
                onClick={() => setEditingName(true)}
                aria-label={t("edit_name_aria")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <PencilIcon className="size-3" />
              </button>
            )}
          </div>
          {editingName ? (
            <div className="flex gap-2">
              <input
                className="flex-1 text-sm px-3 py-1.5 border border-border rounded-card bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") {
                    setEditingName(false);
                    setNameValue(group.name ?? "");
                  }
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveName}
                disabled={saving}
                className="text-xs px-3 py-1.5 rounded-card bg-primary text-primary-foreground disabled:opacity-50"
              >
                {saving ? t("saving") : t("save")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingName(false);
                  setNameValue(group.name ?? "");
                }}
                className="text-xs px-2 py-1.5 rounded-card border border-border text-muted-foreground"
              >
                {t("cancel")}
              </button>
            </div>
          ) : (
            <p className="text-sm font-medium text-foreground">{nameValue}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("group_description")}
            </span>
            {isOwner && !editingDesc && (
              <button
                type="button"
                onClick={() => setEditingDesc(true)}
                aria-label={t("edit_desc_aria")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <PencilIcon className="size-3" />
              </button>
            )}
          </div>
          {editingDesc ? (
            <div className="space-y-2">
              <textarea
                className="w-full text-sm px-3 py-1.5 border border-border rounded-card bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                value={descValue}
                onChange={(e) => setDescValue(e.target.value)}
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveDesc}
                  disabled={saving}
                  className="text-xs px-3 py-1.5 rounded-card bg-primary text-primary-foreground disabled:opacity-50"
                >
                  {saving ? t("saving") : t("save")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingDesc(false);
                    setDescValue(group.description ?? "");
                  }}
                  className="text-xs px-2 py-1.5 rounded-card border border-border text-muted-foreground"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{descValue || "—"}</p>
          )}
        </div>
      </section>

      {/* Members list */}
      <section>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          {members.length} {t("members")}
        </h2>
        {membersLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-9 rounded-card bg-surface animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-0.5">
                {m.profile.avatar_url ? (
                  <Image
                    src={m.profile.avatar_url}
                    alt={m.profile.display_name ?? ""}
                    width={28}
                    height={28}
                    className="rounded-full shrink-0 object-cover"
                  />
                ) : (
                  <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-primary">
                      {(m.profile.display_name?.[0] ?? "?").toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="flex-1 text-sm text-foreground truncate">
                  {m.profile.display_name ?? t("anonymous")}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-surface border border-border/50 shrink-0">
                  {ROLE_LABELS[m.role] ?? m.role}
                </span>
                {isOwner && m.user_id !== currentUserId && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(m.id)}
                    aria-label={t("remove_member_aria")}
                    className="text-sm text-error-foreground hover:opacity-70 transition-opacity shrink-0 leading-none"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add member (admin/owner only) */}
      {isAdminOrOwner && (
        <section className="space-y-2">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t("add_member")}
          </h2>
          <input
            type="text"
            placeholder={t("add_member_placeholder")}
            value={searchQuery}
            onChange={(e) => handleSearchProfiles(e.target.value)}
            className="w-full text-sm px-3 py-1.5 border border-border rounded-card bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searching && (
            <p className="text-xs text-muted-foreground">{t("searching")}</p>
          )}
          {searchResults.length > 0 && (
            <div className="border border-border rounded-card overflow-hidden">
              {searchResults.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => handleAddMember(profile.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface transition-colors text-left border-b border-border/50 last:border-0"
                >
                  <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-primary">
                      {(profile.display_name?.[0] ?? "?").toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-foreground">
                    {profile.display_name}
                  </span>
                </button>
              ))}
            </div>
          )}
          {searchQuery && !searching && searchResults.length === 0 && (
            <p className="text-xs text-muted-foreground">
              {t("no_members_found")}
            </p>
          )}

          {/* Copy invite link */}
          <button
            type="button"
            onClick={handleCopyInvite}
            className="text-xs text-primary hover:opacity-70 transition-opacity"
          >
            {copied ? t("invite_copied") : t("invite_link")}
          </button>
        </section>
      )}
    </div>
  );
}
