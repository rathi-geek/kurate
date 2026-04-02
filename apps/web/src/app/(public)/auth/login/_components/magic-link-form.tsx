"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSafeReducedMotion } from "@/app/_libs/hooks/useSafeReducedMotion";
import { useTranslations } from "@/i18n/use-translations";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { fadeUpLeft } from "@/app/_libs/utils/motion";
import { Arrow } from "@/components/brand";

import { FormField } from "@/app/_components/form-field";
import { Spinner } from "@/app/_components/spinner";

export enum MagicStep {
  Form = "form",
  Sent = "sent",
}

interface MagicLinkFormProps {
  email: string;
  step: MagicStep;
  error: string;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
}

export function MagicLinkForm({
  email,
  step,
  error,
  loading,
  onEmailChange,
  onSubmit,
  onReset,
}: MagicLinkFormProps) {
  const t = useTranslations("auth.login");
  const prefersReducedMotion = useSafeReducedMotion();

  return (
    <AnimatePresence mode="wait">
      {step === MagicStep.Form ? (
        <motion.form
          key="magic-form"
          initial={prefersReducedMotion ? false : "hidden"}
          animate={prefersReducedMotion ? undefined : "visible"}
          exit={prefersReducedMotion ? undefined : "exit"}
          variants={fadeUpLeft}
          onSubmit={onSubmit}
          className="space-y-4">
          <FormField
            htmlFor="magic-email"
            label={t("magic_link_email_label")}
            error={error}>
            <Input
              id="magic-email"
              type="email"
              placeholder={t("magic_link_email_placeholder")}
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              required
            />
          </FormField>
          <div className="pt-2">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Spinner /> : <>{t("magic_link_submit")} <Arrow s={14} /></>}
            </Button>
          </div>
        </motion.form>
      ) : (
        <motion.div
          key="magic-sent"
          initial={prefersReducedMotion ? false : "hidden"}
          animate={prefersReducedMotion ? undefined : "visible"}
          variants={fadeUpLeft}>
          <h3 className="mb-1.5 font-serif text-xl font-normal">{t("magic_link_sent_title")}</h3>
          <p className="text-muted-foreground font-sans text-sm">
            {t("magic_link_sent_message", { email })}
          </p>
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onReset}
              className="text-muted-foreground hover:text-foreground focus:ring-ring rounded-sm font-sans text-sm underline focus:ring-2 focus:ring-offset-2 focus:outline-none">
              {t("magic_link_use_different_email")}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
