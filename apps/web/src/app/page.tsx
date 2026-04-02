"use client";

import type { ComponentProps } from "react";

import Link from "next/link";

import { motion } from "framer-motion";
import { useSafeReducedMotion } from "@/app/_libs/hooks/useSafeReducedMotion";
import { useTranslations } from "@/i18n/use-translations";

import { Button } from "@/components/ui/button";

import { ROUTES } from "@kurate/utils";
import { BrandArch, BrandConcentricArch, BrandStar, BrandSunburst } from "@/components/brand";

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

const TESTIMONIALS = [
  {
    quote:
      "Kurate completely changed how I discover content. It's like having a brilliant friend who reads everything.",
    name: "Nikhil Kamath",
    role: "Co-founder, Zerodha",
  },
  {
    quote:
      "I organized 3 years of scattered bookmarks in a single afternoon. The AI tagging is unreal.",
    name: "Naman Lahoti",
    role: "Founder & Builder",
  },
  {
    quote:
      "Kurate is that extra part of your brain that remembers everything you read and connects the dots.",
    name: "Arshia Mal",
    role: "Product Designer",
  },
  {
    quote:
      "The social curation feed is addictive in the best way. I trust people's recommendations over any algorithm.",
    name: "Suchet Kumar",
    role: "Engineer & Curator",
  },
  {
    quote:
      "Finally, a reading tool that respects my time. The proof of knowledge concept is brilliant.",
    name: "Vivek Kamath",
    role: "Founder, Kurate",
  },
  {
    quote: "Replaced Pocket, Instapaper, and my 47 open tabs. Kurate just gets it.",
    name: "Peter Thiel",
    role: "Founder, Founders Fund",
  },
];

const FEATURE_KEYS = [
  { icon: "arch", bg: "bg-teal/20", titleKey: "feature_1_title", descKey: "feature_1_desc" },
  { icon: "star", bg: "bg-slate-subtle", titleKey: "feature_2_title", descKey: "feature_2_desc" },
  { icon: "sunburst", bg: "bg-accent", titleKey: "feature_3_title", descKey: "feature_3_desc" },
] as const;

const STATS_PEOPLE = [
  { person: "Naman Lahoti", role: "Founder & Builder" },
  { person: "Arshia Mal", role: "Product Designer" },
];

