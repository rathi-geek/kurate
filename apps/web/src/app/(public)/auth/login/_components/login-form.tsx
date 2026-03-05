"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Link, useRouter } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/app/_libs/constants/routes";
import { createClient } from "@/app/_libs/supabase/client";
import { Arrow, BrandStar, BrandSunburst, FloatDeco } from "@/components/brand";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i?: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 28, delay: (i ?? 0) * 0.07 },
  }),
};

export function LoginForm() {
  const router = useRouter();
  const t = useTranslations("auth.login");
  const tApp = useTranslations("app");
  const prefersReducedMotion = useReducedMotion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (!isDemo) {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(t("error_invalid"));
        setLoading(false);
        return;
      }
    }

    router.replace(ROUTES.APP.CHAT);
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream">
      <div aria-hidden="true">
        <FloatDeco top={50} right={50} opacity={0.04}>
          <BrandSunburst s={100} />
        </FloatDeco>
      </div>

      <main id="main-content" className="relative z-10 w-full max-w-[var(--container-auth)] px-8">
        <motion.div
          custom={0}
          initial={prefersReducedMotion ? false : "hidden"}
          animate={prefersReducedMotion ? undefined : "visible"}
          variants={fadeUp}
          className="mb-12 flex items-center gap-2"
        >
          <span aria-hidden="true"><BrandStar s={20} /></span>
          <span className="font-sans text-lg font-black tracking-tight">{tApp("name").toUpperCase()}</span>
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
          onSubmit={handleLogin}
          className="space-y-4"
        >
          <div>
            <label htmlFor="login-email" className="mb-2 block font-sans text-xs font-bold uppercase tracking-[0.08em] text-foreground">
              {t("email_label")}
            </label>
            <Input
              id="login-email"
              type="email"
              placeholder={t("email_placeholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-2 block font-sans text-xs font-bold uppercase tracking-[0.08em] text-foreground">
              {t("password_label")}
            </label>
            <Input
              id="login-password"
              type="password"
              placeholder={t("password_placeholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="mt-1.5 font-sans text-sm text-destructive">{error}</p>}
            <p className="mt-2 text-right font-sans text-sm text-muted-foreground">
              <Link
                href={ROUTES.AUTH.FORGOT_PASSWORD}
                className="rounded-sm underline transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {t("forgot_password")}
              </Link>
            </p>
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <span className="inline-block animate-spin">
                  <BrandStar s={14} />
                </span>
              ) : (
                <>
                  {t("submit")} <Arrow s={14} />
                </>
              )}
            </Button>
          </div>
        </motion.form>

        <motion.div
          custom={3}
          initial={prefersReducedMotion ? false : "hidden"}
          animate={prefersReducedMotion ? undefined : "visible"}
          variants={fadeUp}
          className="mt-8 border-t border-border pt-6 text-center"
        >
          <p className="font-sans text-sm text-muted-foreground">
            {t("no_account")}{" "}
            <Link
              href={ROUTES.AUTH.SIGNUP}
              className="rounded-sm font-bold underline hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {t("sign_up")}
            </Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
