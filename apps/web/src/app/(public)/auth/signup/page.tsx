"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/app/_libs/constants/routes";
import { createClient } from "@/app/_libs/supabase/client";
import { BrandStar, BrandSunburst, FloatDeco, Arrow } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const router = useRouter();
  const t = useTranslations("auth.signup");
  const tApp = useTranslations("app");
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
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
    }

    router.push(ROUTES.APP.CHAT);
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center relative overflow-hidden">
      <div aria-hidden="true">
        <FloatDeco top={60} right={40} opacity={0.04}>
          <BrandSunburst s={120} />
        </FloatDeco>
        <FloatDeco bottom={80} left={60} opacity={0.03}>
          <BrandSunburst s={80} />
        </FloatDeco>
      </div>

      <main id="main-content" className="w-full max-w-[var(--container-auth)] px-8 relative z-10">
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

        <form onSubmit={handleSignup} className="space-y-4">
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
          </div>
          <div>
            <label className="block mb-2 font-sans text-xs font-bold uppercase tracking-[0.08em] text-foreground">
              {t("password_label")}
            </label>
            <Input
              type="password"
              placeholder={t("password_placeholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        <div className="border-t border-border mt-8 pt-6 text-center">
          <p className="font-sans text-sm text-muted-foreground">
            {t("already_have_account")}{" "}
            <Link
              href={ROUTES.AUTH.LOGIN}
              className="font-bold underline hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
            >
              {t("log_in")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
