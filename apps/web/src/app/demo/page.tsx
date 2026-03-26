import Link from "next/link";
import type { Metadata } from "next";
import { getT } from "@/i18n/server";

import { ROUTES } from "@kurate/utils";

export const metadata: Metadata = {
  title: "Watch in action | Kurate",
  description: "See Kurate in action — save, curate, and discover content with your trusted network.",
  openGraph: {
    title: "Watch in action | Kurate",
    description: "See Kurate in action — save, curate, and discover content with your trusted network.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Kurate — Read smarter, curate better" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-image.png"] },
};

export default async function DemoPage() {
  const t = getT("demo");
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <main id="main-content" className="w-full">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-foreground mb-4">{t("title")}</h1>
          <p className="text-muted-foreground mb-6">{t("coming_soon")}</p>
          <Link href={ROUTES.HOME} className="text-primary hover:underline">
            {t("back_home")}
          </Link>
        </div>
      </main>
    </div>
  );
}
