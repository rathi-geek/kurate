"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { AppSidebar } from "@/app/_components/sidebar";
import { ROUTES } from "@/app/_libs/constants/routes";
import { useAuth } from "@/app/_libs/auth-context";
import {
  SidebarOverridesProvider,
  type SidebarOverrides,
} from "@/app/_libs/sidebar-overrides-context";
import { createClient } from "@/app/_libs/supabase/client";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [sidebarOverrides, setSidebarOverrides] = useState<SidebarOverrides>({});

  const userEmail = user?.email ?? "";
  const userName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(ROUTES.AUTH.LOGIN);
  }, [router]);

  return (
    <SidebarOverridesProvider setOverrides={setSidebarOverrides}>
      <div className="bg-background flex h-screen">
        <AppSidebar
          userEmail={userEmail}
          userName={userName}
          onLogout={handleLogout}
          {...sidebarOverrides}
        />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </SidebarOverridesProvider>
  );
}
