import type { Metadata } from "next";

import { env } from "env";

/**
 * @description Metadata for the website
 * @returns {Metadata} Metadata for the website
 */
export const metadata: Metadata = {
  title: {
    template: `%s - ${env.NEXT_PUBLIC_APP_TITLE}`,
    default: env.NEXT_PUBLIC_APP_TITLE,
  },
  description: env.NEXT_PUBLIC_APP_DESCRIPTION,
  keywords: env.NEXT_PUBLIC_APP_KEYWORDS,
  robots: { index: true, follow: true },
  alternates: {
    canonical: env.NEXT_PUBLIC_APP_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: env.NEXT_PUBLIC_APP_TITLE,
    description: env.NEXT_PUBLIC_APP_DESCRIPTION,
    images: ["/og-image.png"],
  },
  openGraph: {
    siteName: env.NEXT_PUBLIC_APP_TITLE,
    url: env.NEXT_PUBLIC_APP_URL,
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Kurate — Read smarter, curate better",
      },
    ],
  },
  icons: [
    {
      rel: "icon",
      type: "image/svg+xml",
      url: "/icon.svg",
    },
    {
      rel: "apple-touch-icon",
      sizes: "180x180",
      url: "/favicons/apple-touch-icon.png",
    },
  ],
};
