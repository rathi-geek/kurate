"use client";

import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import { defaultLocale, resources } from "@kurate/locales";

const i18n = i18next.createInstance();

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLocale,
  fallbackLng: defaultLocale,
  interpolation: {
    escapeValue: false, // React already escapes XSS
  },
  keySeparator: ".",
  nsSeparator: ":",
  react: {
    useSuspense: false,
  },
});

export default i18n;
