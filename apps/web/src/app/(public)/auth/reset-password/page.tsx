import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ResetPasswordForm } from "./_components/reset-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.reset_password");
  const tApp = await getTranslations("app");
  return {
    title: `${t("title")} — ${tApp("name")}`,
  };
}

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
