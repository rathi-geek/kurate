import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ROUTES } from "@/app/_libs/constants/routes";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function UnauthorizedPage() {
  const t = await getTranslations("errors");
  return (
    <main id="main-content" className="bg-primary/25 flex h-dvh flex-col items-center justify-center">
      <h2 className="text-4xl font-bold">{t("unauthorized_title")}</h2>
      <p className="mt-4 mb-2 text-2xl">
        {t("unauthorized_message")}
      </p>
      <Button asChild className="cursor-pointer">
        <Link href={ROUTES.HOME}>{t("return_home")}</Link>
      </Button>
    </main>
  );
}
