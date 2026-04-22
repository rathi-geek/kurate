import type { NextConfig } from "next";

import path from "node:path";

import withBundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";
import { env } from "env";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: false,
  productionBrowserSourceMaps: true,
  skipTrailingSlashRedirect: true,
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
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
      // Mixpanel Proxy — routes through first-party domain to bypass ad blockers
      {
        source: "/mp/lib.min.js",
        destination: "https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js",
      },
      {
        source: "/mp/lib.js",
        destination: "https://cdn.mxpnl.com/libs/mixpanel-2-latest.js",
      },
      {
        source: "/mp/decide",
        destination: "https://decide.mixpanel.com/decide",
      },
      {
        source: "/mp/:path*",
        destination: "https://api.mixpanel.com/:path*",
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

// Conditionally apply Sentry configuration only if auth token is provided
const withSentry = env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(nextConfig, {
      org: "kurate",
      project: "kurate",
      silent: !process.env.CI,
      widenClientFileUpload: true,
      tunnelRoute: "/monitoring",
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
  : nextConfig;

export default withBundleAnalyzer({
  enabled: env.ANALYZE === "true",
})(
  env.NEXT_PUBLIC_APP_ENV === "production" ||
    env.NEXT_PUBLIC_APP_ENV === "staging"
    ? withSentry
    : nextConfig,
);
