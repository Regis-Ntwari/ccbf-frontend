# ADR 0005 — Localization covers the interface and the data

Date: 2026-10-15. Status: accepted.

## Context
The product serves English, Kinyarwanda and French users. Earlier only client-facing strings were translated; package
names, phase names, homepage copy, engine assumptions and activity messages stayed English, so switching the language
changed the chrome but not the content. The user asked for a switch that changes everything, and for admins to be able to
enter their content in every language.

## Decision
1. **Interface strings** live in i18next fragments, `src/shared/i18n/locales/<lang>/<fragment>.json`, one fragment per
   feature, deep-merged per language at start-up. Key sets must be identical across the three languages (checked by
   script during review). Zod validation messages are lazy (`{ error: () => i18n.t(...) }`) so forms validate in the
   current language.
2. **Server content is localized by the backend** from `Accept-Language`. The in-browser mock implements this today:
   `rulesFromConfig(config, lang)` resolves names, the engine and handlers use `i18n.getFixedT(lang)` for generated prose,
   and the activity log stores `{ messageKey, messageParams }` and renders on read. The real backend must honour the same
   header. Estimate ids never include the language.
3. **Admin-editable text is a localized string** `{ en, rw, fr }` (`LocalizedStringSchema`); English is required and the
   fallback. The platform configuration page edits one language at a time via a "Content language" switch, with per-field
   completeness markers. `PublicConfig` and all other read endpoints return resolved plain strings, so consumers never see
   the multilingual shape.
4. **The query cache is per language**: `queryKeyHashFn` prefixes the locale, and a language change invalidates the
   router so loaders and titles re-run. No query key had to change.

## Consequences
- Adding a language means a new locale folder, a new key in `LocalizedStringSchema`, and an entry in `SUPPORTED_LOCALES`.
- Kinyarwanda defaults and dictionaries were drafted by the assistant and need review by a native speaker.
- Dates use `Intl` with `rw-RW`; where the runtime lacks Kinyarwanda data it falls back to English month names.
