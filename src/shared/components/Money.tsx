import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import type { TypographyProps } from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import type { Currency, MoneyRange } from '@/shared/api/schemas'
import { formatMoney } from '@/shared/lib/format'
import { TraceButton } from './TraceButton'

export function Money({ value, currency = 'RWF', compact = false, ...props }: { value: number; currency?: Currency; compact?: boolean } & TypographyProps) {
  const { i18n } = useTranslation()
  return (
    <Typography component="span" sx={{ fontVariantNumeric: 'tabular-nums' }} {...props}>
      {formatMoney(value, currency, i18n.language, { compact })}
    </Typography>
  )
}

/**
 * Hero range: the "one number" of the result page, shown as low – high with the
 * most-likely figure underneath. Clients never see a single point estimate.
 */
export function RangeHero({
  range,
  currency = 'RWF',
  label,
  estimateId,
  figureId,
  showMid = true,
}: {
  range: MoneyRange
  currency?: Currency
  label: string
  estimateId?: string
  figureId?: string
  showMid?: boolean
}) {
  const { i18n } = useTranslation()
  const l = i18n.language
  return (
    <Box>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Stack direction="row" sx={{ alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="h1" component="p" sx={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
          {formatMoney(range.low, currency, l, { compact: true })}
          <Box component="span" sx={{ color: 'text.secondary', mx: 1, fontWeight: 400 }}>
            –
          </Box>
          {formatMoney(range.high, currency, l, { compact: true })}
        </Typography>
        {estimateId && figureId && <TraceButton estimateId={estimateId} figureId={figureId} />}
      </Stack>
      {showMid && (
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Most likely {formatMoney(range.mid, currency, l)}
        </Typography>
      )}
    </Box>
  )
}
