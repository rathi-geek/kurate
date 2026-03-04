import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { ROUTES } from "@/app/_libs/constants/routes";
import { Button } from "@/components/ui/button";

export default async function ForbiddenPage() {
  const t = await getTranslations("errors");
  return (
    <main id="main-content" className="bg-primary/25 flex h-dvh flex-col items-center justify-center">
      <h2 className="text-4xl font-bold">{t("forbidden_title")}</h2>
      <p className="mt-4 mb-2 text-2xl">{t("forbidden_message")}</p>
      <Button asChild className="cursor-pointer">
        <Link href={ROUTES.HOME}>{t("return_home")}</Link>
      </Button>
    </main>
  );
}
