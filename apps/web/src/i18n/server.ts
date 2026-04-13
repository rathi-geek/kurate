import { defaultLocale, resources } from "@kurate/locales";

type NestedRecord = { [key: string]: string | NestedRecord };

/**
 * Server-side translation helper for Server Components and async page functions.
 * Drop-in replacement for next-intl's getTranslations() — but synchronous.
 * Supports `{{var}}` interpolation matching the client-side `useTranslations`.
 *
 * Usage:
 *   const t = getT("groups");
 *   t("create_group")
 *   t("join_wrong_account_desc", { invitedEmail, currentEmail })
 */
export function getT(
  namespace: string,
): (key: string, values?: Record<string, unknown>) => string {
  const translation = resources[defaultLocale].translation as NestedRecord;

  // Resolve nested namespace e.g. "auth.onboarding" → translation.auth.onboarding
  const ns = namespace.split(".").reduce<NestedRecord | string>(
    (obj, key) => (typeof obj === "object" ? (obj[key] ?? obj) : obj),
    translation,
  );

  return (key: string, values?: Record<string, unknown>): string => {
    if (typeof ns !== "object") return key;
    const value = key
      .split(".")
      .reduce<NestedRecord | string>(
        (obj, k) => (typeof obj === "object" ? (obj[k] ?? key) : obj),
        ns,
      );
    if (typeof value !== "string") return key;
    if (!values) return value;
    return value.replace(/\{\{(\w+)\}\}/g, (_, k) =>
      values[k] != null ? String(values[k]) : "",
    );
  };
}
