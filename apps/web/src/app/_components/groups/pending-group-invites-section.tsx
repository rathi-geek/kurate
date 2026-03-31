"use client";

import { useState } from "react";

import { ROUTES } from "@kurate/utils";
import { toast } from "sonner";

import type { GroupInvite } from "@/app/_libs/hooks/useGroupInvites";
import { useTranslations } from "@/i18n/use-translations";

import { CheckIcon, CloseIcon, CopyIcon } from "@/components/icons";

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
    <div className="px-5 pb-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t("pending_invites_title")}
      </p>
      <div className="overflow-hidden rounded-card border border-border">
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
              className="flex items-center gap-2.5 border-b border-border px-4 py-2.5 last:border-0"
            >
              <span className="flex-1 truncate text-sm text-foreground">{invite.invited_email}</span>
              <button
                type="button"
                onClick={() => void copyUrl()}
                title={t("copy_invite_link_aria")}
                aria-label={t("copy_invite_link_aria")}
                className={`shrink-0 transition-colors ${isCopied ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                {isCopied ? (
                  <CheckIcon className="size-3.5" />
                ) : (
                  <CopyIcon className="size-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  onRemoveInvite(invite.id);
                  toast.success(t("invite_removed_toast", { email: invite.invited_email }));
                }}
                title={t("remove_invite_aria")}
                aria-label={t("remove_invite_aria")}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
              >
                <CloseIcon className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
