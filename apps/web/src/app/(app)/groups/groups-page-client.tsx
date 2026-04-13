"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { queryKeys } from "@kurate/query";
import { useQuery } from "@tanstack/react-query";

import { CreateGroupDialog } from "@/app/_components/groups/create-group-dialog";
import { fetchUserGroups } from "@/app/_libs/utils/fetchUserGroups";
import { ChevronRightIcon, PlusIcon } from "@/components/icons";

const ROLE_BADGE: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

export function GroupsPageClient() {
  const [createOpen, setCreateOpen] = useState(false);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: queryKeys.groups.list(),
    queryFn: fetchUserGroups,
  });

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-foreground font-serif text-2xl font-bold">My Groups</h1>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="bg-primary text-primary-foreground flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-90">
          <PlusIcon className="h-3 w-3" />
          New Group
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-surface h-16 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground text-sm">You&apos;re not in any groups yet.</p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="bg-primary text-primary-foreground mt-4 rounded-full px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90">
            Create a Group
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <Link
              key={g.id}
              href={`/groups/${g.id}`}
              className="rounded-card border-border bg-card hover:bg-surface flex items-center gap-3 border p-4 transition-colors">
              {/* Group avatar */}
              <div className="bg-primary/10 relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full">
                {g.avatarUrl ? (
                  <Image src={g.avatarUrl} alt={g.name} fill className="object-cover" sizes="40px" />
                ) : (
                  <span className="text-primary text-sm font-bold">
                    {(g.name[0] ?? "?").toUpperCase()}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center gap-2">
                  <span className="text-foreground truncate font-medium">{g.name}</span>
                  {g.role && (
                    <span className="text-muted-foreground bg-surface border-border/50 shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px]">
                      {ROLE_BADGE[g.role] ?? g.role}
                    </span>
                  )}
                </div>
                {g.description && (
                  <p className="text-muted-foreground line-clamp-1 text-xs">{g.description}</p>
                )}
              </div>

              <ChevronRightIcon className="text-muted-foreground hidden size-3.5 shrink-0 md:block" />
            </Link>
          ))}
        </div>
      )}

      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
