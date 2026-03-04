import "./globals.css";

import Script from "next/script";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import GoogleAnalyticsScripts from "@/app/_components/google-analytics";
import SonnarToaster from "@/app/_components/sonner-toaster";
import { dmMono, dmSans } from "@/app/_config/fonts";
import { getJsonLd } from "@/app/_config/jsonId";
import { metadata } from "@/app/_config/metadata";
import { viewport } from "@/app/_config/viewport";

export { metadata, viewport };

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${dmSans.variable} ${dmMono.variable} bg-cream text-foreground font-sans antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <SonnarToaster />
        </NextIntlClientProvider>
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
