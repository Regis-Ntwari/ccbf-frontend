const LOCALE_MAP = { en: 'en-RW', rw: 'rw-RW', fr: 'fr-RW' }
const intlLocale = (l) => LOCALE_MAP[l] ?? 'en-RW'

/** Formats money. RWF has no minor units; compact mode gives "12.4M". */
export function formatMoney(value, currency = 'RWF', locale = 'en', opts = {}) {
  const l = intlLocale(locale)
  if (opts.compact) {
    const abs = Math.abs(value)
    const sign = value < 0 ? '-' : ''
    if (abs >= 1e9) return `${sign}${(abs / 1e9).toLocaleString(l, { maximumFractionDigits: 2 })}B ${currency}`
    if (abs >= 1e6) return `${sign}${(abs / 1e6).toLocaleString(l, { maximumFractionDigits: 1 })}M ${currency}`
    if (abs >= 1e3) return `${sign}${(abs / 1e3).toLocaleString(l, { maximumFractionDigits: 0 })}k ${currency}`
  }
  return `${value.toLocaleString(l, { maximumFractionDigits: currency === 'RWF' ? 0 : 2 })} ${currency}`
}

export function formatRange(r, currency = 'RWF', locale = 'en', compact = true) {
  return `${formatMoney(r.low, currency, locale, { compact })} – ${formatMoney(r.high, currency, locale, { compact })}`
}

export const formatNumber = (n, locale = 'en', digits = 0) =>
  n.toLocaleString(intlLocale(locale), { maximumFractionDigits: digits })

export const formatPct = (n, digits = 0) => `${n.toFixed(digits)} %`

export const formatArea = (m2, locale = 'en') => `${formatNumber(m2, locale)} m²`

/** Browsers ship no Kinyarwanda calendar data, so month names are supplied here. */
const RW_MONTHS = [
  'Mutarama',
  'Gashyantare',
  'Werurwe',
  'Mata',
  'Gicurasi',
  'Kamena',
  'Nyakanga',
  'Kanama',
  'Nzeri',
  'Ukwakira',
  'Ugushyingo',
  'Ukuboza',
]

export function formatDate(iso, locale = 'en') {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  if (locale === 'rw') return `${d.getDate()} ${RW_MONTHS[d.getMonth()]} ${d.getFullYear()}`
  return d.toLocaleDateString(intlLocale(locale), { year: 'numeric', month: 'short', day: 'numeric' })
}

export const daysSince = (iso) => Math.floor((Date.now() - Date.parse(iso)) / 86_400_000)

const UNIT_KEYS = {
  'no.': 'each',
  sum: 'sum',
  PC: 'primeCost',
  pc: 'piece',
  bag: 'bag',
  day: 'day',
  bar: 'bar',
  box: 'box',
  sheet: 'sheet',
  hour: 'hour',
}
/** Translates the few word-like units (no., sum, PC, bag, day); symbols such as m², kg, RWF pass through. */
export const unitLabel = (t, unit) => (UNIT_KEYS[unit] ? t(`units.${UNIT_KEYS[unit]}`, { defaultValue: unit }) : unit)
/** Material category labels; the category id stays the English enum value. */
export const categoryLabel = (t, category) => t(`catalogue.category.${category}`, { defaultValue: category })
