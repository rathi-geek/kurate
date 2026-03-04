"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { BrandStar, BrandSunburst, BrandArch, BrandConcentricArch } from "@/components/brand";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const LOGOS = [
  "Product Hunt", "Hacker News", "Indie Hackers", "Substack", "Every",
  "Stratechery", "The Verge", "Wired", "Arc", "Readwise",
];

const TESTIMONIALS = [
  { quote: "Kurate completely changed how I discover content. It's like having a brilliant friend who reads everything.", name: "Nikhil Kamath", role: "Co-founder, Zerodha" },
  { quote: "I organized 3 years of scattered bookmarks in a single afternoon. The AI tagging is unreal.", name: "Naman Lahoti", role: "Founder & Builder" },
  { quote: "Kurate is that extra part of your brain that remembers everything you read and connects the dots.", name: "Arshia Mal", role: "Product Designer" },
  { quote: "The social curation feed is addictive in the best way. I trust people's recommendations over any algorithm.", name: "Suchet Kumar", role: "Engineer & Curator" },
  { quote: "Finally, a reading tool that respects my time. The proof of knowledge concept is brilliant.", name: "Vivek Kamath", role: "Founder, Kurate" },
  { quote: "Replaced Pocket, Instapaper, and my 47 open tabs. Kurate just gets it.", name: "Peter Thiel", role: "Founder, Founders Fund" },
];

const FEATURE_KEYS = [
  { icon: "arch", bg: "bg-amber/20", titleKey: "feature_1_title", descKey: "feature_1_desc" },
  { icon: "star", bg: "bg-lavender/30", titleKey: "feature_2_title", descKey: "feature_2_desc" },
  { icon: "sunburst", bg: "bg-teal/20", titleKey: "feature_3_title", descKey: "feature_3_desc" },
] as const;

const STATS_PEOPLE = [
  { person: "Naman Lahoti", role: "Founder & Builder" },
  { person: "Arshia Mal", role: "Product Designer" },
];

