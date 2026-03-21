import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/app/_libs/supabase/server";
import { createAdminClient } from "@/app/_libs/supabase/admin";
import { env } from "env";
import { ROUTES } from "@/app/_libs/constants/routes";
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
      display_name:
        [profile.first_name, profile.last_name].filter(Boolean).join(" ") || null,
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

  const encodedEmail = Buffer.from(email.toLowerCase()).toString("base64url");
  const joinPath = `/groups/join/${groupId}?e=${encodedEmail}`;
  const callbackUrl = `${env.NEXT_PUBLIC_APP_URL}${ROUTES.AUTH.CALLBACK}?next=${encodeURIComponent(joinPath)}`;
  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase.auth.admin.inviteUserByEmail(email.toLowerCase(), {
    redirectTo: callbackUrl,
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
      status: "pending",
    });
  } catch {
    // group_invites table not created yet — ignore
  }

  return NextResponse.json({ success: true });
}
