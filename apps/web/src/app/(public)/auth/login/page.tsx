"use client";

import { useState } from "react";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { createClient } from "@/app/_libs/supabase/client";
import { Arrow, BrandStar, BrandSunburst, FloatDeco } from "@/components/brand";
import type { Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i?: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 28, delay: (i ?? 0) * 0.07 },
  }),
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");

    if (!isDemo) {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }
    }

    router.replace("/chat");
    router.refresh();
  }

  return (
    <div className="bg-cream relative flex min-h-screen items-center justify-center overflow-hidden">
      <FloatDeco top={50} right={50} opacity={0.04}>
        <BrandSunburst s={100} />
      </FloatDeco>

      <div className="relative z-10 w-full max-w-[440px] px-8">
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mb-12 flex items-center gap-2"
        >
          <BrandStar s={20} />
          <span className="font-sans text-lg font-black tracking-tight">KURATE</span>
        </motion.div>

        <motion.div custom={1} initial="hidden" animate="visible" variants={fadeUp}>
          <h2 className="mb-1.5 font-serif text-[32px] font-normal tracking-tight">Welcome back</h2>
          <p className="text-muted-foreground mb-8 font-sans text-sm">Log in to your account.</p>
        </motion.div>

        <motion.form
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          onSubmit={handleLogin}
          className="space-y-4"
        >
          <div>
            <label className="text-foreground mb-2 block font-sans text-[11px] font-bold tracking-[0.08em] uppercase">
              Email
            </label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-foreground mb-2 block font-sans text-[11px] font-bold tracking-[0.08em] uppercase">
              Password
            </label>
            <Input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-destructive mt-1.5 font-sans text-[13px]">{error}</p>}
            <p
              className="text-muted-foreground hover:text-foreground mt-2 cursor-pointer text-right font-sans text-[13px] transition-colors"
              onClick={() => router.push("/auth/forgot-password")}>
              Forgot password?
            </p>
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <span className="inline-block animate-spin">
                  <BrandStar s={14} />
                </span>
              ) : (
                <>
                  Log In <Arrow s={14} />
                </>
              )}
            </Button>
          </div>
        </motion.form>

        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="border-border mt-8 border-t pt-6 text-center"
        >
          <p className="text-muted-foreground font-sans text-[13px]">
            No account?{" "}
            <span
              className="cursor-pointer font-bold underline"
              onClick={() => router.push("/auth/signup")}>
              Sign up
            </span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
