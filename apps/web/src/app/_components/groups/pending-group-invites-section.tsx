"use client";

import { useState } from "react";

import { ROUTES } from "@kurate/utils";
import { toast } from "sonner";

import type { GroupInvite } from "@/app/_libs/hooks/useGroupInvites";
import { CheckIcon, CloseIcon, CopyIcon } from "@/components/icons";
import { useTranslations } from "@/i18n/use-translations";

function encodeEmail(email: string): string {
  return btoa(email).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export interface PendingGroupInvitesSectionProps {
  groupId: string;
  invites: GroupInvite[];
  onRemoveInvite: (inviteId: string) => void;
}

export function PendingGroupInvitesSection({
  groupId,
  invites,
  onRemoveInvite,
}: PendingGroupInvitesSectionProps) {
  const t = useTranslations("groups");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (invites.length === 0) return null;

  return (
    <div className="px-2 pb-4 md:px-5">
      <p className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-wider uppercase">
        {t("pending_invites_title")}
      </p>
      <div className="rounded-card border-border overflow-hidden border">
        {invites.map((invite) => {
          const isCopied = copiedId === invite.id;
          const copyUrl = async () => {
            const origin = typeof window !== "undefined" ? window.location.origin : "";
            const url = `${origin}${ROUTES.APP.GROUP_JOIN(groupId)}?e=${encodeEmail(invite.invited_email)}`;
            await navigator.clipboard.writeText(url);
            setCopiedId(invite.id);
            setTimeout(() => setCopiedId(null), 2000);
          };
          return (
            <div
              key={invite.id}
              className="border-border flex items-center gap-2.5 border-b px-4 py-2.5 last:border-0">
              <span className="text-foreground flex-1 truncate text-sm">
                {invite.invited_email}
              </span>
              <button
                type="button"
                onClick={() => void copyUrl()}
                title={t("copy_invite_link_aria")}
                aria-label={t("copy_invite_link_aria")}
                className={`shrink-0 transition-colors ${isCopied ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {isCopied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  onRemoveInvite(invite.id);
                  toast.success(t("invite_removed_toast", { email: invite.invited_email }));
                }}
                title={t("remove_invite_aria")}
                aria-label={t("remove_invite_aria")}
                className="text-muted-foreground hover:text-destructive shrink-0 transition-colors">
                <CloseIcon className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
