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
    .from("conversations")
    .select("id, group_name, group_max_members")
    .eq("invite_code", invite_code)
    .maybeSingle();

  if (!group) {
    redirect("/home");
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("conversation_members")
    .select("id")
    .eq("convo_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    redirect(`/groups/${slugify(group.group_name ?? "")}`);
  }

  // Check if group is full
  const { count } = await supabase
    .from("conversation_members")
    .select("id", { count: "exact", head: true })
    .eq("convo_id", group.id);

  if ((count ?? 0) >= (group.group_max_members ?? 50)) {
    // Render full message — can't redirect so we render inline
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <h2 className="font-serif text-2xl text-ink mb-2">{group.group_name}</h2>
          <p className="text-muted-foreground text-sm">
            This group is full ({group.group_max_members ?? 50} members max).
          </p>
        </div>
      </div>
    );
  }

  // Mark email invite as accepted if one exists for this user
  // Requires DB migration: CREATE TABLE group_invites (...)
  // After migration, remove the try/catch and the `as any` cast
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: emailInvite } = await db
      .from("group_invites")
      .select("id")
      .eq("group_id", group.id)
      .eq("status", "pending")
      .maybeSingle();

    if (emailInvite?.id) {
      await db.from("group_invites").update({ status: "accepted" }).eq("id", emailInvite.id);
    }
  } catch {
    // group_invites table not created yet — continue with join
  }

  // Join the group
  await supabase.from("conversation_members").insert({
    convo_id: group.id,
    user_id: user.id,
    role: "member",
  });

  redirect(`/groups/${slugify(group.group_name ?? "")}`);
}
