import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import rw from './locales/rw.json'
import fr from './locales/fr.json'

export const SUPPORTED_LOCALES = ['en', 'rw', 'fr'] as const

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, rw: { translation: rw }, fr: { translation: fr } },
    fallbackLng: 'en',
    supportedLngs: [...SUPPORTED_LOCALES],
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], lookupLocalStorage: 'ccbf-lang', caches: ['localStorage'] },
  })

export default i18n
