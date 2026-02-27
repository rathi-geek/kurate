"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/app/_libs/supabase/client";
import { BrandStar, BrandSunburst, FloatDeco } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Arrow } from "@/components/brand";

const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
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

    router.push("/chat" as never);
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center relative overflow-hidden">
      <FloatDeco top={50} right={50} opacity={0.04}>
        <BrandSunburst s={100} />
      </FloatDeco>

      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[440px] px-8 relative z-10"
      >
        <div className="flex items-center gap-2 mb-12">
          <BrandStar s={20} />
          <span className="font-sans font-black text-lg tracking-tight">
            KURATE
          </span>
        </div>

        <h2 className="font-serif text-[32px] font-normal mb-1.5 tracking-tight">
          Welcome back
        </h2>
        <p className="font-sans text-sm text-muted-foreground mb-8">
          Log in to your account.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block mb-2 font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-foreground">
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
            <label className="block mb-2 font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-foreground">
              Password
            </label>
            <Input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && (
              <p className="mt-1.5 font-sans text-[13px] text-destructive">
                {error}
              </p>
            )}
            <p
              className="font-sans text-[13px] text-muted-foreground mt-2 text-right cursor-pointer hover:text-foreground transition-colors"
              onClick={() => router.push("/auth/forgot-password")}
            >
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
        </form>

        <div className="border-t border-border mt-8 pt-6 text-center">
          <p className="font-sans text-[13px] text-muted-foreground">
            No account?{" "}
            <span
              className="font-bold underline cursor-pointer"
              onClick={() => router.push("/auth/signup")}
            >
              Sign up
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
