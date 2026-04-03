"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { type Variants, motion } from "framer-motion";
import { useSafeReducedMotion } from "@/app/_libs/hooks/useSafeReducedMotion";
import { useTranslations } from "@/i18n/use-translations";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { FormField } from "@/app/_components/form-field";
import { Spinner } from "@/app/_components/spinner";
import { fadeUp } from "@/app/_libs/utils/motion";
import { Arrow, BrandLogo } from "@/components/brand";

import { AuthPageShell } from "@/app/(public)/auth/_components/auth-page-shell";
import { validateUsername } from "@/app/_libs/utils/validate-username";
import { useUsernameAvailability } from "@/app/_libs/hooks/useUsernameAvailability";
import { useProfileUpsert } from "@/app/_libs/hooks/useProfileUpsert";
import { UsernameField } from "./username-field";
import { InterestPicker } from "./interest-picker";

export function OnboardingForm() {
  const t = useTranslations("auth.onboarding");
  const tApp = useTranslations("app");
  const prefersReducedMotion = useSafeReducedMotion();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [localUsernameError, setLocalUsernameError] = useState<string | null>(null);

  const { status: handleStatus, setStatus: setHandleStatus } = useUsernameAvailability(username);
  const { submit, loading, usernameError: serverUsernameError, setUsernameError: setServerUsernameError } =
    useProfileUpsert({ onHandleStatusChange: setHandleStatus });

  const usernameError = serverUsernameError ?? localUsernameError;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedUsername = username.trim();

    let hasError = false;
    if (!trimmedName) {
      setNameError("Required");
      hasError = true;
    }
    if (!trimmedUsername) {
      setLocalUsernameError("Required");
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
            onChange={(e) => { setName(e.target.value); setNameError(null); }}
            onBlur={() => { if (!name.trim()) setNameError("Required"); }}
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
    </AuthPageShell>
  );
}
