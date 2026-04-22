import "./globals.css";

import Script from "next/script";

import { QueryProvider } from "@kurate/query";
import { AnalyticsProvider } from "@/app/_libs/analytics-provider";
import { AuthProvider } from "@/app/_libs/auth-context";
import { ProgressBarProvider } from "@/app/_components/progress-bar-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import GoogleAnalyticsScripts from "@/app/_components/google-analytics";
import { I18nProvider } from "@/app/_components/i18n-provider";
import SonnarToaster from "@/app/_components/sonner-toaster";
import { dmMono, dmSans } from "@/app/_config/fonts";
import { getJsonLd } from "@/app/_config/jsonId";
import { metadata } from "@/app/_config/metadata";
import { viewport } from "@/app/_config/viewport";

export { metadata, viewport };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${dmMono.variable} bg-cream text-foreground font-sans antialiased`}>
        <a
          href="#main-content"
          className="focus:bg-primary focus:text-primary-foreground focus:rounded-button sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:font-sans focus:text-sm focus:font-medium">
          Skip to main content
        </a>
        <I18nProvider>
          <QueryProvider>
            <AuthProvider>
              <AnalyticsProvider>
                <ProgressBarProvider>
                  {children}
                </ProgressBarProvider>
              </AnalyticsProvider>
            </AuthProvider>
            <SonnarToaster />
            {/* <AnimationPreview /> */}
          </QueryProvider>
        </I18nProvider>
        <GoogleAnalyticsScripts />
        <SpeedInsights />
        <Analytics />
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getJsonLd()) }}
        />
      </body>
    </html>
  );
}
