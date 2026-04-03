"use client";

import { type Variants, motion } from "framer-motion";
import { useSafeReducedMotion } from "@/app/_libs/hooks/useSafeReducedMotion";
import { useTranslations } from "@/i18n/use-translations";

import { Button } from "@/components/ui/button";

import { ErrorAlert } from "@/app/_components/error-alert";
import { Spinner } from "@/app/_components/spinner";
import { fadeUp } from "@/app/_libs/utils/motion";
import { BrandLogo, BrandSunburst, FloatDeco } from "@/components/brand";
import { GoogleIcon } from "@/components/icons";

import { MagicLinkForm } from "./magic-link-form";
import { useLoginAuth } from "@/app/_libs/hooks/useLoginAuth";

export function LoginForm() {
  const t = useTranslations("auth.login");
  const tApp = useTranslations("app");
  const prefersReducedMotion = useSafeReducedMotion();

  const {
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
  } = useLoginAuth();

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
            onReset={resetMagicLink}
          />
        </motion.div>
      </main>
    </div>
  );
}