export default function LandingPage() {
  const prefersReducedMotion = useSafeReducedMotion();
  const t = useTranslations("landing");
  const tNav = useTranslations("nav");
  const tApp = useTranslations("app");

  return (
    <div className="bg-cream text-ink min-h-screen">
      {/* Announcement Banner */}
      <div className="bg-teal px-4 py-3 text-center text-sm font-medium text-white">
        {t("announcement")}{" "}
        <Link href={ROUTES.AUTH.LOGIN} className="font-semibold underline hover:opacity-80">
          {t("join_now")}
        </Link>
      </div>

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
          <Link
            href={ROUTES.ABOUT as ComponentProps<typeof Link>["href"]}
            className="text-ink/75 hover:text-ink hidden font-sans text-sm font-medium transition-opacity md:inline">
            {tNav("about")}
          </Link>
          <Link
            href={ROUTES.BLOG as ComponentProps<typeof Link>["href"]}
            className="text-ink/75 hover:text-ink hidden font-sans text-sm font-medium transition-opacity md:inline">
            {tNav("blog")}
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
              className="text-ink mb-6 font-serif text-5xl font-normal tracking-[-0.02em] md:text-7xl">
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
          </motion.div>
        </section>

        {/* Dark Showcase */}
        <section className="bg-muted px-6 py-16 md:py-20">
          <div className="container-page flex flex-col items-center gap-10 md:flex-row md:gap-[60px]">
            <div className="flex-1">
              <div className="mb-7 flex gap-2">
                {([t("platform_web"), t("platform_ios"), t("platform_android")] as const).map(
                  (p) => (
                    <span
                      key={p}
                      className="border-ink/[0.08] text-ink flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-sans text-sm font-medium">
                      <div className="bg-ink h-1.5 w-1.5 rounded-full" /> {p}
                    </span>
                  ),
                )}
              </div>
              <h2 className="text-ink mb-5 font-serif text-3xl font-normal md:text-5xl">
                {t("save_title")}
              </h2>
              <p className="text-ink/75 mb-8 max-w-[400px] font-sans text-base leading-[1.7]">
                {t("save_description")}
              </p>
              <Button asChild variant="outline">
                <Link href={ROUTES.DEMO as ComponentProps<typeof Link>["href"]}>
                  {t("watch_in_action")}
                </Link>
              </Button>
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
        <div aria-hidden="true" className="bg-teal overflow-hidden py-5">
          <div className="flex" style={{ animation: "marquee 20s linear infinite" }}>
            {[...LOGOS, ...LOGOS].map((l, i) => (
              <span
                key={i}
                className="px-6 font-sans text-base font-bold whitespace-nowrap text-white/50">
                {l}
              </span>
            ))}
          </div>
        </div>

        {/* Features */}
        <section id="features" aria-labelledby="features-heading" className="bg-cream px-6 py-20">
          <div className="container-page mb-[60px] text-center">
            <h2
              id="features-heading"
              className="text-ink mb-4 font-serif text-3xl font-normal md:text-4xl">
              {t("proof_title")}
            </h2>
            <p className="text-ink/75 mx-auto max-w-[520px] font-sans text-base leading-[1.7]">
              {t("proof_subtitle")}
            </p>
          </div>
          <div className="container-page flex flex-col gap-6 md:flex-row">
            {FEATURE_KEYS.map((feature, i) => (
              <motion.div
                key={i}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
                whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 25, delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={prefersReducedMotion ? undefined : { y: -6 }}
                className="bg-muted rounded-card border-ink/[0.06] flex-1 border p-7">
                <div
                  aria-hidden="true"
                  className={`h-11 w-11 ${feature.bg} rounded-card mb-4 flex items-center justify-center`}>
                  {feature.icon === "arch" && <BrandArch s={22} c="#1A1A1A" />}
                  {feature.icon === "star" && <BrandStar s={20} c="#1A1A1A" />}
                  {feature.icon === "sunburst" && <BrandSunburst s={22} c="#1A1A1A" />}
                </div>
                <h3 className="text-ink mb-2 font-sans text-lg font-bold">{t(feature.titleKey)}</h3>
                <p className="text-ink/70 font-sans text-sm leading-relaxed">
                  {t(feature.descKey)}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section aria-labelledby="testimonials-heading" className="bg-muted overflow-hidden py-20">
          <div className="mb-12 px-6 text-center">
            <h2
              id="testimonials-heading"
              className="text-ink font-serif text-3xl font-normal italic md:text-5xl">
              {t("testimonials_line1")}
              <br />
              {t("testimonials_line2")}
            </h2>
          </div>
          <div
            aria-hidden="true"
            className="flex w-max"
            style={{ animation: "marquee 60s linear infinite" }}>
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, idx) => (
              <div
                key={idx}
                className="rounded-card mr-5 flex max-w-[300px] min-w-[280px] shrink-0 flex-col gap-4 bg-white p-6">
                <div className="bg-teal/20 text-teal mx-auto flex h-11 w-11 items-center justify-center rounded-full font-sans text-sm font-bold">
                  {t.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <p className="text-ink flex-1 text-center font-sans text-sm leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="text-center">
                  <div className="text-ink font-sans text-sm font-bold">{t.name}</div>
                  <div className="text-ink/65 font-sans text-xs">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="bg-muted px-6 pb-20">
          <div className="container-page flex flex-col justify-center gap-5 md:flex-row">
            {(
              [
                { statKey: "stat_1", descKey: "stat_1_desc" },
                { statKey: "stat_2", descKey: "stat_2_desc" },
              ] as const
            ).map((card, i) => (
              <motion.div
                key={i}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
                whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 25, delay: i * 0.15 }}
                viewport={{ once: true }}
                whileHover={prefersReducedMotion ? undefined : { y: -4 }}
                className="bg-teal rounded-card flex max-w-md flex-1 flex-col p-8">
                <h3 className="mb-2 min-h-[80px] font-serif text-2xl font-normal text-white italic md:text-3xl">
                  {t(card.statKey)}
                </h3>
                <p className="mb-6 flex-1 font-sans text-sm leading-relaxed text-white/70">
                  {t(card.descKey)}
                </p>
                <div className="mt-auto flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 font-sans text-xs font-bold text-white">
                    {STATS_PEOPLE[i].person.charAt(0)}
                  </div>
                  <div>
                    <div className="font-sans text-sm font-semibold text-white">
                      {STATS_PEOPLE[i].person}
                    </div>
                    <div className="font-sans text-xs text-white/50">{STATS_PEOPLE[i].role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section aria-labelledby="cta-heading" className="bg-cream px-6 py-20">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.97 }}
            whileInView={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            viewport={{ once: true }}
            className="container-content border-ink/[0.08] rounded-card relative overflow-hidden border-2 p-8 text-center md:p-12"
            style={{ animation: "ctaBreathe 3s ease-in-out infinite" }}>
            <div className="relative z-10">
              <p className="text-ink/70 mb-2 font-sans text-sm">{t("cta_ready")}</p>
              <h2
                id="cta-heading"
                className="text-ink mb-8 font-serif text-2xl font-normal md:text-4xl">
                <span className="italic">{t("cta_title_italic")}</span> {t("cta_title_rest")}
              </h2>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild size="lg">
                  <Link href={ROUTES.AUTH.LOGIN}>{t("get_started")}</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href={ROUTES.AUTH.LOGIN}>{t("log_in")}</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-ink/[0.06] bg-cream border-t px-6 py-12">
        <div className="container-page">
          <div className="mb-[60px] flex flex-row items-start justify-evenly">
            {[
              {
                titleKey: "footer_company" as const,
                linkKeys: [
                  "footer_about",
                  "footer_careers",
                  "footer_blog",
                  "footer_press",
                ] as const,
              },
              {
                titleKey: "footer_product" as const,
                linkKeys: [
                  "footer_features",
                  "footer_pricing",
                  "footer_extension",
                  "footer_mobile_app",
                ] as const,
              },
              {
                titleKey: "footer_resources" as const,
                linkKeys: [
                  "footer_help",
                  "footer_community",
                  "footer_privacy",
                  "footer_terms",
                ] as const,
              },
            ].map((col, i) => (
              <div key={i} className="text-center">
                <h4 className="text-ink/60 mb-2.5 font-serif text-sm font-normal italic md:mb-4 md:text-lg">
                  {t(col.titleKey)}
                </h4>
                {col.linkKeys.map((key) => (
                  <Link
                    key={key}
                    href={ROUTES.HOME}
                    className="text-ink/75 hover:text-ink block py-0.5 font-sans text-xs transition-colors md:py-1 md:text-sm">
                    {t(key)}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          <div className="mb-10 flex items-center justify-center gap-5">
            <BrandConcentricArch s={80} className="text-ink" />
            <span className="text-ink font-sans text-5xl leading-none font-black tracking-[-0.04em] md:text-7xl">
              {tApp("name")}
            </span>
          </div>

          <div className="border-ink/[0.06] flex flex-col items-center justify-between gap-4 border-t pt-5 md:flex-row">
            <span className="text-ink/55 font-sans text-sm">{t("copyright")}</span>
            <div className="flex items-center gap-3">
              {[t("terms"), t("privacy"), t("data_controls")].map((label) => (
                <Link
                  key={label}
                  href={ROUTES.HOME}
                  className="text-ink/55 hover:text-ink/75 font-sans text-sm transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
