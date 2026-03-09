"use client";

import { useState } from "react";

import { env } from "env";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ROUTES } from "@/app/_libs/constants/routes";
import { createClient } from "@/app/_libs/supabase/client";
import { springGentle } from "@/lib/motion-variants";
import { Arrow } from "@/components/brand";
import { BrandLogo } from "@/components/brand";
import { Link } from "@/i18n";

import { ErrorAlert } from "@/app/_components/error-alert";
import { FormField } from "@/app/_components/form-field";
import { Spinner } from "@/app/_components/spinner";
import { AuthPageShell } from "../../_components/auth-page-shell";

type Step = "form" | "sent";

export function ForgotPasswordForm() {
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
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${env.NEXT_PUBLIC_APP_URL}${ROUTES.AUTH.CALLBACK}?type=recovery`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep("sent");
  }

  const mp = (custom?: number) => ({
    custom,
    initial: prefersReducedMotion ? false : { opacity: 0, y: 8 },
    animate: prefersReducedMotion ? undefined : { opacity: 1, y: 0, transition: springGentle },
    exit: prefersReducedMotion ? undefined : { opacity: 0, y: -8, transition: { duration: 0.15 } },
  });

  return (
    <AuthPageShell>
      <div className="mb-12">
        <BrandLogo name={tApp("name")} s={24} />
      </div>

      <AnimatePresence mode="wait">
        {step === "form" && (
          <motion.div key="form" {...mp()}>
            <h2 className="mb-1.5 font-serif text-3xl font-normal tracking-tight">{t("title")}</h2>
            <p className="text-muted-foreground mb-8 font-sans text-sm">{t("subtitle")}</p>

            {error && <ErrorAlert>{error}</ErrorAlert>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField htmlFor="forgot-email" label={t("email_label")}>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder={t("email_placeholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </FormField>
              <div className="pt-2">
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? <Spinner /> : <>{t("submit")} <Arrow s={14} /></>}
                </Button>
              </div>
            </form>

            <div className="border-border mt-8 border-t pt-6 text-center">
              <p className="text-muted-foreground font-sans text-sm">
                {t("remember_password")}{" "}
                <Link
                  href={ROUTES.AUTH.LOGIN}
                  className="focus:ring-ring rounded-sm font-bold underline hover:text-foreground focus:ring-2 focus:ring-offset-2 focus:outline-none">
                  {t("log_in")}
                </Link>
              </p>
            </div>
          </motion.div>
        )}

        {step === "sent" && (
          <motion.div key="sent" {...mp()} className="text-center">
            <h2 className="mb-1.5 font-serif text-3xl font-normal tracking-tight">
              {t("sent_title")}
            </h2>
            <p className="text-muted-foreground mb-8 font-sans text-sm">
              {t("sent_message", { email })}
            </p>

            <div className="border-border mt-8 border-t pt-6">
              <p className="text-muted-foreground font-sans text-sm">
                {t("back_to")}{" "}
                <Link
                  href={ROUTES.AUTH.LOGIN}
                  className="focus:ring-ring rounded-sm font-bold underline hover:text-foreground focus:ring-2 focus:ring-offset-2 focus:outline-none">
                  {t("log_in")}
                </Link>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthPageShell>
  );
}
