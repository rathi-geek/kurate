import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { ROUTES } from "@/app/_libs/constants/routes";

export default async function AboutPage() {
  const t = await getTranslations("about");
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <main id="main-content" className="w-full">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-foreground mb-4">{t("title")}</h1>
          <p className="text-muted-foreground mb-6">{t("coming_soon")}</p>
          <Link href={ROUTES.HOME} className="text-primary hover:underline">{t("back_home")}</Link>
        </div>
      </main>
    </div>
  );
}
