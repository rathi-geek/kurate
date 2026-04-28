"use client";

import { useRef, useState } from "react";

import Link from "next/link";

import { ROUTES } from "@kurate/utils";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";

import { useSafeReducedMotion } from "@/app/_libs/hooks/useSafeReducedMotion";
import { BrandConcentricArch } from "@/components/brand";
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
  const t = useTranslations("landing");
  const tNav = useTranslations("nav");
  const tApp = useTranslations("app");

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
              <video
                ref={videoRef}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className="block w-full">
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
                  }
                }}
                aria-label={isMuted ? "Unmute video" : "Mute video"}
                className="absolute right-3 bottom-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                {isMuted ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                )}
              </button>
            </motion.div>
          </motion.div>
        </section>

        {/* Vault Showcase */}
        <section id="features" className="bg-muted px-6 py-16 md:py-20">
          <div className="container-page flex flex-col items-center gap-10 md:flex-row md:gap-[60px]">
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
                  {/* Apple / iOS */}
                  <svg
                    aria-hidden="true"
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  {/* Android */}
                  <svg
                    aria-hidden="true"
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="currentColor">
                    <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5S11 23.33 11 22.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5S22 17.33 22 16.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.96 1.23 13 1 12 1c-1.04 0-2 .23-2.84.63L7.68.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 3.26 6 5.01 6 7h12c0-1.99-.97-3.75-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z" />
                  </svg>
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
            <div aria-hidden="true" className="flex flex-1 justify-center">
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
            <BrandConcentricArch s={80} className="text-ink" />
            <span className="text-ink font-sans text-5xl leading-none font-black tracking-[-0.04em] md:text-7xl">
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
