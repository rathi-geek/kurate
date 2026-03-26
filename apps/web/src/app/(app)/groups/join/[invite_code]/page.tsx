import type { Metadata } from "next";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/app/_libs/supabase/server";
import { ROUTES } from "@kurate/utils";

interface Props {
  params: Promise<{ invite_code: string }>;
  searchParams: Promise<{ e?: string }>;
}

function decodeEmail(encoded: string): string {
  const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (padded.length % 4)) % 4;
  return atob(padded + "=".repeat(padding));
}

function EmailMismatchError({ invitedEmail, userEmail }: { invitedEmail: string; userEmail: string }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center max-w-sm px-6">
        <h2 className="font-serif text-2xl mb-2">Wrong account</h2>
        <p className="text-muted-foreground text-sm mb-1">
          This invite was sent to <strong>{invitedEmail}</strong>.
        </p>
        <p className="text-muted-foreground text-sm">
          You&apos;re signed in as <strong>{userEmail}</strong>. Please sign in with the correct account.
        </p>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { invite_code } = await params;
  const supabase = await createClient();
  const { data: group } = await supabase
    .from("conversations")
    .select("group_name, group_description")
    .eq("id", invite_code)
    .single();

  if (!group) return { title: "Join a group" };

  return {
    title: `Join ${group.group_name} on Kurate`,
    description: group.group_description ?? `You're invited to join ${group.group_name}`,
    openGraph: {
      title: `Join ${group.group_name} on Kurate`,
      description: group.group_description ?? `You're invited to join ${group.group_name}`,
      type: "website",
    },
  };
}

export default async function JoinGroupPage({ params, searchParams }: Props) {
  const { invite_code } = await params;
  const { e: encodedEmail } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const fullPath = encodedEmail
      ? `${ROUTES.APP.GROUP_JOIN(invite_code)}?e=${encodedEmail}`
      : ROUTES.APP.GROUP_JOIN(invite_code);
    redirect(`${ROUTES.AUTH.LOGIN}?next=${encodeURIComponent(fullPath)}`);
  }

  // Check onboarding status
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_onboarded")
    .eq("id", user.id)
    .single();

  if (!profile?.is_onboarded) {
    const fullPath = encodedEmail
      ? `${ROUTES.APP.GROUP_JOIN(invite_code)}?e=${encodedEmail}`
      : ROUTES.APP.GROUP_JOIN(invite_code);
    redirect(`${ROUTES.APP.ONBOARDING}?next=${encodeURIComponent(fullPath)}`);
  }

  // Validate invited email if present
  if (encodedEmail) {
    const invitedEmail = decodeEmail(encodedEmail);
    if (user.email !== invitedEmail) {
      return <EmailMismatchError invitedEmail={invitedEmail} userEmail={user.email ?? ""} />;
    }
  }

  // Find group by invite code
  const { data: group } = await supabase
    .from("conversations")
    .select("id, group_name, group_max_members")
    .eq("id", invite_code)
    .maybeSingle();

  if (!group) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <h2 className="font-serif text-2xl mb-2">Invalid invite link</h2>
          <p className="text-muted-foreground text-sm">
            This invite link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("conversation_members")
    .select("id")
    .eq("convo_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    redirect(ROUTES.APP.GROUP(group.id) as Route);
  }

  // Check if group is full
  const { count } = await supabase
    .from("conversation_members")
    .select("id", { count: "exact", head: true })
    .eq("convo_id", group.id);

  if ((count ?? 0) >= (group.group_max_members ?? 50)) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <h2 className="font-serif text-2xl mb-2">{group.group_name}</h2>
          <p className="text-muted-foreground text-sm">
            This group is full ({group.group_max_members ?? 50} members max).
          </p>
        </div>
      </div>
    );
  }

  // Mark email invite as accepted if one exists for this user
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    await db
      .from("group_invites")
      .update({ status: "accepted" })
      .eq("invite_code", invite_code)
      .eq("email", user.email);
  } catch {
    // group_invites table not created yet — continue with join
  }

  // Join the group
  await supabase.from("conversation_members").insert({
    convo_id: group.id,
    user_id: user.id,
    role: "member",
  });

  redirect(ROUTES.APP.GROUP(group.id) as Route);
}
