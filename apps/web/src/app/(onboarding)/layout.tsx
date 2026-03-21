import type { Metadata } from "next";

import { AuthProvider } from "@/app/_libs/auth-context";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Onboarding layout — authenticated but no app sidebar.
 * Sits between (public) auth pages and the full (app) shell.
 */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
