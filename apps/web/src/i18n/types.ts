import type en from "../../messages/en-US.json";

// This makes useTranslations() fully typed — you'll get autocomplete and
// compile-time errors for missing keys
declare module "next-intl" {
  interface AppConfig {
    Messages: typeof en;
  }
}
