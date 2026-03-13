import { redirect } from "next/navigation";
import { createClient } from "@/app/_libs/supabase/server";
import { slugify } from "@/app/_libs/utils/slugify";

interface JoinGroupPageProps {
  params: Promise<{ invite_code: string }>;
}

export default async function JoinGroupPage({ params }: JoinGroupPageProps) {
  const { invite_code } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/groups/join/${invite_code}`);

  // Find group by invite code
  const { data: group } = await supabase
    .from("groups")
    .select("id, name, max_members")
    .eq("invite_code", invite_code)
    .maybeSingle();

  if (!group) {
    redirect("/home");
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    redirect(`/groups/${slugify(group.name)}`);
  }

  // Check if group is full
  const { count } = await supabase
    .from("group_members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", group.id)
    .eq("status", "active");

  if ((count ?? 0) >= group.max_members) {
    // Render full message — can't redirect so we render inline
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <h2 className="font-serif text-2xl text-ink mb-2">{group.name}</h2>
          <p className="text-muted-foreground text-sm">
            This group is full ({group.max_members} members max).
          </p>
        </div>
      </div>
    );
  }

  // Join the group
  await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    role: "member",
    status: "active",
  });

  redirect(`/groups/${slugify(group.name)}`);
}
