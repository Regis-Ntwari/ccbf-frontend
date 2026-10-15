import { SUPPORTED_LOCALES } from '@/shared/i18n'

/**
 * Admin-editable text is stored once per language: `{ en: 'House', rw: 'Inzu', fr: 'Maison' }`.
 * English is mandatory and is the fallback for a missing translation.
 */
export const L = (en, rw, fr) => ({ en, ...(rw ? { rw } : {}), ...(fr ? { fr } : {}) })

export function isLocalized(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof value.en === 'string' &&
    Object.keys(value).every((k) => SUPPORTED_LOCALES.includes(k))
  )
}

/** Picks the text for `lang`, falling back to English, then to any language present. */
export function resolveLocalized(value, lang) {
  if (!isLocalized(value)) return value
  return value[lang] || value.en || Object.values(value).find(Boolean) || ''
}

/** Deep-copies `obj`, replacing every localized string with the text for `lang`. */
export function localizeDeep(obj, lang) {
  if (Array.isArray(obj)) return obj.map((v) => localizeDeep(v, lang))
  if (obj && typeof obj === 'object') {
    if (isLocalized(obj)) return resolveLocalized(obj, lang)
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, localizeDeep(v, lang)]))
  }
  return obj
}

/** Languages a localized value is missing (empty or absent). */
export function missingLocales(value, locales = SUPPORTED_LOCALES) {
  if (!isLocalized(value)) return []
  return locales.filter((l) => !value[l]?.trim())
}
