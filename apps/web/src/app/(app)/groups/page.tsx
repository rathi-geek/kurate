import Link from "next/link";
import { redirect } from "next/navigation";

import type { GroupRole } from "@kurate/types";

import { createClient } from "@/app/_libs/supabase/server";

export default async function GroupsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: memberRows } = await supabase
    .from("conversation_members")
    .select(
      "role, joined_at, conversations!conversation_members_convo_id_fkey(id, group_name, group_description, group_max_members)",
    )
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  const groups = (memberRows ?? [])
    .map((row) => {
      const g = Array.isArray(row.conversations) ? row.conversations[0] : row.conversations;
      if (!g) return null;
      return {
        id: g.id,
        name: g.group_name ?? "",
        description: g.group_description,
        max_members: g.group_max_members ?? 50,
        role: row.role as GroupRole,
        joined_at: row.joined_at,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    name: string;
    description: string | null;
    max_members: number;
    role: GroupRole;
    joined_at: string;
  }>;

  const ROLE_BADGE: Record<GroupRole, string> = {
    owner: "Owner",
    admin: "Admin",
    member: "Member",
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-foreground font-serif text-2xl font-bold">My Groups</h1>
      </div>

      {groups.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground text-sm">You&apos;re not in any groups yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <Link
              key={g.id}
              href={`/groups/${g.id}`}
              className="rounded-card border-border bg-card hover:bg-surface block border p-4 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-foreground truncate font-medium">{g.name}</span>
                    <span className="text-muted-foreground bg-surface border-border/50 shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px]">
                      {ROLE_BADGE[g.role]}
                    </span>
                  </div>
                  {g.description && (
                    <p className="text-muted-foreground line-clamp-2 text-xs">{g.description}</p>
                  )}
                </div>
                <svg
                  width={14}
                  height={14}
                  viewBox="0 0 14 14"
                  fill="none"
                  className="text-muted-foreground mt-1 shrink-0">
                  <path
                    d="M5 3l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