export default function LandingPage() {
  const prefersReducedMotion = useReducedMotion();
  const t = useTranslations("landing");
  const tNav = useTranslations("nav");
  const tApp = useTranslations("app");

  return (
    <div className="min-h-screen bg-cream text-ink">
      {/* Announcement Banner */}
      <div className="bg-teal text-white text-center py-3 px-4 text-sm font-medium">
        {t("announcement")}{" "}
        <Link href="/auth/signup" className="underline font-semibold hover:opacity-80">
          {t("join_now")}
        </Link>
      </div>

      {/* Nav */}
      <nav aria-label="Main navigation" className="flex items-center justify-between px-6 md:px-8 py-4 border-b border-ink/[0.03] bg-cream sticky top-0 z-50">
        <Link href="/" aria-label="Kurate home" className="flex items-center gap-2">
          <BrandConcentricArch s={26} className="text-ink" />
          <span className="font-sans font-black text-xl text-ink tracking-tight">
            {tApp("name")}
          </span>
        </Link>
        <div className="flex items-center gap-7">
          <Link href="#features" className="hidden md:inline font-sans text-sm font-medium text-ink/75 hover:text-ink transition-opacity">
            {tNav("product")}
          </Link>
          <Link href="/about" className="hidden md:inline font-sans text-sm font-medium text-ink/75 hover:text-ink transition-opacity">
            {tNav("about")}
          </Link>
          <Link href="/blog" className="hidden md:inline font-sans text-sm font-medium text-ink/75 hover:text-ink transition-opacity">
            {tNav("blog")}
          </Link>
          <Link href="/auth/login" className="font-sans text-sm font-medium text-ink/75 hover:text-ink transition-opacity">
            {tNav("log_in")}
          </Link>
          <Button asChild size="sm">
            <Link href="/auth/signup">{tNav("get_early_access")}</Link>
          </Button>
        </div>
      </nav>

      <main id="main-content">
      {/* Hero */}
      <section aria-labelledby="hero-heading" className="px-6 py-20 md:py-32 text-center relative">
        <motion.div
          initial={false}
          animate={prefersReducedMotion ? undefined : "visible"}
          variants={staggerContainer}
          className="container-content relative z-10"
        >
          <motion.h1
            id="hero-heading"
            initial={prefersReducedMotion ? false : undefined}
            animate={prefersReducedMotion ? undefined : "visible"}
            variants={fadeUp}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className="font-serif text-5xl md:text-7xl font-normal text-ink mb-6 tracking-[-0.02em]"
          >
            <span className="italic">{t("hero_title")}</span>
          </motion.h1>
          <motion.p
            initial={prefersReducedMotion ? false : undefined}
            animate={prefersReducedMotion ? undefined : "visible"}
            variants={fadeUp}
            transition={{ type: "spring", stiffness: 260, damping: 25, delay: 0.15 }}
            className="font-sans text-lg leading-relaxed text-ink/75 max-w-[500px] mx-auto mb-9"
          >
            {t("hero_subtitle")}
          </motion.p>
          <motion.div
            initial={prefersReducedMotion ? false : undefined}
            animate={prefersReducedMotion ? undefined : "visible"}
            variants={fadeUp}
            transition={{ type: "spring", stiffness: 260, damping: 25, delay: 0.3 }}
            className="flex gap-3 justify-center flex-wrap"
          >
            <Button asChild size="lg">
              <Link href="/auth/signup">{t("get_started")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/login">{t("log_in")}</Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Dark Showcase */}
      <section className="bg-muted px-6 py-16 md:py-20">
        <div className="container-page flex flex-col md:flex-row items-center gap-10 md:gap-[60px]">
          <div className="flex-1">
            <div className="flex gap-2 mb-7">
              {([t("platform_web"), t("platform_ios"), t("platform_android")] as const).map((p) => (
                <span
                  key={p}
                  className="py-1.5 px-3.5 rounded-full border border-ink/[0.08] font-sans text-sm font-medium text-ink flex items-center gap-1.5"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-ink" /> {p}
                </span>
              ))}
            </div>
            <h2 className="font-serif text-3xl md:text-5xl font-normal text-ink mb-5">
              {t("save_title")}
            </h2>
            <p className="font-sans text-base text-ink/75 leading-[1.7] mb-8 max-w-[400px]">
              {t("save_description")}
            </p>
            <Button asChild variant="outline">
              <Link href="/demo">{t("watch_in_action")}</Link>
            </Button>
          </div>

          {/* Phone mockup */}
          <div aria-hidden="true" className="flex-1 flex justify-center">
            <div className="w-[220px] h-[400px] bg-ink overflow-hidden rounded-card border-2 border-border shadow-xl">
              <div className="p-4 pt-10">
                <div className="font-sans font-bold text-white/40 uppercase mb-3 text-xs tracking-[0.08em]">
                  {t("library_label")}
                </div>
                {[
                  { t: "Tech Trends Report 2026", src: "research.contrary.com", tag: "AI" },
                  { t: "How to Do Great Work", src: "paulgraham.com", tag: "Startups" },
                  { t: "What I Read This Week #172", src: "chamath.substack.com", tag: "AI" },
                ].map((item, i) => (
                  <div key={i} className="py-2.5" style={{ borderTop: i ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                    <div className="font-sans text-xs font-semibold text-white mb-0.5">{item.t}</div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-white/35 text-xs">{item.src}</span>
                      <span className="py-0.5 px-1.5 bg-white/[0.07] text-white/50 text-xs rounded-sm">{item.tag}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logo Ticker */}
      <div aria-hidden="true" className="bg-teal py-5 overflow-hidden">
        <div className="flex" style={{ animation: "marquee 20s linear infinite" }}>
          {[...LOGOS, ...LOGOS].map((l, i) => (
            <span key={i} className="font-sans text-base font-bold text-white/50 whitespace-nowrap px-6">
              {l}
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" aria-labelledby="features-heading" className="px-6 py-20 bg-cream">
        <div className="container-page text-center mb-[60px]">
          <h2 id="features-heading" className="font-serif text-3xl md:text-4xl font-normal text-ink mb-4">
            {t("proof_title")}
          </h2>
          <p className="font-sans text-base text-ink/75 leading-[1.7] max-w-[520px] mx-auto">
            {t("proof_subtitle")}
          </p>
        </div>
        <div className="container-page flex flex-col md:flex-row gap-6">
          {FEATURE_KEYS.map((feature, i) => (
            <motion.div
              key={i}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 25, delay: i * 0.1 }}
              viewport={{ once: true }}
              whileHover={prefersReducedMotion ? undefined : { y: -6 }}
              className="flex-1 bg-muted rounded-card p-7 border border-ink/[0.06]"
            >
              <div aria-hidden="true" className={`w-11 h-11 ${feature.bg} rounded-card flex items-center justify-center mb-4`}>
                {feature.icon === "arch" && <BrandArch s={22} c="#1A1A1A" />}
                {feature.icon === "star" && <BrandStar s={20} c="#1A1A1A" />}
                {feature.icon === "sunburst" && <BrandSunburst s={22} c="#1A1A1A" />}
              </div>
              <h3 className="font-sans font-bold text-lg text-ink mb-2">{t(feature.titleKey)}</h3>
              <p className="font-sans text-sm text-ink/70 leading-relaxed">{t(feature.descKey)}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section aria-labelledby="testimonials-heading" className="bg-muted py-20 overflow-hidden">
        <div className="text-center mb-12 px-6">
          <h2 id="testimonials-heading" className="font-serif text-3xl md:text-5xl font-normal text-ink italic">
            {t("testimonials_line1")}<br />{t("testimonials_line2")}
          </h2>
        </div>
        <div aria-hidden="true" className="flex w-max" style={{ animation: "marquee 60s linear infinite" }}>
          {[...TESTIMONIALS, ...TESTIMONIALS].map((t, idx) => (
            <div key={idx} className="min-w-[280px] max-w-[300px] bg-white rounded-card p-6 shrink-0 flex flex-col gap-4 mr-5">
              <div className="w-11 h-11 rounded-full bg-teal/20 flex items-center justify-center font-sans text-sm font-bold text-teal mx-auto">
                {t.name.split(" ").map(n => n[0]).join("")}
              </div>
              <p className="font-sans text-sm leading-relaxed text-ink text-center flex-1">&ldquo;{t.quote}&rdquo;</p>
              <div className="text-center">
                <div className="font-sans text-sm font-bold text-ink">{t.name}</div>
                <div className="font-sans text-xs text-ink/65">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-muted px-6 pb-20">
        <div className="container-page flex flex-col md:flex-row gap-5 justify-center">
          {([{ statKey: "stat_1", descKey: "stat_1_desc" }, { statKey: "stat_2", descKey: "stat_2_desc" }] as const).map((card, i) => (
            <motion.div
              key={i}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 25, delay: i * 0.15 }}
              viewport={{ once: true }}
              whileHover={prefersReducedMotion ? undefined : { y: -4 }}
              className="bg-teal rounded-card p-8 flex flex-col flex-1 max-w-md"
            >
              <h3 className="font-serif text-2xl md:text-3xl font-normal italic text-white mb-2 min-h-[80px]">
                {t(card.statKey)}
              </h3>
              <p className="font-sans text-sm text-white/70 leading-relaxed mb-6 flex-1">
                {t(card.descKey)}
              </p>
              <div className="flex items-center gap-2.5 mt-auto">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-sans text-xs font-bold text-white">
                  {STATS_PEOPLE[i].person.charAt(0)}
                </div>
                <div>
                  <div className="font-sans text-sm font-semibold text-white">{STATS_PEOPLE[i].person}</div>
                  <div className="font-sans text-xs text-white/50">{STATS_PEOPLE[i].role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section aria-labelledby="cta-heading" className="px-6 py-20 bg-cream">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.97 }}
          whileInView={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 25 }}
          viewport={{ once: true }}
          className="container-content border-2 border-ink/[0.08] p-8 md:p-12 text-center relative overflow-hidden rounded-card"
          style={{ animation: "ctaBreathe 3s ease-in-out infinite" }}
        >
          <div className="relative z-10">
            <p className="font-sans text-sm text-ink/70 mb-2">{t("cta_ready")}</p>
            <h2 id="cta-heading" className="font-serif text-2xl md:text-4xl font-normal text-ink mb-8">
              <span className="italic">{t("cta_title_italic")}</span> {t("cta_title_rest")}
            </h2>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button asChild size="lg">
                <Link href="/auth/signup">{t("get_started")}</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/auth/login">{t("log_in")}</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>
      </main>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-ink/[0.06] bg-cream">
        <div className="container-page">
          <div className="flex flex-row items-start justify-evenly mb-[60px]">
            {[
              { titleKey: "footer_company" as const, linkKeys: ["footer_about", "footer_careers", "footer_blog", "footer_press"] as const },
              { titleKey: "footer_product" as const, linkKeys: ["footer_features", "footer_pricing", "footer_extension", "footer_mobile_app"] as const },
              { titleKey: "footer_resources" as const, linkKeys: ["footer_help", "footer_community", "footer_privacy", "footer_terms"] as const },
            ].map((col, i) => (
              <div key={i} className="text-center">
                <h4 className="font-serif text-sm md:text-lg font-normal italic text-ink/60 mb-2.5 md:mb-4">{t(col.titleKey)}</h4>
                {col.linkKeys.map((key) => (
                  <Link key={key} href="/" className="block font-sans text-xs md:text-sm text-ink/75 py-0.5 md:py-1 hover:text-ink transition-colors">
                    {t(key)}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center mb-10 gap-5">
            <BrandConcentricArch s={80} className="text-ink" />
            <span className="font-sans text-5xl md:text-7xl font-black text-ink leading-none tracking-[-0.04em]">
              {tApp("name")}
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between border-t border-ink/[0.06] pt-5 gap-4">
            <span className="font-sans text-sm text-ink/55">{t("copyright")}</span>
            <div className="flex gap-3 items-center">
              {([t("terms"), t("privacy"), t("data_controls")]).map((label) => (
                <Link key={label} href="/" className="font-sans text-sm text-ink/55 hover:text-ink/75 transition-colors">
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
