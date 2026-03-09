"use client";

import { useEffect, useState } from "react";

import { type Variants, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { FormField } from "@/app/_components/form-field";
import { Spinner } from "@/app/_components/spinner";
import { ROUTES } from "@/app/_libs/constants/routes";
import { createClient } from "@/app/_libs/supabase/client";
import { cn } from "@/app/_libs/utils/cn";
import { fadeUp } from "@/app/_libs/utils/motion";
import { Arrow, BrandLogo } from "@/components/brand";
import { useRouter } from "@/i18n";

import { AuthPageShell } from "@/app/(public)/auth/_components/auth-page-shell";

const DEFAULT_INTERESTS = [
  "Technology",
  "Design",
  "Science",
  "Finance",
  "Startups",
  "Psychology",
  "Philosophy",
  "Writing",
  "Health",
  "Politics",
  "Climate",
  "Arts",
  "Education",
  "Business",
  "History",
];

const VISIBLE_COUNT = 5;

export function OnboardingForm() {
  const router = useRouter();
  const t = useTranslations("auth.onboarding");
  const tApp = useTranslations("app");
  const prefersReducedMotion = useReducedMotion();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.updateUser({
      data: { name, username, interests, onboarded: true },
    });
    router.replace(ROUTES.APP.CHAT);
  }

  const mp = (custom: number) => ({
    custom,
    initial: prefersReducedMotion ? false : ("hidden" as const),
    animate: prefersReducedMotion ? undefined : ("visible" as const),
    variants: fadeUp as Variants,
  });

  const visibleInterests = expanded ? DEFAULT_INTERESTS : DEFAULT_INTERESTS.slice(0, VISIBLE_COUNT);

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
            onChange={(e) => setName(e.target.value)}
          />
        </FormField>

        <FormField htmlFor="onboarding-username" label={t("username_label")}>
          <Input
            id="onboarding-username"
            type="text"
            placeholder={t("username_placeholder")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
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
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Spinner /> : <>{t("submit")} <Arrow s={14} /></>}
          </Button>
        </div>
      </motion.form>
    </AuthPageShell>
  );
}
