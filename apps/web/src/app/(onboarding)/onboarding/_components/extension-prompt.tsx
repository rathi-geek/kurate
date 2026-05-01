"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { type Variants, motion } from "framer-motion";
import { useSafeReducedMotion } from "@/app/_libs/hooks/useSafeReducedMotion";
import { ROUTES } from "@kurate/utils";
import { BrandLogo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/icons";
import { fadeUp } from "@/app/_libs/utils/motion";
import { useExtensionDetection } from "@/app/_libs/hooks/useExtensionDetection";
import { useTranslations } from "@/i18n/use-translations";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/kurate/ljljjongakpideellcpanddcplljonca";

interface ExtensionPromptProps {
  nextUrl: string | null;
}

export function ExtensionPrompt({ nextUrl }: ExtensionPromptProps) {
  const router = useRouter();
  const prefersReducedMotion = useSafeReducedMotion();
  const { isInstalled, isWaiting, onInstallClick } = useExtensionDetection(true);
  const redirected = useRef(false);
  const t = useTranslations("auth.onboarding.extension");

  const benefits = [t("benefit_1"), t("benefit_2"), t("benefit_3")];

  useEffect(() => {
    if (isInstalled && !redirected.current) {
      redirected.current = true;
      const timer = setTimeout(() => {
        router.replace(nextUrl ?? ROUTES.APP.HOME);
      }, 3000); 
      return () => clearTimeout(timer);
    }
  }, [isInstalled, nextUrl, router]);

  function handleSkip() {
    router.replace(nextUrl ?? ROUTES.APP.HOME);
  }

  function handleInstall() {
    onInstallClick();
    window.open(CHROME_STORE_URL, "_blank", "noopener,noreferrer");
  }

  const mp = (custom: number) => ({
    custom,
    initial: prefersReducedMotion ? false : ("hidden" as const),
    animate: "visible" as const,
    variants: fadeUp as Variants,
  });

  if (isInstalled) {
    return (
      <div className="flex flex-col items-center text-center">
        {/* <div className="mb-8 w-full">
          <BrandLogo name="Kurate" s={24} />
        </div> */}

        {/* <div className="mb-6 w-full">
          <BrowserMockup isInstalled />
        </div> */}

        <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-primary/10">
          <CheckIcon className="size-6 text-primary" />
        </div>

        <h2 className="mb-2 font-serif text-3xl font-normal tracking-tight text-ink">
          {t("installed_title")}
        </h2>
        <p className="font-sans text-sm text-muted-foreground">
          {t("installed_subtitle")}
        </p>
      </div>
    );
  }

  return (
    <>
      <motion.div {...mp(0)} className="mb-8">
        <BrandLogo name="Kurate" s={24} />
      </motion.div>

      <motion.div {...mp(2)} className="mb-8">
        <h2 className="mb-2 font-serif text-3xl font-normal tracking-tight text-ink">
          {t("title")}
        </h2>
        <p className="font-sans text-sm leading-relaxed text-muted-foreground">
          {t("subtitle")}
        </p>
      </motion.div>

      <motion.div {...mp(1)} className="mb-8">
        <BrowserMockup isInstalled={false} t={t} />
      </motion.div>

      {/* <motion.div {...mp(2)} className="mb-8">
        <h2 className="mb-2 font-serif text-3xl font-normal tracking-tight text-ink">
          One last thing
        </h2>
        <p className="font-sans text-sm leading-relaxed text-muted-foreground">
          Save anything from the web with a single click — no copy-pasting needed.
        </p>
      </motion.div> */}

      <motion.div {...mp(3)} className="mb-10">
        <div className="mb-5 h-px bg-border" />
        <ul className="space-y-4">
          {benefits.map((benefit, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-foreground">
              <span className="mt-px shrink-0 font-semibold text-primary">✓</span>
              {benefit}
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div {...mp(4)} className="space-y-3 pt-2">
        <Button className="w-full gap-2" onClick={handleInstall}>
          {isWaiting ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {t("installing_button")}
            </>
          ) : (
            t("install_button")
          )}
        </Button>
        <button
          type="button"
          onClick={handleSkip}
          className="w-full text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("skip")}
        </button>
      </motion.div>
    </>
  );
}

function BrowserMockup({
  isInstalled,
  t,
}: {
  isInstalled: boolean;
  t: (key: string) => string;
}) {
  return (
    <div className="mx-auto w-[260px] overflow-hidden rounded-card border border-border bg-card shadow-md">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2.5">
        <div className="flex gap-1.5">
          <div className="size-2.5 rounded-full bg-red-400/60" aria-hidden="true" />
          <div className="size-2.5 rounded-full bg-amber-400/60" aria-hidden="true" />
          <div className="size-2.5 rounded-full bg-green-400/60" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 truncate rounded-pill bg-background px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
          {t("mockup_url")}
        </div>
        <div className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-primary text-[11px] font-bold text-primary-foreground">
          K
        </div>
      </div>

      {/* Popup preview */}
      <div className="space-y-2 p-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-xs font-bold text-primary">
            K
          </div>
          <div>
            <div className="text-[11px] font-semibold text-foreground">{t("mockup_name")}</div>
            <div className="text-[10px] text-muted-foreground">{t("mockup_save_label")}</div>
          </div>
        </div>
        <div className="h-px bg-border" />
        <div className="truncate text-[11px] text-muted-foreground">
          {isInstalled ? t("mockup_saved") : t("mockup_save_prompt")}
        </div>
        <div className="rounded-button bg-primary py-1.5 text-center text-[11px] font-medium text-primary-foreground">
          {t("mockup_save_button")}
        </div>
      </div>
    </div>
  );
}
