"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import { Link, useRouter } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/app/_libs/constants/routes";
import { createClient } from "@/app/_libs/supabase/client";
import { Arrow, BrandStar, BrandSunburst, FloatDeco } from "@/components/brand";

const springGentle = { type: "spring" as const, stiffness: 260, damping: 25 };

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i?: number) => ({
    opacity: 1,
    y: 0,
    transition: { ...springGentle, delay: (i ?? 0) * 0.07 },
  }),
};

type Step = "form" | "sent";

export function SignupForm() {
  const router = useRouter();
  const t = useTranslations("auth.signup");
  const tApp = useTranslations("app");
  const prefersReducedMotion = useReducedMotion();
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (!isDemo) {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        // Generic error — never expose authError.message (email enumeration risk)
        setError(t("error_general"));
        setLoading(false);
        return;
      }

      // session is null when email confirmation is required
      if (data.session === null) {
        setStep("sent");
        setLoading(false);
        return;
      }
    }

    router.replace(ROUTES.APP.CHAT);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream">
      <div aria-hidden="true">
        <FloatDeco top={60} right={40} opacity={0.04}>
          <BrandSunburst s={120} />
        </FloatDeco>
        <FloatDeco bottom={80} left={60} opacity={0.03}>
          <BrandSunburst s={80} />
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

        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.div
              key="form"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, transition: springGentle }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8, transition: { duration: 0.15 } }}
            >
              <h2 className="mb-1.5 font-serif text-3xl font-normal tracking-tight">{t("title")}</h2>
              <p className="mb-8 font-sans text-sm text-muted-foreground">{t("subtitle")}</p>

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label htmlFor="signup-email" className="mb-2 block font-sans text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                    {t("email_label")}
                  </label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder={t("email_placeholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="signup-password" className="mb-2 block font-sans text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                    {t("password_label")}
                  </label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder={t("password_placeholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                  {error && (
                    <p className="mt-1.5 font-sans text-sm text-destructive">{error}</p>
                  )}
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
              </form>

              <div className="mt-8 border-t border-border pt-6 text-center">
                <p className="font-sans text-sm text-muted-foreground">
                  {t("already_have_account")}{" "}
                  <Link
                    href={ROUTES.AUTH.LOGIN}
                    className="rounded-sm font-bold underline hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {t("log_in")}
                  </Link>
                </p>
              </div>
            </motion.div>
          )}

          {step === "sent" && (
            <motion.div
              key="sent"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, transition: springGentle }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8, transition: { duration: 0.15 } }}
            >
              <h2 className="mb-1.5 font-serif text-3xl font-normal tracking-tight">{t("email_sent_title")}</h2>
              <p className="mb-8 font-sans text-sm text-muted-foreground">{t("email_sent_message", { email })}</p>

              <div className="mt-8 border-t border-border pt-6 text-center">
                <p className="font-sans text-sm text-muted-foreground">
                  {t("already_have_account")}{" "}
                  <Link
                    href={ROUTES.AUTH.LOGIN}
                    className="rounded-sm font-bold underline hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {t("log_in")}
                  </Link>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
