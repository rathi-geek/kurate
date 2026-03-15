"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { VaultModal } from "@/app/_components/vault/VaultModal";
import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@/app/_libs/query/keys";
import { fetchUserGroups } from "@/app/_libs/utils/fetchUserGroups";
import type { VaultItem } from "@/app/_libs/types/vault";

const supabase = createClient();

export interface VaultShareModalProps {
  open: boolean;
  item: VaultItem | null;
  onClose: () => void;
}

export function VaultShareModal({ open, item, onClose }: VaultShareModalProps) {
  const t = useTranslations("vault");
  const queryClient = useQueryClient();
  const [sharingId, setSharingId] = useState<string | null>(null);
  // Track groups shared to in this session for optimistic "already shared" display
  const [sharedGroups, setSharedGroups] = useState<Set<string>>(new Set());

  const { data: groups = [], isLoading } = useQuery({
    queryKey: queryKeys.groups.list(),
    queryFn: fetchUserGroups,
    enabled: open,
    staleTime: 1000 * 60 * 5,
  });

  async function handleShare(groupId: string) {
    if (!item) return;
    setSharingId(groupId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("group_posts").insert({
        convo_id: groupId,
        logged_item_id: item.logged_item_id,
        shared_by: user.id,
      });
      setSharedGroups((prev) => new Set([...prev, groupId]));
      queryClient.invalidateQueries({ queryKey: queryKeys.vault.all });
      onClose();
    } finally {
      setSharingId(null);
    }
  }

  const sharedSet = sharedGroups;

  return (
    <VaultModal open={open} onClose={onClose} title={t("share_modal_title")}>
      {isLoading ? (
        <p className="font-sans text-sm text-muted-foreground">…</p>
      ) : groups.length === 0 ? (
        <p className="font-sans text-sm text-muted-foreground">{t("share_modal_no_groups")}</p>
      ) : (
        <ul className="space-y-2">
          {groups.map((group) => {
            const already = sharedSet.has(group.id);
            return (
              <li
                key={group.id}
                className="flex items-center justify-between rounded-button border border-border bg-card px-3 py-2"
              >
                <span className="font-sans text-sm text-foreground">{group.name}</span>
                {already ? (
                  <span className="font-sans text-xs text-muted-foreground">
                    ✓ {t("share_modal_already_shared")}
                  </span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={sharingId !== null}
                    onClick={() => handleShare(group.id)}
                  >
                    {t("share_modal_share_btn")}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </VaultModal>
  );
}
