"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/app/_libs/supabase/client";
import { BrandStar, BrandSunburst, FloatDeco , Arrow } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
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
          Set new password
        </h2>
        <p className="font-sans text-sm text-muted-foreground mb-8">
          Choose a new password for your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-foreground">
              New password
            </label>
            <Input
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="block mb-2 font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-foreground">
              Confirm password
            </label>
            <Input
              type="password"
              placeholder="Re-enter your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              required
            />
            {error && (
              <p className="mt-1.5 font-sans text-[13px] text-destructive">
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
                  Update Password <Arrow s={14} />
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
