import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./config";

export default getRequestConfig(async ({
  requestLocale,
}: {
  requestLocale: Promise<string | undefined>;
}) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    formats: {
      dateTime: {
        short: {
          day: "numeric",
          month: "short",
          year: "numeric",
        },
      },
      number: {
        currency: {
          style: "currency",
          currency: locale === "en-GB" ? "GBP" : "USD",
        },
      },
    },
  };
});
