"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ROUTES } from "@/app/_libs/constants/routes";
import { createClient } from "@/app/_libs/supabase/client";
import { BrandStar, BrandSunburst, FloatDeco , Arrow } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const springGentle = {
  type: "spring" as const,
  stiffness: 260,
  damping: 25,
};

type Step = "form" | "sent";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/auth/callback?type=recovery` }
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep("sent");
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
        className="w-full max-w-[var(--container-auth)] px-8 relative z-10"
      >
        <div className="flex items-center gap-2 mb-12">
          <BrandStar s={20} />
          <span className="font-sans font-black text-lg tracking-tight">
            KURATE
          </span>
        </div>

        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: springGentle }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
            >
              <h2 className="font-serif text-3xl font-normal mb-1.5 tracking-tight">
                Reset your password
              </h2>
              <p className="font-sans text-sm text-muted-foreground mb-8">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                        Send Reset Link <Arrow s={14} />
                      </>
                    )}
                  </Button>
                </div>
              </form>

              <div className="border-t border-border mt-8 pt-6 text-center">
                <p className="font-sans text-sm text-muted-foreground">
                  Remember your password?{" "}
                  <span
                    className="font-bold underline cursor-pointer"
                    onClick={() => router.push(ROUTES.AUTH.LOGIN)}
                  >
                    Log in
                  </span>
                </p>
              </div>
            </motion.div>
          )}

          {step === "sent" && (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: springGentle }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
              className="text-center"
            >
              <h2 className="font-serif text-3xl font-normal mb-1.5 tracking-tight">
                Check your email
              </h2>
              <p className="font-sans text-sm text-muted-foreground mb-8">
                We sent a password reset link to{" "}
                <span className="font-bold text-foreground">{email}</span>
              </p>

              <div className="border-t border-border mt-8 pt-6">
                <p className="font-sans text-sm text-muted-foreground">
                  Back to{" "}
                  <span
                    className="font-bold underline cursor-pointer"
                    onClick={() => router.push(ROUTES.AUTH.LOGIN)}
                  >
                    Log in
                  </span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
