"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ROUTES } from "@/app/_libs/constants/routes";
import { fadeUpRight } from "@/app/_libs/utils/motion";
import { Arrow } from "@/components/brand";
import { Link } from "@/i18n";

import { FormField } from "@/app/_components/form-field";
import { Spinner } from "@/app/_components/spinner";

interface PasswordFormProps {
  email: string;
  password: string;
  error: string;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function PasswordForm({
  email,
  password,
  error,
  loading,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: PasswordFormProps) {
  const t = useTranslations("auth.login");
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      key="password-form"
      initial={prefersReducedMotion ? false : "hidden"}
      animate={prefersReducedMotion ? undefined : "visible"}
      variants={fadeUpRight}>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField htmlFor="login-email" label={t("email_label")}>
          <Input
            id="login-email"
            type="email"
            placeholder={t("email_placeholder")}
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            required
          />
        </FormField>
        <FormField htmlFor="login-password" label={t("password_label")} error={error}>
          <Input
            id="login-password"
            type="password"
            placeholder={t("password_placeholder")}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            required
          />
          <p className="text-muted-foreground mt-2 text-right font-sans text-sm">
            <Link
              href={ROUTES.AUTH.FORGOT_PASSWORD}
              className="hover:text-foreground focus:ring-ring rounded-sm underline transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none">
              {t("forgot_password")}
            </Link>
          </p>
        </FormField>
        <div className="pt-2">
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Spinner /> : <>{t("submit")} <Arrow s={14} /></>}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
