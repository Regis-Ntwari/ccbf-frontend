import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Box from '@mui/material/Box'
import { useTranslation } from 'react-i18next'
import { LOCALE_LABEL, SUPPORTED_LOCALES } from '@/shared/i18n'
import { FONT_MONO } from '@/shared/theme/theme'

/** Small per-language completeness marker: filled for present, hollow for missing. */
export function LocaleDots({ value, locales = SUPPORTED_LOCALES }) {
  const { t } = useTranslation()
  return (
    <Box component="span" sx={{ display: 'inline-flex', gap: 0.5, alignItems: 'center', ml: 1 }}>
      {locales.map((l) => {
        const present = Boolean(value?.[l]?.trim())
        return (
          <Tooltip
            key={l}
            title={`${LOCALE_LABEL[l]}: ${present ? t('admin.i18n.provided') : t('admin.i18n.missing')}`}
          >
            <Box
              component="span"
              sx={{
                fontFamily: FONT_MONO,
                fontSize: 9,
                lineHeight: 1,
                px: 0.5,
                py: 0.25,
                border: '1px solid',
                borderColor: present ? 'success.main' : 'divider',
                color: present ? 'success.main' : 'text.disabled',
                textTransform: 'uppercase',
              }}
            >
              {l}
            </Box>
          </Tooltip>
        )
      })}
    </Box>
  )
}

/**
 * Edits one language of a localized text (`{ en, rw, fr }`). The active
 * language comes from the page's content-language switch; the English text
 * is shown as placeholder while a translation is still missing.
 */
export function LocalizedTextField({ value, lang, onChange, label, locales, ...rest }) {
  const v = value ?? { en: '' }
  const fallback = lang !== 'en' && v.en ? v.en : undefined
  return (
    <TextField
      {...rest}
      label={
        label ? (
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
            {label}
            <LocaleDots value={v} locales={locales} />
          </Box>
        ) : undefined
      }
      value={v[lang] ?? ''}
      placeholder={fallback}
      onChange={(e) => {
        const next = { ...v, [lang]: e.target.value }
        if (lang !== 'en' && !e.target.value) delete next[lang]
        onChange(next)
      }}
      slotProps={{ ...rest.slotProps, inputLabel: { shrink: true, ...rest.slotProps?.inputLabel } }}
    />
  )
}
