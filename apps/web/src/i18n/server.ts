import { defaultLocale, resources } from "@kurate/locales";

type NestedRecord = { [key: string]: string | NestedRecord };

/**
 * Server-side translation helper for Server Components and async page functions.
 * Drop-in replacement for next-intl's getTranslations() — but synchronous.
 *
 * Usage:
 *   const t = getT("groups");
 *   t("create_group")
 */
export function getT(namespace: string): (key: string) => string {
  const translation = resources[defaultLocale].translation as NestedRecord;

  // Resolve nested namespace e.g. "auth.onboarding" → translation.auth.onboarding
  const ns = namespace.split(".").reduce<NestedRecord | string>(
    (obj, key) => (typeof obj === "object" ? (obj[key] ?? obj) : obj),
    translation,
  );

  return (key: string): string => {
    if (typeof ns !== "object") return key;
    const value = key
      .split(".")
      .reduce<NestedRecord | string>(
        (obj, k) => (typeof obj === "object" ? (obj[k] ?? key) : obj),
        ns,
      );
    return typeof value === "string" ? value : key;
  };
}
