import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { defaultLocale, resources } from '@kurate/locales';

export { resources };

// Get device language, fall back to default locale
const deviceLanguage = getLocales()[0]?.languageCode ?? defaultLocale;

i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage,
  fallbackLng: defaultLocale,

  interpolation: {
    escapeValue: false,
  },

  keySeparator: '.',
  nsSeparator: ':',

  react: {
    useSuspense: false,
  },
});

export default i18n;
