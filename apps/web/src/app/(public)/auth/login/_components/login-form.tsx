"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import { Link, useRouter } from "@/i18n";
import { env } from "env";
import { cn } from "@/app/_libs/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/app/_libs/constants/routes";
import { createClient } from "@/app/_libs/supabase/client";
import { Arrow, BrandLogo, BrandStar, BrandSunburst, FloatDeco } from "@/components/brand";
import { GoogleIcon } from "@/components/icons";

const springGentle = { type: "spring" as const, stiffness: 260, damping: 25 };

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i?: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 28, delay: (i ?? 0) * 0.07 },
  }),
};

enum AuthStep {
  Form = "form",
  OtpVerify = "otp",
}

enum LoginMethod {
  Password = "password",
  MagicLink = "magic-link",
}

enum MagicStep {
  Form = "form",
  Sent = "sent",
}

export function LoginForm() {
  const router = useRouter();
  const t = useTranslations("auth.login");
  const tApp = useTranslations("app");
  const prefersReducedMotion = useReducedMotion();

  const [authStep, setAuthStep] = useState<AuthStep>(AuthStep.Form);
  const [method, setMethod] = useState<LoginMethod>(LoginMethod.Password);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicEmail, setMagicEmail] = useState("");
  const [magicStep, setMagicStep] = useState<MagicStep>(MagicStep.Form);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicError, setMagicError] = useState("");

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${env.NEXT_PUBLIC_APP_URL}${ROUTES.AUTH.CALLBACK}`,
      },
    });
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setMagicError("");
    setMagicLoading(true);

    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: magicEmail,
      options: {
        emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}${ROUTES.AUTH.CALLBACK}`,
      },
    });

    if (otpError) {
      setMagicError(t("error_invalid"));
      setMagicLoading(false);
      return;
    }

    setMagicStep(MagicStep.Sent);
    setMagicLoading(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (!signInError) {
      const isOnboarded = signInData.user?.user_metadata?.onboarded === true;
      router.replace(isOnboarded ? ROUTES.APP.CHAT : ROUTES.APP.ONBOARDING);
      return;
    }

    const { data: signUpData, error: signUpError } =
      await supabase.auth.signUp({ email, password });

    if (signUpError) {
      setError(t("error_wrong_password"));
      setLoading(false);
      return;
    }

    if (signUpData.session === null) {
      setAuthStep(AuthStep.OtpVerify);
      setLoading(false);
      return;
    }

    router.replace(ROUTES.APP.ONBOARDING);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: "signup",
    });

    if (verifyError) {
      setError(t("otp_error"));
      setLoading(false);
      return;
    }

    router.replace(ROUTES.APP.ONBOARDING);
  }

  if (authStep === AuthStep.OtpVerify) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
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
            <h2 className="mb-1.5 font-serif text-3xl font-normal tracking-tight">{t("otp_title")}</h2>
            <p className="mb-8 font-sans text-sm text-muted-foreground">{t("otp_subtitle", { email })}</p>
          </motion.div>

          <motion.form
            custom={2}
            initial={prefersReducedMotion ? false : "hidden"}
            animate={prefersReducedMotion ? undefined : "visible"}
            variants={fadeUp}
            onSubmit={handleVerifyOtp}
            className="space-y-4"
          >
            <div>
              <label htmlFor="otp-code" className="mb-2 block font-sans text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                {t("otp_code_label")}
              </label>
              <Input
                id="otp-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder={t("otp_code_placeholder")}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                required
                autoFocus
              />
              {error && <p className="mt-1.5 font-sans text-sm text-destructive">{error}</p>}
            </div>
            <div className="pt-2">
              <Button type="submit" disabled={loading || otpCode.length < 6} className="w-full">
                {loading ? (
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-block"><BrandStar s={14} /></motion.span>
                ) : (
                  <>{t("otp_submit")} <Arrow s={14} /></>
                )}
              </Button>
            </div>
          </motion.form>

          <motion.div
            custom={3}
            initial={prefersReducedMotion ? false : "hidden"}
            animate={prefersReducedMotion ? undefined : "visible"}
            variants={fadeUp}
            className="mt-6 text-center"
          >
            <button
              type="button"
              onClick={() => { setAuthStep(AuthStep.Form); setOtpCode(""); setError(""); }}
              className="font-sans text-sm text-muted-foreground underline hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
            >
              {t("otp_back")}
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
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

        {/* Google OAuth */}
        <motion.div
          custom={2}
          initial={prefersReducedMotion ? false : "hidden"}
          animate={prefersReducedMotion ? undefined : "visible"}
          variants={fadeUp}
        >
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={handleGoogle}
          >
            <GoogleIcon className="h-4 w-4" />
            {t("google")}
          </Button>

          {/* Divider */}
          <div className="relative my-2 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="font-sans text-xs text-muted-foreground">{t("or_divider")}</span>
            <div className="h-px flex-1 bg-border" />
          </div>
        </motion.div>

        {/* Method tabs */}
        <motion.div
          custom={3}
          initial={prefersReducedMotion ? false : "hidden"}
          animate={prefersReducedMotion ? undefined : "visible"}
          variants={fadeUp}
          className="relative mb-6 flex rounded-button bg-surface p-1"
        >
          {/* Single always-mounted sliding pill — translates by its own width (= one tab) */}
          <motion.span
            aria-hidden="true"
            className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-[calc(var(--radius-button)-2px)] bg-primary"
            initial={false}
            animate={{ x: method === LoginMethod.Password ? "0%" : "100%" }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 500, damping: 40, mass: 0.6 }
            }
          />
          {([LoginMethod.Password, LoginMethod.MagicLink] as LoginMethod[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={cn(
                "relative z-10 flex-1 px-4 py-1.5 font-sans text-sm font-medium transition-colors duration-200",
                method === m ? "text-primary-foreground" : "text-muted-foreground hover:text-brand"
              )}
            >
              {m === LoginMethod.Password ? t("tab_password") : t("tab_magic_link")}
            </button>
          ))}
        </motion.div>

        {method === LoginMethod.Password && (
          <motion.div
            key="password-form"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, transition: springGentle }}
          >
            <motion.form
              custom={4}
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
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-block">
                      <BrandStar s={14} />
                    </motion.span>
                  ) : (
                    <>
                      {t("submit")} <Arrow s={14} />
                    </>
                  )}
                </Button>
              </div>
            </motion.form>
          </motion.div>
        )}

        {method === LoginMethod.MagicLink && (
          <AnimatePresence mode="wait">
            {magicStep === MagicStep.Form ? (
              <motion.form
                key="magic-form"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, transition: springGentle }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8, transition: { duration: 0.15 } }}
                onSubmit={handleMagicLink}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="magic-email" className="mb-2 block font-sans text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                    {t("magic_link_email_label")}
                  </label>
                  <Input
                    id="magic-email"
                    type="email"
                    placeholder={t("magic_link_email_placeholder")}
                    value={magicEmail}
                    onChange={(e) => setMagicEmail(e.target.value)}
                    required
                  />
                  {magicError && <p className="mt-1.5 font-sans text-sm text-destructive">{magicError}</p>}
                </div>
                <div className="pt-2">
                  <Button type="submit" disabled={magicLoading} className="w-full">
                    {magicLoading ? (
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-block"><BrandStar s={14} /></motion.span>
                    ) : (
                      <>{t("magic_link_submit")} <Arrow s={14} /></>
                    )}
                  </Button>
                </div>
              </motion.form>
            ) : (
              <motion.div
                key="magic-sent"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, transition: springGentle }}
              >
                <h3 className="mb-1.5 font-serif text-xl font-normal">{t("magic_link_sent_title")}</h3>
                <p className="font-sans text-sm text-muted-foreground">{t("magic_link_sent_message", { email: magicEmail })}</p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
