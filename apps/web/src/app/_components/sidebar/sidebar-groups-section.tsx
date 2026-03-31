"use client";

import { useState } from "react";

import { LuChevronDown } from "react-icons/lu";
import { cn } from "@/app/_libs/utils/cn";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "@/i18n/use-translations";

import { ROUTES } from "@kurate/utils";
import { queryKeys } from "@kurate/query";
import { type GroupRow, fetchUserGroups } from "@/app/_libs/utils/fetchUserGroups";
import { fetchGroupFeedPage } from "@/app/_libs/hooks/useGroupFeed";
import { BrandStar } from "@/components/brand";
import { CreateGroupDialog } from "@/app/_components/groups/create-group-dialog";
import { PlusIcon } from "@/components/icons";
import Link from "next/link";
import { UnreadBadge } from "@/app/_components/sidebar/unread-badge";

export interface SidebarGroupsSectionProps {
  collapsed?: boolean;
  /** Called when a group link is clicked (e.g. to close mobile drawer) */
  onItemClick?: () => void;
  unreadCounts?: Map<string, number>;
  markRead?: (convoId: string) => Promise<void>;
  currentUserId?: string | null;
}

function GroupListContent({
  groups,
  collapsed,
  onItemClick,
  unreadCounts,
  markRead,
  currentUserId,
}: {
  groups: GroupRow[];
  collapsed: boolean;
  onItemClick?: () => void;
  unreadCounts?: Map<string, number>;
  markRead?: (convoId: string) => Promise<void>;
  currentUserId?: string | null;
}) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
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
              onMouseEnter={() => {
                void queryClient.prefetchInfiniteQuery({
                  queryKey: queryKeys.groups.feed(g.id),
                  queryFn: ({ pageParam }) =>
                    fetchGroupFeedPage(g.id, currentUserId ?? "", pageParam as string | null),
                  initialPageParam: null,
                  staleTime: 1000 * 30,
                });
              }}
              className="hover:bg-ink/4 flex w-full cursor-pointer items-center justify-center rounded-md py-1.5 transition-colors">
              <div className="relative">
                <div className="bg-primary/10 relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-md">
                  {g.avatarUrl ? (
                    <Image src={g.avatarUrl} alt={g.name} fill className="object-cover" sizes="28px" />
                  ) : (
                    <BrandStar s={10} c="currentColor" />
                  )}
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
        const isActive = pathname.startsWith(ROUTES.APP.GROUP(g.id));
        return (
          <Link
            key={g.id}
            href={ROUTES.APP.GROUP(g.id)}
            onClick={handleClick}
            onMouseEnter={() => {
              void queryClient.prefetchInfiniteQuery({
                queryKey: queryKeys.groups.feed(g.id),
                queryFn: ({ pageParam }) =>
                  fetchGroupFeedPage(g.id, currentUserId ?? "", pageParam as string | null),
                initialPageParam: null,
                staleTime: 1000 * 30,
              });
            }}
            className={cn(
              "rounded-badge flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors",
              isActive ? "bg-ink/8" : "hover:bg-ink/4",
            )}>
            <div className="bg-primary/10 relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md">
              {g.avatarUrl ? (
                <Image src={g.avatarUrl} alt={g.name} fill className="object-cover" sizes="28px" />
              ) : (
                <BrandStar s={10} c="currentColor" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-ink truncate font-sans text-xs font-bold">{g.name}</div>
            </div>
            <UnreadBadge count={unread} variant="inline" className="ml-auto" />
          </Link>
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
  currentUserId,
}: SidebarGroupsSectionProps) {
  const t = useTranslations("sidebar");
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(true);

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
            <button
              type="button"
              onClick={() => setSectionOpen((v) => !v)}
              className="flex items-center gap-1 text-left"
              title={sectionOpen ? "Collapse" : "Expand"}>
              <LuChevronDown
                className={cn(
                  "text-ink/25 h-3 w-3 transition-transform duration-150",
                  !sectionOpen && "-rotate-90",
                )}
              />
              <p className="text-ink/25 font-mono text-xs font-bold tracking-widest uppercase">
                {t("groups")}
              </p>
            </button>
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
        {sectionOpen && <div className="space-y-0.5">
          <GroupListContent
            groups={userGroups}
            collapsed={collapsed}
            onItemClick={onItemClick}
            unreadCounts={unreadCounts}
            markRead={markRead}
            currentUserId={currentUserId}
          />
        </div>}
      </div>
      <CreateGroupDialog open={createGroupOpen} onOpenChange={setCreateGroupOpen} />
    </>
  );
}
