"use client";

import { useTranslation } from "react-i18next";

/**
 * Drop-in replacement for next-intl's useTranslations().
 * Scopes t() to a namespace using dot-separated keys in the shared en.json.
 *
 * Usage (identical to next-intl):
 *   const t = useTranslations("groups");
 *   t("create_group") // → resources.en.translation.groups.create_group
 */
export function useTranslations(namespace: string) {
  const { t } = useTranslation();
  return (key: string, values?: Record<string, unknown>) =>
    t(`${namespace}.${key}`, values ?? {});
}
