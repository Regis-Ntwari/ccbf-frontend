import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

export const SUPPORTED_LOCALES = ['en', 'rw', 'fr']
export const LOCALE_LABEL = { en: 'English', rw: 'Kinyarwanda', fr: 'Français' }

/**
 * Translations live in `locales/<lang>/<fragment>.json`. Every fragment is
 * deep-merged into one dictionary per language, so a feature can own its own
 * file (`boq.json` holding `{ "boq": { ... } }`) without touching the others.
 */
const fragments = import.meta.glob('./locales/*/*.json', { eager: true })

function deepMerge(target, source) {
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      target[k] = deepMerge(target[k] && typeof target[k] === 'object' ? target[k] : {}, v)
    } else target[k] = v
  }
  return target
}

const resources = {}
for (const [path, mod] of Object.entries(fragments)) {
  const lang = path.split('/')[2]
  if (!SUPPORTED_LOCALES.includes(lang)) continue
  resources[lang] ??= { translation: {} }
  deepMerge(resources[lang].translation, mod.default ?? mod)
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: [...SUPPORTED_LOCALES],
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], lookupLocalStorage: 'ccbf-lang', caches: ['localStorage'] },
  })

export default i18n
