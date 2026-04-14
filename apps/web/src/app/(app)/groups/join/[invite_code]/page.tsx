import { type Metadata ,type  Route } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/app/_libs/supabase/server";
import { createAdminClient } from "@/app/_libs/supabase/admin";
import { getT } from "@/i18n/server";
import { ROUTES } from "@kurate/utils";

import { JoinErrorView } from "./JoinErrorView";

interface Props {
  params: Promise<{ invite_code: string }>;
  searchParams: Promise<{ e?: string }>;
}

function decodeEmail(encoded: string): string {
  const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (padded.length % 4)) % 4;
  return atob(padded + "=".repeat(padding));
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
  const t = getT("groups");

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

  // Validate email-specific invite
  let invitedEmail: string | null = null;
  if (encodedEmail) {
    invitedEmail = decodeEmail(encodedEmail);

    // Email mismatch — wrong account
    if (user.email !== invitedEmail) {
      return (
        <JoinErrorView
          title={t("join_wrong_account_title")}
          description={t("join_wrong_account_desc", {
            invitedEmail,
            currentEmail: user.email ?? "a different account",
          })}
        />
      );
    }

    // Check if this email invite still exists (not revoked)
    // Use admin client — RLS only allows group members to read, but invitee isn't a member yet
    const adminSupabase = createAdminClient();
    const { data: inviteRow } = await adminSupabase
      .from("group_invites")
      .select("id")
      .eq("group_id", invite_code)
      .eq("invited_email", invitedEmail)
      .maybeSingle();

    if (!inviteRow) {
      return (
        <JoinErrorView
          title={t("join_revoked_title")}
          description={t("join_revoked_desc")}
        />
      );
    }
  }

  // Find group
  const { data: group } = await supabase
    .from("conversations")
    .select("id, group_name, group_max_members")
    .eq("id", invite_code)
    .maybeSingle();

  if (!group) {
    return (
      <JoinErrorView
        title={t("join_invalid_title")}
        description={t("join_invalid_desc")}
      />
    );
  }

  // Already a member — redirect straight in
  const { data: existing } = await supabase
    .from("conversation_members")
    .select("id")
    .eq("convo_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    redirect(ROUTES.APP.GROUP(group.id) as Route);
  }

  // Group full
  const { count } = await supabase
    .from("conversation_members")
    .select("id", { count: "exact", head: true })
    .eq("convo_id", group.id);

  if ((count ?? 0) >= (group.group_max_members ?? 50)) {
    return (
      <JoinErrorView
        title={t("join_full_title", { groupName: group.group_name ?? "" })}
        description={t("join_full_desc", {
          max: group.group_max_members ?? 50,
        })}
      />
    );
  }

  // Join the group
  await supabase.from("conversation_members").insert({
    convo_id: group.id,
    user_id: user.id,
    role: "member",
  });

  // Remove the email invite row now that it's been used
  if (invitedEmail) {
    const admin = createAdminClient();
    await admin
      .from("group_invites")
      .delete()
      .eq("group_id", group.id)
      .eq("invited_email", invitedEmail);
  }

  redirect(ROUTES.APP.GROUP(group.id) as Route);
}
