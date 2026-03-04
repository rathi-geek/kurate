"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ROUTES } from "@/app/_libs/constants/routes";
import { createClient } from "@/app/_libs/supabase/client";
import { BrandStar, BrandSunburst, FloatDeco, Arrow } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const springGentle = {
  type: "spring" as const,
  stiffness: 260,
  damping: 25,
};

type Step = "form" | "sent";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth.forgot_password");
  const tApp = useTranslations("app");
  const prefersReducedMotion = useReducedMotion();
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/auth/callback?type=recovery` }
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep("sent");
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center relative overflow-hidden">
      <div aria-hidden="true">
        <FloatDeco top={50} right={50} opacity={0.04}>
          <BrandSunburst s={100} />
        </FloatDeco>
      </div>

      <main id="main-content" className="w-full max-w-[var(--container-auth)] px-8 relative z-10">
        <motion.div
          variants={pageVariants}
          initial={prefersReducedMotion ? false : "hidden"}
          animate={prefersReducedMotion ? undefined : "visible"}
          className="w-full"
        >
        <div className="flex items-center gap-2 mb-12">
          <span aria-hidden="true"><BrandStar s={20} /></span>
          <span className="font-sans font-black text-lg tracking-tight">
            {tApp("name").toUpperCase()}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.div
              key="form"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, transition: springGentle }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8, transition: { duration: 0.15 } }}
            >
              <h2 className="font-serif text-3xl font-normal mb-1.5 tracking-tight">
                {t("title")}
              </h2>
              <p className="font-sans text-sm text-muted-foreground mb-8">
                {t("subtitle")}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-2 font-sans text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                    {t("email_label")}
                  </label>
                  <Input
                    type="email"
                    placeholder={t("email_placeholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  {error && (
                    <p className="mt-1.5 font-sans text-sm text-destructive">
                      {error}
                    </p>
                  )}
                </div>
                <div className="pt-2">
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="inline-block"
                      >
                        <BrandStar s={14} />
                      </motion.span>
                    ) : (
                      <>
                        {t("submit")} <Arrow s={14} />
                      </>
                    )}
                  </Button>
                </div>
              </form>

              <div className="border-t border-border mt-8 pt-6 text-center">
                <p className="font-sans text-sm text-muted-foreground">
                  {t("remember_password")}{" "}
                  <Link
                    href={ROUTES.AUTH.LOGIN}
                    className="font-bold underline hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
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
              className="text-center"
            >
              <h2 className="font-serif text-3xl font-normal mb-1.5 tracking-tight">
                {t("sent_title")}
              </h2>
              <p className="font-sans text-sm text-muted-foreground mb-8">
                {t("sent_message", { email })}
              </p>

              <div className="border-t border-border mt-8 pt-6">
                <p className="font-sans text-sm text-muted-foreground">
                  {t("back_to")}{" "}
                  <Link
                    href={ROUTES.AUTH.LOGIN}
                    className="font-bold underline hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                  >
                    {t("log_in")}
                  </Link>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}
