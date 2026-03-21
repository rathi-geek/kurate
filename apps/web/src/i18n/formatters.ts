"use client";

import { useLocale } from "next-intl";

/** Client-side hook for locale-aware date, currency, and relative time formatting. Import from "@/i18n/formatters". */
export function useFormatters() {
  const locale = useLocale();

  function formatDate(date: Date | string, style: "short" | "long" = "short") {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat(
      locale,
      style === "short"
        ? { year: "numeric", month: "short", day: "numeric" }
        : {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }
    ).format(d);
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: locale === "en-GB" ? "GBP" : "USD",
    }).format(amount);
  }

  function formatRelativeTime(date: Date | string) {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffSeconds = Math.floor((d.getTime() - now.getTime()) / 1000);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

    if (Math.abs(diffSeconds) < 60) return rtf.format(diffSeconds, "second");
    if (Math.abs(diffSeconds) < 3600)
      return rtf.format(Math.floor(diffSeconds / 60), "minute");
    if (Math.abs(diffSeconds) < 86400)
      return rtf.format(Math.floor(diffSeconds / 3600), "hour");
    return rtf.format(Math.floor(diffSeconds / 86400), "day");
  }

  return { formatDate, formatCurrency, formatRelativeTime };
}
