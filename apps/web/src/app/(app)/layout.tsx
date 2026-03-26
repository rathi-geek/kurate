import type { Metadata } from "next";

import { AppShell } from "@/app/_components/app-shell";
import { AuthProvider } from "@/app/_libs/auth-context";
import { AnalyticsProvider } from "@/app/_libs/analytics-provider";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AnalyticsProvider>
        <AppShell>{children}</AppShell>
      </AnalyticsProvider>
    </AuthProvider>
  );
}
