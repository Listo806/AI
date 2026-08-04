import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import ptTranslations from './locales/pt.json';
import { SUPPORTED_CODES } from './locales';

// Resolve the initial language: a previously saved preference (either key the app
// uses), validated against the supported set, else English.
const getSavedLanguage = () => {
  try {
    const saved =
      localStorage.getItem('preferredLanguage') ||
      localStorage.getItem('cortexa_lang');
    if (saved && SUPPORTED_CODES.includes(saved)) {
      return saved;
    }
  } catch (_e) {
    /* storage unavailable — fall through to default */
  }
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      es: { translation: esTranslations },
      pt: { translation: ptTranslations },
    },
    lng: getSavedLanguage(),
    fallbackLng: 'en', // English is the source + fallback language
    supportedLngs: SUPPORTED_CODES,
    nonExplicitSupportedLngs: true,
    // Never render a blank string or a raw key: an empty/missing translation
    // falls through to the English value instead.
    returnEmptyString: false,
    // Surface untranslated keys during development so gaps can be corrected;
    // silent in production (no user impact — fallback covers it).
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: (lngs, ns, key) => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('[i18n] missing translation key', {
          key,
          ns,
          lng: Array.isArray(lngs) ? lngs[0] : lngs,
        });
      }
    },
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

// Persist the language whenever it changes.
i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem('preferredLanguage', lng);
  } catch (_e) {
    /* no-op */
  }
});

export default i18n;
