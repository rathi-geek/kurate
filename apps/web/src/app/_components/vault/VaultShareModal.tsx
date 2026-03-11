"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/app/_libs/supabase/client";
import { queryKeys } from "@/app/_libs/query/keys";
import type { VaultItem } from "@/app/_libs/types/vault";

interface GroupRow {
  id: string;
  name: string;
}

export interface VaultShareModalProps {
  open: boolean;
  item: VaultItem | null;
  onClose: () => void;
}

export function VaultShareModal({
  open,
  item,
  onClose,
}: VaultShareModalProps) {
  const t = useTranslations("vault");
  const queryClient = useQueryClient();
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    let cancelled = false;

    async function fetchGroups() {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const { data: memberships } = await supabase
          .from("group_members")
          .select("group_id, groups(id, name)")
          .eq("user_id", user.id);
        if (cancelled) return;
        const list: GroupRow[] = [];
        const seen = new Set<string>();
        for (const row of memberships ?? []) {
          const g = (row as { groups: GroupRow | null }).groups;
          if (g?.id && !seen.has(g.id)) {
            seen.add(g.id);
            list.push({ id: g.id, name: g.name });
          }
        }
        setGroups(list);
      } catch {
        if (!cancelled) setGroups([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchGroups();
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function handleShare(groupId: string) {
    if (!item) return;
    const supabase = createClient();
    setSharingId(groupId);
    try {
      const current = item.shared_to_groups ?? [];
      const next = current.includes(groupId)
        ? current
        : [...current, groupId];
      await supabase
        .from("logged_items")
        .update({ shared_to_groups: next })
        .eq("id", item.id);
      queryClient.invalidateQueries({ queryKey: queryKeys.vault.all });
      onClose();
    } finally {
      setSharingId(null);
    }
  }

  const sharedSet = new Set(item?.shared_to_groups ?? []);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("share_modal_title")}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="font-sans text-sm text-muted-foreground">
            …
          </p>
        ) : groups.length === 0 ? (
          <p className="font-sans text-sm text-muted-foreground">
            {t("share_modal_no_groups")}
          </p>
        ) : (
          <ul className="space-y-2">
            {groups.map((group) => {
              const already = sharedSet.has(group.id);
              return (
                <li
                  key={group.id}
                  className="flex items-center justify-between rounded-button border border-border bg-card px-3 py-2"
                >
                  <span className="font-sans text-sm text-foreground">
                    {group.name}
                  </span>
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
      </DialogContent>
    </Dialog>
  );
}
