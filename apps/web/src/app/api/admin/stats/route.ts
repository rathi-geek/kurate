import { NextResponse } from "next/server";
import { createClient } from "@/app/_libs/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "env";

export interface AdminStats {
  totalUsers: number;
  totalLoggedItems: number;
  recentSignups: number;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.user_metadata?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden", message: "Admin access required" },
        { status: 403 }
      );
    }

    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json(
        {
          totalUsers: 0,
          totalLoggedItems: 0,
          recentSignups: 0,
          _message: "SUPABASE_SERVICE_ROLE_KEY not configured",
        } satisfies AdminStats & { _message?: string },
        { status: 200 }
      );
    }

    const adminClient = createSupabaseClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey,
      { auth: { persistSession: false } }
    );

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [usersResult, loggedItemsResult] = await Promise.all([
      adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      adminClient
        .from("logged_items")
        .select("id", { count: "exact", head: true }),
    ]);

    const users = usersResult.data?.users ?? [];
    const recentSignups = users.filter(
      (u) => new Date(u.created_at) >= sevenDaysAgo
    ).length;

    const stats: AdminStats = {
      totalUsers: users.length,
      totalLoggedItems: loggedItemsResult.count ?? 0,
      recentSignups,
    };

    return NextResponse.json(stats);
  } catch (err) {
    console.error("[admin/stats]", err);
    return NextResponse.json(
      { error: "Internal error", message: "Failed to load stats" },
      { status: 500 }
    );
  }
}
