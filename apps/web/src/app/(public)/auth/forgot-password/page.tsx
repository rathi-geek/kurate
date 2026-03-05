import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ForgotPasswordForm } from "./_components/forgot-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.forgot_password");
  const tApp = await getTranslations("app");
  return {
    title: `${t("title")} — ${tApp("name")}`,
  };
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
