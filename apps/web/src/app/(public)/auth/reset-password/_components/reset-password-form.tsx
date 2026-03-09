"use client";

import { useState } from "react";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ROUTES } from "@/app/_libs/constants/routes";
import { createClient } from "@/app/_libs/supabase/client";
import { fadeUp } from "@/app/_libs/utils/motion";
import { Arrow, BrandLogo } from "@/components/brand";
import { useRouter } from "@/i18n";

import { FormField } from "@/app/_components/form-field";
import { Spinner } from "@/app/_components/spinner";
import { AuthPageShell } from "../../_components/auth-page-shell";

export function ResetPasswordForm() {
  const router = useRouter();
  const t = useTranslations("auth.reset_password");
  const tApp = useTranslations("app");
  const prefersReducedMotion = useReducedMotion();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError(t("error_mismatch"));
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.replace(ROUTES.APP.CHAT);
  }

  const mp = (custom: number) => ({
    custom,
    initial: prefersReducedMotion ? false : ("hidden" as const),
    animate: prefersReducedMotion ? undefined : ("visible" as const),
    variants: fadeUp,
  });

  return (
    <AuthPageShell>
      <motion.div {...mp(0)} className="mb-12">
        <BrandLogo name={tApp("name")} s={24} />
      </motion.div>

      <motion.div {...mp(1)}>
        <h2 className="mb-1.5 font-serif text-3xl font-normal tracking-tight">{t("title")}</h2>
        <p className="text-muted-foreground mb-8 font-sans text-sm">{t("subtitle")}</p>
      </motion.div>

      <motion.form {...mp(2)} onSubmit={handleSubmit} className="space-y-4">
        <FormField htmlFor="reset-password" label={t("new_password_label")}>
          <Input
            id="reset-password"
            type="password"
            placeholder={t("placeholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </FormField>
        <FormField htmlFor="reset-confirm" label={t("confirm_password_label")} error={error}>
          <Input
            id="reset-confirm"
            type="password"
            placeholder={t("confirm_placeholder")}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            required
          />
        </FormField>
        <div className="pt-2">
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Spinner /> : <>{t("submit")} <Arrow s={14} /></>}
          </Button>
        </div>
      </motion.form>
    </AuthPageShell>
  );
}
