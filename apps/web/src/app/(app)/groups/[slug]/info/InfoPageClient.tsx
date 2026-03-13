"use client";

import { Suspense, useState } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { useGroupFeed } from "@/app/_libs/hooks/useGroupFeed";
import { useGroupMembers } from "@/app/_libs/hooks/useGroupMembers";
import { queryKeys } from "@/app/_libs/query/keys";
import { createClient } from "@/app/_libs/supabase/client";
import type { Tables } from "@/app/_libs/types/database.types";
import type { GroupDrop, GroupRole } from "@/app/_libs/types/groups";
import { LibraryCard } from "@/components/groups/library-card";
import { ChevronLeftIcon, PencilIcon, PlusIcon } from "@/components/icons";

const supabase = createClient();

type Modal = "invite" | "edit" | null;

interface InfoPageClientProps {
  group: Tables<"groups">;
  currentUserId: string;
  userRole: GroupRole;
  groupSlug: string;
}

export function InfoPageClient(props: InfoPageClientProps) {
  return (
    <Suspense fallback={null}>
      <InfoPageInner {...props} />
    </Suspense>
  );
}

function InfoPageInner({ group, currentUserId, userRole, groupSlug }: InfoPageClientProps) {
  const t = useTranslations("groups");
  const router = useRouter();
  const queryClient = useQueryClient();

  const { members, isLoading: membersLoading } = useGroupMembers(group.id, currentUserId);
  const {
    drops,
    isLoading: feedLoading,
    fetchNextPage,
    hasNextPage,
  } = useGroupFeed(group.id, currentUserId);

  // Eagerly load all pages for the library
  if (hasNextPage) fetchNextPage();

  const [openModal, setOpenModal] = useState<Modal>(null);
  const [copied, setCopied] = useState(false);

  // Edit modal state
  const [editName, setEditName] = useState(group.name ?? "");
  const [editDesc, setEditDesc] = useState(group.description ?? "");
  const [saving, setSaving] = useState(false);

  // Invite search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; display_name: string | null; avatar_url: string | null }>
  >([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const isOwner = userRole === "owner";
  const isAdminOrOwner = userRole === "owner" || userRole === "admin";

  // ── Copy invite link ──────────────────────────────────────────────────────
  const handleCopyInvite = async () => {
    const url = `${window.location.origin}/groups/join/${group.invite_code}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Save group info ───────────────────────────────────────────────────────
  const handleSaveInfo = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    await supabase
      .from("groups")
      .update({ name: editName.trim(), description: editDesc.trim() || null })
      .eq("id", group.id);
    setSaving(false);
    setOpenModal(null);
  };

  // ── Search profiles ───────────────────────────────────────────────────────
  const handleSearch = async (query: string) => {
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
      .limit(8);
    setSearchResults(data ?? []);
    setSearching(false);
  };

  // ── Add member ────────────────────────────────────────────────────────────
  const handleAddMember = async (profileId: string) => {
    setAddingId(profileId);
    await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: profileId,
      role: "member",
      status: "active",
    });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.groups.members(group.id),
    });
    setAddingId(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  const avatarInitial = (group.name?.[0] ?? "G").toUpperCase();
  const memberIds = new Set(members.map((m) => m.user_id));

  return (
    <div className="mx-auto flex h-full max-w-md flex-col overflow-hidden">
      {/* ── Scrollable body ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-start gap-5 px-5 py-5">
          <div className="flex w-full flex-row items-start gap-3">
            <div className="flex shrink-0 flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => router.push(`/groups/${groupSlug}`)}
                aria-label={t("back_to_feed")}
                className="text-muted-foreground hover:text-foreground hover:bg-surface shrink-0 rounded-md p-1.5 transition-colors">
                <ChevronLeftIcon className="size-[18px]" />
              </button>

              {/* Avatar with edit overlay */}
              <div className="relative">
                <div className="bg-primary/10 flex size-20 items-center justify-center rounded-full">
                  <span className="text-primary text-3xl font-bold">{avatarInitial}</span>
                </div>

                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setOpenModal("edit")}
                    aria-label={t("edit_name_aria")}
                    className="bg-card border-border text-muted-foreground hover:text-foreground absolute -right-0.5 -bottom-0.5 flex size-6 items-center justify-center rounded-full border shadow-sm transition-colors">
                    <PencilIcon className="size-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="pt-1">
              <h1 className="text-foreground font-serif text-xl leading-tight font-normal">
                {group.name}
              </h1>
              {group.description && (
                <p className="text-muted-foreground mt-1 text-sm leading-snug">
                  {group.description}
                </p>
              )}
            </div>
          </div>

          {/* Members strip: + button then avatars with names */}
          <div className="flex items-center gap-4 overflow-x-auto pb-1 w-full no-scrollbar">
            {/* Add button */}
            {isAdminOrOwner && (
              <button
                type="button"
                onClick={() => setOpenModal("invite")}
                aria-label={t("add_member")}
                className="flex shrink-0 flex-col items-center gap-1.5 group"
              >
                <div className="size-11 rounded-full border-2 border-dashed border-border bg-card flex items-center justify-center text-muted-foreground group-hover:border-primary group-hover:text-primary transition-colors">
                  <PlusIcon className="size-4" />
                </div>
                <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors leading-none">
                  {t("add_member")}
                </span>
              </button>
            )}

            {/* Member avatars + names */}
            {membersLoading
              ? [1, 2, 3].map((i) => (
                  <div key={i} className="flex shrink-0 flex-col items-center gap-1.5">
                    <div className="size-11 rounded-full bg-surface animate-pulse" />
                    <div className="h-2.5 w-8 rounded bg-surface animate-pulse" />
                  </div>
                ))
              : members.map((m) => (
                  <div key={m.id} className="flex shrink-0 flex-col items-center gap-1.5">
                    {m.profile.avatar_url ? (
                      <Image
                        src={m.profile.avatar_url}
                        alt={m.profile.display_name ?? ""}
                        width={44}
                        height={44}
                        className="size-11 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center border border-border/50">
                        <span className="text-sm font-bold text-primary">
                          {(m.profile.display_name?.[0] ?? "?").toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-[10px] text-muted-foreground leading-none max-w-[44px] truncate text-center">
                      {m.profile.display_name ?? t("anonymous")}
                    </span>
                  </div>
                ))}
          </div>
        </div>

        {/* ── Library grid (Instagram style) ───────────────────────── */}
        <div className="px-1 py-1">
          {feedLoading ? (
            <div className="grid grid-cols-3 gap-0.5">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-surface aspect-square animate-pulse" />
              ))}
            </div>
          ) : drops.length === 0 ? (
            <div className="text-muted-foreground py-16 text-center text-sm">
              {t("library_empty")}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5 sm:grid-cols-3">
              {drops.map((drop: GroupDrop) => (
                <LibraryCard
                  key={drop.id}
                  drop={drop}
                  currentUserId={currentUserId}
                  groupId={group.id}
                  groupSlug={groupSlug}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Invite / search modal ────────────────────────────────────── */}
      <Dialog
        open={openModal === "invite"}
        onOpenChange={(o) => {
          if (!o) {
            setOpenModal(null);
            setSearchQuery("");
            setSearchResults([]);
          }
        }}>
        <DialogContent className="max-w-sm">
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
            {searching && <p className="text-muted-foreground px-1 text-xs">{t("searching")}</p>}
            {searchResults.length > 0 && (
              <div className="border-border rounded-card overflow-hidden border">
                {searchResults.map((profile) => {
                  const alreadyMember = memberIds.has(profile.id);
                  return (
                    <button
                      key={profile.id}
                      type="button"
                      disabled={alreadyMember || addingId === profile.id}
                      onClick={() => !alreadyMember && handleAddMember(profile.id)}
                      className="hover:bg-surface border-border/50 flex w-full items-center gap-2.5 border-b px-3 py-2.5 text-left transition-colors last:border-0 disabled:opacity-60">
                      <div className="bg-primary/10 flex size-7 shrink-0 items-center justify-center rounded-full">
                        <span className="text-primary text-[10px] font-bold">
                          {(profile.display_name?.[0] ?? "?").toUpperCase()}
                        </span>
                      </div>
                      <span className="text-foreground flex-1 text-sm">{profile.display_name}</span>
                      {alreadyMember ? (
                        <span className="text-muted-foreground text-[10px]">
                          {t("member_role_member")}
                        </span>
                      ) : addingId === profile.id ? (
                        <span className="text-muted-foreground text-[10px]">{t("saving")}</span>
                      ) : (
                        <PlusIcon className="text-primary size-3.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {searchQuery && !searching && searchResults.length === 0 && (
              <p className="text-muted-foreground px-1 text-xs">{t("no_members_found")}</p>
            )}
            {/* Invite link fallback */}
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

      {/* ── Edit group info modal ────────────────────────────────────── */}
      <Dialog open={openModal === "edit"} onOpenChange={(o) => !o && setOpenModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("edit_group_info")}</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <div className="space-y-1.5">
              <label className="text-foreground text-sm font-medium">{t("group_name")}</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
            </div>
            <div className="space-y-1.5">
              <label className="text-foreground text-sm font-medium">
                {t("group_description")}
              </label>
              <Textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpenModal(null)}
                disabled={saving}>
                {t("cancel")}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!editName.trim() || saving}
                onClick={handleSaveInfo}>
                {saving ? t("saving") : t("save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

