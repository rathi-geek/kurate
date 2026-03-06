"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useRouter } from "@/i18n";
import { cn } from "@/app/_libs/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/app/_libs/constants/routes";
import { createClient } from "@/app/_libs/supabase/client";
import { Arrow, BrandLogo, BrandStar, BrandSunburst, FloatDeco } from "@/components/brand";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i?: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 28, delay: (i ?? 0) * 0.07 },
  }),
};

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
      if (!data.user) {
        router.replace(ROUTES.AUTH.LOGIN);
      }
    });
  }, [router]);

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
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

  const visibleInterests = expanded ? DEFAULT_INTERESTS : DEFAULT_INTERESTS.slice(0, VISIBLE_COUNT);

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <FloatDeco top={50} right={50} opacity={0.04}>
          <BrandSunburst s={100} />
        </FloatDeco>
      </div>

      <main id="main-content" className="relative z-10 mx-auto w-full max-w-[var(--container-auth)] px-8 py-16">
        <motion.div
          custom={0}
          initial={prefersReducedMotion ? false : "hidden"}
          animate={prefersReducedMotion ? undefined : "visible"}
          variants={fadeUp}
          className="mb-12"
        >
          <BrandLogo name={tApp("name")} s={24} />
        </motion.div>

        <motion.div
          custom={1}
          initial={prefersReducedMotion ? false : "hidden"}
          animate={prefersReducedMotion ? undefined : "visible"}
          variants={fadeUp}
        >
          <h2 className="mb-1.5 font-serif text-3xl font-normal tracking-tight">{t("title")}</h2>
          <p className="mb-8 font-sans text-sm text-muted-foreground">{t("subtitle")}</p>
        </motion.div>

        <motion.form
          custom={2}
          initial={prefersReducedMotion ? false : "hidden"}
          animate={prefersReducedMotion ? undefined : "visible"}
          variants={fadeUp}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div>
            <label htmlFor="onboarding-name" className="mb-2 block font-sans text-xs font-bold uppercase tracking-[0.08em] text-foreground">
              {t("name_label")}
            </label>
            <Input
              id="onboarding-name"
              type="text"
              placeholder={t("name_placeholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="onboarding-username" className="mb-2 block font-sans text-xs font-bold uppercase tracking-[0.08em] text-foreground">
              {t("username_label")}
            </label>
            <Input
              id="onboarding-username"
              type="text"
              placeholder={t("username_placeholder")}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <p className="mb-3 block font-sans text-xs font-bold uppercase tracking-[0.08em] text-foreground">
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
                      : "border border-border bg-card text-foreground hover:border-primary/50"
                  )}
                >
                  {interest}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="rounded-badge px-3 py-1.5 font-sans text-sm text-muted-foreground underline hover:text-foreground transition-colors"
              >
                {expanded ? t("show_less") : t("show_more")}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-block"><BrandStar s={14} /></motion.span>
              ) : (
                <>{t("submit")} <Arrow s={14} /></>
              )}
            </Button>
          </div>
        </motion.form>
      </main>
    </div>
  );
}
