import '@/localization/i18n';
import { resources } from '@kurate/locales';
import { usePersistStore } from '@/store';
import * as Localization from 'expo-localization';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type TranslateFunction = (
  key: string,
  options?: Record<string, unknown>,
) => string;

interface LocalizationContextType {
  locale: string;
  t: TranslateFunction;
  setLocale: (locale: string) => void;
  switchToDeviceLocale: () => void;
}

export const LocalizationContext = createContext<LocalizationContextType>({
  locale: 'en',
  t: (key: string) => key,
  setLocale: () => {},
  switchToDeviceLocale: () => {},
});

const SUPPORTED_LANGUAGES = Object.keys(resources) as Array<
  keyof typeof resources
>;

export function LocalizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const setAppLanguage = usePersistStore(s => s.setAppLanguage);
  const appLanguage = usePersistStore(s => s.appLanguage);
  const { t, i18n } = useTranslation();
  const [locale, setLocaleState] = useState(
    Localization.getLocales()[0]?.languageCode || 'en',
  );

  const setLocale = async (newLocale: string, persist: boolean = true) => {
    const finalLocale = SUPPORTED_LANGUAGES.includes(
      newLocale as keyof typeof resources,
    )
      ? (newLocale as keyof typeof resources)
      : 'en';
    if (persist) {
      setAppLanguage(finalLocale);
    }
    await i18n.changeLanguage(finalLocale);
    setLocaleState(finalLocale);
  };
  const switchToDeviceLocale = async () => {
    const deviceLocale = Localization.getLocales()[0]?.languageCode || 'en';
    setLocale(deviceLocale, false);
  };

  useEffect(() => {
    const loadLocale = async () => {
      if (appLanguage) {
        setLocale(appLanguage as string, true);
      } else {
        switchToDeviceLocale();
      }
    };

    loadLocale();
  }, []);

  const translationFunction: TranslateFunction = (key, options) =>
    t(key, options);

  return (
    <LocalizationContext.Provider
      value={{
        locale: locale,
        t: translationFunction,
        setLocale,
        switchToDeviceLocale,
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
}

export const useLocalization = () => useContext(LocalizationContext);
