/** Server-side formatters (for Server Components and API routes). Import from "@/i18n/formatters-server". */

export async function getServerFormatters(locale: string) {
  const dateTimeFormat = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const currencyFormat = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: locale === "en-GB" ? "GBP" : "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const relativeFormat = new Intl.RelativeTimeFormat(locale, {
    numeric: "auto",
  });

  return { dateTimeFormat, currencyFormat, relativeFormat };
}
