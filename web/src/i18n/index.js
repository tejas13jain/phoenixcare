import en from './en.json';

// Minimal i18n scaffold: only English ships at launch, but every string lives in a
// locale JSON file keyed by dotted path, and `locales`/`useTranslation` are the only two
// places that need to change to add a language (e.g. hi.json, then locales.hi = hi).
const locales = { en };

let currentLocale = 'en';

export function setLocale(locale) {
  if (locales[locale]) currentLocale = locale;
}

export function t(path) {
  const value = path.split('.').reduce((acc, key) => acc?.[key], locales[currentLocale]);
  return value ?? path;
}

export function useTranslation() {
  return { t, locale: currentLocale, setLocale };
}
