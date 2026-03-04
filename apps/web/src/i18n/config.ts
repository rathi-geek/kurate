import { defineRouting } from "next-intl/routing";

/** i18n for translated text only — no locale in URLs. Use useTranslations() for copy. */
export const routing = defineRouting({
  locales: ["en-US", "en-GB"],
  defaultLocale: "en-US",
  localePrefix: "never", // URLs stay as /chat, /profile — locale from cookie/header only
});
