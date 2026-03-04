import type { NextConfig } from "next";

import path from "node:path";

import withBundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";
import { withPostHogConfig } from "@posthog/nextjs-config";
import { withSentryConfig } from "@sentry/nextjs";
import { env } from "env";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  productionBrowserSourceMaps: true, // sentry and posthog config
  skipTrailingSlashRedirect: true,
  serverExternalPackages: ["import-in-the-middle", "require-in-the-middle"], // posthog config
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [],
  },
  async rewrites() {
    return [
      // Google Tag Manager Proxy
      {
        source: "/gm",
        destination: "https://www.googletagmanager.com/gtm.js",
      },
      {
        source: "/gtm/td",
        destination: "https://www.googletagmanager.com/td",
      },
      {
        source: "/debug/bootstrap",
        destination: "https://www.googletagmanager.com/debug/bootstrap",
      },
      {
        source: "/debug/:path*",
        destination: "https://www.googletagmanager.com/debug/:path*",
      },
      {
        source: "/controller.js",
        destination: "https://www.googletagmanager.com/controller.js",
      },
      {
        source: "/gtm/:path*",
        destination: "https://www.googletagmanager.com/gtm/:path*",
      },
      // PostHog Proxy
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
      {
        source: "/ingest/flags",
        destination: "https://eu.i.posthog.com/flags",
      },
    ];
  },
  experimental: {
    authInterrupts: true,
    optimizePackageImports: [
      "react-hook-form",
      "react-icons",
      "tailwind-merge",
      "zod",
    ],
    webVitalsAttribution: ["FCP", "LCP", "CLS", "FID", "TTFB", "INP"],
  },
};

// Conditionally apply PostHog configuration only if API keys are provided
const withPostHog =
  env.POSTHOG_API_KEY && env.POSTHOG_ENV_ID
    ? withPostHogConfig(nextConfig, {
        personalApiKey: env.POSTHOG_API_KEY, // Personal API Key
        envId: env.POSTHOG_ENV_ID, // Environment ID
        host: env.NEXT_PUBLIC_POSTHOG_HOST, // (optional), defaults to https://us.posthog.com
      })
    : nextConfig;

// Conditionally apply Sentry configuration only if auth token is provided
const withSentry = env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(withPostHog, {
      org: "kurate", // TODO: replace with your Sentry org slug
      project: "kurate",
      silent: !process.env.CI,
      widenClientFileUpload: true,
      tunnelRoute: "/monitoring", // ?!monitoring in next.config.ts when using proxy.ts file
      disableLogger: true,
      automaticVercelMonitors: true,
      authToken: env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        deleteSourcemapsAfterUpload: true,
      },
      reactComponentAnnotation: {
        enabled: true,
      },
    })
  : withPostHog;

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(
  withBundleAnalyzer({
    enabled: env.ANALYZE === "true",
  })(
    env.NEXT_PUBLIC_APP_ENV === "production" ||
      env.NEXT_PUBLIC_APP_ENV === "staging"
      ? withSentry
      : nextConfig,
  ),
);
