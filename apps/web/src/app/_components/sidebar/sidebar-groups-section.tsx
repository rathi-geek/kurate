"use client";

import { useState } from "react";

import Link from "next/link";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { queryKeys } from "@/app/_libs/query/keys";
import { fetchUserGroups, type GroupRow } from "@/app/_libs/utils/fetchUserGroups";
import { slugify } from "@/app/_libs/utils/slugify";
import { BrandStar } from "@/components/brand";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";

export interface SidebarGroupsSectionProps {
  collapsed?: boolean;
  /** Called when a group link is clicked (e.g. to close mobile drawer) */
  onItemClick?: () => void;
}

function GroupListContent({
  groups,
  collapsed,
  onItemClick,
}: {
  groups: GroupRow[];
  collapsed: boolean;
  onItemClick?: () => void;
}) {
  if (collapsed) {
    return (
      <>
        {groups.map((g) => (
          <Link
            key={g.id}
            href={`/groups/${slugify(g.name)}`}
            title={g.name}
            onClick={onItemClick}
            className="hover:bg-ink/4 flex w-full cursor-pointer items-center justify-center rounded-md py-1.5 transition-colors">
            <div className="bg-primary/10 flex h-7 w-7 items-center justify-center rounded-md">
              <BrandStar s={10} c="currentColor" />
            </div>
          </Link>
        ))}
      </>
    );
  }
  return (
    <>
      {groups.map((g) => (
        <div
          key={g.id}
          className="hover:bg-ink/4 group/grp rounded-badge flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors">
          <Link
            href={`/groups/${slugify(g.name)}`}
            onClick={onItemClick}
            className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="bg-primary/10 flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
              <BrandStar s={10} c="currentColor" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-ink truncate font-sans text-xs font-bold">
                {g.name}
              </div>
            </div>
          </Link>
        </div>
      ))}
    </>
  );
}

export function SidebarGroupsSection({
  collapsed = false,
  onItemClick,
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
              title={t("create_group")}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        )}
        <div className="space-y-0.5">
          <GroupListContent
            groups={userGroups}
            collapsed={collapsed}
            onItemClick={onItemClick}
          />
        </div>
      </div>
      <CreateGroupDialog
        open={createGroupOpen}
        onOpenChange={setCreateGroupOpen}
      />
    </>
  );
}
