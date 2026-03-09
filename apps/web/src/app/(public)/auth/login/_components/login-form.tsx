"use client";

import { useEffect, useState } from "react";

import { env } from "env";
import { type Variants, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import { ErrorAlert } from "@/app/_components/error-alert";
import { Spinner } from "@/app/_components/spinner";
import { ROUTES } from "@/app/_libs/constants/routes";
import { createClient } from "@/app/_libs/supabase/client";
import { fadeUp } from "@/app/_libs/utils/motion";
import { BrandLogo, BrandSunburst, FloatDeco } from "@/components/brand";
import { GoogleIcon } from "@/components/icons";

import { MagicLinkForm, MagicStep } from "./magic-link-form";

export function LoginForm() {
  const t = useTranslations("auth.login");
  const tApp = useTranslations("app");
  const prefersReducedMotion = useReducedMotion();

  const [googleLoading, setGoogleLoading] = useState(false);
  const [magicEmail, setMagicEmail] = useState("");
  const [magicStep, setMagicStep] = useState<MagicStep>(MagicStep.Form);
  const [magicError, setMagicError] = useState("");
  const [magicLoading, setMagicLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const params = new URLSearchParams(hash.slice(1));
    const errorCode = params.get("error_code");
    if (errorCode) {
      const messages: Record<string, string> = {
        otp_expired: t("magic_link_expired"),
        access_denied: t("magic_link_invalid"),
      };
      setAuthError(messages[errorCode] ?? t("magic_link_invalid"));
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [t]);

  async function handleGoogle() {
    setGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${env.NEXT_PUBLIC_APP_URL}${ROUTES.AUTH.CALLBACK}` },
    });
    // signInWithOAuth redirects the browser — loading stays true until navigation completes
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setMagicError("");
    setMagicLoading(true);

    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: magicEmail,
      options: { emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}${ROUTES.AUTH.CALLBACK}` },
    });

    if (otpError) {
      setMagicError(t("error_invalid"));
      setMagicLoading(false);
      return;
    }

    setMagicStep(MagicStep.Sent);
    setMagicLoading(false);
  }

  const mp = (custom: number) => ({
    custom,
    initial: prefersReducedMotion ? false : ("hidden" as const),
    animate: prefersReducedMotion ? undefined : ("visible" as const),
    variants: fadeUp as Variants,
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div aria-hidden="true">
        <FloatDeco top={50} right={50} opacity={0.04}>
          <BrandSunburst s={100} />
        </FloatDeco>
      </div>

      <main id="main-content" className="max-w-auth relative z-10 w-full px-8">
        <motion.div {...mp(0)} className="mb-4">
          <BrandLogo name={tApp("name")} s={24} />
        </motion.div>

        <motion.div {...mp(1)} className="mb-12">
          <h2 className="mb-1.5 font-serif text-3xl font-normal tracking-tight">{t("title")}</h2>
        </motion.div>

        {authError && (
          <motion.div {...mp(1.5)}>
            <ErrorAlert>{authError}</ErrorAlert>
          </motion.div>
        )}

        <motion.div {...mp(2)}>
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            disabled={googleLoading}
            onClick={handleGoogle}>
            {googleLoading ? <Spinner /> : <GoogleIcon className="h-4 w-4" />}
            {t("google")}
          </Button>
          <div className="relative my-4 flex items-center gap-3">
            <div className="bg-border h-px flex-1" />
            <span className="text-muted-foreground font-sans text-xs">{t("or_divider")}</span>
            <div className="bg-border h-px flex-1" />
          </div>
        </motion.div>

        <motion.div {...mp(3)}>
          <MagicLinkForm
            email={magicEmail}
            step={magicStep}
            error={magicError}
            loading={magicLoading}
            onEmailChange={setMagicEmail}
            onSubmit={handleMagicLink}
            onReset={() => {
              setMagicStep(MagicStep.Form);
              setMagicEmail("");
              setMagicError("");
            }}
          />
        </motion.div>
      </main>
    </div>
  );
}
