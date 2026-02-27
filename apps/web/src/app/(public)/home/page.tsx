import { Suspense } from "react";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const FeatureFlagHero = dynamic(() => import("@/app/(public)/home/_components/feature-flag-hero"));

const features = [
  {
    title: "Analytics that respect privacy",
    description:
      "PostHog (dead-clicks, heatmaps, performance, exceptions) + Vercel Analytics + Speed Insights + GTM ready to go.",
  },
  {
    title: "Feature flags & experiments",
    description:
      "Ship A/B tests and feature rollouts with PostHog flags. The hero below switches based on a live flag.",
  },
  {
    title: "Production-grade error tracking",
    description:
      "Sentry wired across client, server, and edge. Server exceptions are also captured in PostHog for unified insight.",
  },
  {
    title: "SEO that ships",
    description:
      "OpenGraph + Twitter cards, sitemap, robots, and JSON-LD schema preconfigured for rich results.",
  },
  {
    title: "UI you can ship today",
    description:
      "A modern, accessible component library (buttons, dialogs, tables, sheets, charts, forms, and more).",
  },
  {
    title: "Type-safe env & great DX",
    description:
      "Zod-validated env via @t3-oss/env-nextjs, TypeScript, ESLint, Prettier, Tailwind v4, and Next.js 15.",
  },
  {
    title: "PWA-ready",
    description:
      "Web manifest and icons included. Fast by default with Turbopack dev and production build analyze.",
  },
  {
    title: "OpenAPI documentation",
    description:
      "Automatically generated OpenAPI documentation for the API. See it in the reference section by going to /reference route.",
  },
  {
    title: "Eslint",
    description:
      "Eslint is pre-configured to fail on errors like unused variables, missing imports, etc. You can customize it to your liking.",
  },
  {
    title: "Husky",
    description:
      "Husky is pre-configured to run typecheck, circular dependency check, lint, and build on commit. You can customize it to your liking.",
  },
  {
    title: "GitHub and GitLab CI/CD",
    description:
      "GitHub and GitLab CI/CD are pre-configured to run the same checks as the pre-commit hook.",
  },
  {
    title: "Drizzle ORM",
    description:
      "Drizzle ORM is pre-configured to use the database of your choice. You can customize it to your liking. Currently supported databases are PostgreSQL, MySQL, and SQLite. Check the README for more details.",
  },
  {
    title: "Test Automation",
    description:
      "Comprehensive test automation setup with component, API, and database testing. Includes real-world examples and enterprise-grade testing patterns.",
  },
];

export default function HomePage() {
  return (
    <main className="container mx-auto flex min-h-dvh w-full flex-col">
      <section className="flex h-dvh flex-col items-center justify-center">
        <div className="text-muted-foreground mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
          Free & open-source
        </div>
        <Image
          src="/favicons/web-app-manifest-192x192.png"
          alt="Project logo"
          width={96}
          height={96}
          className="mb-4"
        />
        <h1 className="mx-auto max-w-xl text-center text-4xl font-bold text-balance sm:text-5xl">
          Build faster. Own your stack.
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 text-center text-lg text-balance">
          Use this starter as-is, or as a reference for your own setup. No vendor lock-in. Yours to
          keep.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
          <Button asChild variant="outline" size="lg">
            <Link href="#features">See features</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="#demo">See live demo</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/users">Sample User Page for Integration Testing</Link>
          </Button>
        </div>
        <Button asChild size="lg" className="mt-8 w-sm px-8 py-8">
          <Link
            href="https://git.geekyants.com/geekyants/coe-grp/boilerplates/frontend/nextjs/-/tree/main?ref_type=heads"
            target="_blank"
            rel="noopener noreferrer">
            Get started
          </Link>
        </Button>
      </section>

      {/* Features grid */}
      <div id="features" />
      <section className="mx-auto h-dvh w-full max-w-6xl">
        <div className="mt-12 mb-8 text-center">
          <h2 className="text-3xl font-semibold">Everything you need to launch</h2>
          <p className="text-muted-foreground mt-2">
            Curated defaults. Batteries included. No lock-in.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title}>
              <CardHeader>
                <CardTitle>{f.title}</CardTitle>
                <CardDescription>{f.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Feature flags live demo */}
      <div id="demo" />
      <section className="mx-auto flex h-dvh w-full max-w-6xl flex-col items-center justify-center">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-semibold">Live feature flag demo</h2>
          <p className="text-muted-foreground mt-2">
            This section swaps content based on a PostHog feature flag variant.
          </p>
        </div>
        <div className="w-full max-w-xl">
          <Card>
            <CardContent>
              <Suspense fallback={<Skeleton className="h-20 w-full" />}>
                <FeatureFlagHero />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
