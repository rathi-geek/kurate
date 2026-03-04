"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/_libs/supabase/client";
import { BrandStar, BrandSunburst, FloatDeco , Arrow } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const router = useRouter();
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

    router.push("/chat" as never);
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center relative overflow-hidden">
      <FloatDeco top={60} right={40} opacity={0.04}>
        <BrandSunburst s={120} />
      </FloatDeco>
      <FloatDeco bottom={80} left={60} opacity={0.03}>
        <BrandSunburst s={80} />
      </FloatDeco>

      <div className="w-full max-w-[var(--container-auth)] px-8 relative z-10">
        <div className="flex items-center gap-2 mb-12">
          <BrandStar s={20} />
          <span className="font-sans font-black text-lg tracking-tight">
            KURATE
          </span>
        </div>

        <h2 className="font-serif text-3xl font-normal mb-1.5 tracking-tight">
          Start reading smarter
        </h2>
        <p className="font-sans text-sm text-muted-foreground mb-8">
          Create your account to get started.
        </p>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block mb-2 font-sans text-xs font-bold uppercase tracking-[0.08em] text-foreground">
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
            <label className="block mb-2 font-sans text-xs font-bold uppercase tracking-[0.08em] text-foreground">
              Password
            </label>
            <Input
              type="password"
              placeholder="At least 8 characters"
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
                  Create Account <Arrow s={14} />
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="border-t border-border mt-8 pt-6 text-center">
          <p className="font-sans text-sm text-muted-foreground">
            Already have an account?{" "}
            <span
              className="font-bold underline cursor-pointer"
              onClick={() => router.push("/auth/login")}
            >
              Log in
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
