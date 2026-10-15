import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'

import { useTranslation } from 'react-i18next'

import { formatMoney } from '@/shared/lib/format'
import { FONT_MONO } from '@/shared/theme/theme'
import { TraceButton } from './TraceButton'

/** Currency value in IBM Plex Mono with tabular numerals. */
export function Money({ value, currency = 'RWF', compact = false, sx, ...props }) {
  const { i18n } = useTranslation()
  return (
    <Typography
      component="span"
      sx={{ fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', ...sx }}
      {...props}
    >
      {formatMoney(value, currency, i18n.language, { compact })}
    </Typography>
  )
}

/** Headline range: low – high with the most-likely figure underneath. Clients never see a lone point estimate. */
export function RangeHero({ range, currency = 'RWF', label, estimateId, figureId, showMid = true }) {
  const { t, i18n } = useTranslation()
  const l = i18n.language
  return (
    <Box>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Stack direction="row" sx={{ alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
        <Typography
          component="p"
          sx={{
            fontFamily: FONT_MONO,
            fontVariantNumeric: 'tabular-nums',
            fontSize: { xs: 26, md: 34 },
            fontWeight: 500,
            lineHeight: 1.15,
            letterSpacing: '-0.01em',
          }}
        >
          {formatMoney(range.low, currency, l, { compact: true })}
          <Box component="span" sx={{ color: 'text.disabled', mx: 1 }}>
            –
          </Box>
          {formatMoney(range.high, currency, l, { compact: true })}
        </Typography>
        {estimateId && figureId && <TraceButton estimateId={estimateId} figureId={figureId} />}
      </Stack>
      {showMid && (
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          {t('shell.mostLikely')}{' '}
          <Box component="span" sx={{ fontFamily: FONT_MONO }}>
            {formatMoney(range.mid, currency, l)}
          </Box>
        </Typography>
      )}
    </Box>
  )
}
