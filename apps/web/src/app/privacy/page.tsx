import Link from "next/link";
import type { Metadata } from "next";

import { ROUTES } from "@kurate/utils";
import { BrandConcentricArch } from "@/components/brand";

import { PrivacyPageContent } from "./_components/privacy-page-content";

export const metadata: Metadata = {
  title: "Privacy Policy | Kurate",
  description:
    "How Kurate collects, uses, and protects your personal information — including data collected by the Kurate browser extension.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Privacy Policy | Kurate",
    description:
      "How Kurate collects, uses, and protects your personal information.",
  },
};

const EFFECTIVE_DATE = "April 15, 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav
        aria-label="Main navigation"
        className="border-ink/[0.03] bg-cream sticky top-0 z-50 flex items-center justify-between border-b px-6 py-4 md:px-8"
      >
        <Link
          href={ROUTES.HOME}
          aria-label="Kurate home"
          className="flex items-center gap-2"
        >
          <BrandConcentricArch s={26} className="text-ink" aria-hidden="true" />
          <span className="text-ink font-sans text-xl font-black tracking-tight">
            Kurate
          </span>
        </Link>
        <span className="font-mono text-xs text-muted-foreground">
          Last updated: {EFFECTIVE_DATE}
        </span>
      </nav>

      <PrivacyPageContent effectiveDate={EFFECTIVE_DATE} />
    </div>
  );
}
