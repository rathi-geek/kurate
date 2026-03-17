"use client";

import { useState } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import { ShareTargetGrid } from "@/app/_components/shared/share-target-grid";
import { Spinner } from "@/app/_components/spinner";
import { VaultModal } from "@/app/_components/vault/VaultModal";
import { queryKeys } from "@/app/_libs/query/keys";
import { createClient } from "@/app/_libs/supabase/client";
import type { VaultItem } from "@/app/_libs/types/vault";
import { cn } from "@/app/_libs/utils/cn";
import { fetchShareableConversations } from "@/app/_libs/utils/fetchShareableConversations";

const supabase = createClient();

export interface VaultShareModalProps {
  open: boolean;
  item: VaultItem | null;
  onClose: () => void;
}

export function VaultShareModal({ open, item, onClose }: VaultShareModalProps) {
  const t = useTranslations("vault");
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSharing, setIsSharing] = useState(false);
  const [sharedIds, setSharedIds] = useState<Set<string>>(new Set());

  const { data: conversations = [] } = useQuery({
    queryKey: queryKeys.vault.shareConversations(),
    queryFn: fetchShareableConversations,
    enabled: open,
    staleTime: 1000 * 60 * 5,
  });

  function handleSelectionChange(ids: string[]) {
    setSelectedIds(new Set(ids));
  }

  async function handleShareSelected() {
    if (!item || selectedIds.size === 0) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setIsSharing(true);
    try {
      const toShare = Array.from(selectedIds);
      const convoMap = new Map(conversations.map((c) => [c.id, c]));

      await Promise.all(
        toShare.map((convo_id) => {
          const convo = convoMap.get(convo_id);
          if (convo?.type === "dm") {
            return supabase.from("messages").insert({
              convo_id,
              sender_id: user.id,
              message_text: "",
              message_type: "logged_item" as const,
              logged_item_id: item.logged_item_id,
            });
          }
          return supabase.from("group_posts").insert({
            convo_id,
            logged_item_id: item.logged_item_id,
            shared_by: user.id,
          });
        }),
      );

      const dmIds = toShare.filter((id) => convoMap.get(id)?.type === "dm");
      queryClient.invalidateQueries({ queryKey: queryKeys.vault.all });
      if (dmIds.length > 0) {
        queryClient.invalidateQueries({ queryKey: queryKeys.people.conversations() });
        for (const dmId of dmIds) {
          queryClient.invalidateQueries({ queryKey: queryKeys.people.messages(dmId) });
        }
      }

      setSharedIds((prev) => new Set([...prev, ...toShare]));
      setSelectedIds(new Set());
      onClose();
    } finally {
      setIsSharing(false);
    }
  }

  const canShare = selectedIds.size > 0 && !isSharing;

  return (
    <VaultModal
      open={open}
      onClose={onClose}
      title={t("share_modal_title")}
      contentClassName="max-w-md sm:max-w-md flex flex-col max-h-[85vh]"
      footer={
        <Button
          onClick={handleShareSelected}
          disabled={isSharing || !canShare}
          className={cn(isSharing || !canShare ? "opacity-50" : undefined)}>
          {isSharing ? <Spinner /> : null}
          {!isSharing ? t("share_modal_share_selected") : null}
        </Button>
      }>
      <ShareTargetGrid
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
        alreadySharedIds={sharedIds}
        enabled={open}
        maxHeight="max-h-[60vh]"
        avatarSize="md"
      />
    </VaultModal>
  );
}
