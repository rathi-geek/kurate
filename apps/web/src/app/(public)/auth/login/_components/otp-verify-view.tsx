"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { fadeUp } from "@/app/_libs/utils/motion";
import { Arrow, BrandLogo } from "@/components/brand";

import { FormField } from "@/app/_components/form-field";
import { Spinner } from "@/app/_components/spinner";
import { AuthPageShell } from "../../_components/auth-page-shell";

interface OtpVerifyViewProps {
  email: string;
  otpCode: string;
  error: string;
  loading: boolean;
  onOtpChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export function OtpVerifyView({
  email,
  otpCode,
  error,
  loading,
  onOtpChange,
  onSubmit,
  onBack,
}: OtpVerifyViewProps) {
  const t = useTranslations("auth.login");
  const tApp = useTranslations("app");
  const prefersReducedMotion = useReducedMotion();

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
        <h2 className="mb-1.5 font-serif text-3xl font-normal tracking-tight">
          {t("otp_title")}
        </h2>
        <p className="text-muted-foreground mb-8 font-sans text-sm">
          {t("otp_subtitle", { email })}
        </p>
      </motion.div>

      <motion.form {...mp(2)} onSubmit={onSubmit} className="space-y-4">
        <FormField htmlFor="otp-code" label={t("otp_code_label")} error={error}>
          <Input
            id="otp-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder={t("otp_code_placeholder")}
            value={otpCode}
            onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, ""))}
            required
            autoFocus
          />
        </FormField>
        <div className="pt-2">
          <Button type="submit" disabled={loading || otpCode.length < 6} className="w-full">
            {loading ? <Spinner /> : <>{t("otp_submit")} <Arrow s={14} /></>}
          </Button>
        </div>
      </motion.form>

      <motion.div {...mp(3)} className="mt-6 text-center">
        <button
          type="button"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground focus:ring-ring rounded-sm font-sans text-sm underline focus:ring-2 focus:ring-offset-2 focus:outline-none">
          {t("otp_back")}
        </button>
      </motion.div>
    </AuthPageShell>
  );
}
