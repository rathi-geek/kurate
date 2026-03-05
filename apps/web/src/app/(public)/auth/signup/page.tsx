import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SignupForm } from "./_components/signup-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.signup");
  const tApp = await getTranslations("app");
  return {
    title: `${t("title")} — ${tApp("name")}`,
  };
}

export default function SignupPage() {
  return <SignupForm />;
}
