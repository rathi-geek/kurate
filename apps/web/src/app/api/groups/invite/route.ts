import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/app/_libs/supabase/server";
import { createAdminClient } from "@/app/_libs/supabase/admin";
import { env } from "env";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { email, groupId, inviteCode } = body as {
    email: string;
    groupId: string;
    inviteCode: string;
  };

  if (!email || !groupId || !inviteCode) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const joinUrl = `${env.NEXT_PUBLIC_APP_URL}/groups/join/${inviteCode}`;
  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase.auth.admin.inviteUserByEmail(email.toLowerCase(), {
    redirectTo: joinUrl,
  });

  if (error) {
    // User already exists on the platform — suggest searching by name/handle
    if (
      error.message.toLowerCase().includes("already registered") ||
      error.message.toLowerCase().includes("already been registered") ||
      error.message.toLowerCase().includes("user already exists")
    ) {
      return NextResponse.json(
        {
          error:
            "This email is already on Kurate. Search by their name or @username to add them directly.",
        },
        { status: 409 },
      );
    }
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
      email: email.toLowerCase(),
      invite_code: inviteCode,
      status: "pending",
    });
  } catch {
    // group_invites table not created yet — ignore
  }

  return NextResponse.json({ success: true });
}
