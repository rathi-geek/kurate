"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { env } from "env";
import { ROUTES } from "@kurate/utils";
import { createClient } from "@/app/_libs/supabase/client";
import { useTranslations } from "@/i18n/use-translations";
import { MagicStep } from "@/app/(public)/auth/login/_components/magic-link-form";

function parseHashError(t: (key: string) => string): string {
  if (typeof window === "undefined") return "";
  const hash = window.location.hash;
  if (!hash) return "";
  const params = new URLSearchParams(hash.slice(1));
  const errorCode = params.get("error_code");
  if (!errorCode) return "";
  const messages: Record<string, string> = {
    otp_expired: t("magic_link_expired"),
    access_denied: t("magic_link_invalid"),
  };
  window.history.replaceState(null, "", window.location.pathname);
  return messages[errorCode] ?? t("magic_link_invalid");
}

export function useLoginAuth() {
  const t = useTranslations("auth.login");
  const searchParams = useSearchParams();

  const nextUrl = searchParams.get("next") ?? "";
  const callbackUrl = nextUrl
    ? `${env.NEXT_PUBLIC_APP_URL}${ROUTES.AUTH.CALLBACK}?next=${encodeURIComponent(nextUrl)}`
    : `${env.NEXT_PUBLIC_APP_URL}${ROUTES.AUTH.CALLBACK}`;

  const [googleLoading, setGoogleLoading] = useState(false);
  const [magicEmail, setMagicEmail] = useState("");
  const [magicStep, setMagicStep] = useState<MagicStep>(MagicStep.Form);
  const [magicError, setMagicError] = useState("");
  const [magicLoading, setMagicLoading] = useState(false);
  const [authError] = useState(() => parseHashError(t));

  async function handleGoogle() {
    setGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setMagicError("");
    setMagicLoading(true);

    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: magicEmail,
      options: { emailRedirectTo: callbackUrl },
    });

    if (otpError) {
      setMagicError(t("error_invalid"));
      setMagicLoading(false);
      return;
    }

    setMagicStep(MagicStep.Sent);
    setMagicLoading(false);
  }

  function resetMagicLink() {
    setMagicStep(MagicStep.Form);
    setMagicEmail("");
    setMagicError("");
  }

  return {
    authError,
    googleLoading,
    handleGoogle,
    magicEmail,
    setMagicEmail,
    magicStep,
    magicError,
    magicLoading,
    handleMagicLink,
    resetMagicLink,
  };
}
