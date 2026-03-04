"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ROUTES } from "@/app/_libs/constants/routes";
import { createClient } from "@/app/_libs/supabase/client";
import { BrandStar, BrandSunburst, FloatDeco, Arrow } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function ResetPasswordPage() {
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
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push(ROUTES.APP.CHAT);
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

        <h2 className="font-serif text-3xl font-normal mb-1.5 tracking-tight">
          {t("title")}
        </h2>
        <p className="font-sans text-sm text-muted-foreground mb-8">
          {t("subtitle")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 font-sans text-xs font-bold uppercase tracking-[0.08em] text-foreground">
              {t("new_password_label")}
            </label>
            <Input
              type="password"
              placeholder={t("placeholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="block mb-2 font-sans text-xs font-bold uppercase tracking-[0.08em] text-foreground">
              {t("confirm_password_label")}
            </label>
            <Input
              type="password"
              placeholder={t("confirm_placeholder")}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
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
        </motion.div>
      </main>
    </div>
  );
}
