import { Suspense } from "react";
import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { LoginForm } from "./_components/login-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = getT("auth.login");
  const tApp = getT("app");
  return {
    title: `${t("title")} — ${tApp("name")}`,
  };
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
