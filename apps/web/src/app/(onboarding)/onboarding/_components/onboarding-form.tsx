"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { type Variants, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { FormField } from "@/app/_components/form-field";
import { Spinner } from "@/app/_components/spinner";
import { ROUTES } from "@/app/_libs/constants/routes";
import { INTEREST_OPTIONS } from "@/app/_libs/constants/interests";
import { saveUserInterests } from "@/app/_libs/hooks/useUserInterests";
import { createClient } from "@/app/_libs/supabase/client";
import { cn } from "@/app/_libs/utils/cn";
import { fadeUp } from "@/app/_libs/utils/motion";
import { Arrow, BrandLogo } from "@/components/brand";
import { useRouter } from "@/i18n";

import { AuthPageShell } from "@/app/(public)/auth/_components/auth-page-shell";

const VISIBLE_COUNT = 5;

function validateUsername(value: string): string | null {
  if (value.length < 2) return "Must be at least 2 characters";
  if (value.length > 20) return "Must be 20 characters or less";
  if (!/^[a-z0-9._-]+$/.test(value)) return "Only letters, numbers, _ - . allowed";
  if (!/^[a-z0-9]/.test(value)) return "Must start with a letter or number";
  if (!/[a-z0-9]$/.test(value)) return "Must end with a letter or number";
  if (/[._-]{2,}/.test(value)) return "Cannot have consecutive . _ or -";
  return null;
}

export function OnboardingForm() {
  const router = useRouter();
  const t = useTranslations("auth.onboarding");
  const tApp = useTranslations("app");
  const prefersReducedMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace(ROUTES.AUTH.LOGIN);
    });
  }, [router]);

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  }

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
      setUsernameError("Required");
      hasError = true;
    } else {
      const err = validateUsername(trimmedUsername);
      if (err) { setUsernameError(err); hasError = true; }
    }
    if (hasError) return;

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace(ROUTES.AUTH.LOGIN);
      return;
    }
    const spaceIdx = trimmedName.indexOf(" ");
    const first_name = spaceIdx === -1 ? trimmedName : trimmedName.slice(0, spaceIdx);
    const last_name = spaceIdx === -1 ? null : trimmedName.slice(spaceIdx + 1) || null;

    await supabase.from("profiles").upsert({
      id: user.id,
      first_name,
      last_name,
      handle: trimmedUsername,
      is_onboarded: true,
    });

    await saveUserInterests(user.id, interests);

    router.replace(nextUrl ?? ROUTES.APP.HOME);
  }

  const mp = (custom: number) => ({
    custom,
    initial: prefersReducedMotion ? false : ("hidden" as const),
    animate: prefersReducedMotion ? undefined : ("visible" as const),
    variants: fadeUp as Variants,
  });

  const visibleInterests = expanded ? INTEREST_OPTIONS : INTEREST_OPTIONS.slice(0, VISIBLE_COUNT);
  const canSubmit = name.trim().length > 0 && username.trim().length > 0 && !validateUsername(username.trim());

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

        <FormField htmlFor="onboarding-username" label={t("username_label")}>
          <Input
            id="onboarding-username"
            type="text"
            placeholder={t("username_placeholder")}
            value={username}
            onChange={(e) => {
              const v = e.target.value.toLowerCase().replace(/\s/g, "");
              setUsername(v);
              setUsernameError(v ? (validateUsername(v) ?? null) : null);
            }}
            onBlur={() => {
              const v = username.trim();
              setUsernameError(v ? (validateUsername(v) ?? null) : "Required");
            }}
          />
          {usernameError && <p className="text-destructive text-xs mt-1">{usernameError}</p>}
        </FormField>

        <div>
          <p className="text-foreground mb-3 block font-sans text-xs font-bold tracking-[0.08em] uppercase">
            {t("interests_label")}
          </p>
          <div className="flex flex-wrap gap-2">
            {visibleInterests.map((interest) => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={cn(
                  "rounded-badge px-3 py-1.5 font-sans text-sm transition-all",
                  interests.includes(interest)
                    ? "bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/50 border"
                )}>
                {interest}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-muted-foreground hover:text-foreground rounded-badge px-3 py-1.5 font-sans text-sm underline transition-colors">
              {expanded ? t("show_less") : t("show_more")}
            </button>
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={loading || !canSubmit} className="w-full">
            {loading ? <Spinner /> : <>{t("submit")} <Arrow s={14} /></>}
          </Button>
        </div>
      </motion.form>
    </AuthPageShell>
  );
}
