"use client";

import { useState, useMemo } from "react";

import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { VaultModal } from "@/app/_components/vault/VaultModal";
import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@/app/_libs/query/keys";
import { fetchUserGroups, type GroupRow } from "@/app/_libs/utils/fetchUserGroups";
import type { VaultItem } from "@/app/_libs/types/vault";
import { SearchIcon, CheckIcon } from "@/components/icons";
import { Spinner } from "@/app/_components/spinner";
import { cn } from "@/app/_libs/utils/cn";

const supabase = createClient();

export interface VaultShareModalProps {
  open: boolean;
  item: VaultItem | null;
  onClose: () => void;
}

function groupMatchesSearch(group: GroupRow, query: string): boolean {
  if (!query.trim()) return true;
  return group.name.toLowerCase().includes(query.trim().toLowerCase());
}

export function VaultShareModal({ open, item, onClose }: VaultShareModalProps) {
  const t = useTranslations("vault");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSharing, setIsSharing] = useState(false);
  const [sharedGroups, setSharedGroups] = useState<Set<string>>(new Set());

  const { data: groups = [], isLoading } = useQuery({
    queryKey: queryKeys.groups.list(),
    queryFn: fetchUserGroups,
    enabled: open,
    staleTime: 1000 * 60 * 5,
  });

  const filteredGroups = useMemo(
    () => groups.filter((g) => groupMatchesSearch(g, search)),
    [groups, search],
  );

  function toggleGroup(id: string) {
    if (sharedGroups.has(id)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleShareSelected() {
    if (!item || selectedIds.size === 0) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setIsSharing(true);
    try {
      const toShare = Array.from(selectedIds);
      await Promise.all(
        toShare.map((convo_id) =>
          supabase.from("group_posts").insert({
            convo_id,
            logged_item_id: item.logged_item_id,
            shared_by: user.id,
          }),
        ),
      );
      setSharedGroups((prev) => new Set([...prev, ...toShare]));
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: queryKeys.vault.all });
      onClose();
    } finally {
      setIsSharing(false);
    }
  }

  const sharedSet = sharedGroups;
  const canShare = selectedIds.size > 0 && !isSharing;

  return (
    <VaultModal
      open={open}
      onClose={onClose}
      title={t("share_modal_title")}
      contentClassName="max-w-md sm:max-w-md flex flex-col max-h-[85vh]"
      footer={
        canShare ? (
          <Button onClick={handleShareSelected} disabled={isSharing}>
            {isSharing ? <Spinner /> : null}
            {!isSharing ? t("share_modal_share_selected") : null}
          </Button>
        ) : undefined
      }
    >
      {/* Search bar */}
      <div className="mb-3 shrink-0">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("share_modal_search_placeholder")}
            className="pl-9 font-sans"
            aria-label={t("share_modal_search_placeholder")}
          />
        </div>
      </div>

      {/* Group grid */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="font-sans text-sm text-muted-foreground">…</p>
        ) : groups.length === 0 ? (
          <p className="font-sans text-sm text-muted-foreground">{t("share_modal_no_groups")}</p>
        ) : filteredGroups.length === 0 ? (
          <p className="font-sans text-sm text-muted-foreground">{t("share_modal_no_results")}</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {filteredGroups.map((group) => {
              const already = sharedSet.has(group.id);
              const selected = selectedIds.has(group.id);
              const initial = (group.name?.[0] ?? "G").toUpperCase();
              const disabled = already;

              return (
                <button
                  key={group.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && toggleGroup(group.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-button border-2 bg-card transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    disabled && "cursor-not-allowed opacity-60",
                    !disabled && "hover:border-border hover:bg-surface",
                    selected && "border-primary bg-primary/5",
                  )}
                  aria-pressed={selected}
                  aria-label={group.name}
                >
                  <div className="relative mt-2">
                    <Avatar className="h-14 w-14 rounded-pill">
                      {/* When group avatar_url is added to API, use AvatarImage here */}
                      <AvatarFallback className="rounded-pill bg-muted font-sans text-lg font-medium text-foreground">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    {selected && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                        aria-hidden
                      >
                        <CheckIcon className="h-3 w-3" />
                      </span>
                    )}
                    {already && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/80 text-card"
                        aria-hidden
                      >
                        <CheckIcon className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <span className="max-w-[72px] truncate px-1 pb-2 font-sans text-xs text-foreground">
                    {group.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </VaultModal>
  );
}
