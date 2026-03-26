import en from "./en.json";
import { spanish as es } from "./es";
import { portoguese as pt } from "./pt";

// Shared i18next resources — consumed by both web and mobile.
// Each app initialises i18next independently with its own locale detection
// (expo-localization on mobile, navigator.language / next-i18next on web).
export const resources = {
  en: { translation: en },
  es: { translation: es },
  pt: { translation: pt },
} as const;

export type SupportedLocale = keyof typeof resources;
export const supportedLocales: SupportedLocale[] = ["en", "es", "pt"];
export const defaultLocale: SupportedLocale = "en";
