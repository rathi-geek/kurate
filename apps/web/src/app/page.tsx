"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";

import { ROUTES } from "@kurate/utils";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";

import { useSafeReducedMotion } from "@/app/_libs/hooks/useSafeReducedMotion";
import { BrandConcentricArch } from "@/components/brand";
import { AndroidIcon, AppleIcon, VolumeOffIcon, VolumeOnIcon } from "@/components/icons";
import { useTranslations } from "@/i18n/use-translations";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const LOGOS = [
  "Product Hunt",
  "Hacker News",
  "Indie Hackers",
  "Substack",
  "Every",
  "Stratechery",
  "The Verge",
  "Wired",
  "Arc",
  "Readwise",
];

export default function LandingPage() {
  const prefersReducedMotion = useSafeReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [autoplayFailed, setAutoplayFailed] = useState(false);

  const t = useTranslations("landing");
  const tNav = useTranslations("nav");
  const tApp = useTranslations("app");

  useEffect(() => {
    const attemptAutoplay = async () => {
      if (!videoRef.current) return;

      // Try unmuted first
      videoRef.current.muted = false;
      try {
        await videoRef.current.play();
        setIsMuted(false);
      } catch (err) {
        // Blocked - fallback to muted
        videoRef.current.muted = true;
        await videoRef.current.play();
        setAutoplayFailed(true);

        // Hide hint after 5 seconds
        setTimeout(() => setAutoplayFailed(false), 5000);
      }
    };

    attemptAutoplay();
  }, []);

  return (
    <div className="bg-cream text-ink min-h-screen">
      {/* Nav */}
      <nav
        aria-label="Main navigation"
        className="border-ink/[0.03] bg-cream sticky top-0 z-50 flex items-center justify-between border-b px-6 py-4 md:px-8">
        <Link href={ROUTES.HOME} aria-label="Kurate home" className="flex items-center gap-2">
          <BrandConcentricArch s={26} className="text-ink" />
          <span className="text-ink font-sans text-xl font-black tracking-tight">
            {tApp("name")}
          </span>
        </Link>
        <div className="flex items-center gap-7">
          <Link
            href="#features"
            className="text-ink/75 hover:text-ink hidden font-sans text-sm font-medium transition-opacity md:inline">
            {tNav("product")}
          </Link>
          <Button asChild size="sm">
            <Link href={ROUTES.APP.HOME}>{t("get_started")}</Link>
          </Button>
        </div>
      </nav>

      <main id="main-content">
        {/* Hero */}
        <section
          aria-labelledby="hero-heading"
          className="relative px-6 py-20 text-center md:py-32">
          <motion.div
            initial={false}
            animate={prefersReducedMotion ? undefined : "visible"}
            variants={staggerContainer}
            className="container-content relative z-10">
            <motion.h1
              id="hero-heading"
              initial={prefersReducedMotion ? false : undefined}
              animate={prefersReducedMotion ? undefined : "visible"}
              variants={fadeUp}
              transition={{ type: "spring", stiffness: 260, damping: 25 }}
              className="text-ink mb-6 font-serif text-4xl font-normal tracking-[-0.02em] md:text-6xl">
              <span className="italic">{t("hero_title")}</span>
            </motion.h1>
            <motion.p
              initial={prefersReducedMotion ? false : undefined}
              animate={prefersReducedMotion ? undefined : "visible"}
              variants={fadeUp}
              transition={{ type: "spring", stiffness: 260, damping: 25, delay: 0.15 }}
              className="text-ink/75 mx-auto mb-9 max-w-[500px] font-sans text-lg leading-relaxed">
              {t("hero_subtitle")}
            </motion.p>
            <motion.div
              initial={prefersReducedMotion ? false : undefined}
              animate={prefersReducedMotion ? undefined : "visible"}
              variants={fadeUp}
              transition={{ type: "spring", stiffness: 260, damping: 25, delay: 0.3 }}
              className="flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href={ROUTES.AUTH.LOGIN}>{t("get_started")}</Link>
              </Button>
            </motion.div>
            <motion.div
              initial={prefersReducedMotion ? false : undefined}
              animate={prefersReducedMotion ? undefined : "visible"}
              variants={fadeUp}
              transition={{ type: "spring", stiffness: 260, damping: 25, delay: 0.45 }}
              className="group rounded-card relative mx-auto mt-12 w-full max-w-4xl overflow-hidden bg-black shadow-2xl">
              <video ref={videoRef} loop playsInline preload="auto" className="block w-full">
                <source
                  src="https://eavlskuuyzzttyqsfsqc.supabase.co/storage/v1/object/public/assets/WhatsApp%20Video%202026-04-09%20at%2020.09.04.mp4"
                  type="video/mp4"
                />
              </video>
              <button
                onClick={() => {
                  if (videoRef.current) {
                    const newMuted = !isMuted;
                    videoRef.current.muted = newMuted;
                    setIsMuted(newMuted);
                    setAutoplayFailed(false);
                  }
                }}
                aria-label={isMuted ? "Unmute video" : "Mute video"}
                className={`absolute right-3 bottom-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-opacity ${
                  autoplayFailed ? "animate-pulse opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}>
                {isMuted ? (
                  <VolumeOffIcon className="h-4 w-4" />
                ) : (
                  <VolumeOnIcon className="h-4 w-4" />
                )}
                {autoplayFailed && (
                  <span className="absolute -top-10 right-0 rounded-md bg-black/90 px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow-lg">
                    Tap for sound
                  </span>
                )}
              </button>
            </motion.div>
          </motion.div>
        </section>

        {/* Vault Showcase */}
        <section id="features" className="bg-muted px-6 py-16 md:py-20">
          <div className="container-page flex flex-col items-center gap-10 md:flex-row md:justify-between">
            <div className="flex-1">
              <div className="mb-7 flex flex-wrap gap-2">
                {(["Web", "Extension"] as const).map((p) => (
                  <span
                    key={p}
                    className="border-ink/[0.08] text-ink flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-sans text-sm font-medium">
                    <div className="bg-ink h-1.5 w-1.5 rounded-full" />
                    {p}
                  </span>
                ))}
                <span className="border-ink/[0.08] text-ink/40 flex items-center gap-2 rounded-full border border-dashed px-3.5 py-1.5 font-sans text-sm">
                  <AppleIcon className="h-3 w-3" />
                  <AndroidIcon className="h-3 w-3" />
                  <span className="font-sans text-xs italic">Mobile app coming soon</span>
                </span>
              </div>
              <h2 className="text-ink mb-5 font-serif text-3xl font-normal md:text-5xl">
                {t("save_title")}
              </h2>
              <p className="text-ink/75 mb-8 max-w-[400px] font-sans text-base leading-[1.7]">
                {t("save_description")}
              </p>
            </div>

            {/* Phone mockup */}
            <div aria-hidden="true" className="flex justify-center">
              <div className="bg-ink rounded-card border-border h-[400px] w-[220px] overflow-hidden border-2 shadow-xl">
                <div className="p-4 pt-10">
                  <div className="mb-3 font-sans text-xs font-bold tracking-[0.08em] text-white/40 uppercase">
                    {t("library_label")}
                  </div>
                  {[
                    { t: "Tech Trends Report 2026", src: "research.contrary.com", tag: "AI" },
                    { t: "How to Do Great Work", src: "paulgraham.com", tag: "Startups" },
                    { t: "What I Read This Week #172", src: "chamath.substack.com", tag: "AI" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="py-2.5"
                      style={{ borderTop: i ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                      <div className="mb-0.5 font-sans text-xs font-semibold text-white">
                        {item.t}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-white/35">{item.src}</span>
                        <span className="rounded-sm bg-white/[0.07] px-1.5 py-0.5 text-xs text-white/50">
                          {item.tag}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Logo Ticker */}
        {/* <div aria-hidden="true" className="bg-teal overflow-hidden py-5">
          <div className="flex" style={{ animation: "marquee 20s linear infinite" }}>
            {[...LOGOS, ...LOGOS].map((l, i) => (
              <span
                key={i}
                className="px-6 font-sans text-base font-bold whitespace-nowrap text-white/50">
                {l}
              </span>
            ))}
          </div>
        </div> */}
      </main>

      {/* Footer */}
      <footer className="border-ink/[0.06] bg-cream border-t px-6 py-12">
        <div className="container-page">
          <div className="mb-10 flex items-center justify-center gap-5">
            <BrandConcentricArch s={68} className="text-ink" />
            <span className="text-ink font-sans text-5xl leading-none font-black tracking-[-0.04em] md:text-6xl">
              {tApp("name")}
            </span>
          </div>

          <div className="border-ink/[0.06] flex flex-col items-center justify-between gap-4 border-t pt-5 md:flex-row">
            <span className="text-ink/55 font-sans text-sm">{t("copyright")}</span>
            <div className="flex items-center gap-3">
              <Link
                href={ROUTES.PRIVACY}
                className="text-ink/55 hover:text-ink/75 font-sans text-sm transition-colors">
                {t("privacy")}
              </Link>
              <Link
                href="/privacy#contact"
                className="text-ink/55 hover:text-ink/75 font-sans text-sm transition-colors">
                {t("footer_help")}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
