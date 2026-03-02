"use client";

import Link from "next/link";
import { motion } from "framer-motion";
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

const FEATURES = [
  {
    icon: "arch",
    bg: "bg-amber/20",
    title: "Save Anything",
    description: "One-click browser extension. Share sheet on mobile. Paste a URL. AI does the rest.",
  },
  {
    icon: "star",
    bg: "bg-lavender/30",
    title: "Rate & Review",
    description: "Star ratings, short takes, topic tags. Build your proof of knowledge.",
  },
  {
    icon: "sunburst",
    bg: "bg-teal/20",
    title: "Discover via Trust",
    description: "Follow curators you trust. The best content finds you through people.",
  },
];

const STATS = [
  { stat: "10x better discovery", desc: "Curated content from trusted people beats any algorithm.", person: "Naman Lahoti", role: "Founder & Builder" },
  { stat: "50+ hours saved", desc: "Stop drowning in tabs. Your library organizes itself.", person: "Arshia Mal", role: "Product Designer" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      {/* Announcement Banner */}
      <div className="bg-teal text-white text-center py-3 px-4 text-sm font-medium">
        Join the <strong>early access waitlist</strong> — spots are limited.{" "}
        <Link href="/auth/signup" className="underline font-semibold hover:opacity-80">
          Join now ›
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-8 py-4 border-b border-ink/[0.03] bg-cream sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <BrandConcentricArch s={26} className="text-ink" />
          <span className="font-sans font-black text-xl text-ink tracking-tight">
            Kurate
          </span>
        </div>
        <div className="flex items-center gap-7">
          <Link href="#" className="hidden md:inline font-sans text-sm font-medium text-ink/55 hover:text-ink transition-opacity">
            Product
          </Link>
          <Link href="#" className="hidden md:inline font-sans text-sm font-medium text-ink/55 hover:text-ink transition-opacity">
            About
          </Link>
          <Link href="#" className="hidden md:inline font-sans text-sm font-medium text-ink/55 hover:text-ink transition-opacity">
            Blog
          </Link>
          <Link href="/auth/login" className="font-sans text-sm font-medium text-ink/55 hover:text-ink transition-opacity">
            Log In
          </Link>
          <Link href="/auth/signup">
            <Button size="sm">Get Early Access</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 md:py-32 text-center relative">
        <motion.div
          initial={false}
          animate="visible"
          variants={staggerContainer}
          className="max-w-[800px] mx-auto relative z-10"
        >
          <motion.h1
            variants={fadeUp}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className="font-serif text-5xl md:text-7xl font-normal text-ink mb-6"
            style={{ letterSpacing: "-0.02em" }}
          >
            <span className="italic">Consume what matters.</span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            transition={{ type: "spring", stiffness: 260, damping: 25, delay: 0.15 }}
            className="font-sans text-lg leading-relaxed text-ink/60 max-w-[500px] mx-auto mb-9"
          >
            The consumption network that turns your best finds into proof of knowledge, powered by people you trust.
          </motion.p>
          <motion.div
            variants={fadeUp}
            transition={{ type: "spring", stiffness: 260, damping: 25, delay: 0.3 }}
            className="flex gap-3 justify-center flex-wrap"
          >
            <Link href="/auth/signup">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg">Log in</Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Dark Showcase */}
      <section className="bg-[#F7F7F7] px-6 py-16 md:py-20">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-[60px]">
          <div className="flex-1">
            <div className="flex gap-2 mb-7">
              {["Web", "iOS", "Android"].map((p) => (
                <span
                  key={p}
                  className="py-1.5 px-3.5 rounded-full border border-ink/[0.08] font-sans text-[13px] font-medium text-ink flex items-center gap-1.5"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-ink" /> {p}
                </span>
              ))}
            </div>
            <h2 className="font-serif text-3xl md:text-5xl font-normal text-ink mb-5">
              Save the best content from all your apps
            </h2>
            <p className="font-sans text-base text-ink/55 leading-[1.7] mb-8 max-w-[400px]">
              One-click save from any browser or app. AI automatically tags, categorizes, and surfaces your best finds.
            </p>
            <Button variant="outline">Watch in action</Button>
          </div>

          {/* Phone mockup */}
          <div className="flex-1 flex justify-center">
            <div
              className="w-[220px] h-[400px] bg-ink overflow-hidden"
              style={{ borderRadius: 28, border: "2px solid rgba(26,26,26,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
            >
              <div className="p-4 pt-10">
                <div className="font-sans font-bold text-white/40 uppercase mb-3" style={{ fontSize: 11, letterSpacing: "0.08em" }}>
                  Your Library
                </div>
                {[
                  { t: "Tech Trends Report 2026", src: "research.contrary.com", tag: "AI" },
                  { t: "How to Do Great Work", src: "paulgraham.com", tag: "Startups" },
                  { t: "What I Read This Week #172", src: "chamath.substack.com", tag: "AI" },
                ].map((item, i) => (
                  <div key={i} className="py-2.5" style={{ borderTop: i ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                    <div className="font-sans text-xs font-semibold text-white mb-0.5">{item.t}</div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-white/35" style={{ fontSize: 9 }}>{item.src}</span>
                      <span className="py-0.5 px-1.5 bg-white/[0.07] text-white/50" style={{ fontSize: 9, borderRadius: 3 }}>{item.tag}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logo Ticker */}
      <div className="bg-teal py-5 overflow-hidden">
        <div className="flex" style={{ animation: "marquee 20s linear infinite" }}>
          {[...LOGOS, ...LOGOS].map((l, i) => (
            <span key={i} className="font-sans text-base font-bold text-white/50 whitespace-nowrap px-6">
              {l}
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="px-6 py-20 bg-cream">
        <div className="max-w-[1200px] mx-auto text-center mb-[60px]">
          <h2 className="font-serif text-3xl md:text-4xl font-normal text-ink mb-4">
            Proof of Knowledge
          </h2>
          <p className="font-sans text-base text-ink/55 leading-[1.7] max-w-[520px] mx-auto">
            Rate what you read. Build a public signal of your expertise. Your curation history becomes your intellectual reputation.
          </p>
        </div>
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row gap-6">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={i}
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 25, delay: i * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -6 }}
              className="flex-1 bg-[#F7F7F7] rounded-2xl p-7 border border-ink/[0.06]"
            >
              <div className={`w-11 h-11 ${feature.bg} rounded-2xl flex items-center justify-center mb-4`}>
                {feature.icon === "arch" && <BrandArch s={22} c="#1A1A1A" />}
                {feature.icon === "star" && <BrandStar s={20} c="#1A1A1A" />}
                {feature.icon === "sunburst" && <BrandSunburst s={22} c="#1A1A1A" />}
              </div>
              <h3 className="font-sans font-bold text-lg text-ink mb-2">{feature.title}</h3>
              <p className="font-sans text-sm text-ink/50 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[#F7F7F7] py-20 overflow-hidden">
        <div className="text-center mb-12 px-6">
          <h2 className="font-serif text-3xl md:text-5xl font-normal text-ink italic">
            People love switching<br />to Kurate
          </h2>
        </div>
        <div className="flex w-max" style={{ animation: "marquee 60s linear infinite" }}>
          {[...TESTIMONIALS, ...TESTIMONIALS].map((t, idx) => (
            <div key={idx} className="min-w-[280px] max-w-[300px] bg-white rounded-2xl p-6 shrink-0 flex flex-col gap-4 mr-5">
              <div className="w-11 h-11 rounded-full bg-teal/20 flex items-center justify-center font-sans text-sm font-bold text-teal mx-auto">
                {t.name.split(" ").map(n => n[0]).join("")}
              </div>
              <p className="font-sans text-sm leading-relaxed text-ink text-center flex-1">&ldquo;{t.quote}&rdquo;</p>
              <div className="text-center">
                <div className="font-sans text-[13px] font-bold text-ink">{t.name}</div>
                <div className="font-sans text-xs text-ink/45">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#F7F7F7] px-6 pb-20">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row gap-5 justify-center">
          {STATS.map((card, i) => (
            <motion.div
              key={i}
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 25, delay: i * 0.15 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              className="bg-teal rounded-2xl p-8 flex flex-col flex-1 max-w-md"
            >
              <h3 className="font-serif text-2xl md:text-3xl font-normal italic text-white mb-2 min-h-[80px]">
                {card.stat}
              </h3>
              <p className="font-sans text-sm text-white/70 leading-relaxed mb-6 flex-1">
                {card.desc}
              </p>
              <div className="flex items-center gap-2.5 mt-auto">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-sans text-xs font-bold text-white">
                  {card.person.charAt(0)}
                </div>
                <div>
                  <div className="font-sans text-[13px] font-semibold text-white">{card.person}</div>
                  <div className="font-sans text-xs text-white/50">{card.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 bg-cream">
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-[800px] mx-auto border-2 border-ink/[0.08] p-8 md:p-12 text-center relative overflow-hidden rounded-2xl"
          style={{ animation: "ctaBreathe 3s ease-in-out infinite" }}
        >
          <div className="relative z-10">
            <p className="font-sans text-[15px] text-ink/50 mb-2">Ready to curate smarter?</p>
            <h2 className="font-serif text-2xl md:text-4xl font-normal text-ink mb-8">
              <span className="italic">Your reading</span> deserves better
            </h2>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/auth/signup">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="lg">Log in</Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-ink/[0.06] bg-cream">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-row items-start justify-evenly mb-[60px]">
            {[
              { title: "Company", links: ["About", "Careers", "Blog", "Press"] },
              { title: "Product", links: ["Features", "Pricing", "Extension", "Mobile App"] },
              { title: "Resources", links: ["Help Center", "Community", "Privacy", "Terms"] },
            ].map((col, i) => (
              <div key={i} className="text-center">
                <h4 className="font-serif text-sm md:text-lg font-normal italic text-ink/40 mb-2.5 md:mb-4">{col.title}</h4>
                {col.links.map((l) => (
                  <div key={l} className="font-sans text-[11px] md:text-sm text-ink/60 py-0.5 md:py-1 cursor-pointer hover:text-ink transition-colors">
                    {l}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center mb-10 gap-5">
            <BrandConcentricArch s={80} className="text-ink" />
            <span className="font-sans text-5xl md:text-7xl font-black text-ink leading-none" style={{ letterSpacing: "-0.04em" }}>
              Kurate
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between border-t border-ink/[0.06] pt-5 gap-4">
            <span className="font-sans text-[13px] text-ink/35">&copy; Kurate 2026</span>
            <div className="flex gap-3 items-center">
              {["Terms", "Privacy", "Data Controls"].map((l) => (
                <span key={l} className="font-sans text-[13px] text-ink/35 cursor-pointer hover:text-ink/60 transition-colors">
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
