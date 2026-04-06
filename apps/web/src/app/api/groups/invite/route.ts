import { type NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { env } from "env";

import { createAdminClient } from "@/app/_libs/supabase/admin";
import { createClient } from "@/app/_libs/supabase/server";
import { mediaToUrl } from "@/app/_libs/utils/getMediaUrl";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const email = request.nextUrl.searchParams.get("email")?.toLowerCase();
  if (!email) return NextResponse.json({ exists: false });

  const adminSupabase = createAdminClient();
  const { data } = await adminSupabase.auth.admin.listUsers();
  const found = data?.users?.find((u) => u.email?.toLowerCase() === email);
  if (!found) return NextResponse.json({ exists: false });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar:avatar_id(file_path, bucket_name), handle")
    .eq("id", found.id)
    .eq("is_onboarded", true)
    .single();

  if (!profile) return NextResponse.json({ exists: false });

  return NextResponse.json({
    exists: true,
    profile: {
      id: profile.id,
      display_name: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || null,
      avatar_url: mediaToUrl(profile.avatar as { file_path: string; bucket_name: string } | null),
      handle: profile.handle,
    },
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { email, groupId } = body as {
    email: string;
    groupId: string;
  };

  if (!email || !groupId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email service not configured." }, { status: 500 });
  }

  // Build invite link — no OTP token, just a direct link to the join page
  const normalizedEmail = email.toLowerCase();
  const encodedEmail = Buffer.from(normalizedEmail).toString("base64url");
  const inviteLink = `${env.NEXT_PUBLIC_APP_URL}/groups/join/${groupId}?e=${encodedEmail}`;

  // Fetch group name and inviter name for a nicer email
  const [{ data: group }, { data: inviterProfile }] = await Promise.all([
    supabase
      .from("conversations")
      .select("group_name")
      .eq("id", groupId)
      .single(),
    supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single(),
  ]);

  const groupName = group?.group_name ?? "a group";
  const inviterName =
    [inviterProfile?.first_name, inviterProfile?.last_name].filter(Boolean).join(" ") ||
    "Someone";

  // Send email via Resend
  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: "Kurate <noreply@kurate.co.in>",
    to: normalizedEmail,
    subject: `${inviterName} invited you to join ${groupName} on Kurate`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 0;text-align:center;">
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#18181b;">Kurate</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#18181b;">You're invited to join ${groupName}</h2>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#52525b;">
                <strong>${inviterName}</strong> invited you to join <strong>${groupName}</strong> on Kurate — a place to discover and curate content together.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${inviteLink}" style="display:inline-block;padding:12px 32px;background-color:#18181b;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
                      Accept Invite
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#a1a1aa;">
                If you weren't expecting this invite, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;text-align:center;border-top:1px solid #f4f4f5;">
              <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;">
                &copy; Kurate
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });

  if (error) {
    console.error("[invite-email]", error.message);
    return NextResponse.json(
      { error: "Failed to send invite. Please try again." },
      { status: 500 },
    );
  }

  // Store invite record — best-effort, table may not exist yet
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    await db.from("group_invites").insert({
      group_id: groupId,
      invited_by: user.id,
      email: normalizedEmail,
      status: "pending",
    });
  } catch {
    // group_invites table not created yet — ignore
  }

  return NextResponse.json({ success: true });
}
