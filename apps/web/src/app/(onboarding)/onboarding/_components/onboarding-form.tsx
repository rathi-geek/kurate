"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { type Variants, motion, AnimatePresence } from "framer-motion";
import { useSafeReducedMotion } from "@/app/_libs/hooks/useSafeReducedMotion";
import { useTranslations } from "@/i18n/use-translations";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { FormField } from "@/app/_components/form-field";
import { Spinner } from "@/app/_components/spinner";
import { fadeUp, springGentle } from "@/app/_libs/utils/motion";
import { Arrow, BrandLogo } from "@/components/brand";

import { AuthPageShell } from "@/app/(public)/auth/_components/auth-page-shell";
import { ROUTES, validateUsername } from "@kurate/utils";
import { useUsernameAvailability } from "@/app/_libs/hooks/useUsernameAvailability";
import { useProfileUpsert } from "@/app/_libs/hooks/useProfileUpsert";
import { isChromiumBrowser } from "@/app/_libs/hooks/useExtensionDetection";
import { UsernameField } from "./username-field";
import { InterestPicker } from "./interest-picker";
import { ExtensionPrompt } from "./extension-prompt";

type Step = "form" | "extension";

export function OnboardingForm() {
  const t = useTranslations("auth.onboarding");
  const tApp = useTranslations("app");
  const tV = useTranslations("validation");
  const prefersReducedMotion = useSafeReducedMotion();
  const searchParams = useSearchParams();
  const router = useRouter();
  const nextUrl = searchParams.get("next");

  const [step, setStep] = useState<Step>("form");
  const [pendingNextUrl, setPendingNextUrl] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [localUsernameError, setLocalUsernameError] = useState<string | null>(null);

  const { status: handleStatus, setStatus: setHandleStatus } = useUsernameAvailability(username);
  const { submit, loading, usernameError: serverUsernameError, setUsernameError: setServerUsernameError } =
    useProfileUpsert({
      onHandleStatusChange: setHandleStatus,
      onSuccess: (url) => {
        if (isChromiumBrowser()) {
          setPendingNextUrl(url);
          setStep("extension");
        } else {
          router.replace(url ?? ROUTES.APP.HOME);
        }
      },
    });

  const usernameError = serverUsernameError ?? localUsernameError;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedUsername = username.trim();

    let hasError = false;
    if (!trimmedName) {
      setNameError(tV("name_required"));
      hasError = true;
    } else if (trimmedName.length > 50) {
      setNameError(tV("name_too_long", { max: 50 }));
      hasError = true;
    }
    if (!trimmedUsername) {
      setLocalUsernameError(tV("username_required"));
      hasError = true;
    } else {
      const err = validateUsername(trimmedUsername);
      if (err) {
        setLocalUsernameError(err);
        hasError = true;
      }
    }
    if (hasError) return;

    await submit({ name: trimmedName, username: trimmedUsername, interests, nextUrl });
  }

  const mp = (custom: number) => ({
    custom,
    initial: prefersReducedMotion ? false : ("hidden" as const),
    animate: prefersReducedMotion ? undefined : ("visible" as const),
    variants: fadeUp as Variants,
  });

  const canSubmit =
    name.trim().length > 0 &&
    username.trim().length > 0 &&
    !validateUsername(username.trim()) &&
    handleStatus !== "taken" &&
    handleStatus !== "checking";

  return (
    <AuthPageShell>
      <AnimatePresence mode="wait">
        {step === "form" ? (
          <motion.div
            key="form"
            initial={prefersReducedMotion ? false : { opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, x: -24 }}
            transition={springGentle}
          >
            <motion.div {...mp(0)} className="mb-12">
              <BrandLogo name={tApp("name")} s={24} />
            </motion.div>

            <motion.div {...mp(1)}>
              <h2 className="mb-1.5 font-serif text-3xl font-normal tracking-tight">{t("title")}</h2>
              <p className="text-muted-foreground mb-8 font-sans text-sm">{t("subtitle")}</p>
            </motion.div>

      <motion.form {...mp(2)} onSubmit={handleSubmit} className="space-y-6">
        <FormField htmlFor="onboarding-name" label={t("name_label")}>
          <Input
            id="onboarding-name"
            type="text"
            placeholder={t("name_placeholder")}
            value={name}
            maxLength={50}
            onChange={(e) => { setName(e.target.value); setNameError(null); }}
            onBlur={() => { if (!name.trim()) setNameError(tV("name_required")); }}
          />
          {nameError && <p className="text-destructive text-xs mt-1">{nameError}</p>}
        </FormField>

              <UsernameField
                username={username}
                onUsernameChange={(v) => { setUsername(v); setServerUsernameError(null); }}
                error={usernameError}
                onErrorChange={setLocalUsernameError}
                status={handleStatus}
                onStatusReset={() => setHandleStatus("idle")}
                label={t("username_label")}
                placeholder={t("username_placeholder")}
              />

              <InterestPicker
                interests={interests}
                onToggle={(interest) =>
                  setInterests((prev) =>
                    prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
                  )
                }
                expanded={expanded}
                onExpandToggle={() => setExpanded((v) => !v)}
                label={t("interests_label")}
                showLessText={t("show_less")}
                showMoreText={t("show_more")}
              />

              <div className="pt-2">
                <Button type="submit" disabled={loading || !canSubmit} className="w-full">
                  {loading ? <Spinner /> : <>{t("submit")} <Arrow s={14} /></>}
                </Button>
              </div>
            </motion.form>
          </motion.div>
        ) : (
          <motion.div
            key="extension"
            initial={prefersReducedMotion ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={springGentle}
          >
            <ExtensionPrompt nextUrl={pendingNextUrl} />
          </motion.div>
        )}
      </AnimatePresence>
    </AuthPageShell>
  );
}
