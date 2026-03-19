"use client";

import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { ROUTES } from "@/app/_libs/constants/routes";
import { queryKeys } from "@/app/_libs/query/keys";
import { type GroupRow, fetchUserGroups } from "@/app/_libs/utils/fetchUserGroups";
import { BrandStar } from "@/components/brand";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { PlusIcon } from "@/components/icons";
import { Link } from "@/i18n";
import { UnreadBadge } from "@/app/_components/sidebar/unread-badge";

export interface SidebarGroupsSectionProps {
  collapsed?: boolean;
  /** Called when a group link is clicked (e.g. to close mobile drawer) */
  onItemClick?: () => void;
  unreadCounts?: Map<string, number>;
  markRead?: (convoId: string) => Promise<void>;
}

function GroupListContent({
  groups,
  collapsed,
  onItemClick,
  unreadCounts,
  markRead,
}: {
  groups: GroupRow[];
  collapsed: boolean;
  onItemClick?: () => void;
  unreadCounts?: Map<string, number>;
  markRead?: (convoId: string) => Promise<void>;
}) {
  if (collapsed) {
    return (
      <>
        {groups.map((g) => {
          const unread = unreadCounts?.get(g.id) ?? 0;
          const handleClick = () => {
            onItemClick?.();
            if (unread > 0) void markRead?.(g.id);
          };
          return (
            <Link
              key={g.id}
              href={ROUTES.APP.GROUP(g.id)}
              title={g.name}
              onClick={handleClick}
              className="hover:bg-ink/4 flex w-full cursor-pointer items-center justify-center rounded-md py-1.5 transition-colors">
              <div className="relative">
                <div className="bg-primary/10 flex h-7 w-7 items-center justify-center rounded-md">
                  <BrandStar s={10} c="currentColor" />
                </div>
                <UnreadBadge
                  count={unread}
                  variant="dot"
                  className="absolute -top-0.5 -right-0.5"
                />
              </div>
            </Link>
          );
        })}
      </>
    );
  }
  return (
    <>
      {groups.map((g) => {
        const unread = unreadCounts?.get(g.id) ?? 0;
        const handleClick = () => {
          onItemClick?.();
          if (unread > 0) void markRead?.(g.id);
        };
        return (
          <div
            key={g.id}
            className="hover:bg-ink/4 group/grp rounded-badge flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors">
            <Link
              href={ROUTES.APP.GROUP(g.id)}
              onClick={handleClick}
              className="flex min-w-0 flex-1 items-center gap-2.5">
              <div className="bg-primary/10 flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
                <BrandStar s={10} c="currentColor" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-ink truncate font-sans text-xs font-bold">{g.name}</div>
              </div>
              <UnreadBadge count={unread} variant="inline" className="ml-auto" />
            </Link>
          </div>
        );
      })}
    </>
  );
}

export function SidebarGroupsSection({
  collapsed = false,
  onItemClick,
  unreadCounts,
  markRead,
}: SidebarGroupsSectionProps) {
  const t = useTranslations("sidebar");
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  const { data: userGroups = [] } = useQuery({
    queryKey: queryKeys.groups.list(),
    queryFn: fetchUserGroups,
    staleTime: 1000 * 60,
  });

  return (
    <>
      <div className={collapsed ? "mt-4 px-2" : "mt-5 px-3"}>
        {!collapsed && (
          <div className="mb-2 flex items-center justify-between px-3">
            <p className="text-ink/25 font-mono text-xs font-bold tracking-widest uppercase">
              {t("groups")}
            </p>
            <button
              type="button"
              onClick={() => setCreateGroupOpen(true)}
              className="text-ink/30 hover:text-ink/60 hover:bg-ink/6 rounded p-0.5 transition-colors"
              title={t("create_group")}
              aria-label={t("create_group")}>
              <PlusIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <div className="space-y-0.5">
          <GroupListContent
            groups={userGroups}
            collapsed={collapsed}
            onItemClick={onItemClick}
            unreadCounts={unreadCounts}
            markRead={markRead}
          />
        </div>
      </div>
      <CreateGroupDialog open={createGroupOpen} onOpenChange={setCreateGroupOpen} />
    </>
  );
}
